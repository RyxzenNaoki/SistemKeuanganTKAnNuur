// Dashboard.tsx — cleaned up ESLint & TypeScript warnings

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
import { db } from '../../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { useToast } from '../../contexts/ToastContext';
import dayjs from 'dayjs';
import { Link, Loader2 } from 'lucide-react';

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
        const incomeSnap = await getDocs(collection(db, 'incomes'));
        const incomes = incomeSnap.docs.map(doc => doc.data() as Income);

        const expenseSnap = await getDocs(collection(db, 'expenses'));
        const expenses = expenseSnap.docs.map(doc => doc.data() as Expense);

        const studentSnap = await getDocs(collection(db, 'students'));
        const students = studentSnap.docs.map(doc => doc.data() as Student);

        const notifSnap = await getDocs(collection(db, 'notifications'));
        const notifs = notifSnap.docs.map(doc => {
          const data = doc.data();
          return {
            title: data.title,
            message: data.message,
            createdAt: data.createdAt?.toDate?.() ?? new Date(),
          } as Notification;
        });
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
        setIncomeSourceData(countByCategory(incomes, 'category'));
      } catch (error) {
        showToast('error', 'Gagal memuat data dashboard');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const groupMonthlyData = (incomes: Income[], expenses: Expense[]): ChartData[] => {
    const months = Array.from({ length: 6 }).map((_, i) =>
      dayjs().subtract(i, 'month').format('MMM')
    ).reverse();

    return months.map(month => {
      const pemasukan = incomes
        .filter(i => dayjs(i.date.toDate()).format('MMM') === month)
        .reduce((sum, i) => sum + i.amount, 0);
      const pengeluaran = expenses
        .filter(e => dayjs(e.date.toDate()).format('MMM') === month)
        .reduce((sum, e) => sum + e.amount, 0);
      return { month, pemasukan, pengeluaran };
    });
  };

  const countByCategory = <T extends Record<string, unknown>>(data: T[], key: keyof T): PieData[] => {
    const map: Record<string, number> = {};
    data.forEach(d => {
      const k = String(d[key] || 'Lainnya');
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      color: '#' + Math.floor(Math.random() * 16777215).toString(16),
    }));
  };

  if (loading) {
    return (
      <div className="page-transition">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          <span className="ml-2 text-gray-600">Memuat dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition">
      <h1 className="text-2xl font-bold mb-6">Beranda</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <p className="text-gray-500 text-sm">Saldo Sekarang</p>
          <p className="text-xl font-semibold text-gray-800">Rp {currentBalance.toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-gray-500 text-sm">Pemasukan Bulan Ini</p>
          <p className="text-xl font-semibold text-green-600">Rp {monthlyIncome.toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-gray-500 text-sm">Pengeluaran Bulan Ini</p>
          <p className="text-xl font-semibold text-red-600">Rp {monthlyExpense.toLocaleString()}</p>
        </div>
        <div className="card p-4">
          <p className="text-gray-500 text-sm">Siswa Aktif</p>
          <p className="text-xl font-semibold text-blue-600">{activeStudents}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card p-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Pemberitahuan</h2>
            <Link to="/admin/notifications" className="text-sm text-primary-600 hover:underline">Lihat Semua</Link>
          </div>
          <ul className="space-y-2 max-h-[230px] overflow-y-auto">
            {notifications.slice(0, 5).map((notif, idx) => {
              const colors = [
                'bg-red-100 text-red-800',
                'bg-green-100 text-green-800',
                'bg-blue-100 text-blue-800',
                'bg-yellow-100 text-yellow-800',
                'bg-purple-100 text-purple-800',
              ];
              const colorClass = colors[idx % colors.length];

              return (
                <li
                  key={idx}
                  className={`rounded-lg p-3 ${colorClass}`}
                >
                  <p className="font-semibold">{notif.title}</p>
                  <p className="text-sm">{notif.message}</p>
                </li>
              );
            })}

            {notifications.length === 0 && (
              <p className="text-gray-500">Belum ada pemberitahuan</p>
            )}
          </ul>

        </div>

        <div className="card p-4">
          <h2 className="text-lg font-semibold mb-2">Sumber Pemasukan</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={incomeSourceData} dataKey="value" nameKey="name" outerRadius={80}>
                {incomeSourceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-4">
        <h2 className="text-lg font-semibold mb-2">Grafik Keuangan 6 Bulan Terakhir</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyFinanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="pemasukan" fill="#34d399" name="Pemasukan" />
            <Bar dataKey="pengeluaran" fill="#f87171" name="Pengeluaran" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AdminDashboard;
