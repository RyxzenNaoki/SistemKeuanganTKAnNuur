import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import app, { db, firebaseConfig } from '../firebase/config';

// ---------------------------------------------------------------------------
// Notifikasi push perangkat (Firebase Cloud Messaging / Web Push)
// - Pengguna mengaktifkan lewat banner di aplikasi -> token perangkat disimpan di
//   koleksi "fcmTokens" (dibaca server saat mengirim notifikasi).
// - Perlu VITE_FIREBASE_VAPID_KEY (Firebase Console > Project settings > Cloud
//   Messaging > Web Push certificates).
// ---------------------------------------------------------------------------

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

export type PushState =
  | 'not-configured' // VAPID key belum diisi
  | 'unsupported' // browser tidak mendukung
  | 'ios-install' // iPhone/iPad: harus dipasang ke Layar Utama dulu
  | 'denied' // izin ditolak pengguna
  | 'default' // belum diminta izin
  | 'granted'; // sudah aktif

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;

export const detectPushState = async (): Promise<PushState> => {
  if (!VAPID_KEY) return 'not-configured';
  if (isIos() && !isStandalone()) return 'ios-install';
  const supported = typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && (await isSupported());
  if (!supported) return 'unsupported';
  return Notification.permission as 'denied' | 'default' | 'granted';
};

const registerWorker = () => {
  // Konfigurasi dikirim lewat query string agar service worker tidak perlu menyimpan kunci sendiri
  const query = new URLSearchParams({
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
  });
  return navigator.serviceWorker.register(`/firebase-messaging-sw.js?${query.toString()}`, {
    scope: '/firebase-cloud-messaging-push-scope',
  });
};

// Ambil token perangkat ini dan simpan ke Firestore (aman dipanggil berulang)
export const syncPushToken = async (user: { uid: string; role: string }): Promise<string> => {
  const registration = await registerWorker();
  const token = await getToken(getMessaging(app), { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
  if (!token) throw new Error('Token notifikasi tidak diterima.');

  await setDoc(
    doc(db, 'fcmTokens', token),
    { uid: user.uid, role: user.role, userAgent: navigator.userAgent.slice(0, 200), updatedAt: serverTimestamp() },
    { merge: true }
  );
  return token;
};

// Minta izin lalu daftarkan perangkat. Dipanggil dari tombol (butuh interaksi pengguna).
export const enablePush = async (user: { uid: string; role: string }): Promise<void> => {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Izin notifikasi tidak diberikan.');
  await syncPushToken(user);
};

export interface ForegroundMessage {
  title?: string;
  body?: string;
  link?: string;
}

// Pesan yang datang saat aplikasi sedang dibuka (ditampilkan sebagai toast)
export const listenForeground = (handler: (message: ForegroundMessage) => void): (() => void) =>
  onMessage(getMessaging(app), payload => handler((payload.data ?? {}) as ForegroundMessage));
