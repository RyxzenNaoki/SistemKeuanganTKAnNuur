// Logika inti notifikasi push (tanpa ketergantungan langsung ke firebase-admin),
// supaya bisa diuji dengan data tiruan. Semua akses data lewat `deps`:
//   deps.db            -> Firestore (Admin SDK)
//   deps.verifyIdToken -> verifikasi ID token Firebase milik pemanggil
//   deps.sendToTokens  -> kirim pesan ke daftar token FCM
//   deps.now           -> waktu sekarang

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const ROLES = ['admin', 'guru', 'parent'];
const rupiah = n => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;
const clip = (s, n) => String(s ?? '').trim().slice(0, n);

const isActiveAccount = user => !user.status || user.status === 'active';

async function getCaller(db, uid) {
  const snap = await db.collection('users').doc(uid).get();
  if (!snap.exists) throw new HttpError(403, 'NO_PROFILE', 'Profil pengguna tidak ditemukan.');
  const data = snap.data();
  if (!ROLES.includes(data.role) || (data.role !== 'admin' && !isActiveAccount(data))) {
    throw new HttpError(403, 'NOT_ACTIVE', 'Akun belum aktif.');
  }
  return { uid, role: data.role, name: data.name || '' };
}

const requireRole = (caller, role) => {
  if (caller.role !== role) throw new HttpError(403, 'FORBIDDEN', 'Anda tidak berhak mengirim notifikasi ini.');
};

// Kumpulkan token perangkat berdasarkan peran atau uid tertentu
async function collectTokens(db, { roles = [], uids = [], excludeUid }) {
  const found = new Map();
  const add = snap => snap.docs.forEach(d => {
    const data = d.data();
    if (data.uid !== excludeUid) found.set(d.id, { token: d.id, uid: data.uid });
  });
  for (const role of roles) add(await db.collection('fcmTokens').where('role', '==', role).get());
  for (const uid of uids) add(await db.collection('fcmTokens').where('uid', '==', uid).get());
  return [...found.values()];
}

// Kirim, lalu hapus token yang sudah tidak berlaku (aplikasi dihapus / izin dicabut)
async function dispatch(deps, tokens, message) {
  if (tokens.length === 0) return { tokens: 0, sent: 0, failed: 0 };
  const result = await deps.sendToTokens(tokens.map(t => t.token), message);
  for (const bad of result.invalidTokens || []) {
    try {
      await deps.db.collection('fcmTokens').doc(bad).delete();
    } catch (err) {
      console.warn('Gagal menghapus token tidak valid:', err?.message);
    }
  }
  return { tokens: tokens.length, sent: result.sent, failed: result.failed };
}

const loadDoc = async (db, collectionName, id, label) => {
  if (!id || typeof id !== 'string') throw new HttpError(400, 'BAD_REQUEST', `ID ${label} tidak valid.`);
  const snap = await db.collection(collectionName).doc(id).get();
  if (!snap.exists) throw new HttpError(404, 'NOT_FOUND', `${label} tidak ditemukan.`);
  return { id: snap.id, ref: db.collection(collectionName).doc(id), ...snap.data() };
};

const dateLabel = value => {
  const d = value?.toDate ? value.toDate() : new Date(value);
  return d.toISOString().slice(0, 10).split('-').reverse().join('/');
};

// ====================== Permintaan dari aplikasi ======================

