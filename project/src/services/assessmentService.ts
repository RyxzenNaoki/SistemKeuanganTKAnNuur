import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Semester } from './studentService';

// ---------------------------------------------------------------------------
// Asesmen (koleksi "assessments")
// Satu dokumen = satu entri untuk SATU murid. Semua entri dari semua guru
// disimpan di koleksi yang sama dan selalu diberi tag studentId + parentUid,
// sehingga:
// - Guru mana pun yang input, tetap muncul digabung di Rekap Asesmen (per murid)
// - Ortu memfilter cukup lewat parentUid -> otomatis hanya lihat entri anaknya
// - Rapor Digital ortu tinggal query per kategori & semester
// ---------------------------------------------------------------------------

export type AssessmentCategory = 'karya' | 'kegiatan' | 'catatan';

export const ASSESSMENT_CATEGORY_LABEL: Record<AssessmentCategory, string> = {
  karya: 'Asesmen Hasil Karya',
  kegiatan: 'Asesmen Foto Berkegiatan',
  catatan: 'Catatan Guru',
};

export interface ParentFeedback {
  message: string;
  createdAt: Date;
}

export interface AssessmentEntry {
  id: string;
  studentId: string;
  studentName: string;
  parentUid: string;
  class: string;
  category: AssessmentCategory;
  theme?: string; // Tema pembelajaran (untuk kategori "karya"), variabel dari admin/prosem
  semester: Semester;
  academicYear: string;
  note: string;
  photoFileId?: string;
  teacherUid: string;
  teacherName: string;
  parentFeedback?: ParentFeedback; // hanya relevan untuk kategori "catatan"
  createdAt: Date;
}

const mapAssessmentDoc = (id: string, data: Record<string, any>): AssessmentEntry => ({
  id,
  studentId: data.studentId,
  studentName: data.studentName ?? '',
  parentUid: data.parentUid ?? '',
  class: data.class ?? '',
  category: data.category,
  theme: data.theme,
  semester: data.semester,
  academicYear: data.academicYear ?? '',
  note: data.note ?? '',
  photoFileId: data.photoFileId,
  teacherUid: data.teacherUid ?? '',
  teacherName: data.teacherName ?? '',
  parentFeedback: data.parentFeedback
    ? {
        message: data.parentFeedback.message,
        createdAt: data.parentFeedback.createdAt?.toDate?.() ?? new Date(),
      }
    : undefined,
  createdAt: data.createdAt?.toDate?.() ?? new Date(),
});

export interface CreateAssessmentInput {
  studentId: string;
  studentName: string;
  parentUid: string;
  class: string;
  category: AssessmentCategory;
  theme?: string;
  semester: Semester;
  academicYear: string;
  note: string;
  photoFileId?: string;
  teacherUid: string;
  teacherName: string;
}

// Guru menambah satu entri asesmen untuk satu murid
export const createAssessment = async (input: CreateAssessmentInput): Promise<void> => {
  await addDoc(collection(db, 'assessments'), {
    ...input,
    createdAt: Timestamp.now(),
  });
};

// Semua entri asesmen satu murid (Guru: Rekap Asesmen per murid; Ortu: Rapor Digital)
// Menggabungkan input dari semua guru karena difilter dari studentId, bukan per guru.
// Diurutkan di kode (bukan orderBy di query) supaya tidak butuh composite
// index — lihat catatan di fetchPaymentsByParent.
export const fetchAssessmentsByStudent = async (
  studentId: string,
  category?: AssessmentCategory
): Promise<AssessmentEntry[]> => {
  const constraints = category
    ? [where('studentId', '==', studentId), where('category', '==', category)]
    : [where('studentId', '==', studentId)];
  const snap = await getDocs(query(collection(db, 'assessments'), ...constraints));
  return snap.docs
    .map(d => mapAssessmentDoc(d.id, d.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

// Semua entri asesmen anak milik satu akun ortu (Rapor Digital -> Beranda ortu)
export const fetchAssessmentsByParent = async (parentUid: string): Promise<AssessmentEntry[]> => {
  const snap = await getDocs(query(collection(db, 'assessments'), where('parentUid', '==', parentUid)));
  return snap.docs
    .map(d => mapAssessmentDoc(d.id, d.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

// Ortu memberi feedback pada satu Catatan Guru
export const addParentFeedback = async (assessmentId: string, message: string): Promise<void> => {
  await updateDoc(doc(db, 'assessments', assessmentId), {
    parentFeedback: { message, createdAt: Timestamp.now() },
  });
};
