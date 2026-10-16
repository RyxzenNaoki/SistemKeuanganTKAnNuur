// Helper upload ke Google Drive lewat serverless function /api/upload.
// Dipakai SEMUA fitur yang butuh upload (bukti pembayaran, foto asesmen,
// PDF rapor, prosem, gambar tutorial) supaya validasi, kompresi foto, dan
// pesan error-nya seragam, dan setiap file masuk ke folder Drive yang tepat.

export type UploadCategory =
  | 'payment-proof'
  | 'assessment-karya'
  | 'assessment-kegiatan'
  | 'report-card'
  | 'prosem'
  | 'modul-ajar'
  | 'tutorial';

export interface UploadResult {
  fileId: string;
  fileName: string;
}

// Batas body Vercel Serverless Function ~4,5 MB
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';
const PDF_ACCEPT = 'application/pdf';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const DOC_ACCEPT =
  'application/pdf,.doc,.docx,.xls,.xlsx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Nilai untuk atribut accept pada <input type="file"> tiap kategori
export const UPLOAD_ACCEPT: Record<UploadCategory, string> = {
  'payment-proof': `${IMAGE_ACCEPT},${PDF_ACCEPT}`,
  'assessment-karya': IMAGE_ACCEPT,
  'assessment-kegiatan': IMAGE_ACCEPT,
  'report-card': PDF_ACCEPT,
  prosem: DOC_ACCEPT,
  'modul-ajar': `.docx,${DOCX_MIME}`,
  tutorial: IMAGE_ACCEPT,
};

const ALLOWED_PREFIX: Record<UploadCategory, string[]> = {
  'payment-proof': ['image/', 'application/pdf'],
  'assessment-karya': ['image/'],
  'assessment-kegiatan': ['image/'],
  'report-card': ['application/pdf'],
  prosem: ['image/', 'application/pdf', 'application/msword', 'application/vnd.'],
  'modul-ajar': [DOCX_MIME],
  tutorial: ['image/'],
};

const TYPE_HINT: Record<UploadCategory, string> = {
  'payment-proof': 'gambar (JPG/PNG) atau PDF',
  'assessment-karya': 'gambar (JPG/PNG)',
  'assessment-kegiatan': 'gambar (JPG/PNG)',
  'report-card': 'PDF',
  prosem: 'PDF, Word, Excel, atau gambar',
  'modul-ajar': 'dokumen Word (.docx)',
  tutorial: 'gambar (JPG/PNG)',
};

// Membuat teks aman untuk nama file: tanpa aksen/spasi/simbol ("Budi Santoso" -> "Budi-Santoso")
export const fileSlug = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Awalan nama file di Google Drive, mis. "TKA-REG_KARYA_2026-10-13_Budi".
// Kode kelas di depan membuat file gampang disortir per kelas di Drive.
export const buildFilePrefix = (parts: (string | undefined | null)[]): string =>
  parts
    .map(p => fileSlug(p ?? ''))
    .filter(Boolean)
    .join('_')
    .slice(0, 90);

export interface UploadOptions {
  namePrefix?: string;
}

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

// Kecilkan foto besar (maks 1600px, JPEG 82%) supaya muat batas upload & hemat kuota.
// File non-gambar, GIF, atau yang sudah kecil dikembalikan apa adanya.
const compressImage = async (file: File): Promise<File> => {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  if (file.size <= 700 * 1024) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file; // browser tidak bisa memproses gambar ini -> kirim apa adanya
  }
};

export const uploadToDrive = async (
  file: File,
  category: UploadCategory,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  // Beberapa browser/PC melaporkan tipe .docx kosong -> pulihkan dari ekstensi
  let source = file;
  if (category === 'modul-ajar' && !file.type && /\.docx$/i.test(file.name)) {
    source = new File([file], file.name, { type: DOCX_MIME });
  }

  if (!ALLOWED_PREFIX[category].some(prefix => source.type.startsWith(prefix))) {
    throw new Error(`Jenis file tidak sesuai. Gunakan ${TYPE_HINT[category]}.`);
  }

  const prepared = await compressImage(source);

  if (prepared.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `Ukuran file ${mb(prepared.size)} melebihi batas ${mb(MAX_UPLOAD_BYTES)}. Kecilkan atau kompres file terlebih dahulu.`
    );
  }

  const form = new FormData();
  // Field teks harus dikirim SEBELUM file supaya terbaca server
  form.append('category', category);
  if (options.namePrefix) form.append('namePrefix', options.namePrefix);
  form.append('file', prepared);

  let res: Response;
  try {
    res = await fetch('/api/upload', { method: 'POST', body: form });
  } catch {
    throw new Error('Tidak bisa terhubung ke server upload. Periksa koneksi internet Anda.');
  }

  if (res.status === 404) {
    throw new Error(
      'Server upload tidak ditemukan. Fitur upload hanya berjalan di Vercel (atau lewat "vercel dev"), bukan "npm run dev".'
    );
  }
  if (res.status === 413) {
    throw new Error('Ukuran file terlalu besar untuk diunggah (maksimal 4 MB).');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.message || 'Upload ke Google Drive gagal.');
  }
  if (!data?.fileId) {
    throw new Error('Upload berhasil tetapi ID file tidak diterima dari server.');
  }

  return { fileId: data.fileId, fileName: data.fileName || file.name };
};
