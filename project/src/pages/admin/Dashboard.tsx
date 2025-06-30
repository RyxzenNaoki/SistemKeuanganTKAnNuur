import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  FileText,
  Clipboard,
  AlertCircle,
} from 'lucide-react';

// Sample data for demonstration
const monthlyFinanceData = [
  { month: 'Jan', pemasukan: 25000000, pengeluaran: 18000000 },
  { month: 'Feb', pemasukan: 28000000, pengeluaran: 19500000 },
  { month: 'Mar', pemasukan: 32000000, pengeluaran: 22000000 },
  { month: 'Apr', pemasukan: 27000000, pengeluaran: 21000000 },
  { month: 'Mei', pemasukan: 30000000, pengeluaran: 24000000 },
  { month: 'Jun', pemasukan: 29000000, pengeluaran: 20000000 },
];

const paymentStatusData = [
  { name: 'Lunas', value: 65, color: '#22c55e' },
  { name: 'Belum Lunas', value: 25, color: '#f97316' },
  { name: 'Telat', value: 10, color: '#ef4444' },
];

const incomeSourceData = [
  { name: 'SPP', value: 70, color: '#a855f7' },
  { name: 'Uang Pangkal', value: 15, color: '#8b5cf6' },
  { name: 'Kegiatan', value: 10, color: '#6d28d9' },
  { name: 'Lainnya', value: 5, color: '#4c1d95' },
];

const AdminDashboard = () => {
  const [currentBalance, setCurrentBalance] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [activeStudents, setActiveStudents] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);

  // Simulate data loading
  useEffect(() => {
    // In a real app, this would be a Firestore fetch
    setCurrentBalance(33500000);
    setMonthlyIncome(29000000);
    setMonthlyExpense(20000000);
    setActiveStudents(68);
    setPendingPayments(17);
  }, []);

  // Format currency function
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="page-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="text-gray-600">Ringkasan keuangan dan informasi TK An Nuur Rumah Cahaya</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Current Balance */}
        <div className="card p-4 border-l-4 border-primary-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Saldo Saat Ini</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(currentBalance)}</p>
            </div>
            <div className="p-2 bg-primary-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>

        {/* Monthly Income */}
        <div className="card p-4 border-l-4 border-success-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pemasukan Bulan Ini</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(monthlyIncome)}</p>
            </div>
            <div className="p-2 bg-success-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-success-600" />
            </div>
          </div>
        </div>

        {/* Monthly Expense */}
        <div className="card p-4 border-l-4 border-warning-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pengeluaran Bulan Ini</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(monthlyExpense)}</p>
            </div>
            <div className="p-2 bg-warning-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-warning-600" />
            </div>
          </div>
        </div>

        {/* Active Students */}
        <div className="card p-4 border-l-4 border-secondary-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Siswa Aktif</p>
              <p className="text-2xl font-bold text-gray-900">{activeStudents} Siswa</p>
            </div>
            <div className="p-2 bg-secondary-100 rounded-lg">
              <Users className="h-6 w-6 text-secondary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Income vs Expense Chart */}
        <div className="card p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pemasukan & Pengeluaran (6 Bulan Terakhir)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyFinanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => formatCurrency(value as number)} 
                  labelFormatter={(label) => `Bulan: ${label}`}
                />
                <Legend />
                <Bar dataKey="pemasukan" name="Pemasukan" fill="#a855f7" />
                <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Combined Pie Charts */}
        <div className="card p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment Status Chart */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Status Pembayaran</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {paymentStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Income Source Chart */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sumber Pemasukan</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeSourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {incomeSourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="card p-4 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/admin/income" className="flex flex-col items-center justify-center p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
              <TrendingUp className="h-8 w-8 text-primary-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Catat Pemasukan</span>
            </Link>
            <Link to="/admin/expenses" className="flex flex-col items-center justify-center p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
              <TrendingDown className="h-8 w-8 text-primary-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Catat Pengeluaran</span>
            </Link>
            <Link to="/admin/schedule" className="flex flex-col items-center justify-center p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
              <Calendar className="h-8 w-8 text-primary-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Jadwal Pembayaran</span>
            </Link>
            <Link to="/admin/reports" className="flex flex-col items-center justify-center p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
              <FileText className="h-8 w-8 text-primary-600 mb-2" />
              <span className="text-sm font-medium text-gray-900">Laporan Keuangan</span>
            </Link>
          </div>
        </div>

        {/* Alerts & Reminders */}
        <div className="card p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pengingat & Pemberitahuan</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 bg-warning-50 rounded-lg">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-warning-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-warning-800">Pembayaran Tertunda</h3>
                <p className="text-xs text-warning-700">{pendingPayments} siswa belum melunasi SPP bulan Juni</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-primary-50 rounded-lg">
              <div className="flex-shrink-0">
                <Clipboard className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-primary-800">Jadwal Pembayaran</h3>
                <p className="text-xs text-primary-700">Tenggat pembayaran SPP bulan Juli: 10 Juli 2025</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-success-50 rounded-lg">
              <div className="flex-shrink-0">
                <Calendar className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-success-800">Kegiatan Mendatang</h3>
                <p className="text-xs text-success-700">Persiapkan anggaran untuk kegiatan Hari Anak pada 23 Juli</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;