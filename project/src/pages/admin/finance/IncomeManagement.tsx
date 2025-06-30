import { useState } from 'react';
import { PlusCircle, Search, Edit2, Trash2, FileText, Download, Filter } from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';
import IncomeModal from '../../../components/admin/IncomeModal';

interface Income {
  id: string;
  date: Date;
  category: 'spp' | 'registration' | 'donation' | 'other';
  description: string;
  amount: number;
  student: string;
  paymentMethod: 'transfer' | 'cash';
  status: 'verified' | 'pending' | 'rejected';
  receiptNumber: string;
  notes?: string;
}

const IncomeManagement = () => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Sample data - replace with actual data from Firebase
  const [incomes, setIncomes] = useState<Income[]>([
    {
      id: '1',
      date: new Date('2025-06-15'),
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
      date: new Date('2025-06-14'),
      category: 'registration',
      description: 'Uang Pangkal TA 2025/2026',
      amount: 2500000,
      student: 'Siti Rahayu',
      paymentMethod: 'transfer',
      status: 'pending',
      receiptNumber: 'REG-2025-06-001',
    },
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
    setSelectedIncome(null);
    setShowModal(true);
  };

  const handleEditIncome = (income: Income) => {
    setSelectedIncome(income);
    setShowModal(true);
  };

  const handleSaveIncome = async (incomeData: Omit<Income, 'id'>) => {
    try {
      setModalLoading(true);
      
      if (selectedIncome) {
        // Update existing income
        setIncomes(prev => prev.map(income => 
          income.id === selectedIncome.id 
            ? { ...income, ...incomeData }
            : income
        ));
        showToast('success', 'Data pemasukan berhasil diperbarui');
      } else {
        // Add new income
        const newIncome: Income = {
          id: Date.now().toString(),
          ...incomeData,
        };
        setIncomes(prev => [...prev, newIncome]);
        showToast('success', 'Pemasukan baru berhasil ditambahkan');
      }
      
      setShowModal(false);
    } catch (error) {
      console.error('Error saving income:', error);
      showToast('error', 'Gagal menyimpan data pemasukan');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteIncome = (income: Income) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus pemasukan ${income.description}?`)) {
      return;
    }

    setIncomes(prev => prev.filter(inc => inc.id !== income.id));
    showToast('success', 'Pemasukan berhasil dihapus');
  };

  const handleExportData = () => {
    showToast('info', 'Mengunduh data pemasukan...');
  };

  const totalIncome = filteredIncomes.reduce((sum, income) => sum + income.amount, 0);
  const verifiedCount = filteredIncomes.filter(income => income.status === 'verified').length;
  const pendingCount = filteredIncomes.filter(income => income.status === 'pending').length;

  return (
    <div className="page-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Pemasukan</h1>
        <p className="text-gray-600">Kelola data pemasukan keuangan sekolah</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Pemasukan</h3>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalIncome)}</p>
          <div className="mt-2 text-sm text-success-600">Periode yang dipilih</div>
        </div>
        <div className="card p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Terverifikasi</h3>
          <p className="text-2xl font-bold text-success-600">{verifiedCount}</p>
          <div className="mt-2 text-sm text-gray-600">dari {filteredIncomes.length} transaksi</div>
        </div>
        <div className="card p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Menunggu Verifikasi</h3>
          <p className="text-2xl font-bold text-warning-600">{pendingCount}</p>
          <div className="mt-2 text-sm text-warning-600">Perlu ditinjau</div>
        </div>
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

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportData}
            className="btn btn-secondary flex items-center flex-1 sm:flex-none"
          >
            <Download className="h-5 w-5 mr-2" />
            Export
          </button>
          <button
            onClick={handleAddIncome}
            className="btn btn-primary flex items-center flex-1 sm:flex-none"
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
                  <td>{income.date.toLocaleDateString('id-ID')}</td>
                  <td>{income.receiptNumber}</td>
                  <td>
                    <span className="badge badge-secondary">{getCategoryLabel(income.category)}</span>
                  </td>
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
                        onClick={() => handleEditIncome(income)}
                        className="p-1 text-gray-500 hover:text-primary-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteIncome(income)}
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

      {/* Income Modal */}
      <IncomeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveIncome}
        incomeData={selectedIncome}
        loading={modalLoading}
      />
    </div>
  );
};

export default IncomeManagement;