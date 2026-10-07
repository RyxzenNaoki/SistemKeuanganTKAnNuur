import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Semester } from './studentService';
import { stripUndefined } from '../utils/firestore';

// ---------------------------------------------------------------------------
// Tema pembelajaran (koleksi "themes")
// Diinput Admin per semester ("tema nya variabel dari admin" — poin 4a & 5c).
// Dipakai sebagai dropdown saat Guru menambah Asesmen Hasil Karya, dan
// sebagai filter di Rapor Digital ortu supaya progress karya dikelompokkan
// per tema per semester.
// ---------------------------------------------------------------------------

export interface Theme {
  id: string;
  name: string; // contoh: "Tanaman", "Kendaraan"
  subTheme?: string; // sub tema hari ini, opsional
  semester: Semester;
  academicYear: string;
  weekNumber?: number; // dipakai untuk "Tema Minggu Ini" di Beranda Guru
  createdAt?: Date;
}

const mapThemeDoc = (id: string, data: Record<string, any>): Theme => ({
  id,
  name: data.name ?? '',
  subTheme: data.subTheme,
  semester: data.semester,
  academicYear: data.academicYear ?? '',
  weekNumber: data.weekNumber,
  createdAt: data.createdAt?.toDate?.(),
});

export interface ThemeInput {
  name: string;
  subTheme?: string;
  semester: Semester;
  academicYear: string;
  weekNumber?: number;
}

export const fetchThemes = async (academicYear?: string, semester?: Semester): Promise<Theme[]> => {
  const snap = await getDocs(query(collection(db, 'themes'), orderBy('weekNumber', 'asc')));
  let themes = snap.docs.map(d => mapThemeDoc(d.id, d.data()));
  if (academicYear) themes = themes.filter(t => t.academicYear === academicYear);
  if (semester) themes = themes.filter(t => t.semester === semester);
  return themes;
};

export const createTheme = async (input: ThemeInput): Promise<void> => {
  await addDoc(collection(db, 'themes'), { ...stripUndefined(input), createdAt: Timestamp.now() });
};

export const updateTheme = async (id: string, input: Partial<ThemeInput>): Promise<void> => {
  await updateDoc(doc(db, 'themes', id), stripUndefined(input));
};

export const deleteTheme = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'themes', id));
};

// Tema minggu ini (dipakai Beranda Guru), berdasarkan nomor minggu berjalan
// dalam tahun ajaran. Dihitung sederhana dari selisih minggu sejak awal semester
// aktif, lalu dicocokkan ke weekNumber yang diinput admin.
export const findCurrentWeekTheme = (themes: Theme[], weekNumber: number): Theme | undefined =>
  themes.find(t => t.weekNumber === weekNumber);
