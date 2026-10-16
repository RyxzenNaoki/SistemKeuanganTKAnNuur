// Daftar kelas yang berlaku di seluruh SINAU.
// SENGAJA dibuat tetap (bukan input teks bebas) supaya nama kelas di Data
// Kelas, Data Siswa, pendaftaran ortu, dan filter guru selalu sama persis.
// Kalau ditulis manual di tempat berbeda-beda (dulu begitu), pencocokan
// jumlah siswa per kelas jadi gagal diam-diam karena teksnya tidak identik.

export const CLASS_OPTIONS = [
  'TK A - REGULER',
  'TK A - FULLDAY',
  'TK B - REGULER',
  'TK B - FULLDAY',
] as const;

export type ClassOption = (typeof CLASS_OPTIONS)[number];

export const isClassOption = (value: unknown): value is ClassOption =>
  typeof value === 'string' && (CLASS_OPTIONS as readonly string[]).includes(value);

// Kode singkat kelas untuk AWALAN NAMA FILE yang diupload ke Google Drive
// (foto karya, foto kegiatan, rapor, bukti bayar, modul ajar), supaya file di
// Drive mudah disortir per kelas. Ubah kodenya di sini kalau mau penamaan lain.
export const CLASS_CODES: Record<ClassOption, string> = {
  'TK A - REGULER': 'TKA-REG',
  'TK A - FULLDAY': 'TKA-FD',
  'TK B - REGULER': 'TKB-REG',
  'TK B - FULLDAY': 'TKB-FD',
};

// Kode untuk satu kelas; kelas di luar daftar (data lama) dikembalikan versi aman-nama-file
export const getClassCode = (className?: string): string => {
  if (!className) return 'UMUM';
  if (isClassOption(className)) return CLASS_CODES[className];
  return className.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toUpperCase() || 'UMUM';
};
