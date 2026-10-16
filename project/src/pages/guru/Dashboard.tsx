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
import { fetchThemes, findCurrentWeekTheme, getSemesterWeekNumber, Theme } from '../../services/curriculumService';
import { WeeklyPlan, fetchWeeklyPlans, findPlanForDate, findDayInPlan, toDateKey } from '../../services/weeklyPlanService';
import { getDomainBadgeClass } from '../../utils/domainStyle';

const GuruDashboard = () => {
  const { currentUser } = useAuth();
  const [name, setName] = useState('');
  const { students, loading } = useStudents({ onlyActive: true });

  const [attendancePct, setAttendancePct] = useState<number | null>(null);
  const [attendanceFilled, setAttendanceFilled] = useState(0);
  const [latestTheme, setLatestTheme] = useState<Theme | null>(null);
  const [plans, setPlans] = useState<WeeklyPlan[]>([]);
  const [planClass, setPlanClass] = useState<string>(CLASS_OPTIONS[0]);
  const [plansLoaded, setPlansLoaded] = useState(false);

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

  // Rencana mingguan hasil baca Modul Ajar yang diunggah admin
  useEffect(() => {
    fetchWeeklyPlans()
      .then(list => {
        setPlans(list);
        // Kalau kelas awal belum punya modul ajar hari ini tapi kelas lain punya, tampilkan kelas itu dulu
        const key = toDateKey();
        const withToday = CLASS_OPTIONS.find(c => findDayInPlan(findPlanForDate(list, c, key), key));
        if (withToday) setPlanClass(withToday);
      })
      .catch(console.error)
      .finally(() => setPlansLoaded(true));
  }, []);

  // Tema yang paling baru dibuat untuk semester berjalan
  useEffect(() => {
    fetchThemes(getCurrentAcademicYear(), getCurrentSemester())
      .then(list => {
        // Prioritas: tema yang nomor minggunya = minggu berjalan; kalau tidak ada,
        // pakai tema terakhir yang diinput.
        const thisWeek = findCurrentWeekTheme(list, getSemesterWeekNumber());
        setLatestTheme(thisWeek ?? list[list.length - 1] ?? null);
      })
      .catch(console.error);
  }, []);

  const todayKey = toDateKey();
  const dayOfWeek = new Date().getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const todayPlan = findPlanForDate(plans, planClass, todayKey);
  const todayDay = findDayInPlan(todayPlan, todayKey);
  const nowHHmm = dayjs().format('HH:mm');
  const intiNow =
    !!todayDay?.intiStart && !!todayDay?.intiEnd && todayDay.intiStart <= nowHHmm && nowHHmm < todayDay.intiEnd;
  const intiLabel =
    todayDay?.intiStart && todayDay?.intiEnd ? `${todayDay.intiStart.replace(':', '.')}–${todayDay.intiEnd.replace(':', '.')}` : '';

  const emptyReason = isWeekend
    ? 'Libur akhir pekan — tidak ada kegiatan belajar.'
    : !plansLoaded
      ? 'Memuat...'
      : !todayPlan
        ? 'Modul ajar untuk minggu ini belum diunggah admin.'
        : 'Hari ini tidak ada dalam modul ajar minggu ini.';

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

          {/* Kegiatan Inti Hari Ini — dibaca otomatis dari Modul Ajar */}
          <a href="#kegiatan-inti" className="rounded-2xl p-4 shadow-soft stat-card-pink hover:shadow-soft-lg transition-shadow">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-100 text-secondary-600">
              <CalendarDays className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-800">Kegiatan Inti Hari Ini</p>
            {todayDay ? (
              <>
                <p className="mt-1 text-sm font-medium text-secondary-700">{todayDay.activities.length} kegiatan</p>
                {intiLabel && <p className="text-xs text-slate-500">Pukul {intiLabel}</p>}
              </>
            ) : (
              <p className="mt-1 text-xs text-slate-500">{emptyReason}</p>
            )}
          </a>

          {/* Tema — menampilkan tema terbaru yang diinput lewat Rekap Asesmen */}
          <Link to="/guru/assessment" className="rounded-2xl p-4 shadow-soft stat-card-yellow hover:shadow-soft-lg transition-shadow">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent-100 text-accent-700">
              <BookOpenText className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-800">Tema Minggu Ini</p>
            {todayPlan ? (
              <>
                <p className="mt-1 text-sm font-medium text-accent-800">{todayPlan.tema}</p>
                {todayPlan.subTema && <p className="text-xs text-slate-500">Sub tema: {todayPlan.subTema}</p>}
                {todayDay?.subSubTheme && (
                  <p className="text-xs text-slate-500 mt-0.5">Hari ini: {todayDay.subSubTheme}</p>
                )}
              </>
            ) : latestTheme ? (
              <>
                <p className="mt-1 text-sm font-medium text-accent-800">{latestTheme.name}</p>
                {latestTheme.subTheme && (
                  <p className="text-xs text-slate-500">Sub tema: {latestTheme.subTheme}</p>
                )}
              </>
            ) : (
              <>
                <p className="mt-1 text-xs text-slate-500">Belum ada tema diinput semester ini</p>
                <span className="mt-3 inline-block badge bg-white text-slate-500">Segera hadir</span>
              </>
            )}
          </Link>
        </div>
      </div>

      {/* Kegiatan inti hari ini, dibaca otomatis dari Modul Ajar */}
      <div id="kegiatan-inti" className="card p-5 mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-semibold text-slate-900">Kegiatan Inti Hari Ini</h2>
            <p className="text-xs text-slate-400">
              {today.format('dddd, DD MMMM YYYY')}
              {intiLabel ? ` · pukul ${intiLabel} WIB` : ''}
            </p>
          </div>
          <select className="input sm:w-56" value={planClass} onChange={e => setPlanClass(e.target.value)}>
            {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {!todayDay ? (
          <p className="text-sm text-slate-400 text-center py-6">{emptyReason}</p>
        ) : (
          <>
            <div className="mb-3 rounded-xl bg-accent-50 border border-accent-100 px-3 py-2">
              <p className="text-sm font-semibold text-accent-900">{todayPlan?.tema}</p>
              <p className="text-xs text-slate-500">
                {todayPlan?.subTema}
                {todayDay.subSubTheme ? ` · ${todayDay.subSubTheme}` : ''}
              </p>
            </div>

            {intiNow && <span className="badge badge-secondary mb-3 inline-block">Kegiatan inti sedang berlangsung</span>}

            {todayDay.activities.length === 0 ? (
              <p className="text-sm text-slate-400 py-4">Kegiatan inti hari ini tidak terbaca dari modul ajar.</p>
            ) : (
              <ul className="space-y-2">
                {todayDay.activities.map((activity, idx) => (
                  <li key={idx} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
                    <span className={`shrink-0 rounded-lg px-2 py-1 text-xs font-semibold ${getDomainBadgeClass(activity.domain)}`}>
                      {activity.domain}
                    </span>
                    <p className="text-sm text-slate-700">{activity.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GuruDashboard;
