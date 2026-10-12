import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { stripUndefined } from '../utils/firestore';

// ---------------------------------------------------------------------------
// Jadwal Pembelajaran (koleksi "schedules")
// Satu dokumen = satu kegiatan pada satu hari untuk satu kelas (atau semua
// kelas). Diinput Admin; Guru melihat jadwal hari ini di Beranda.
// Hari efektif sekolah: Senin s.d. Jumat.
// ---------------------------------------------------------------------------

export const ALL_CLASSES = 'Semua Kelas';

export const SCHOOL_DAYS = [
  { value: 1, label: 'Senin' },
  { value: 2, label: 'Selasa' },
  { value: 3, label: 'Rabu' },
  { value: 4, label: 'Kamis' },
  { value: 5, label: 'Jumat' },
] as const;

export interface ScheduleItem {
  id: string;
  className: string; // salah satu CLASS_OPTIONS atau ALL_CLASSES
  day: number; // 1 = Senin ... 5 = Jumat
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  activity: string;
  notes?: string;
}

const mapScheduleDoc = (id: string, data: Record<string, any>): ScheduleItem => ({
  id,
  className: data.className ?? ALL_CLASSES,
  day: data.day,
  startTime: data.startTime ?? '',
  endTime: data.endTime ?? '',
  activity: data.activity ?? '',
  notes: data.notes,
});

export type ScheduleInput = Omit<ScheduleItem, 'id'>;

export const fetchSchedules = async (): Promise<ScheduleItem[]> => {
  const snap = await getDocs(collection(db, 'schedules'));
  return snap.docs
    .map(d => mapScheduleDoc(d.id, d.data()))
    .sort((a, b) => a.day - b.day || a.startTime.localeCompare(b.startTime));
};

export const createSchedule = async (input: ScheduleInput): Promise<void> => {
  await addDoc(collection(db, 'schedules'), { ...stripUndefined(input), createdAt: Timestamp.now() });
};

export const updateSchedule = async (id: string, input: ScheduleInput): Promise<void> => {
  await updateDoc(doc(db, 'schedules', id), stripUndefined(input));
};

export const deleteSchedule = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'schedules', id));
};

// Kegiatan hari tertentu untuk satu kelas (termasuk yang berlaku untuk semua kelas)
export const getDaySchedule = (all: ScheduleItem[], className: string, day: number): ScheduleItem[] =>
  all
    .filter(s => s.day === day && (s.className === className || s.className === ALL_CLASSES))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

// getDay() JS: 0 = Minggu ... 6 = Sabtu -> sama dengan penomoran kita untuk Senin-Jumat
export const getTodayNumber = (date: Date = new Date()): number => date.getDay();
