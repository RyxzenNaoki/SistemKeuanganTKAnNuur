// File yang diupload lewat /api/upload disimpan di Google Drive dan diberi
// izin "siapa saja yang punya link boleh melihat" (lihat api/upload.js).
// Helper ini membangun URL yang konsisten dari fileId, dipakai di semua
// tempat yang menampilkan file hasil upload: bukti pembayaran, foto asesmen,
// dan PDF rapor.

export const getDriveImageUrl = (fileId: string): string =>
  `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;

export const getDrivePreviewUrl = (fileId: string): string =>
  `https://drive.google.com/file/d/${fileId}/preview`;

export const getDriveDownloadUrl = (fileId: string): string =>
  `https://drive.google.com/uc?export=download&id=${fileId}`;
