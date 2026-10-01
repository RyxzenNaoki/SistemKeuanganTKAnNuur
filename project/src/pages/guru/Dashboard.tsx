import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { CalendarDays, ClipboardCheck, BookOpenText, Users, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { useStudents } from '../../hooks/useStudents';
import { getCurrentAcademicYear, getCurrentSemester } from '../../services/studentService';
import { CLASS_OPTIONS } from '../../config/classes';
import { fetchAttendanceSession, calculateAttendancePercentage } from '../../services/attendanceService';
import { fetchThemes, Theme } from '../../services/curriculumService';

const GuruDashboard = () => {
  const { currentUser } = useAuth();
  const [name, setName] = useState('');
  const { students, loading } = useStudents({ onlyActive: true });

  const [attendancePct, setAttendancePct] = useState<number | null>(null);
  const [attendanceFilled, setAttendanceFilled] = useState(0);
  const [latestTheme, setLatestTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const loadName = async () => {
      if (!currentUser) return;
      try {
        const snap = await getDoc(doc(db, 'users', currentUser.uid));
        if (snap.exists()) setName(snap.data().name || '');
      } catch (error) {
        console.error(error);
      }
    };
    loadName();
  }, [currentUser]);

  const today = dayjs().locale('id');

  // Ringkasan jumlah murid per kelas (dari Data Siswa yang diinput admin / didaftarkan ortu)
  const perClass = students.reduce<Record<string, number>>((acc, s) => {
    acc[s.class] = (acc[s.class] || 0) + 1;
    return acc;
  }, {});

  // Persentase hadir hari ini, digabung dari absensi semua kelas yang sudah diisi
  useEffect(() => {
    const loadAttendance = async () => {
      try {
        const sessions = await Promise.all(CLASS_OPTIONS.map(c => fetchAttendanceSession(c, new Date())));
        const filled = sessions.filter(Boolean);
        setAttendanceFilled(filled.length);

        let hadir = 0;
        let total = 0;
        filled.forEach(session => {
          Object.keys(session!.records).forEach(studentId => {
            const { hadir: h, total: t } = calculateAttendancePercentage(studentId, [session!]);
            hadir += h;
            total += t;
          });
        });
        setAttendancePct(total === 0 ? null : Math.round((hadir / total) * 100));
      } catch (err) {
        console.error('Gagal memuat ringkasan absensi:', err);
      }
    };
    loadAttendance();
  }, []);

  // Tema yang paling baru dibuat untuk semester berjalan
  useEffect(() => {
    fetchThemes(getCurrentAcademicYear(), getCurrentSemester())
      .then(list => setLatestTheme(list[list.length - 1] ?? null))
      .catch(console.error);
  }, []);

  return (
    <div className="page-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Selamat Datang{name ? `, ${name}` : ''}!</h1>
        <p className="text-sm text-slate-500">
          {today.format('dddd, DD MMMM YYYY')} · Tahun ajaran {getCurrentAcademicYear()}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl p-5 shadow-soft stat-card-blue lg:col-span-1">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
            <Users className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm text-slate-500">Murid Aktif</p>
          <p className="text-3xl font-bold text-slate-800">{loading ? '…' : students.length}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(perClass).map(([cls, total]) => (
              <span key={cls} className="badge badge-primary">{cls}: {total}</span>
            ))}
          </div>
          <Link
            to="/guru/students"
            className="mt-4 inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Lihat data siswa <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Absensi Anak — sekarang data asli dari Rekap Absensi hari ini */}
          <Link to="/guru/attendance" className="rounded-2xl p-4 shadow-soft stat-card-blue hover:shadow-soft-lg transition-shadow">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-800">Absensi Hari Ini</p>
            {attendancePct === null ? (
              <p className="mt-1 text-xs text-slate-500">Belum ada kelas yang mengisi absensi hari ini</p>
            ) : (
              <>
                <p className="text-2xl font-bold text-primary-700">{attendancePct}%</p>
                <p className="text-xs text-slate-500">hadir · {attendanceFilled} dari {CLASS_OPTIONS.length} kelas terisi</p>
              </>
            )}
          </Link>

          {/* Jadwal Pembelajaran — belum ada modul jadwal, tetap kerangka */}
          <div className="rounded-2xl p-4 shadow-soft stat-card-pink">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-100 text-secondary-600">
              <CalendarDays className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-800">Jadwal Pembelajaran</p>
            <p className="mt-1 text-xs text-slate-500">Hari/tanggal dan jadwal kegiatan</p>
            <span className="mt-3 inline-block badge bg-white text-slate-500">Segera hadir</span>
          </div>

          {/* Tema — menampilkan tema terbaru yang diinput lewat Rekap Asesmen */}
          <Link to="/guru/assessment" className="rounded-2xl p-4 shadow-soft stat-card-yellow hover:shadow-soft-lg transition-shadow">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent-100 text-accent-700">
              <BookOpenText className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-800">Tema Berjalan</p>
            {latestTheme ? (
              <p className="mt-1 text-sm font-medium text-accent-800">{latestTheme.name}</p>
            ) : (
              <>
                <p className="mt-1 text-xs text-slate-500">Belum ada tema diinput semester ini</p>
                <span className="mt-3 inline-block badge bg-white text-slate-500">Segera hadir</span>
              </>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GuruDashboard;
