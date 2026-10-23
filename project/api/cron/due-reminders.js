import { createDeps } from '../_lib/firebaseAdmin.js';
import { runDailyReminders, HttpError } from '../_lib/notifyCore.js';

// Dijalankan Vercel Cron tiap hari (lihat vercel.json). Vercel otomatis mengirim
// "Authorization: Bearer <CRON_SECRET>" jika variabel CRON_SECRET diisi.
export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return res.status(500).json({ code: 'CRON_NOT_CONFIGURED', message: 'CRON_SECRET belum diisi.' });
  }
  if (req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Tidak berwenang.' });
  }

  try {
    const summary = await runDailyReminders(createDeps());
    return res.status(200).json({ ok: true, ...summary });
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.status).json({ code: error.code, message: error.message });
    }
    console.error('Cron error:', error);
    return res.status(500).json({ code: 'INTERNAL', message: 'Gagal menjalankan pengingat.' });
  }
}
