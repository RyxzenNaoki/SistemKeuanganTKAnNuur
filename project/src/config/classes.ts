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
