import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Semester } from './studentService';

// ---------------------------------------------------------------------------
// PDF Rapor (koleksi "reportCards")
// Satu dokumen = satu file PDF rapor untuk satu murid, satu semester.
// File-nya sendiri disimpan di Google Drive lewat /api/upload (fileId),
// pola yang sama dengan bukti pembayaran & foto asesmen — lihat src/utils/drive.ts.
// ---------------------------------------------------------------------------

export interface ReportCard {
  id: string;
  studentId: string;
  studentName: string;
  parentUid: string;
  class: string;
  semester: Semester;
  academicYear: string;
  fileId: string;
  fileName: string;
  uploadedByName: string;
  uploadedAt: Date;
}

const mapReportCardDoc = (id: string, data: Record<string, any>): ReportCard => ({
  id,
  studentId: data.studentId,
  studentName: data.studentName ?? '',
  parentUid: data.parentUid ?? '',
  class: data.class ?? '',
  semester: data.semester,
  academicYear: data.academicYear ?? '',
  fileId: data.fileId,
  fileName: data.fileName ?? 'Rapor.pdf',
  uploadedByName: data.uploadedByName ?? '',
  uploadedAt: data.uploadedAt?.toDate?.() ?? new Date(),
});

// Semua rapor satu murid (dipakai Guru/Admin — rules mengizinkan mereka
// membaca apa pun terlepas dari bentuk query). JANGAN dipakai dari sisi
// Ortu: rules "reportCards" mensyaratkan field parentUid pada query itu
// sendiri untuk ortu, kalau tidak Firestore menolak seluruh query (bukan
// cuma menyaring dokumennya) — pakai fetchReportCardsByParent di sisi ortu.
export const fetchReportCardsByStudent = async (studentId: string): Promise<ReportCard[]> => {
  const snap = await getDocs(query(collection(db, 'reportCards'), where('studentId', '==', studentId)));
  return snap.docs
    .map(d => mapReportCardDoc(d.id, d.data()))
    .sort((a, b) => b.academicYear.localeCompare(a.academicYear) || b.semester.localeCompare(a.semester));
};

// Semua rapor anak milik satu akun ortu (Ortu -> Rapor Digital). Query-nya
// difilter lewat parentUid supaya persis cocok dengan syarat rules.
export const fetchReportCardsByParent = async (parentUid: string): Promise<ReportCard[]> => {
  const snap = await getDocs(query(collection(db, 'reportCards'), where('parentUid', '==', parentUid)));
  return snap.docs
    .map(d => mapReportCardDoc(d.id, d.data()))
    .sort((a, b) => b.academicYear.localeCompare(a.academicYear) || b.semester.localeCompare(a.semester));
};

export interface CreateReportCardInput {
  studentId: string;
  studentName: string;
  parentUid: string;
  class: string;
  semester: Semester;
  academicYear: string;
  fileId: string;
  fileName: string;
  uploadedByName: string;
}

// Admin/Guru mengunggah PDF rapor untuk satu murid satu semester
export const createReportCard = async (input: CreateReportCardInput): Promise<void> => {
  await addDoc(collection(db, 'reportCards'), { ...input, uploadedAt: Timestamp.now() });
};

export const deleteReportCard = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'reportCards', id));
};
