import { useState } from 'react';
import { PlusCircle, Search, Edit2, Trash2, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface Payment {
  id: string;
  type: string;
  amount: number;
  dueDate: string;
  description: string;
  status: 'upcoming' | 'overdue' | 'paid';
  studentName: string;
  class: string;
}

const PaymentSchedule = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Sample data - in real app, this would come from Firestore
  const [payments] = useState<Payment[]>([
    {
      id: '1',
      type: 'SPP Bulanan',
      amount: 500000,
      dueDate: '2025-07-10',
      description: 'SPP Bulan Juli 2025',
      status: 'upcoming',
      studentName: 'Budi Santoso',
      class: 'TK B - Mawar',
    },
    {
      id: '2',
      type: 'Uang Kegiatan',
      amount: 150000,
      dueDate: '2025-07-15',
      description: 'Kegiatan Hari Anak',
      status: 'upcoming',
      studentName: 'Siti Rahayu',
      class: 'TK A - Melati',
    },
    {
      id: '3',
      type: 'SPP Bulanan',
      amount: 500000,
      dueDate: '2025-06-10',
      description: 'SPP Bulan Juni 2025',
      status: 'paid',
      studentName: 'Ahmad Fadli',
      class: 'TK B - Mawar',
    },
    {
      id: '4',
      type: 'SPP Bulanan',
      amount: 500000,
      dueDate: '2025-06-10',
      description: 'SPP Bulan Juni 2025',
      status: 'overdue',
      studentName: 'Rina Putri',
      class: 'TK A - Melati',
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

  const getStatusBadge = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return (
          <span className="badge badge-success flex items-center w-fit">
            <CheckCircle className="h-3 w-3 mr-1" />
            Lunas
          </span>
        );
      case 'overdue':
        return (
          <span className="badge badge-error flex items-center w-fit">
            <AlertCircle className="h-3 w-3 mr-1" />
            Terlambat
          </span>
        );
      case 'upcoming':
        return (
          <span className="badge badge-warning flex items-center w-fit">
            <Clock className="h-3 w-3 mr-1" />
            Akan Datang
          </span>
        );
    }
  };

  const filteredPayments = payments.filter(payment =>
    payment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Jadwal Pembayaran</h1>
        <p className="text-gray-600">Kelola jadwal dan status pembayaran siswa</p>
      </div>

      {/* Actions Bar */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari jadwal pembayaran..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 input"
          />
        </div>

        {/* Add Payment Schedule Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary flex items-center"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Tambah Jadwal
        </button>
      </div>

      {/* Payment Schedule Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Siswa</th>
                <th>Kelas</th>
                <th>Jenis Pembayaran</th>
                <th>Jumlah</th>
                <th>Jatuh Tempo</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id}>
                  <td className="font-medium text-gray-900">{payment.studentName}</td>
                  <td>{payment.class}</td>
                  <td>
                    <div>
                      <div className="font-medium text-gray-900">{payment.type}</div>
                      <div className="text-sm text-gray-500">{payment.description}</div>
                    </div>
                  </td>
                  <td className="font-medium">{formatCurrency(payment.amount)}</td>
                  <td>{formatDate(payment.dueDate)}</td>
                  <td>{getStatusBadge(payment.status)}</td>
                  <td>
                    <div className="flex items-center space-x-2">
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

        {filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada jadwal pembayaran</h3>
            <p className="mt-1 text-sm text-gray-500">
              Belum ada jadwal pembayaran yang ditambahkan atau sesuai dengan pencarian.
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Payment Schedule Modal would go here */}
      {/* Implementation of modal component omitted for brevity */}
    </div>
  );
};

export default PaymentSchedule;