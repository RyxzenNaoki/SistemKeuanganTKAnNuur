import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import dayjs from 'dayjs';
import { Download, Loader2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { db } from '../../../firebase/config';
import { useToast } from '../../../contexts/ToastContext';
import { exportToCSV } from '../../../utils/csv';

// ================= TYPES & KONSTANTA =================
type Transaction = {
  date: Date;
  category: string;
  description: string;
  amount: number;
};

const INCOME_CATEGORIES: Record<string, string> = {
  spp: 'SPP Bulanan',
  registration: 'Uang Pangkal',
  activity: 'Uang Kegiatan',
  uniform: 'Uang Seragam',
  book: 'Uang Buku',
  other: 'Lainnya',
};

// Sama dengan daftar kategori di form Pengeluaran (ExpenseModal)
const EXPENSE_CATEGORIES = ['Gaji', 'Operasional', 'Utilitas', 'ATK', 'Maintenance', 'Transport', 'Konsumsi', 'Lain-lain'];

const PASTEL = ['#7dbcfa', '#ff9cc7', '#ffe06b', '#a7e8c3', '#c9b8ff', '#ffc9a3', '#9fd8e8', '#f7b6d2'];

type CategoryRow = { name: string; count: number; total: number; percent: number; color: string };

const rupiah = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;

// Kelompokkan transaksi per kategori; semua kategori resmi selalu tampil (walau 0)
// supaya admin langsung lihat "Gaji berapa, Operasional berapa" tanpa ada yang hilang.
const buildCategoryRows = (
  items: Transaction[],
  knownCategories: string[],
  labelOf: (raw: string) => string
): CategoryRow[] => {
  const map = new Map<string, { count: number; total: number }>();
  knownCategories.forEach(c => map.set(labelOf(c), { count: 0, total: 0 }));
  items.forEach(item => {
    const label = labelOf(item.category);
    const current = map.get(label) ?? { count: 0, total: 0 };
    map.set(label, { count: current.count + 1, total: current.total + (item.amount || 0) });
  });
  const grand = Array.from(map.values()).reduce((s, r) => s + r.total, 0);
  return Array.from(map.entries()).map(([name, { count, total }], idx) => ({
    name,
    count,
    total,
    percent: grand === 0 ? 0 : Math.round((total / grand) * 1000) / 10,
    color: PASTEL[idx % PASTEL.length],
  }));
};

// ============== COMPONENT ================
const FinancialReports = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<6 | 12>(6);
  const [incomes, setIncomes] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [incomeSnap, expenseSnap] = await Promise.all([
          getDocs(collection(db, 'incomes')),
          getDocs(collection(db, 'expenses')),
        ]);
        const toTx = (d: Record<string, any>): Transaction => ({
          date: d.date?.toDate?.() ?? new Date(),
          category: d.category ?? '',
          description: d.description ?? '',
          amount: d.amount ?? 0,
        });
        setIncomes(incomeSnap.docs.map(d => toTx(d.data())));
        setExpenses(expenseSnap.docs.map(d => toTx(d.data())));
      } catch (error) {
        console.error('Gagal memuat data:', error);
        showToast('error', 'Gagal memuat data laporan');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Semua angka diturunkan dari data + periode, jadi ganti periode langsung menghitung ulang
  const report = useMemo(() => {
    const start = dayjs().subtract(period - 1, 'month').startOf('month');
    const inPeriod = (t: Transaction) => !dayjs(t.date).isBefore(start);
    const periodIncomes = incomes.filter(inPeriod);
    const periodExpenses = expenses.filter(inPeriod);

    const months = Array.from({ length: period }).map((_, i) => start.add(i, 'month'));
    const monthly = months.map(m => {
      const sameMonth = (t: Transaction) => dayjs(t.date).isSame(m, 'month');
      const pemasukan = periodIncomes.filter(sameMonth).reduce((s, t) => s + t.amount, 0);
      const pengeluaran = periodExpenses.filter(sameMonth).reduce((s, t) => s + t.amount, 0);
      return { month: m.format('MMM YY'), key: m, pemasukan, pengeluaran, saldo: pemasukan - pengeluaran };
    });

    // Matriks kategori x bulan untuk rincian detail
    const expenseMatrix = EXPENSE_CATEGORIES.map(cat => ({
      name: cat,
      perMonth: months.map(m =>
        periodExpenses
          .filter(t => (EXPENSE_CATEGORIES.includes(t.category) ? t.category : 'Lain-lain') === cat && dayjs(t.date).isSame(m, 'month'))
          .reduce((s, t) => s + t.amount, 0)
      ),
    }));

    return {
      periodIncomes,
      periodExpenses,
      monthly,
      months,
      expenseMatrix,
      incomeRows: buildCategoryRows(periodIncomes, Object.keys(INCOME_CATEGORIES), raw => INCOME_CATEGORIES[raw] ?? 'Lainnya'),
      expenseRows: buildCategoryRows(
        periodExpenses,
        EXPENSE_CATEGORIES,
        raw => (EXPENSE_CATEGORIES.includes(raw) ? raw : 'Lain-lain')
      ),
      totalIncome: periodIncomes.reduce((s, t) => s + t.amount, 0),
      totalExpense: periodExpenses.reduce((s, t) => s + t.amount, 0),
    };
  }, [incomes, expenses, period]);

  const periodLabel = `${period}_Bulan_Terakhir`;

  const exportMonthly = () =>
    exportToCSV(
      report.monthly.map(m => ({ Bulan: m.month, Pemasukan: m.pemasukan, Pengeluaran: m.pengeluaran, Saldo: m.saldo })),
      `Ringkasan_Bulanan_${periodLabel}`
    );

  const exportCategories = () =>
    exportToCSV(
      [
        ...report.incomeRows.map(r => ({ Jenis: 'Pemasukan', Kategori: r.name, 'Jumlah Transaksi': r.count, Total: r.total, 'Persen (%)': r.percent })),
        ...report.expenseRows.map(r => ({ Jenis: 'Pengeluaran', Kategori: r.name, 'Jumlah Transaksi': r.count, Total: r.total, 'Persen (%)': r.percent })),
      ],
      `Laporan_Per_Kategori_${periodLabel}`
    );

  const exportDetail = () => {
    const rows = [
      ...report.periodIncomes.map(t => ({ Jenis: 'Pemasukan', t, kategori: INCOME_CATEGORIES[t.category] ?? 'Lainnya' })),
      ...report.periodExpenses.map(t => ({ Jenis: 'Pengeluaran', t, kategori: t.category })),
    ]
      .sort((a, b) => a.t.date.getTime() - b.t.date.getTime())
      .map(({ Jenis, t, kategori }) => ({
        Tanggal: dayjs(t.date).format('DD/MM/YYYY'),
        Jenis,
        Kategori: kategori,
        Deskripsi: t.description,
        Jumlah: t.amount,
      }));
    if (rows.length === 0) {
      showToast('error', 'Tidak ada transaksi pada periode ini');
      return;
    }
    exportToCSV(rows, `Detail_Transaksi_${periodLabel}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        <span className="ml-2 text-slate-500">Memuat laporan...</span>
      </div>
    );
  }

  const saldo = report.totalIncome - report.totalExpense;

  return (
    <div className="page-transition space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Laporan Keuangan</h1>
          <p className="text-sm text-slate-500">Rincian pemasukan dan pengeluaran per kategori</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="input w-auto" value={period} onChange={e => setPeriod(Number(e.target.value) as 6 | 12)}>
            <option value={6}>6 Bulan Terakhir</option>
            <option value={12}>12 Bulan Terakhir</option>
          </select>
          <button onClick={exportMonthly} className="btn btn-secondary flex items-center gap-2">
            <Download className="h-4 w-4" /> Ringkasan
          </button>
          <button onClick={exportCategories} className="btn btn-secondary flex items-center gap-2">
            <Download className="h-4 w-4" /> Per Kategori
          </button>
          <button onClick={exportDetail} className="btn btn-primary flex items-center gap-2">
            <Download className="h-4 w-4" /> Detail Transaksi
          </button>
        </div>
      </div>

      {/* Ringkasan periode */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl p-4 shadow-soft stat-card-blue">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600"><TrendingUp className="h-5 w-5" /></div>
          <p className="mt-3 text-sm text-slate-500">Total Pemasukan</p>
          <p className="text-xl font-semibold text-slate-800">{rupiah(report.totalIncome)}</p>
        </div>
        <div className="rounded-2xl p-4 shadow-soft stat-card-pink">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-100 text-secondary-600"><TrendingDown className="h-5 w-5" /></div>
          <p className="mt-3 text-sm text-slate-500">Total Pengeluaran</p>
          <p className="text-xl font-semibold text-slate-800">{rupiah(report.totalExpense)}</p>
        </div>
        <div className="rounded-2xl p-4 shadow-soft stat-card-yellow">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent-100 text-accent-700"><Wallet className="h-5 w-5" /></div>
          <p className="mt-3 text-sm text-slate-500">Selisih (Saldo Periode)</p>
          <p className={`text-xl font-semibold ${saldo < 0 ? 'text-error-600' : 'text-slate-800'}`}>{rupiah(saldo)}</p>
        </div>
      </div>

      {/* Tabel per kategori */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CategoryTable title="Pemasukan per Kategori" rows={report.incomeRows} total={report.totalIncome} />
        <CategoryTable title="Pengeluaran per Kategori" rows={report.expenseRows} total={report.totalExpense} />
      </div>

      {/* Grafik */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CategoryPie title="Komposisi Pemasukan" rows={report.incomeRows} />
        <CategoryPie title="Komposisi Pengeluaran" rows={report.expenseRows} />
      </div>

      <div className="card p-5">
        <h2 className="text-lg font-semibold mb-3">Grafik Bulanan</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={report.monthly} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} tickFormatter={(v: number) => (v >= 1_000_000 ? `${v / 1_000_000}jt` : v >= 1_000 ? `${v / 1_000}rb` : String(v))} />
            <Tooltip formatter={(v: number) => rupiah(v)} cursor={{ fill: '#f1f5f9' }} />
            <Legend />
            <Bar dataKey="pemasukan" fill="#7dbcfa" name="Pemasukan" radius={[8, 8, 0, 0]} />
            <Bar dataKey="pengeluaran" fill="#ff9cc7" name="Pengeluaran" radius={[8, 8, 0, 0]} />
            <Bar dataKey="saldo" fill="#ffe06b" name="Saldo" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Rincian bulanan */}
      <div className="card p-5">
        <h2 className="text-lg font-semibold mb-3">Rincian Bulanan</h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Bulan</th>
                <th className="text-right">Pemasukan</th>
                <th className="text-right">Pengeluaran</th>
                <th className="text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {report.monthly.map(m => (
                <tr key={m.month}>
                  <td className="font-medium">{m.month}</td>
                  <td className="text-right">{rupiah(m.pemasukan)}</td>
                  <td className="text-right">{rupiah(m.pengeluaran)}</td>
                  <td className={`text-right font-medium ${m.saldo < 0 ? 'text-error-600' : ''}`}>{rupiah(m.saldo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rincian pengeluaran per kategori per bulan */}
      <div className="card p-5">
        <h2 className="text-lg font-semibold mb-1">Rincian Pengeluaran per Kategori per Bulan</h2>
        <p className="text-xs text-slate-400 mb-3">Contoh: berapa gaji, operasional, dan lainnya di tiap bulan.</p>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Kategori</th>
                {report.months.map(m => (
                  <th key={m.format('YYYY-MM')} className="text-right whitespace-nowrap">{m.format('MMM YY')}</th>
                ))}
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {report.expenseMatrix.map(row => (
                <tr key={row.name}>
                  <td className="font-medium">{row.name}</td>
                  {row.perMonth.map((value, idx) => (
                    <td key={idx} className="text-right whitespace-nowrap">{value === 0 ? '-' : rupiah(value)}</td>
                  ))}
                  <td className="text-right font-semibold whitespace-nowrap">{rupiah(row.perMonth.reduce((s, v) => s + v, 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const CategoryTable = ({ title, rows, total }: { title: string; rows: CategoryRow[]; total: number }) => (
  <div className="card p-5">
    <h2 className="text-lg font-semibold mb-3">{title}</h2>
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Kategori</th>
            <th className="text-right">Transaksi</th>
            <th className="text-right">Total</th>
            <th className="text-right">%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.name}>
              <td>
                <span className="inline-block h-2.5 w-2.5 rounded-full mr-2" style={{ backgroundColor: row.color }} />
                {row.name}
              </td>
              <td className="text-right">{row.count}</td>
              <td className="text-right">{rupiah(row.total)}</td>
              <td className="text-right">{row.percent}%</td>
            </tr>
          ))}
          <tr className="bg-slate-50 font-semibold">
            <td>Total</td>
            <td className="text-right">{rows.reduce((s, r) => s + r.count, 0)}</td>
            <td className="text-right">{rupiah(total)}</td>
            <td className="text-right">{total === 0 ? '0%' : '100%'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

const CategoryPie = ({ title, rows }: { title: string; rows: CategoryRow[] }) => {
  const data = rows.filter(r => r.total > 0);
  return (
    <div className="card p-5">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      {data.length === 0 ? (
        <p className="text-slate-400 text-sm py-16 text-center">Belum ada data pada periode ini</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={data} dataKey="total" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={3}>
              {data.map(entry => (
                <Cell key={entry.name} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => rupiah(v)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default FinancialReports;
