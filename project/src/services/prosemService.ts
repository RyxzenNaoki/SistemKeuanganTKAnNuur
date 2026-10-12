import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Semester } from './studentService';
import { stripUndefined } from '../utils/firestore';

// ---------------------------------------------------------------------------
// Prosem / Program Semester (koleksi "prosem")
// Admin mengunggah file prosem per semester (PDF/Word/Excel/gambar) ke Google
// Drive lewat /api/upload (kategori "prosem"); Guru melihat & mengunduhnya di
// halaman Upload RPPM & Modul Ajar.
// ---------------------------------------------------------------------------

export interface Prosem {
  id: string;
  title: string;
  semester: Semester;
  academicYear: string;
  fileId: string;
  fileName: string;
  uploadedByName: string;
  uploadedAt: Date;
}

const mapProsemDoc = (id: string, data: Record<string, any>): Prosem => ({
  id,
  title: data.title ?? '',
  semester: data.semester,
  academicYear: data.academicYear ?? '',
  fileId: data.fileId,
  fileName: data.fileName ?? '',
  uploadedByName: data.uploadedByName ?? '',
  uploadedAt: data.uploadedAt?.toDate?.() ?? new Date(),
});

// Diurutkan di kode (bukan orderBy) supaya tidak butuh index tambahan
export const fetchProsem = async (academicYear?: string, semester?: Semester): Promise<Prosem[]> => {
  const snap = await getDocs(collection(db, 'prosem'));
  let list = snap.docs.map(d => mapProsemDoc(d.id, d.data()));
  if (academicYear) list = list.filter(p => p.academicYear === academicYear);
  if (semester) list = list.filter(p => p.semester === semester);
  return list.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
};

export interface CreateProsemInput {
  title: string;
  semester: Semester;
  academicYear: string;
  fileId: string;
  fileName: string;
  uploadedByName: string;
}

export const createProsem = async (input: CreateProsemInput): Promise<void> => {
  await addDoc(collection(db, 'prosem'), { ...input, uploadedAt: Timestamp.now() });
};

export const deleteProsem = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'prosem', id));
};

// ---------------------------------------------------------------------------
// Pengaturan halaman "Upload RPPM & Modul Ajar" (dokumen settings/teachingResources)
// Link folder Drive + gambar tutorial bisa diubah admin tanpa deploy ulang.
// ---------------------------------------------------------------------------

export interface TeachingResources {
  driveFolderUrl?: string;
  tutorialImageFileId?: string;
}

const SETTINGS_REF = () => doc(db, 'settings', 'teachingResources');

export const fetchTeachingResources = async (): Promise<TeachingResources> => {
  const snap = await getDoc(SETTINGS_REF());
  if (!snap.exists()) return {};
  const data = snap.data();
  return { driveFolderUrl: data.driveFolderUrl, tutorialImageFileId: data.tutorialImageFileId };
};

export const saveTeachingResources = async (input: TeachingResources): Promise<void> => {
  await setDoc(SETTINGS_REF(), { ...stripUndefined(input), updatedAt: Timestamp.now() }, { merge: true });
};
