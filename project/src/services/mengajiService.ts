import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  doc,
  arrayUnion,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Semester } from './studentService';
import { deepStripUndefined } from '../utils/firestore';

// ---------------------------------------------------------------------------
// Rapor Mengaji (koleksi "mengajiReports")
// Satu dokumen = satu murid untuk satu semester (ID deterministik), berisi:
//   - target hafalan surat & hadits (beserta status capaian)
//   - riwayat progress mengaji (jilid + halaman)
//   - catatan guru
// Diinput Guru; Orang Tua hanya melihat. Setiap penulisan selalu menyertakan
// parentUid supaya ortu bisa membaca lewat query where('parentUid', '==', uid)
// — bentuk query yang cocok dengan Firestore Rules.
// ---------------------------------------------------------------------------

export type HafalanStatus = 'belum' | 'proses' | 'hafal';

export const HAFALAN_LABEL: Record<HafalanStatus, string> = {
  belum: 'Belum',
  proses: 'Sedang dihafal',
  hafal: 'Hafal',
};

export interface HafalanTarget {
  name: string;
  status: HafalanStatus;
}

export interface MengajiProgressEntry {
  id: string;
  date: string; // YYYY-MM-DD
  jilid: string;
  halaman: number;
  teacherName: string;
  createdAt: Date;
}

export interface MengajiNote {
  id: string;
  message: string;
  teacherName: string;
  createdAt: Date;
}

export interface MengajiReport {
  id: string;
  studentId: string;
  studentName: string;
  parentUid: string;
  class: string;
  semester: Semester;
  academicYear: string;
  suratTargets: HafalanTarget[];
  haditsTargets: HafalanTarget[];
  progress: MengajiProgressEntry[];
  notes: MengajiNote[];
}

// Identitas murid + semester yang selalu ikut tertulis di dokumen
export interface MengajiBase {
  studentId: string;
  studentName: string;
  parentUid: string;
  class: string;
  semester: Semester;
  academicYear: string;
}

export const mengajiReportId = (studentId: string, academicYear: string, semester: Semester): string =>
  `${studentId}_${academicYear.replace('/', '-')}_${semester}`;

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const toDate = (v: any): Date => v?.toDate?.() ?? new Date();

const mapReport = (id: string, d: Record<string, any>): MengajiReport => ({
  id,
  studentId: d.studentId ?? '',
  studentName: d.studentName ?? '',
  parentUid: d.parentUid ?? '',
  class: d.class ?? '',
  semester: d.semester,
  academicYear: d.academicYear ?? '',
  suratTargets: Array.isArray(d.suratTargets) ? d.suratTargets : [],
  haditsTargets: Array.isArray(d.haditsTargets) ? d.haditsTargets : [],
  progress: (Array.isArray(d.progress) ? d.progress : []).map((p: any) => ({
    id: p.id,
    date: p.date,
    jilid: p.jilid,
    halaman: p.halaman,
    teacherName: p.teacherName ?? '',
    createdAt: toDate(p.createdAt),
  })),
  notes: (Array.isArray(d.notes) ? d.notes : []).map((n: any) => ({
    id: n.id,
    message: n.message,
    teacherName: n.teacherName ?? '',
    createdAt: toDate(n.createdAt),
  })),
});

// Progress terbaru = tanggal paling baru (lalu waktu input paling baru)
export const sortProgressNewestFirst = (entries: MengajiProgressEntry[]): MengajiProgressEntry[] =>
  [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.getTime() - a.createdAt.getTime());

// ---------------- sisi Guru ----------------

export const fetchMengajiReport = async (
  studentId: string,
  academicYear: string,
  semester: Semester
): Promise<MengajiReport | null> => {
  const id = mengajiReportId(studentId, academicYear, semester);
  const snap = await getDoc(doc(db, 'mengajiReports', id));
  return snap.exists() ? mapReport(snap.id, snap.data()) : null;
};

export const saveHafalanTargets = async (
  base: MengajiBase,
  suratTargets: HafalanTarget[],
  haditsTargets: HafalanTarget[]
): Promise<void> => {
  const id = mengajiReportId(base.studentId, base.academicYear, base.semester);
  await setDoc(
    doc(db, 'mengajiReports', id),
    deepStripUndefined({ ...base, suratTargets, haditsTargets, updatedAt: Timestamp.now() }),
    { merge: true }
  );
};

export const addMengajiProgress = async (
  base: MengajiBase,
  entry: { date: string; jilid: string; halaman: number; teacherName: string }
): Promise<void> => {
  const id = mengajiReportId(base.studentId, base.academicYear, base.semester);
  await setDoc(
    doc(db, 'mengajiReports', id),
    deepStripUndefined({
      ...base,
      progress: arrayUnion({ id: newId(), ...entry, createdAt: Timestamp.now() }),
      updatedAt: Timestamp.now(),
    }),
    { merge: true }
  );
};

export const addMengajiNote = async (
  base: MengajiBase,
  note: { message: string; teacherName: string }
): Promise<void> => {
  const id = mengajiReportId(base.studentId, base.academicYear, base.semester);
  await setDoc(
    doc(db, 'mengajiReports', id),
    deepStripUndefined({
      ...base,
      notes: arrayUnion({ id: newId(), ...note, createdAt: Timestamp.now() }),
      updatedAt: Timestamp.now(),
    }),
    { merge: true }
  );
};

// Hapus satu entri dari array (baca -> saring -> tulis, karena arrayRemove butuh objek persis sama)
const removeFromArray = async (reportId: string, field: 'progress' | 'notes', entryId: string): Promise<void> => {
  const ref = doc(db, 'mengajiReports', reportId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const current: any[] = Array.isArray(snap.data()[field]) ? snap.data()[field] : [];
  await updateDoc(ref, { [field]: current.filter(item => item.id !== entryId), updatedAt: Timestamp.now() });
};

export const removeMengajiProgress = (reportId: string, entryId: string) => removeFromArray(reportId, 'progress', entryId);
export const removeMengajiNote = (reportId: string, entryId: string) => removeFromArray(reportId, 'notes', entryId);

// ---------------- sisi Ortu (read-only) ----------------

// Semua rapor mengaji anak milik satu akun ortu. Query WAJIB lewat parentUid
// (cocok dengan Rules); diurutkan di kode: tahun ajaran terbaru, lalu Genap sebelum Ganjil (yang lebih baru dulu).
export const fetchMengajiReportsByParent = async (parentUid: string): Promise<MengajiReport[]> => {
  const snap = await getDocs(query(collection(db, 'mengajiReports'), where('parentUid', '==', parentUid)));
  return snap.docs
    .map(d => mapReport(d.id, d.data()))
    .sort((a, b) => b.academicYear.localeCompare(a.academicYear) || (a.semester === 'Ganjil' ? 1 : -1) - (b.semester === 'Ganjil' ? 1 : -1));
};
