import { useState } from 'react';
import { PlusCircle, Search, Download, Edit2, Trash2, TrendingDown, Calendar, FileText, Filter } from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';
import ExpenseModal from '../../../components/admin/ExpenseModal';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  attachments?: string[];
}

const ExpenseManagement = () => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Sample data - replace with actual data from Firestore
  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: '1',
      description: 'Pembayaran Listrik',
      amount: 750000,
      category: 'Utilitas',
      date: new Date('2025-06-15'),
      status: 'approved',
      notes: 'Pembayaran listrik bulan Juni 2025',
    },
    {
      id: '2',
      description: 'Alat Tulis Kantor',
      amount: 500000,
      category: 'ATK',
      date: new Date('2025-06-14'),
      status: 'approved',
      notes: 'Pembelian ATK untuk administrasi',
    },
    {
      id: '3',
      description: 'Perbaikan AC',
      amount: 1200000,
      category: 'Maintenance',
      date: new Date('2025-06-13'),
      status: 'pending',
      notes: 'Service AC ruang kelas Mawar',
    },
  ]);

  const categories = [
    'Utilitas',
    'ATK',
    'Maintenance',
    'Gaji',
    'Operasional',
    'Transport',
    'Konsumsi',
    'Lain-lain',
  ];

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const approvedCount = expenses.filter(expense => expense.status === 'approved').length;
  const pendingCount = expenses.filter(expense => expense.status === 'pending').length;

  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || expense.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'badge-success';
      case 'rejected':
        return 'badge-error';
      default:
        return 'badge-warning';
    }
  };

  const handleAddExpense = () => {
    setSelectedExpense(null);
    setShowModal(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowModal(true);
  };

  const handleSaveExpense = async (expenseData: Omit<Expense, 'id'>) => {
    try {
      setModalLoading(true);
      
      if (selectedExpense) {
        // Update existing expense
        setExpenses(prev => prev.map(expense => 
          expense.id === selectedExpense.id 
            ? { ...expense, ...expenseData }
            : expense
        ));
        showToast('success', 'Data pengeluaran berhasil diperbarui');
      } else {
        // Add new expense
        const newExpense: Expense = {
          id: Date.now().toString(),
          ...expenseData,
        };
        setExpenses(prev => [...prev, newExpense]);
        showToast('success', 'Pengeluaran baru berhasil ditambahkan');
      }
      
      setShowModal(false);
    } catch (error) {
      console.error('Error saving expense:', error);
      showToast('error', 'Gagal menyimpan data pengeluaran');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteExpense = (expense: Expense) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus pengeluaran ${expense.description}?`)) {
      return;
    }

    setExpenses(prev => prev.filter(exp => exp.id !== expense.id));
    showToast('success', 'Pengeluaran berhasil dihapus');
  };

  const handleExport = () => {
    showToast('info', 'Mengunduh data pengeluaran...');
  };

  return (
    <div className="page-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Pengeluaran</h1>
        <p className="text-gray-600">Kelola dan pantau pengeluaran sekolah</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card p-6 bg-gradient-to-br from-error-50 to-error-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-error-600">Total Pengeluaran</p>
              <p className="text-2xl font-bold text-error-900 mt-1">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
            <div className="p-2 bg-error-200 rounded-lg">
              <TrendingDown className="h-6 w-6 text-error-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-error-600">
            <Calendar className="h-4 w-4 mr-1" />
            <span>Bulan Juni 2025</span>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Status Pengeluaran</h3>
            <FileText className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Approved</span>
              <span className="text-sm font-medium text-success-600">{approvedCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending</span>
              <span className="text-sm font-medium text-warning-600">{pendingCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total</span>
              <span className="text-sm font-medium text-gray-900">{expenses.length}</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Kategori Teratas</h3>
            <FileText className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Utilitas</span>
              <span className="text-sm font-medium text-gray-900">35%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Maintenance</span>
              <span className="text-sm font-medium text-gray-900">30%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">ATK</span>
              <span className="text-sm font-medium text-gray-900">20%</span>
            </div>
          </div>
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
              placeholder="Cari pengeluaran..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input"
            />
          </div>

          {/* Category Filter */}
          <div className="relative min-w-[200px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 input appearance-none"
            >
              <option value="all">Semua Kategori</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleExport}
            className="btn btn-secondary flex items-center flex-1 sm:flex-none"
          >
            <Download className="h-5 w-5 mr-2" />
            Export
          </button>
          <button
            onClick={handleAddExpense}
            className="btn btn-primary flex items-center flex-1 sm:flex-none"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Tambah Pengeluaran
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Deskripsi</th>
                <th>Kategori</th>
                <th>Tanggal</th>
                <th>Jumlah</th>
                <th>Status</th>
                <th>Catatan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => (
                <tr key={expense.id}>
                  <td className="font-medium text-gray-900">{expense.description}</td>
                  <td>
                    <span className="badge badge-secondary">{expense.category}</span>
                  </td>
                  <td>{expense.date.toLocaleDateString('id-ID')}</td>
                  <td className="font-medium text-error-600">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadgeColor(expense.status)}`}>
                      {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                    </span>
                  </td>
                  <td className="max-w-xs truncate" title={expense.notes}>
                    {expense.notes}
                  </td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditExpense(expense)}
                        className="p-1 text-gray-500 hover:text-primary-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(expense)}
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

        {filteredExpenses.length === 0 && (
          <div className="text-center py-12">
            <TrendingDown className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada data pengeluaran</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Tidak ada pengeluaran yang sesuai dengan filter'
                : 'Mulai dengan menambahkan pengeluaran baru.'}
            </p>
          </div>
        )}
      </div>

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveExpense}
        expenseData={selectedExpense}
        loading={modalLoading}
      />
    </div>
  );
};

export default ExpenseManagement;