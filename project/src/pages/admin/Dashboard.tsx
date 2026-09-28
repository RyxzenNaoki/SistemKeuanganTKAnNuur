import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  Bar,
} from 'recharts';
import { Link } from 'react-router-dom';
import { Loader2, Wallet, TrendingUp, TrendingDown, Users, Bell } from 'lucide-react';
import dayjs from 'dayjs';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useToast } from '../../contexts/ToastContext';
import { APP_DESCRIPTION } from '../../config/branding';

type Income = {
  date: { toDate: () => Date };
  amount: number;
  category: string;
};

type Expense = {
  date: { toDate: () => Date };
  amount: number;
};

type Student = {
  status: 'active' | 'alumni';
};

interface Notification {
  title: string;
  message: string;
  createdAt: Date;
}

type ChartData = {
  month: string;
  pemasukan: number;
  pengeluaran: number;
};

type PieData = {
  name: string;
  value: number;
  color: string;
};

const PASTEL = ['#7dbcfa', '#ff9cc7', '#ffe06b', '#a7e8c3', '#c9b8ff', '#ffc9a3'];

const CATEGORY_LABEL: Record<string, string> = {
  spp: 'SPP',
  registration: 'Pendaftaran',
  activity: 'Kegiatan',
  uniform: 'Seragam',
  book: 'Buku',
  other: 'Lainnya',
};

const NOTIF_TONES = [
  'bg-secondary-50 border-secondary-100 text-secondary-800',
  'bg-primary-50 border-primary-100 text-primary-800',
  'bg-accent-50 border-accent-100 text-accent-800',
];

const rupiah = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;
const shortRupiah = (value: number) =>
  value >= 1_000_000 ? `${value / 1_000_000}jt` : value >= 1_000 ? `${value / 1_000}rb` : String(value);

