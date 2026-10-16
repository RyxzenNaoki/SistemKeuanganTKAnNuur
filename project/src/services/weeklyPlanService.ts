import { collection, getDocs, setDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Semester } from './studentService';
import { fetchThemes, createTheme } from './curriculumService';
import { deepStripUndefined } from '../utils/firestore';
import type { ParsedModulAjar } from '../utils/modulAjarParser';

// ---------------------------------------------------------------------------
// Rencana Mingguan (koleksi "weeklyPlans") — hasil baca otomatis dari Modul Ajar
// Admin mengunggah file Modul Ajar (.docx); isinya dibaca di browser dan yang
// disimpan hanya data terstruktur: tema, sub tema, dan KEGIATAN INTI per hari.
// Satu dokumen = satu kelas untuk satu minggu, ID deterministik
// "{tanggalMulai}_{kelas}" sehingga mengunggah ulang minggu yang sama otomatis
// menimpa (tidak dobel).
// ---------------------------------------------------------------------------

export interface WeeklyPlanActivity {
  domain: string;
  text: string;
}

export interface WeeklyPlanDay {
  date: string; // YYYY-MM-DD
  dayName: string;
  subSubTheme?: string;
  intiStart?: string;
  intiEnd?: string;
  activities: WeeklyPlanActivity[];
}

export interface WeeklyPlan {
  id: string;
  className: string;
  tema: string;
  subTema: string;
  weekNumber?: number;
  semester: Semester;
  academicYear: string;
  startDate: string;
  endDate: string;
  days: WeeklyPlanDay[];
  fileId?: string;
  fileName?: string;
  uploadedByName: string;
  uploadedAt: Date;
}

// Tanggal lokal perangkat -> "YYYY-MM-DD" (bukan toISOString, supaya tidak geser hari karena zona waktu)
export const toDateKey = (date: Date = new Date()): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const mapPlanDoc = (id: string, data: Record<string, any>): WeeklyPlan => ({
  id,
  className: data.className ?? '',
  tema: data.tema ?? '',
  subTema: data.subTema ?? '',
  weekNumber: data.weekNumber,
  semester: data.semester,
  academicYear: data.academicYear ?? '',
  startDate: data.startDate ?? '',
  endDate: data.endDate ?? '',
  days: Array.isArray(data.days) ? data.days : [],
  fileId: data.fileId,
  fileName: data.fileName,
  uploadedByName: data.uploadedByName ?? '',
  uploadedAt: data.uploadedAt?.toDate?.() ?? new Date(),
});

// Diurutkan di kode (bukan orderBy) supaya tidak butuh index tambahan
export const fetchWeeklyPlans = async (): Promise<WeeklyPlan[]> => {
  const snap = await getDocs(collection(db, 'weeklyPlans'));
  return snap.docs
    .map(d => mapPlanDoc(d.id, d.data()))
    .sort((a, b) => b.startDate.localeCompare(a.startDate) || a.className.localeCompare(b.className));
};

export interface SaveWeeklyPlanInput {
  parsed: ParsedModulAjar;
  classNames: string[];
  semester: Semester;
  academicYear: string;
  fileId?: string;
  fileName?: string;
  uploadedByName: string;
}

// Simpan satu rencana per kelas terpilih. Tema juga didaftarkan ke "Tema
// Pembelajaran" (kalau belum ada) supaya muncul di dropdown Asesmen Hasil Karya guru.
export const saveWeeklyPlans = async (input: SaveWeeklyPlanInput): Promise<void> => {
  const { parsed, classNames, semester, academicYear } = input;

  await Promise.all(
    classNames.map(className =>
      setDoc(
        doc(db, 'weeklyPlans', `${parsed.startDate}_${className}`),
        deepStripUndefined({
          className,
          tema: parsed.tema,
          subTema: parsed.subTema,
          weekNumber: parsed.weekNumber,
          semester,
          academicYear,
          startDate: parsed.startDate,
          endDate: parsed.endDate,
          days: parsed.days,
          fileId: input.fileId,
          fileName: input.fileName,
          uploadedByName: input.uploadedByName,
          uploadedAt: Timestamp.now(),
        })
      )
    )
  );

  if (parsed.tema) {
    try {
      const existing = await fetchThemes(academicYear, semester);
      const exists = existing.some(t => t.name.trim().toLowerCase() === parsed.tema.trim().toLowerCase());
      if (!exists) {
        await createTheme({
          name: parsed.tema,
          subTheme: parsed.subTema || undefined,
          weekNumber: parsed.weekNumber,
          semester,
          academicYear,
        });
      }
    } catch (err) {
      // Gagal mendaftarkan tema tidak boleh membatalkan penyimpanan rencana
      console.warn('Tema tidak terdaftar otomatis:', err);
    }
  }
};

export const deleteWeeklyPlan = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'weeklyPlans', id));
};

// Rencana yang mencakup tanggal tertentu untuk satu kelas
export const findPlanForDate = (plans: WeeklyPlan[], className: string, dateKey: string): WeeklyPlan | undefined =>
  plans.find(p => p.className === className && p.startDate <= dateKey && dateKey <= p.endDate);

export const findDayInPlan = (plan: WeeklyPlan | undefined, dateKey: string): WeeklyPlanDay | undefined =>
  plan?.days.find(d => d.date === dateKey);
