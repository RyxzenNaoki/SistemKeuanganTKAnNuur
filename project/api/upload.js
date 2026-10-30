import multer from 'multer';
import { google } from 'googleapis';
import stream from 'stream';

// Batas body Vercel Serverless Function = 4,5 MB, jadi file dibatasi 4 MB
// (klien juga mengecilkan foto otomatis sebelum upload — lihat src/utils/upload.ts).
const MAX_FILE_BYTES = 4 * 1024 * 1024;

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: MAX_FILE_BYTES } });

export const config = {
  api: {
    bodyParser: false,
  },
};

// Tiap jenis upload punya folder Google Drive sendiri. Isi ID folder-nya di
// Vercel -> Project Settings -> Environment Variables. Kalau variabel khusus
// belum diisi, otomatis jatuh ke GOOGLE_FOLDER_ID (folder umum).
const FOLDER_ENV_BY_CATEGORY = {
  'payment-proof': 'GOOGLE_FOLDER_ID_PEMBAYARAN', // bukti pembayaran dari orang tua
  'assessment-karya': 'GOOGLE_FOLDER_ID_KARYA', // foto hasil karya murid
  'assessment-kegiatan': 'GOOGLE_FOLDER_ID_KEGIATAN', // foto kegiatan murid
  'report-card': 'GOOGLE_FOLDER_ID_RAPOR', // PDF rapor
  prosem: 'GOOGLE_FOLDER_ID_PROSEM', // prosem + modul ajar + gambar tutorial dari admin
  'modul-ajar': 'GOOGLE_FOLDER_ID_PROSEM',
  'modul-ortu': 'GOOGLE_FOLDER_ID_PROSEM', // modul orang tua (kumpulan doa & hadits)
  tutorial: 'GOOGLE_FOLDER_ID_PROSEM',
};

const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const fail = (res, status, code, message) => res.status(status).json({ code, message });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Method Not Allowed');
  }

  upload.single('file')(req, res, async function (err) {
    if (err) {
      console.error('Upload Error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return fail(res, 413, 'FILE_TOO_LARGE', 'Ukuran file melebihi 4 MB.');
      }
      return fail(res, 500, 'UPLOAD_PARSE_ERROR', 'Upload gagal diproses.');
    }

    if (!req.file) {
      return fail(res, 400, 'NO_FILE', 'Tidak ada file yang dikirim.');
    }

    const { originalname, buffer, mimetype } = req.file;

    if (!ALLOWED_MIME.includes(mimetype)) {
      return fail(res, 415, 'UNSUPPORTED_TYPE', 'Jenis file tidak didukung (gunakan gambar, PDF, Word, atau Excel).');
    }

    const category = String(req.body?.category || '');
    const folderEnvName = FOLDER_ENV_BY_CATEGORY[category];
    const folderId = (folderEnvName && process.env[folderEnvName]) || process.env.GOOGLE_FOLDER_ID;

    if (!folderId) {
      console.error(`Folder Drive belum diatur: ${folderEnvName || 'GOOGLE_FOLDER_ID'}`);
      return fail(
        res,
        500,
        'FOLDER_NOT_CONFIGURED',
        'Folder penyimpanan belum diatur oleh pengelola sistem.'
      );
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
      console.error('Kredensial Google (CLIENT_ID / CLIENT_SECRET / REFRESH_TOKEN) belum lengkap');
      return fail(res, 500, 'CREDENTIALS_MISSING', 'Kredensial Google Drive belum diatur oleh pengelola sistem.');
    }

    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      });

      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      const bufferStream = new stream.PassThrough();
      bufferStream.end(buffer);

      // multer membaca nama file sebagai latin1; kembalikan ke UTF-8 supaya
      // nama dengan huruf non-ASCII tidak rusak, lalu beri awalan unik.
      const decodedName = Buffer.from(originalname, 'latin1').toString('utf8');
      const safeName = decodedName.replace(/[^\w.\- ()]/g, '_');
      // Awalan dari aplikasi (mis. "TKA-REG_KARYA_2026-10-13_Budi") supaya file
      // gampang disortir per kelas di Drive. Dibersihkan: hanya huruf, angka, - dan _.
      const prefix = String(req.body?.namePrefix || '')
        .replace(/[^A-Za-z0-9_-]+/g, '-')
        .slice(0, 90);
      const driveName = `${prefix || category || 'file'}_${Date.now()}_${safeName}`;

      const response = await drive.files.create({
        requestBody: { name: driveName, parents: [folderId] },
        media: { mimeType: mimetype, body: bufferStream },
        fields: 'id, name',
        supportsAllDrives: true,
      });

      const fileId = response.data.id;

      // Supaya file bisa ditampilkan (foto, PDF, bukti pembayaran) tanpa login
      // Google, file diberi izin "siapa saja yang punya link boleh melihat".
      await drive.permissions.create({
        fileId,
        requestBody: { role: 'reader', type: 'anyone' },
        supportsAllDrives: true,
      });

      return res.status(200).json({
        message: 'Upload berhasil',
        fileId,
        fileName: decodedName,
        viewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
      });
    } catch (error) {
      console.error('Upload error:', error?.response?.data || error);
      const detail = String(error?.response?.data?.error || error?.message || '');
      if (detail.includes('invalid_grant')) {
        return fail(
          res,
          500,
          'AUTH_EXPIRED',
          'Izin Google Drive kedaluwarsa. Pengelola sistem perlu membuat ulang GOOGLE_REFRESH_TOKEN.'
        );
      }
      if (error?.code === 404 || detail.includes('File not found')) {
        return fail(res, 500, 'FOLDER_NOT_FOUND', 'Folder Drive tidak ditemukan atau akun Google tidak punya akses ke folder itu.');
      }
      return fail(res, 500, 'DRIVE_ERROR', 'Upload ke Google Drive gagal.');
    }
  });
}