const AdminDashboard = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);

  const [currentBalance, setCurrentBalance] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [activeStudents, setActiveStudents] = useState(0);

  const [monthlyFinanceData, setMonthlyFinanceData] = useState<ChartData[]>([]);
  const [incomeSourceData, setIncomeSourceData] = useState<PieData[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [incomeSnap, expenseSnap, studentSnap, notifSnap] = await Promise.all([
          getDocs(collection(db, 'incomes')),
          getDocs(collection(db, 'expenses')),
          getDocs(collection(db, 'students')),
          getDocs(collection(db, 'notifications')),
        ]);

        const incomes = incomeSnap.docs.map(d => d.data() as Income);
        const expenses = expenseSnap.docs.map(d => d.data() as Expense);
        const students = studentSnap.docs.map(d => d.data() as Student);

        const notifs = notifSnap.docs
          .map(d => {
            const data = d.data();
            return {
              title: data.title,
              message: data.message,
              createdAt: data.createdAt?.toDate?.() ?? new Date(),
            } as Notification;
          })
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setNotifications(notifs);

        const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
        const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

        setCurrentBalance(totalIncome - totalExpense);
        setMonthlyIncome(
          incomes
            .filter(i => dayjs(i.date.toDate()).isSame(new Date(), 'month'))
            .reduce((sum, i) => sum + i.amount, 0)
        );
        setMonthlyExpense(
          expenses
            .filter(e => dayjs(e.date.toDate()).isSame(new Date(), 'month'))
            .reduce((sum, e) => sum + e.amount, 0)
        );
        setActiveStudents(students.filter(s => s.status === 'active').length);

        setMonthlyFinanceData(groupMonthlyData(incomes, expenses));
        setIncomeSourceData(sumByCategory(incomes));
      } catch (error) {
        showToast('error', 'Gagal memuat data dashboard');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groupMonthlyData = (incomes: Income[], expenses: Expense[]): ChartData[] => {
    const months = Array.from({ length: 6 }).map((_, i) => dayjs().subtract(5 - i, 'month'));

    return months.map(m => {
      const inMonth = (d: Date) => dayjs(d).isSame(m, 'month');
      return {
        month: m.format('MMM YY'),
        pemasukan: incomes.filter(i => inMonth(i.date.toDate())).reduce((s, i) => s + i.amount, 0),
        pengeluaran: expenses.filter(e => inMonth(e.date.toDate())).reduce((s, e) => s + e.amount, 0),
      };
    });
  };

  // Nominal per kategori (bukan jumlah transaksi), warna pastel tetap
  const sumByCategory = (incomes: Income[]): PieData[] => {
    const map: Record<string, number> = {};
    incomes.forEach(i => {
      const key = CATEGORY_LABEL[i.category] ?? 'Lainnya';
      map[key] = (map[key] || 0) + i.amount;
    });
    return Object.entries(map).map(([name, value], idx) => ({
      name,
      value,
      color: PASTEL[idx % PASTEL.length],
    }));
  };

  if (loading) {
    return (
      <div className="page-transition">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          <span className="ml-2 text-slate-500">Memuat dashboard...</span>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Saldo Sekarang', value: rupiah(currentBalance), icon: Wallet, card: 'stat-card-blue', chip: 'bg-primary-100 text-primary-600' },
    { label: 'Pemasukan Bulan Ini', value: rupiah(monthlyIncome), icon: TrendingUp, card: 'stat-card-blue', chip: 'bg-primary-100 text-primary-600' },
    { label: 'Pengeluaran Bulan Ini', value: rupiah(monthlyExpense), icon: TrendingDown, card: 'stat-card-pink', chip: 'bg-secondary-100 text-secondary-600' },
    { label: 'Siswa Aktif', value: String(activeStudents), icon: Users, card: 'stat-card-yellow', chip: 'bg-accent-100 text-accent-700' },
    { label: 'Pemberitahuan Aktif', value: String(notifications.length), icon: Bell, card: 'stat-card-pink', chip: 'bg-secondary-100 text-secondary-600' },
  ];

  return (
    <div className="page-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Beranda</h1>
        <p className="text-sm text-slate-500">{APP_DESCRIPTION}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, card, chip }) => (
          <div key={label} className={`rounded-2xl p-4 shadow-soft ${card}`}>
            <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${chip}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm text-slate-500">{label}</p>
            <p className="text-xl font-semibold text-slate-800 break-words">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Pemberitahuan Aktif</h2>
            <Link to="/admin/notifications" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              Lihat Semua
            </Link>
          </div>
          <ul className="space-y-2 max-h-[260px] overflow-y-auto">
            {notifications.slice(0, 5).map((notif, idx) => (
              <li key={idx} className={`rounded-xl border p-3 ${NOTIF_TONES[idx % NOTIF_TONES.length]}`}>
                <p className="font-semibold text-sm">{notif.title}</p>
                <p className="text-sm opacity-90">{notif.message}</p>
              </li>
            ))}
            {notifications.length === 0 && (
              <p className="text-slate-400 text-sm py-6 text-center">Belum ada pemberitahuan</p>
            )}
          </ul>
        </div>

        <div className="card p-5">
          <h2 className="text-lg font-semibold mb-3">Sumber Pemasukan</h2>
          {incomeSourceData.length === 0 ? (
            <p className="text-slate-400 text-sm py-16 text-center">Belum ada data pemasukan</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={incomeSourceData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {incomeSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => rupiah(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="text-lg font-semibold mb-3">Grafik Keuangan 6 Bulan Terakhir</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyFinanceData} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={shortRupiah} />
            <Tooltip formatter={(v: number) => rupiah(v)} cursor={{ fill: '#f1f5f9' }} />
            <Legend />
            <Bar dataKey="pemasukan" fill="#7dbcfa" name="Pemasukan" radius={[8, 8, 0, 0]} />
            <Bar dataKey="pengeluaran" fill="#ff9cc7" name="Pengeluaran" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AdminDashboard;
