import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { stripUndefined } from '../utils/firestore';

// ---------------------------------------------------------------------------
// Jadwal / tagihan pembayaran (koleksi "payments")
// Ditautkan lewat studentId + parentUid, BUKAN teks nama siswa, supaya:
// - konsisten walau nama ditulis beda-beda / diedit admin
// - bisa dibatasi lewat Firestore Rules (ortu hanya boleh baca tagihan miliknya)
// - begitu di-assign admin, otomatis tampil di akun ortu yang bersangkutan
// ---------------------------------------------------------------------------

export type PaymentStatus = 'upcoming' | 'overdue' | 'paid';

export interface Payment {
  id: string;
  studentId: string;
  studentName: string; // disalin saat assign, memudahkan tampilan tanpa join
  parentUid: string;
  class: string;
  type: string;
  amount: number;
  dueDate: Date;
  description: string;
  status: PaymentStatus;
  paidAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export const PAYMENT_TYPES = [
  'SPP Bulanan',
  'Uang Pangkal',
  'Uang Kegiatan',
  'Uang Seragam',
  'Uang Buku',
  'Lainnya',
] as const;

// Status otomatis: kalau sudah ditandai lunas tetap lunas, kalau belum
// dibandingkan dengan tanggal jatuh tempo hari ini.
export const computePaymentStatus = (dueDate: Date, storedStatus: PaymentStatus): PaymentStatus => {
  if (storedStatus === 'paid') return 'paid';
  return dueDate.getTime() < new Date().setHours(0, 0, 0, 0) ? 'overdue' : 'upcoming';
};

const mapPaymentDoc = (id: string, data: Record<string, any>): Payment => {
  const dueDate = data.dueDate?.toDate?.() ?? new Date();
  return {
    id,
    studentId: data.studentId ?? '',
    studentName: data.studentName ?? '',
    parentUid: data.parentUid ?? '',
    class: data.class ?? '',
    type: data.type ?? '',
    amount: data.amount ?? 0,
    dueDate,
    description: data.description ?? '',
    status: computePaymentStatus(dueDate, data.status ?? 'upcoming'),
    paidAt: data.paidAt?.toDate?.(),
    createdAt: data.createdAt?.toDate?.(),
    updatedAt: data.updatedAt?.toDate?.(),
  };
};

// Semua tagihan (Admin -> Jadwal Pembayaran)
export const fetchAllPayments = async (): Promise<Payment[]> => {
  const snap = await getDocs(query(collection(db, 'payments'), orderBy('dueDate', 'desc')));
  return snap.docs.map(d => mapPaymentDoc(d.id, d.data()));
};

// Tagihan milik satu akun orang tua (Ortu -> Beranda & Riwayat Pembayaran)
// Catatan: sengaja TIDAK pakai orderBy di query Firestore di sini. Query yang
// menggabungkan where() + orderBy() pada field berbeda butuh composite index
// yang harus dibuat manual di Firebase Console; kalau belum ada, query gagal
// diam-diam (di-catch, cuma masuk console.error) sehingga data terlihat
// "tidak muncul" padahal sebenarnya query-nya error. Supaya tidak bergantung
// pada index tambahan, data diambil polos lalu diurutkan di kode.
export const fetchPaymentsByParent = async (parentUid: string): Promise<Payment[]> => {
  const snap = await getDocs(query(collection(db, 'payments'), where('parentUid', '==', parentUid)));
  return snap.docs
    .map(d => mapPaymentDoc(d.id, d.data()))
    .sort((a, b) => b.dueDate.getTime() - a.dueDate.getTime());
};

export interface AssignPaymentInput {
  studentId: string;
  studentName: string;
  parentUid: string;
  class: string;
  type: string;
  amount: number;
  dueDate: Date;
  description: string;
}

// Admin meng-assign tagihan ke satu siswa -> otomatis muncul di akun ortu terkait
export const assignPayment = async (input: AssignPaymentInput): Promise<string> => {
  const ref = await addDoc(collection(db, 'payments'), {
    ...stripUndefined(input),
    status: 'upcoming' as PaymentStatus,
    dueDate: Timestamp.fromDate(input.dueDate),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  return ref.id;
};

export const updatePayment = async (id: string, input: Partial<AssignPaymentInput> & { status?: PaymentStatus }): Promise<void> => {
  const { dueDate, ...rest } = input;
  await updateDoc(doc(db, 'payments', id), {
    ...stripUndefined(rest),
    ...(dueDate ? { dueDate: Timestamp.fromDate(dueDate) } : {}),
    ...(input.status === 'paid' ? { paidAt: Timestamp.now() } : {}),
    updatedAt: Timestamp.now(),
  });
};

export const deletePayment = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'payments', id));
};

// ---------------------------------------------------------------------------
// Bukti pembayaran (koleksi "payment_proofs") — sudah ada sejak awal,
// ditautkan ulang ke tagihan (paymentId) supaya "Riwayat Pembayaran" ortu
// bisa menampilkan jumlah & histori yang sesuai dengan jadwal yang di-assign.
// ---------------------------------------------------------------------------

