import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { CalendarDays, ClipboardCheck, BookOpenText, Users, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/id';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { useStudents } from '../../hooks/useStudents';
import { getCurrentAcademicYear } from '../../services/studentService';

const GuruDashboard = () => {
  const { currentUser } = useAuth();
  const [name, setName] = useState('');
  const { students, loading } = useStudents({ onlyActive: true });

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

  const upcoming = [
    { title: 'Absensi Anak', desc: 'Persentase kehadiran per anak', icon: ClipboardCheck, tone: 'stat-card-blue', chip: 'bg-primary-100 text-primary-600' },
    { title: 'Jadwal Pembelajaran', desc: 'Hari/tanggal dan jadwal kegiatan', icon: CalendarDays, tone: 'stat-card-pink', chip: 'bg-secondary-100 text-secondary-600' },
    { title: 'Tema & Sub Tema', desc: 'Tema minggu ini dan sub tema hari ini (sesuai prosem)', icon: BookOpenText, tone: 'stat-card-yellow', chip: 'bg-accent-100 text-accent-700' },
  ];

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
          {upcoming.map(({ title, desc, icon: Icon, tone, chip }) => (
            <div key={title} className={`rounded-2xl p-4 shadow-soft ${tone}`}>
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${chip}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-800">{title}</p>
              <p className="mt-1 text-xs text-slate-500">{desc}</p>
              <span className="mt-3 inline-block badge bg-white text-slate-500">Segera hadir</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GuruDashboard;
