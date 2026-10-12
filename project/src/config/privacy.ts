// Data untuk halaman Kebijakan Privasi (/privacy-policy).
// ISI bagian "KONTAK" di bawah ini dengan data sekolah yang sebenarnya
// sebelum URL halaman dipakai di Google Cloud Console.

export const PRIVACY_PATH = '/privacy-policy';

// Tanggal terakhir kebijakan diperbarui (ubah setiap kali isi kebijakan berubah)
export const PRIVACY_LAST_UPDATED = '12 Oktober 2026';

// ====================== KONTAK (WAJIB DIISI) ======================
// Email resmi sekolah untuk pertanyaan/permintaan terkait data pribadi
export const PRIVACY_CONTACT_EMAIL = 'sinaurumahcahaya705@gmail.com';
// Nomor telepon/WhatsApp sekolah (boleh dikosongkan: '')
export const PRIVACY_CONTACT_PHONE = '081233466497 (Bu Rita)';
// Alamat sekolah (boleh dikosongkan: '')
export const PRIVACY_CONTACT_ADDRESS = 'Perum. Taman Raden Intan Kav. 705, Arjosari, Kec. Blimbing, Kota Malang';
// ==================================================================

export const isContactEmailConfigured = !PRIVACY_CONTACT_EMAIL.includes('GANTI_DENGAN');
