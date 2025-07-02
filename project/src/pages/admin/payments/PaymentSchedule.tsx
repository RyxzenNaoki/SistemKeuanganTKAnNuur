import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
import { PlusCircle, Search, Edit2, Trash2, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';
import PaymentScheduleModal from '../../../components/admin/PaymentScheduleModal';

interface Payment {
  id: string;
  type: string;
  amount: number;
  dueDate: Date;
  description: string;
  status: 'upcoming' | 'overdue' | 'paid';
  studentName: string;
  class: string;
}

const PaymentSchedule = () => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Sample data - in real app, this would come from Firestore
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
  const fetchPayments = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'payments'));
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        const dueDate = d.dueDate?.toDate?.() || new Date();
        const status = getAutoStatus(dueDate, d.status);
        return {
          id: doc.id,
          type: d.type,
          amount: d.amount,
          dueDate,
          description: d.description,
          status,
          studentName: d.studentName,
          class: d.class,
        };
      });
      setPayments(data);
    } catch (err) {
      console.error('Failed to load payments:', err);
      showToast('error', 'Gagal memuat data jadwal');
    }
  };
  fetchPayments();
}, []);

const getAutoStatus = (dueDate: Date, currentStatus: string): Payment['status'] => {
  const today = new Date();
  if (currentStatus === 'paid') return 'paid';
  return dayjs(dueDate).isBefore(dayjs(today), 'day') ? 'overdue' : 'upcoming';
};


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
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

  const handleAddPayment = () => {
    setSelectedPayment(null);
    setShowModal(true);
  };

  const handleEditPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowModal(true);
  };

  const handleSavePayment = async (paymentData: Omit<Payment, 'id'>) => {
  try {
    setModalLoading(true);
    const now = Timestamp.now();

    if (selectedPayment) {
      await updateDoc(doc(db, 'payments', selectedPayment.id), {
        ...paymentData,
        dueDate: Timestamp.fromDate(paymentData.dueDate),
        updatedAt: now,
      });
      showToast('success', 'Jadwal pembayaran diperbarui');
    } else {
      await addDoc(collection(db, 'payments'), {
        ...paymentData,
        dueDate: Timestamp.fromDate(paymentData.dueDate),
        createdAt: now,
        updatedAt: now,
      });
      showToast('success', 'Jadwal pembayaran ditambahkan');
    }

    setShowModal(false);
    window.location.reload(); // atau fetchPayments() jika dibuat terpisah
  } catch (err) {
    console.error('Failed to save:', err);
    showToast('error', 'Gagal menyimpan jadwal');
  } finally {
    setModalLoading(false);
  }
};


  const handleDeletePayment = async (payment: Payment) => {
  if (!window.confirm(`Yakin hapus jadwal "${payment.description}"?`)) return;

  try {
    await deleteDoc(doc(db, 'payments', payment.id));
    setPayments(prev => prev.filter(p => p.id !== payment.id));
    showToast('success', 'Jadwal dihapus');
  } catch (err) {
    console.error('Failed to delete:', err);
    showToast('error', 'Gagal menghapus jadwal');
  }
};


  // Calculate summary statistics
  const upcomingCount = payments.filter(p => p.status === 'upcoming').length;
  const overdueCount = payments.filter(p => p.status === 'overdue').length;
  const paidCount = payments.filter(p => p.status === 'paid').length;

  return (
    <div className="page-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Jadwal Pembayaran</h1>
        <p className="text-gray-600">Kelola jadwal dan status pembayaran siswa</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Jadwal</p>
              <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
            </div>
            <div className="p-2 bg-primary-100 rounded-lg">
              <Calendar className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Akan Datang</p>
              <p className="text-2xl font-bold text-warning-600">{upcomingCount}</p>
            </div>
            <div className="p-2 bg-warning-100 rounded-lg">
              <Clock className="h-6 w-6 text-warning-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Terlambat</p>
              <p className="text-2xl font-bold text-error-600">{overdueCount}</p>
            </div>
            <div className="p-2 bg-error-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-error-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Lunas</p>
              <p className="text-2xl font-bold text-success-600">{paidCount}</p>
            </div>
            <div className="p-2 bg-success-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-success-600" />
            </div>
          </div>
        </div>
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
          onClick={handleAddPayment}
          className="btn btn-primary flex items-center w-full sm:w-auto"
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
                  <td>
                    <span className="badge badge-secondary">{payment.class}</span>
                  </td>
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
                        onClick={() => handleEditPayment(payment)}
                        className="p-1 text-gray-500 hover:text-primary-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePayment(payment)}
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
              {searchTerm 
                ? 'Tidak ada jadwal yang sesuai dengan pencarian'
                : 'Belum ada jadwal pembayaran yang ditambahkan'}
            </p>
          </div>
        )}
      </div>

      {/* Payment Schedule Modal */}
      <PaymentScheduleModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSavePayment}
        scheduleData={selectedPayment}
        loading={modalLoading}
      />
    </div>
  );
};

export default PaymentSchedule;