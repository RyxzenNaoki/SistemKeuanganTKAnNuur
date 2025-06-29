import { useState } from 'react';
import { Download, FileText, Calendar, TrendingUp, TrendingDown, DollarSign, Filter } from 'lucide-react';
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
import { useToast } from '../../../contexts/ToastContext';

// Sample data for demonstration
const monthlyData = [
  { month: 'Jan', pemasukan: 25000000, pengeluaran: 18000000, saldo: 7000000 },
  { month: 'Feb', pemasukan: 28000000, pengeluaran: 19500000, saldo: 8500000 },
  { month: 'Mar', pemasukan: 32000000, pengeluaran: 22000000, saldo: 10000000 },
  { month: 'Apr', pemasukan: 27000000, pengeluaran: 21000000, saldo: 6000000 },
  { month: 'Mei', pemasukan: 30000000, pengeluaran: 24000000, saldo: 6000000 },
  { month: 'Jun', pemasukan: 29000000, pengeluaran: 20000000, saldo: 9000000 },
];

const incomeByCategory = [
  { name: 'SPP Bulanan', value: 70, amount: 20300000, color: '#a855f7' },
  { name: 'Uang Pangkal', value: 15, amount: 4350000, color: '#8b5cf6' },
  { name: 'Kegiatan', value: 10, amount: 2900000, color: '#6d28d9' },
  { name: 'Lainnya', value: 5, amount: 1450000, color: '#4c1d95' },
];

const expenseByCategory = [
  { name: 'Gaji', value: 40, amount: 8000000, color: '#ef4444' },
  { name: 'Utilitas', value: 25, amount: 5000000, color: '#f97316' },
  { name: 'Maintenance', value: 20, amount: 4000000, color: '#eab308' },
  { name: 'ATK', value: 10, amount: 2000000, color: '#84cc16' },
  { name: 'Lainnya', value: 5, amount: 1000000, color: '#06b6d4' },
];

const FinancialReports = () => {
  const { showToast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [reportType, setReportType] = useState('summary');

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate totals
  const totalIncome = monthlyData.reduce((sum, item) => sum + item.pemasukan, 0);
  const totalExpense = monthlyData.reduce((sum, item) => sum + item.pengeluaran, 0);
  const netProfit = totalIncome - totalExpense;

  const handleExportReport = (type: string) => {
    showToast('info', `Mengunduh laporan ${type}...`);
    // Implement export functionality
  };

  return (
    <div className="page-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Laporan Keuangan</h1>
        <p className="text-gray-600">Analisis dan laporan keuangan sekolah</p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Period Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="pl-10 input appearance-none"
            >
              <option value="3months">3 Bulan Terakhir</option>
              <option value="6months">6 Bulan Terakhir</option>
              <option value="1year">1 Tahun Terakhir</option>
              <option value="custom">Periode Kustom</option>
            </select>
          </div>

          {/* Report Type */}
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="input"
          >
            <option value="summary">Ringkasan</option>
            <option value="detailed">Detail</option>
            <option value="comparison">Perbandingan</option>
          </select>
        </div>

        {/* Export Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleExportReport('PDF')}
            className="btn btn-secondary flex items-center"
          >
            <Download className="h-5 w-5 mr-2" />
            Export PDF
          </button>
          <button
            onClick={() => handleExportReport('Excel')}
            className="btn btn-primary flex items-center"
          >
            <FileText className="h-5 w-5 mr-2" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="card p-6 bg-gradient-to-br from-primary-50 to-primary-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-primary-600">Total Pemasukan</p>
              <p className="text-2xl font-bold text-primary-900 mt-1">
                {formatCurrency(totalIncome)}
              </p>
            </div>
            <div className="p-2 bg-primary-200 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-primary-600">
            <Calendar className="h-4 w-4 mr-1" />
            <span>6 Bulan Terakhir</span>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-error-50 to-error-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-error-600">Total Pengeluaran</p>
              <p className="text-2xl font-bold text-error-900 mt-1">
                {formatCurrency(totalExpense)}
              </p>
            </div>
            <div className="p-2 bg-error-200 rounded-lg">
              <TrendingDown className="h-6 w-6 text-error-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-error-600">
            <Calendar className="h-4 w-4 mr-1" />
            <span>6 Bulan Terakhir</span>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-success-50 to-success-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-success-600">Laba Bersih</p>
              <p className="text-2xl font-bold text-success-900 mt-1">
                {formatCurrency(netProfit)}
              </p>
            </div>
            <div className="p-2 bg-success-200 rounded-lg">
              <DollarSign className="h-6 w-6 text-success-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-success-600">
            <Calendar className="h-4 w-4 mr-1" />
            <span>Margin: {((netProfit / totalIncome) * 100).toFixed(1)}%</span>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Rata-rata Bulanan</h3>
            <FileText className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pemasukan</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(totalIncome / 6)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pengeluaran</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(totalExpense / 6)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Laba</span>
              <span className="text-sm font-medium text-success-600">
                {formatCurrency(netProfit / 6)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Trend */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tren Keuangan Bulanan</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => formatCurrency(value as number)} 
                  labelFormatter={(label) => `Bulan: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="pemasukan" 
                  name="Pemasukan" 
                  stroke="#a855f7" 
                  strokeWidth={3}
                />
                <Line 
                  type="monotone" 
                  dataKey="pengeluaran" 
                  name="Pengeluaran" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                />
                <Line 
                  type="monotone" 
                  dataKey="saldo" 
                  name="Saldo" 
                  stroke="#22c55e" 
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Comparison */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Perbandingan Bulanan</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => formatCurrency(value as number)} 
                  labelFormatter={(label) => `Bulan: ${label}`}
                />
                <Legend />
                <Bar dataKey="pemasukan" name="Pemasukan" fill="#a855f7" />
                <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Income by Category */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pemasukan per Kategori</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {incomeByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {incomeByCategory.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(item.amount)}
                    </div>
                    <div className="text-xs text-gray-500">{item.value}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expense by Category */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pengeluaran per Kategori</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {expenseByCategory.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-600">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(item.amount)}
                    </div>
                    <div className="text-xs text-gray-500">{item.value}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary Table */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Ringkasan Keuangan Bulanan</h2>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Bulan</th>
                <th>Pemasukan</th>
                <th>Pengeluaran</th>
                <th>Laba/Rugi</th>
                <th>Margin (%)</th>
                <th>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((item, index) => {
                const profit = item.pemasukan - item.pengeluaran;
                const margin = (profit / item.pemasukan) * 100;
                return (
                  <tr key={index}>
                    <td className="font-medium text-gray-900">{item.month} 2025</td>
                    <td className="font-medium text-success-600">
                      {formatCurrency(item.pemasukan)}
                    </td>
                    <td className="font-medium text-error-600">
                      {formatCurrency(item.pengeluaran)}
                    </td>
                    <td className={`font-medium ${profit >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                      {formatCurrency(profit)}
                    </td>
                    <td className={`font-medium ${margin >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                      {margin.toFixed(1)}%
                    </td>
                    <td className="font-medium text-gray-900">
                      {formatCurrency(item.saldo)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;