export async function handleNotifyRequest({ event, payload = {}, idToken }, deps) {
  if (!idToken) throw new HttpError(401, 'NO_TOKEN', 'Belum login.');
  let uid;
  try {
    ({ uid } = await deps.verifyIdToken(idToken));
  } catch {
    throw new HttpError(401, 'BAD_TOKEN', 'Sesi login tidak valid.');
  }
  const { db } = deps;
  const caller = await getCaller(db, uid);

  switch (event) {
    // Admin membuat pengumuman -> semua pengguna lain
    case 'announcement': {
      requireRole(caller, 'admin');
      const title = clip(payload.title, 80);
      const body = clip(payload.message, 240);
      if (!title || !body) throw new HttpError(400, 'BAD_REQUEST', 'Judul dan isi wajib diisi.');
      const tokens = await collectTokens(db, { roles: ROLES, excludeUid: uid });
      return ok(await dispatch(deps, tokens, { title, body, link: '/', tag: 'announcement' }));
    }

    // Admin menambah tagihan -> orang tua murid terkait
    case 'payment-assigned': {
      requireRole(caller, 'admin');
      const payment = await loadDoc(db, 'payments', payload.paymentId, 'Tagihan');
      if (!payment.parentUid) return ok({ tokens: 0, sent: 0, failed: 0 });
      const tokens = await collectTokens(db, { uids: [payment.parentUid] });
      return ok(
        await dispatch(deps, tokens, {
          title: 'Tagihan baru',
          body: `${payment.type} ${rupiah(payment.amount)} untuk ${payment.studentName}, jatuh tempo ${dateLabel(payment.dueDate)}.`,
          link: '/parent/payment',
          tag: `payment-${payment.id}`,
        })
      );
    }

    // Orang tua mengunggah bukti -> semua admin (sekali saja per bukti)
    case 'proof-submitted': {
      requireRole(caller, 'parent');
      const proof = await loadDoc(db, 'payment_proofs', payload.proofId, 'Bukti pembayaran');
      if (proof.student !== uid) throw new HttpError(403, 'FORBIDDEN', 'Bukti ini bukan milik Anda.');
      if (proof.notifiedAt) return ok({ tokens: 0, sent: 0, failed: 0, skipped: true });

      let who = caller.name || 'Orang tua';
      const kids = await db.collection('students').where('parentUid', '==', uid).get();
      if (!kids.empty) who = kids.docs[0].data().name || who;

      const tokens = await collectTokens(db, { roles: ['admin'] });
      const result = await dispatch(deps, tokens, {
        title: 'Bukti pembayaran baru',
        body: `${who}: ${proof.paymentType} ${rupiah(proof.amount)} menunggu verifikasi.`,
        link: '/admin/payment-proofs',
        tag: `proof-${proof.id}`,
      });
      await proof.ref.update({ notifiedAt: deps.now() });
      return ok(result);
    }

    // Admin menyetujui/menolak bukti -> orang tua pengunggah
    case 'proof-reviewed': {
      requireRole(caller, 'admin');
      const proof = await loadDoc(db, 'payment_proofs', payload.proofId, 'Bukti pembayaran');
      if (proof.status !== 'verified' && proof.status !== 'rejected') {
        throw new HttpError(400, 'BAD_STATE', 'Bukti ini belum diverifikasi atau ditolak.');
      }
      const tokens = await collectTokens(db, { uids: [proof.student] });
      const verified = proof.status === 'verified';
      return ok(
        await dispatch(deps, tokens, {
          title: verified ? 'Pembayaran disetujui' : 'Bukti pembayaran ditolak',
          body: verified
            ? `${proof.paymentType} ${rupiah(proof.amount)} sudah diverifikasi. Terima kasih.`
            : `${proof.paymentType}: ${clip(proof.rejectionReason, 120) || 'silakan unggah ulang bukti yang benar.'}`,
          link: '/parent/payment',
          tag: `proof-${proof.id}`,
        })
      );
    }

    default:
      throw new HttpError(400, 'UNKNOWN_EVENT', 'Jenis notifikasi tidak dikenal.');
  }
}

const ok = body => ({ status: 200, body });

// ====================== Pengingat harian (cron) ======================

const jakartaDateKey = date => new Date(date.getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10);

const reminderText = daysLeft => {
  if (daysLeft === 0) return 'jatuh tempo hari ini';
  if (daysLeft === 1) return 'jatuh tempo besok';
  if (daysLeft > 1) return `jatuh tempo ${daysLeft} hari lagi`;
  return `terlambat ${-daysLeft} hari`;
};

// Ingatkan tagihan H-3, H-1, hari-H, lalu tiap 3 hari saat terlambat;
// dan ingatkan admin kalau ada bukti pembayaran yang belum diperiksa.
export async function runDailyReminders(deps) {
  const { db } = deps;
  const todayKey = jakartaDateKey(deps.now());
  const summary = { paymentsChecked: 0, paymentReminders: 0, adminReminder: false };

  const payments = await db.collection('payments').where('status', '==', 'upcoming').get();
  for (const d of payments.docs) {
    const p = d.data();
    summary.paymentsChecked++;
    if (!p.parentUid || !p.dueDate) continue;
    if (p.lastReminderDate === todayKey) continue;

    const dueKey = (p.dueDate.toDate ? p.dueDate.toDate() : new Date(p.dueDate)).toISOString().slice(0, 10);
    const daysLeft = Math.round((Date.parse(dueKey) - Date.parse(todayKey)) / 86400000);
    const shouldRemind = [3, 1, 0].includes(daysLeft) || (daysLeft < 0 && (-daysLeft) % 3 === 0);
    if (!shouldRemind) continue;

    const tokens = await collectTokens(db, { uids: [p.parentUid] });
    await dispatch(deps, tokens, {
      title: 'Pengingat pembayaran',
      body: `${p.type} ${rupiah(p.amount)} untuk ${p.studentName} ${reminderText(daysLeft)}.`,
      link: '/parent/payment',
      tag: `due-${d.id}`,
    });
    await d.ref.update({ lastReminderDate: todayKey });
    summary.paymentReminders++;
  }

  const pending = await db.collection('payment_proofs').where('status', '==', 'pending').get();
  if (pending.size > 0) {
    const tokens = await collectTokens(db, { roles: ['admin'] });
    await dispatch(deps, tokens, {
      title: 'Bukti pembayaran menunggu verifikasi',
      body: `${pending.size} bukti pembayaran belum diperiksa.`,
      link: '/admin/payment-proofs',
      tag: 'pending-proofs',
    });
    summary.adminReminder = true;
  }

  return summary;
}
