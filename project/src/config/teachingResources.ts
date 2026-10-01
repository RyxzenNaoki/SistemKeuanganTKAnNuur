// Konten halaman "Upload RPPM & Modul Ajar" (Guru). Dibuat sebagai config
// terpisah supaya link Google Drive dan langkah tutorial gampang diganti
// tanpa bongkar komponen halamannya.
//
// CATATAN: ganti DRIVE_FOLDER_URL di bawah ini dengan link folder Google
// Drive sekolah yang berisi template RPPM, Modul Ajar, dan berkas pendukung.

export const DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/GANTI_DENGAN_ID_FOLDER_ANDA';

export const TUTORIAL_STEPS: { title: string; description: string }[] = [
  {
    title: 'Buka folder Google Drive sekolah',
    description: 'Klik tombol "Buka Folder Drive" di bawah untuk mengakses template RPPM, Modul Ajar, dan berkas pendukung.',
  },
  {
    title: 'Salin template yang sesuai',
    description: 'Duplikat (Make a copy) template RPPM atau Modul Ajar ke folder kelas Anda sendiri, jangan mengedit file template asli.',
  },
  {
    title: 'Isi dan simpan dokumen',
    description: 'Lengkapi RPPM/Modul Ajar sesuai tema minggu berjalan, lalu simpan di folder kelas Anda di Drive tersebut.',
  },
  {
    title: 'Informasikan ke admin',
    description: 'Setelah selesai, beri tahu admin lewat Kontak Admin atau grup sekolah supaya dokumen bisa diperiksa.',
  },
];
