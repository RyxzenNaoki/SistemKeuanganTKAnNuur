import { createDeps } from './_lib/firebaseAdmin.js';
import { handleNotifyRequest, HttpError } from './_lib/notifyCore.js';

// Endpoint pengirim notifikasi push. Dipanggil aplikasi (setelah admin membuat
// pengumuman/tagihan, ortu mengunggah bukti, dst.) dengan ID token Firebase di
// header Authorization. Server memeriksa peran pemanggil dan memuat data dari
// Firestore sendiri, jadi isi notifikasi tidak bisa dipalsukan dari browser.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' });
  }

  try {
    const header = String(req.headers.authorization || '');
    const idToken = header.startsWith('Bearer ') ? header.slice(7) : '';
    const { event, payload } = req.body || {};

    const result = await handleNotifyRequest({ event, payload, idToken }, createDeps());
    return res.status(result.status).json(result.body);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ code: error.code, message: error.message });
    }
    console.error('Notify error:', error);
    return res.status(500).json({ code: 'INTERNAL', message: 'Gagal mengirim notifikasi.' });
  }
}
