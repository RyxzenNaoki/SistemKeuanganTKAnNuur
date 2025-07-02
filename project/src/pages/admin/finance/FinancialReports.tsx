// FinancialReports.tsx — versi fix semua error + fitur export CSV + CHART ditampilkan

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { FileText } from 'lucide-react';
import { saveAs } from 'file-saver';
import { useToast } from '../../../contexts/ToastContext';
import dayjs from 'dayjs';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

// ================= TYPES =================
type Income = {
  id?: string;
  date: Date;
  category: 'spp' | 'registration' | 'activity' | 'uniform' | 'book' | 'other';
  description: string;
  amount: number;
};

type Expense = {
  id?: string;
  date: Date;
  category: 'Utilitas'|'ATK'|'Maintenance'|'Gaji'|'Operasional'|'Transport'|'Konsumsi'|'Lain-lain';
  description: string;
  amount: number;
};

type MonthlySummary = {
  month: string;
  pemasukan: number;
  pengeluaran: number;
  saldo: number;
};

type CategoryBreakdown = {
  name: string;
  amount: number;
  value: number;
  color: string;
};

// ============== COMPONENT ================
const FinancialReports = () => {
  const { showToast } = useToast();

  const [selectedPeriod, setSelectedPeriod] = useState<'6months' | '12months'>('6months');
  const [reportType, setReportType] = useState<'summary' | 'detail'>('summary');
  const [monthlyData, setMonthlyData] = useState<MonthlySummary[]>([]);
  const [incomeByCategory, setIncomeByCategory] = useState<CategoryBreakdown[]>([]);
  const [expenseByCategory, setExpenseByCategory] = useState<CategoryBreakdown[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const incomeSnap = await getDocs(collection(db, 'incomes'));
        const incomesData: Income[] = incomeSnap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            date: data.date?.toDate?.() || new Date(),
            category: data.category,
            description: data.description,
            amount: data.amount,
          };
        });

        const expenseSnap = await getDocs(collection(db, 'expenses'));
        const expensesData: Expense[] = expenseSnap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            date: data.date?.toDate?.() || new Date(),
            category: data.category,
            description: data.description,
            amount: data.amount,
          };
        });

        setIncomes(incomesData);
        setExpenses(expensesData);
        processReports(incomesData, expensesData);
      } catch (error) {
        console.error('Gagal memuat data:', error);
        showToast('error', 'Gagal memuat data laporan');
      }
    };

    fetchData();
  }, []);



  const processReports = (incomes: Income[], expenses: Expense[]) => {
    const months = Array.from({ length: selectedPeriod === '6months' ? 6 : 12 })
      .map((_, i) => dayjs().subtract(i, 'month').format('MMM')).reverse();

    const monthMap: Record<string, MonthlySummary> = months.reduce((acc, month) => {
      acc[month] = { month, pemasukan: 0, pengeluaran: 0, saldo: 0 };
      return acc;
    }, {} as Record<string, MonthlySummary>);

    incomes.forEach(income => {
      const month = dayjs(income.date).format('MMM');
      if (monthMap[month]) monthMap[month].pemasukan += income.amount || 0;
    });

    expenses.forEach(exp => {
      const month = dayjs(exp.date).format('MMM');
      if (monthMap[month]) monthMap[month].pengeluaran += exp.amount || 0;
    });

    Object.values(monthMap).forEach(item => {
      item.saldo = item.pemasukan - item.pengeluaran;
    });

    setMonthlyData(Object.values(monthMap));

    const groupBy = (data: (Income | Expense)[], key: keyof Income | keyof Expense) => {
      const grouped: Record<string, number> = {};
      data.forEach(item => {
        const cat = item[key] || 'Lainnya';
        grouped[cat as string] = (grouped[cat as string] || 0) + (item.amount || 0);
      });
      return grouped;
    };

    const incomeCat = groupBy(incomes, 'category');
    const incomeResult: CategoryBreakdown[] = Object.entries(incomeCat).map(([key, val]) => ({
      name: key,
      amount: val,
      value: Math.round((val / incomes.reduce((s, i) => s + i.amount, 0)) * 100),
      color: '#' + Math.floor(Math.random() * 16777215).toString(16),
    }));

    const expenseCat = groupBy(expenses, 'category');
    const expenseResult: CategoryBreakdown[] = Object.entries(expenseCat).map(([key, val]) => ({
      name: key,
      amount: val,
      value: Math.round((val / expenses.reduce((s, e) => s + e.amount, 0)) * 100),
      color: '#' + Math.floor(Math.random() * 16777215).toString(16),
    }));

    setIncomeByCategory(incomeResult);
    setExpenseByCategory(expenseResult);
  };

  const exportToCSV = <T extends Record<string, unknown>>(data: T[], filename: string) => {
    if (data.length === 0) return;

    const csvContent = [
      Object.keys(data[0]).join(','), // Header
      ...data.map(item =>
        Object.values(item)
          .map(value => `"${String(value).replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
  };


  const handleExportReport = (type: string) => {
    showToast('info', `Mengunduh laporan ${type.toUpperCase()}...`);

    if (type === 'csv') {
      if (reportType === 'summary') {
        exportToCSV(monthlyData, 'Ringkasan_Keuangan');
      } else if (reportType === 'detail') {
        exportToCSV([...incomes, ...expenses], 'Detail_Transaksi');
      }
    }
  };

  return (
    <div className="page-transition">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-gray-800">Laporan Keuangan</h1>
        <div className="flex gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) =>
              setSelectedPeriod(e.target.value as '6months' | '12months')
            }
            className="input"
          >
            <option value="6months">6 Bulan Terakhir</option>
            <option value="12months">12 Bulan Terakhir</option>
          </select>
          <button
            onClick={() => handleExportReport('csv')}
            className="btn btn-primary flex items-center gap-2"
          >
            <FileText className="h-5 w-5" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <label className="text-sm font-medium">Jenis Laporan:</label>
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value as 'summary' | 'detail')}
          className="input"
        >
          <option value="summary">Ringkasan</option>
          <option value="detail">Detail</option>
        </select>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card p-4">
          <h2 className="text-lg font-semibold mb-2">Pemasukan per Kategori</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={incomeByCategory} dataKey="value" nameKey="name" outerRadius={80}>
                {incomeByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <h2 className="text-lg font-semibold mb-2">Pengeluaran per Kategori</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={expenseByCategory} dataKey="value" nameKey="name" outerRadius={80}>
                {expenseByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-4">
        <h2 className="text-lg font-semibold mb-2">Ringkasan Bulanan</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="pemasukan" fill="#34d399" name="Pemasukan" />
            <Bar dataKey="pengeluaran" fill="#f87171" name="Pengeluaran" />
            <Bar dataKey="saldo" fill="#60a5fa" name="Saldo" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FinancialReports;
