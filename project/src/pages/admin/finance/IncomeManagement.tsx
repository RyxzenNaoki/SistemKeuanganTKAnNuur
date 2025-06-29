import { useState } from 'react';
import { PlusCircle, Search, Edit2, Trash2, FileText, Download, Filter } from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';

interface Income {
  id: string;
  date: string;
  category: 'spp' | 'registration' | 'donation' | 'other';
  description: string;
  amount: number;
  student: string;
  paymentMethod: 'transfer' | 'cash';
  status: 'verified' | 'pending' | 'rejected';
  receiptNumber: string;
}

const IncomeManagement = () => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Sample data - replace with actual data from Firebase
  const [incomes] = useState<Income[]>([
    {
      id: '1',
      date: '2025-06-15',
      category: 'spp',
      description: 'SPP Bulan Juni 2025',
      amount: 500000,
      student: 'Budi Santoso',
      paymentMethod: 'transfer',
      status: 'verified',
      receiptNumber: 'SPP-2025-06-001',
    },
    {
      id: '2',
      date: '2025-06-14',
      category: 'registration',
      description: 'Uang Pangkal TA 2025/2026',
      amount: 2500000,
      student: 'Siti Rahayu',
      paymentMethod: 'transfer',
      status: 'pending',
      receiptNumber: 'REG-2025-06-001',
    },
    // Add more sample data as needed
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryLabel = (category: string) => {
    const categories = {
      spp: 'SPP Bulanan',
      registration: 'Uang Pangkal',
      donation: 'Donasi',
      other: 'Lainnya',
    };
    return categories[category as keyof typeof categories] || category;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'rejected':
        return 'badge-error';
      default:
        return 'badge-secondary';
    }
  };

  const filteredIncomes = incomes.filter((income) => {
    const matchesSearch =
      income.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      income.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
      income.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || income.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || income.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleAddIncome = () => {
    setShowAddModal(true);
  };

  const handleExportData = () => {
    // Implement export functionality
    showToast('info', 'Mengunduh data pemasukan...');
  };

  return (
    <div className="page-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Pemasukan</h1>
        <p className="text-gray-600">Kelola data pemasukan keuangan sekolah</p>
      </div>

      {/* Actions Bar */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari pemasukan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input"
            >
              <option value="all">Semua Kategori</option>
              <option value="spp">SPP Bulanan</option>
              <option value="registration">Uang Pangkal</option>
              <option value="donation">Donasi</option>
              <option value="other">Lainnya</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input"
            >
              <option value="all">Semua Status</option>
              <option value="verified">Terverifikasi</option>
              <option value="pending">Menunggu</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExportData}
            className="btn btn-secondary flex items-center"
          >
            <Download className="h-5 w-5 mr-2" />
            Export
          </button>
          <button
            onClick={handleAddIncome}
            className="btn btn-primary flex items-center"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Tambah Pemasukan
          </button>
        </div>
      </div>

      {/* Income Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>No. Kwitansi</th>
                <th>Kategori</th>
                <th>Keterangan</th>
                <th>Siswa</th>
                <th>Jumlah</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncomes.map((income) => (
                <tr key={income.id}>
                  <td>{new Date(income.date).toLocaleDateString('id-ID')}</td>
                  <td>{income.receiptNumber}</td>
                  <td>{getCategoryLabel(income.category)}</td>
                  <td>{income.description}</td>
                  <td>{income.student}</td>
                  <td className="font-medium">{formatCurrency(income.amount)}</td>
                  <td>
                    <span className={`badge ${getStatusBadgeColor(income.status)}`}>
                      {income.status === 'verified' && 'Terverifikasi'}
                      {income.status === 'pending' && 'Menunggu'}
                      {income.status === 'rejected' && 'Ditolak'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {/* Handle view receipt */}}
                        className="p-1 text-gray-500 hover:text-primary-600 transition-colors"
                        title="Lihat Kwitansi"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {/* Handle edit */}}
                        className="p-1 text-gray-500 hover:text-primary-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {/* Handle delete */}}
                        className="p-1 text-gray-500 hover:text-error-600 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredIncomes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Tidak ada data pemasukan yang ditemukan</p>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="card p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Pemasukan Bulan Ini</h3>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(15000000)}</p>
          <div className="mt-2 text-sm text-success-600">+12.5% dari bulan lalu</div>
        </div>
        <div className="card p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">SPP Terkumpul</h3>
          <p className="text-2xl font-bold text-gray-900">85%</p>
          <div className="mt-2 text-sm text-gray-600">29 dari 34 siswa</div>
        </div>
        <div className="card p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Menunggu Verifikasi</h3>
          <p className="text-2xl font-bold text-gray-900">3</p>
          <div className="mt-2 text-sm text-warning-600">Pembayaran perlu dicek</div>
        </div>
      </div>

      {/* Add/Edit Income Modal would go here */}
      {/* Implementation of modal component omitted for brevity */}
    </div>
  );
};

export default IncomeManagement;