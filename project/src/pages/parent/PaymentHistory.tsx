import { useState } from 'react';
import { Search, Download, Eye, Calendar, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface PaymentRecord {
  id: string;
  date: string;
  type: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  receiptNumber: string;
  paymentMethod: 'transfer' | 'cash';
  verificationDate?: string;
}

const PaymentHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  // Sample data - replace with actual data from Firebase
  const [payments] = useState<PaymentRecord[]>([
    {
      id: '1',
      date: '2025-06-05',
      type: 'SPP Bulanan',
      description: 'SPP Bulan Juni 2025',
      amount: 500000,
      status: 'paid',
      receiptNumber: 'SPP-2025-06-001',
      paymentMethod: 'transfer',
      verificationDate: '2025-06-05',
    },
    {
      id: '2',
      date: '2025-05-05',
      type: 'SPP Bulanan',
      description: 'SPP Bulan Mei 2025',
      amount: 500000,
      status: 'paid',
      receiptNumber: 'SPP-2025-05-001',
      paymentMethod: 'transfer',
      verificationDate: '2025-05-06',
    },
    {
      id: '3',
      date: '2025-04-05',
      type: 'SPP Bulanan',
      description: 'SPP Bulan April 2025',
      amount: 500000,
      status: 'paid',
      receiptNumber: 'SPP-2025-04-001',
      paymentMethod: 'cash',
      verificationDate: '2025-04-05',
    },
    {
      id: '4',
      date: '2025-03-15',
      type: 'Uang Kegiatan',
      description: 'Kegiatan Outing Class',
      amount: 150000,
      status: 'paid',
      receiptNumber: 'KEG-2025-03-001',
      paymentMethod: 'transfer',
      verificationDate: '2025-03-16',
    },
    {
      id: '5',
      date: '2025-03-05',
      type: 'SPP Bulanan',
      description: 'SPP Bulan Maret 2025',
      amount: 500000,
      status: 'paid',
      receiptNumber: 'SPP-2025-03-001',
      paymentMethod: 'transfer',
      verificationDate: '2025-03-05',
    },
    {
      id: '6',
      date: '2025-02-05',
      type: 'SPP Bulanan',
      description: 'SPP Bulan Februari 2025',
      amount: 500000,
      status: 'paid',
      receiptNumber: 'SPP-2025-02-001',
      paymentMethod: 'transfer',
      verificationDate: '2025-02-06',
    },
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: PaymentRecord['status']) => {
    switch (status) {
      case 'paid':
        return (
          <span className="badge badge-success flex items-center w-fit">
            <CheckCircle className="h-3 w-3 mr-1" />
            Lunas
          </span>
        );
      case 'pending':
        return (
          <span className="badge badge-warning flex items-center w-fit">
            <Clock className="h-3 w-3 mr-1" />
            Menunggu
          </span>
        );
      case 'overdue':
        return (
          <span className="badge badge-error flex items-center w-fit">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Terlambat
          </span>
        );
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    return method === 'transfer' ? 'Transfer Bank' : 'Tunai';
  };

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || payment.status === selectedStatus;

    let matchesPeriod = true;
    if (selectedPeriod !== 'all') {
      const paymentDate = new Date(payment.date);
      const now = new Date();
      
      switch (selectedPeriod) {
        case '1month':
          matchesPeriod = paymentDate >= new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case '3months':
          matchesPeriod = paymentDate >= new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          break;
        case '6months':
          matchesPeriod = paymentDate >= new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
          break;
        case '1year':
          matchesPeriod = paymentDate >= new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
      }
    }

    return matchesSearch && matchesStatus && matchesPeriod;
  });

  // Calculate summary statistics
  const totalPaid = filteredPayments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPayments = filteredPayments.length;
  const paidPayments = filteredPayments.filter(p => p.status === 'paid').length;

  const handleDownloadReceipt = (payment: PaymentRecord) => {
    // Implement receipt download functionality
    console.log('Downloading receipt for:', payment.receiptNumber);
  };

  const handleExportHistory = () => {
    // Implement export functionality
    console.log('Exporting payment history');
  };

  return (
    <div className="page-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Riwayat Pembayaran</h1>
        <p className="text-gray-600">Lihat dan kelola riwayat pembayaran Anda</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card p-6 bg-gradient-to-br from-success-50 to-success-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-success-600">Total Dibayar</p>
              <p className="text-2xl font-bold text-success-900 mt-1">
                {formatCurrency(totalPaid)}
              </p>
            </div>
            <div className="p-2 bg-success-200 rounded-lg">
              <CheckCircle className="h-6 w-6 text-success-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-success-600">
            <Calendar className="h-4 w-4 mr-1" />
            <span>Periode yang dipilih</span>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Status Pembayaran</h3>
            <CheckCircle className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Lunas</span>
              <span className="text-sm font-medium text-success-600">{paidPayments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Transaksi</span>
              <span className="text-sm font-medium text-gray-900">{totalPayments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tingkat Kepatuhan</span>
              <span className="text-sm font-medium text-primary-600">
                {totalPayments > 0 ? Math.round((paidPayments / totalPayments) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Rata-rata Pembayaran</h3>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Per Bulan</span>
              <span className="text-sm font-medium text-gray-900">
                {formatCurrency(paidPayments > 0 ? totalPaid / Math.max(paidPayments, 1) : 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Metode Favorit</span>
              <span className="text-sm font-medium text-primary-600">Transfer Bank</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari pembayaran..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input min-w-[120px]"
            >
              <option value="all">Semua Status</option>
              <option value="paid">Lunas</option>
              <option value="pending">Menunggu</option>
              <option value="overdue">Terlambat</option>
            </select>

            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="input min-w-[120px]"
            >
              <option value="all">Semua Periode</option>
              <option value="1month">1 Bulan Terakhir</option>
              <option value="3months">3 Bulan Terakhir</option>
              <option value="6months">6 Bulan Terakhir</option>
              <option value="1year">1 Tahun Terakhir</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleExportHistory}
          className="btn btn-secondary flex items-center w-full sm:w-auto"
        >
          <Download className="h-5 w-5 mr-2" />
          Export Data
        </button>
      </div>

      {/* Payment History Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>No. Kwitansi</th>
                <th>Jenis Pembayaran</th>
                <th>Keterangan</th>
                <th>Jumlah</th>
                <th>Metode</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id}>
                  <td>{formatDate(payment.date)}</td>
                  <td className="font-medium text-primary-600">{payment.receiptNumber}</td>
                  <td>
                    <span className="badge badge-secondary">{payment.type}</span>
                  </td>
                  <td>{payment.description}</td>
                  <td className="font-medium">{formatCurrency(payment.amount)}</td>
                  <td>{getPaymentMethodLabel(payment.paymentMethod)}</td>
                  <td>{getStatusBadge(payment.status)}</td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleDownloadReceipt(payment)}
                        className="p-1 text-gray-500 hover:text-primary-600 transition-colors"
                        title="Lihat Kwitansi"
                        disabled={payment.status !== 'paid'}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadReceipt(payment)}
                        className="p-1 text-gray-500 hover:text-primary-600 transition-colors"
                        title="Download Kwitansi"
                        disabled={payment.status !== 'paid'}
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada riwayat pembayaran</h3>
            <p className="mt-1 text-sm text-gray-500">
              Belum ada pembayaran yang sesuai dengan filter yang dipilih.
            </p>
          </div>
        )}
      </div>

      {/* Payment Instructions */}
      <div className="mt-6 card p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Penting</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-900 mb-2">Cara Download Kwitansi</h3>
            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
              <li>Klik tombol mata (👁) untuk melihat kwitansi</li>
              <li>Klik tombol download untuk menyimpan PDF</li>
              <li>Kwitansi hanya tersedia untuk pembayaran yang sudah lunas</li>
              <li>Simpan kwitansi sebagai bukti pembayaran</li>
            </ol>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-900 mb-2">Bantuan</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Jika ada kesalahan data, hubungi admin sekolah</p>
              <p>• Kwitansi dapat diunduh kapan saja</p>
              <p>• Data pembayaran tersimpan permanen</p>
              <p>• Gunakan fitur export untuk backup data</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;