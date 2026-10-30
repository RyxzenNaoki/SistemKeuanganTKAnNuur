import { collection, query, where, getDocs, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { stripUndefined } from '../utils/firestore';

// ---------------------------------------------------------------------------
// Catatan Anekdot (koleksi "anecdotes")
// Catatan singkat guru tentang kejadian tertentu pada seorang murid: tanggal,
// detail kejadian, tempat, keterangan, dan lampiran foto (opsional).
// Hanya dilihat Guru & Admin (tidak tampil di akun orang tua, tanpa feedback ortu).
// ---------------------------------------------------------------------------

export interface Anecdote {
  id: string;
  studentId: string;
  studentName: string;
  parentUid: string;
  class: string;
  date: string; // YYYY-MM-DD (tanggal kejadian)
  detail: string; // Detail Kejadian
  place: string; // Tempat
  notes: string; // Keterangan
  photoFileId?: string; // Lampiran foto (opsional)
  teacherUid: string;
  teacherName: string;
  createdAt: Date;
}

const mapAnecdote = (id: string, d: Record<string, any>): Anecdote => ({
  id,
  studentId: d.studentId ?? '',
  studentName: d.studentName ?? '',
  parentUid: d.parentUid ?? '',
  class: d.class ?? '',
  date: d.date ?? '',
  detail: d.detail ?? '',
  place: d.place ?? '',
  notes: d.notes ?? '',
  photoFileId: d.photoFileId,
  teacherUid: d.teacherUid ?? '',
  teacherName: d.teacherName ?? '',
  createdAt: d.createdAt?.toDate?.() ?? new Date(),
});

// Terbaru di atas. Diurutkan di kode (bukan orderBy) supaya tidak butuh index tambahan.
export const fetchAnecdotes = async (studentId?: string): Promise<Anecdote[]> => {
  const source = studentId
    ? query(collection(db, 'anecdotes'), where('studentId', '==', studentId))
    : collection(db, 'anecdotes');
  const snap = await getDocs(source);
  return snap.docs
    .map(d => mapAnecdote(d.id, d.data()))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.getTime() - a.createdAt.getTime());
};

export type CreateAnecdoteInput = Omit<Anecdote, 'id' | 'createdAt'>;

export const createAnecdote = async (input: CreateAnecdoteInput): Promise<void> => {
  await addDoc(collection(db, 'anecdotes'), { ...stripUndefined(input), createdAt: Timestamp.now() });
};

export const deleteAnecdote = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'anecdotes', id));
};