export interface PaymentProof {
  id: string;
  student: string; // uid ortu yang upload
  paymentId?: string; // tagihan yang dibayar, kalau ada
  paymentType: string;
  amount: number;
  paymentDate: Date;
  bankAccount: string;
  referenceNumber: string;
  notes?: string;
  fileId?: string;
  fileName?: string;
  status: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  verifiedAt?: Date;
  uploadedAt: Date;
}

const mapProofDoc = (id: string, data: Record<string, any>): PaymentProof => ({
  id,
  student: data.student,
  paymentId: data.paymentId,
  paymentType: data.paymentType,
  amount: data.amount ?? 0,
  paymentDate: data.paymentDate?.toDate?.() ?? new Date(),
  bankAccount: data.bankAccount ?? '',
  referenceNumber: data.referenceNumber ?? '',
  notes: data.notes,
  fileId: data.fileId,
  fileName: data.fileName,
  status: data.status ?? 'pending',
  rejectionReason: data.rejectionReason,
  verifiedAt: data.verifiedAt?.toDate?.(),
  uploadedAt: data.uploadedAt?.toDate?.() ?? data.uploadedAt ?? new Date(),
});

export const fetchPaymentProofsByParent = async (uid: string): Promise<PaymentProof[]> => {
  const snap = await getDocs(query(collection(db, 'payment_proofs'), where('student', '==', uid)));
  return snap.docs
    .map(d => mapProofDoc(d.id, d.data()))
    .sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());
};


// ---------------------------------------------------------------------------
// Sisi Ortu: kirim bukti pembayaran baru (status awal selalu "pending")
// ---------------------------------------------------------------------------

export interface SubmitPaymentProofInput {
  student: string; // uid ortu
  paymentId?: string;
  paymentType: string;
  amount: number;
  paymentDate: Date;
  bankAccount: string;
  referenceNumber: string;
  notes?: string;
  fileId: string;
  fileName: string;
}

export const submitPaymentProof = async (input: SubmitPaymentProofInput): Promise<string> => {
  const ref = await addDoc(collection(db, 'payment_proofs'), {
    ...stripUndefined(input),
    paymentDate: Timestamp.fromDate(input.paymentDate),
    status: 'pending',
    uploadedAt: Timestamp.now(),
  })
  return ref.id;
};

// ---------------------------------------------------------------------------
// Sisi Admin: lihat, verifikasi, dan tolak bukti pembayaran
// ---------------------------------------------------------------------------

// Semua bukti pembayaran (Admin). Rules mengizinkan admin membaca semuanya.
export const fetchAllPaymentProofs = async (): Promise<PaymentProof[]> => {
  const snap = await getDocs(collection(db, 'payment_proofs'));
  return snap.docs
    .map(d => mapProofDoc(d.id, d.data()))
    .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
};

// Jenis tagihan (label admin) -> kategori pemasukan di Manajemen Keuangan
const INCOME_CATEGORY_BY_PAYMENT_TYPE: Record<string, string> = {
  'SPP Bulanan': 'spp',
  'Uang Pangkal': 'registration',
  'Uang Kegiatan': 'activity',
  'Uang Seragam': 'uniform',
  'Uang Buku': 'book',
};

export interface VerifyPaymentProofOptions {
  proof: PaymentProof;
  studentName: string; // nama murid untuk deskripsi pemasukan
  recordAsIncome: boolean;
}

// Admin menyetujui bukti pembayaran:
// 1) status bukti -> verified
// 2) tagihan yang ditautkan (kalau ada) -> paid, sehingga di akun ortu jadi "Lunas"
// 3) opsional: dicatat otomatis sebagai Pemasukan (tanpa duplikat: dicek lewat proofId)
export const verifyPaymentProof = async ({ proof, studentName, recordAsIncome }: VerifyPaymentProofOptions): Promise<void> => {
  if (proof.status === 'verified') return;

  await updateDoc(doc(db, 'payment_proofs', proof.id), {
    status: 'verified',
    verifiedAt: Timestamp.now(),
    rejectionReason: deleteField(),
  });

  if (proof.paymentId) {
    await updatePayment(proof.paymentId, { status: 'paid' });
  }

  if (recordAsIncome) {
    const existing = await getDocs(query(collection(db, 'incomes'), where('proofId', '==', proof.id)));
    if (existing.empty) {
      await addDoc(collection(db, 'incomes'), {
        date: Timestamp.fromDate(proof.paymentDate),
        category: INCOME_CATEGORY_BY_PAYMENT_TYPE[proof.paymentType] ?? 'other',
        description: `${proof.paymentType} - ${studentName}`,
        amount: proof.amount,
        student: studentName,
        paymentMethod: 'transfer',
        status: 'verified',
        receiptNumber: `BKT-${proof.id.slice(0, 6).toUpperCase()}`,
        notes: proof.referenceNumber ? `Ref: ${proof.referenceNumber}` : '',
        proofId: proof.id,
      });
    }
  }
};

export const rejectPaymentProof = async (proofId: string, reason: string): Promise<void> => {
  await updateDoc(doc(db, 'payment_proofs', proofId), {
    status: 'rejected',
    rejectionReason: reason,
    verifiedAt: Timestamp.now(),
  });
};
