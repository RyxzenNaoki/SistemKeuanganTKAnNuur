import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { HttpError } from './notifyCore.js';

// Menyiapkan Firebase Admin SDK dari variabel lingkungan
// FIREBASE_SERVICE_ACCOUNT_JSON (isi file JSON service account, satu baris).
const getAdminApp = () => {
  if (getApps().length > 0) return getApps()[0];
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new HttpError(500, 'ADMIN_NOT_CONFIGURED', 'Server notifikasi belum dikonfigurasi (FIREBASE_SERVICE_ACCOUNT_JSON).');
  }
  let account;
  try {
    account = JSON.parse(raw);
  } catch {
    throw new HttpError(500, 'ADMIN_BAD_CONFIG', 'FIREBASE_SERVICE_ACCOUNT_JSON bukan JSON yang valid.');
  }
  if (account.private_key) account.private_key = account.private_key.replace(/\\n/g, '\n');
  return initializeApp({ credential: cert(account) });
};

const INVALID_TOKEN_CODES = [
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
];

export const createDeps = () => {
  const app = getAdminApp();
  const messaging = getMessaging(app);

  return {
    db: getFirestore(app),
    verifyIdToken: token => getAuth(app).verifyIdToken(token),
    now: () => new Date(),
    // Pesan data-only: ditampilkan oleh service worker (/firebase-messaging-sw.js)
    sendToTokens: async (tokens, message) => {
      let sent = 0;
      let failed = 0;
      const invalidTokens = [];
      for (let i = 0; i < tokens.length; i += 500) {
        const batch = tokens.slice(i, i + 500);
        const res = await messaging.sendEachForMulticast({
          tokens: batch,
          data: {
            title: message.title,
            body: message.body,
            link: message.link || '/',
            tag: message.tag || '',
          },
          webpush: { headers: { Urgency: 'high', TTL: '86400' } },
        });
        sent += res.successCount;
        failed += res.failureCount;
        res.responses.forEach((r, idx) => {
          if (!r.success && INVALID_TOKEN_CODES.includes(r.error?.code)) invalidTokens.push(batch[idx]);
        });
      }
      return { sent, failed, invalidTokens };
    },
  };
};
