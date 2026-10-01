import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import dayjs from 'dayjs';

// ---------------------------------------------------------------------------
// Absensi (koleksi "attendance")
// Satu dokumen = satu kelas pada satu tanggal, ID dokumen dibuat deterministik
// ("{class}_{YYYY-MM-DD}") supaya menyimpan absensi hari yang sama otomatis
// menimpa (bukan duplikat), dan gampang diambil per kelas per tanggal.
// Status per murid disimpan sebagai map { [studentId]: status } dalam satu
// dokumen, bukan satu dokumen per murid per hari, supaya "centang massal"
// di Rekap Absensi Guru cukup satu kali simpan.
// ---------------------------------------------------------------------------

export type AttendanceStatus = 'hadir' | 'sakit' | 'izin' | 'alpa';

export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  hadir: 'Hadir',
  sakit: 'Sakit',
  izin: 'Izin',
  alpa: 'Alpa',
};

export interface AttendanceSession {
  id: string;
  class: string;
  date: Date;
  records: Record<string, AttendanceStatus>; // studentId -> status
  recordedBy: string; // uid guru
  updatedAt?: Date;
}

const sessionId = (className: string, date: Date) => `${className}_${dayjs(date).format('YYYY-MM-DD')}`;

const mapSessionDoc = (id: string, data: Record<string, any>): AttendanceSession => ({
  id,
  class: data.class ?? '',
  date: data.date?.toDate?.() ?? new Date(),
  records: data.records ?? {},
  recordedBy: data.recordedBy ?? '',
  updatedAt: data.updatedAt?.toDate?.(),
});

// Absensi satu kelas pada satu tanggal tertentu (Rekap Absensi Guru: buka tanggal -> centang)
export const fetchAttendanceSession = async (
  className: string,
  date: Date
): Promise<AttendanceSession | null> => {
  const snap = await getDoc(doc(db, 'attendance', sessionId(className, date)));
  if (!snap.exists()) return null;
  return mapSessionDoc(snap.id, snap.data());
};

// Simpan/perbarui absensi satu kelas satu hari sekaligus (satu kali tulis untuk semua murid)
export const saveAttendanceSession = async (
  className: string,
  date: Date,
  records: Record<string, AttendanceStatus>,
  recordedBy: string
): Promise<void> => {
  await setDoc(doc(db, 'attendance', sessionId(className, date)), {
    class: className,
    date: Timestamp.fromDate(date),
    records,
    recordedBy,
    updatedAt: Timestamp.now(),
  });
};

// Semua sesi absensi satu kelas dalam rentang tanggal (dipakai untuk hitung persentase)
export const fetchAttendanceByClass = async (
  className: string,
  from?: Date,
  to?: Date
): Promise<AttendanceSession[]> => {
  const snap = await getDocs(query(collection(db, 'attendance'), where('class', '==', className)));
  let sessions = snap.docs.map(d => mapSessionDoc(d.id, d.data()));
  if (from) sessions = sessions.filter(s => s.date >= from);
  if (to) sessions = sessions.filter(s => s.date <= to);
  return sessions.sort((a, b) => a.date.getTime() - b.date.getTime());
};

// Persentase kehadiran satu murid dari kumpulan sesi absensi kelasnya
// (dipakai Beranda Guru: "Absensi Anak (Persentase Kehadiran per Anak)")
export const calculateAttendancePercentage = (
  studentId: string,
  sessions: AttendanceSession[]
): { percentage: number; hadir: number; total: number } => {
  const relevant = sessions.filter(s => studentId in s.records);
  const hadir = relevant.filter(s => s.records[studentId] === 'hadir').length;
  const total = relevant.length;
  return { percentage: total === 0 ? 0 : Math.round((hadir / total) * 100), hadir, total };
};
