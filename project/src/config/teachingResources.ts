// Konten halaman "Upload RPPM & Modul Ajar" (Guru). Dibuat sebagai config
// terpisah supaya link Google Drive dan langkah tutorial gampang diganti
// tanpa bongkar komponen halamannya.
//
// CATATAN: ganti DRIVE_FOLDER_URL di bawah ini dengan link folder Google
// Drive sekolah yang berisi template RPPM, Modul Ajar, dan berkas pendukung.

export const DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/GANTI_DENGAN_ID_FOLDER_ANDA';

// Langkah-langkah ini mengikuti gambar tutorial "5 Langkah Mudah Buat Modul Ajar dari RPPM"
// (src/assets/tutorial-modul-ajar.jpg), ditambah langkah penyerahan ke admin.
export const TUTORIAL_STEPS: { title: string; description: string }[] = [
  {
    title: 'Isi RPPM dan simpan dengan nama yang benar',
    description:
      'Isi kegiatan seminggu penuh (Senin–Jumat) dan lengkapi bagian atas (Guru Kelas, Kelas, Usia, Jumlah Murid, Minggu ke-). Simpan dengan format nama RPPM (KELAS) (TANGGAL), contoh: RPPM B 14-18 September 2026.',
  },
  {
    title: 'Buka Claude AI',
    description: 'Buka claude.ai di HP/laptop lalu mulai chat baru. Jangan melanjutkan chat lama minggu sebelumnya supaya tidak tertukar.',
  },
  {
    title: 'Upload 3 file ke chat',
    description:
      'Upload sekaligus: RPPM minggu ini, Modul Ajar minggu lalu di kelas yang sama (sebagai contoh format), dan file PROMPT_RPPM_KE_MODUL_AJAR.md. Pastikan kelas Modul Ajar contoh sama dengan RPPM.',
  },
  {
    title: 'Tulis perintah di kolom chat',
    description: 'Contoh: "Buatkan modul ajar tanggal 14-18 September 2026 mengikuti detail dari file prompt". Tambahkan nama kelas bila perlu.',
  },
  {
    title: 'Kirim, tunggu, lalu periksa hasilnya',
    description:
      'Tunggu sekitar 1–3 menit. Baca ringkasan di chat (hari yang kegiatannya kosong akan ditandai), cek kegiatan tiap hari sesuai RPPM, lalu unduh file Modul Ajar (.docx).',
  },
  {
    title: 'Serahkan Modul Ajar ke admin',
    description:
      'Kirim file Modul Ajar (.docx) ke admin untuk diunggah ke SINAU. Setelah diunggah, kegiatan inti tiap hari otomatis tampil di Beranda Guru.',
  },
];
