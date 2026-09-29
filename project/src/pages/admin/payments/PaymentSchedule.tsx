import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { PlusCircle, Search, Edit2, Trash2, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';
import PaymentScheduleModal from '../../../components/admin/PaymentScheduleModal';
import {
  Payment,
  fetchAllPayments,
  assignPayment,
  updatePayment,
  deletePayment,
} from '../../../services/paymentService';

const PaymentSchedule = () => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);

  const loadPayments = async () => {
    try {
      setPayments(await fetchAllPayments());
    } catch (err) {
      console.error('Failed to load payments:', err);
      showToast('error', 'Gagal memuat data jadwal');
    }
  };

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  const formatDate = (date: Date) => dayjs(date).format('DD MMMM YYYY');

  const getStatusBadge = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return <span className="badge badge-success flex items-center w-fit"><CheckCircle className="h-3 w-3 mr-1" />Lunas</span>;
      case 'overdue':
        return <span className="badge badge-error flex items-center w-fit"><AlertCircle className="h-3 w-3 mr-1" />Terlambat</span>;
      default:
        return <span className="badge badge-warning flex items-center w-fit"><Clock className="h-3 w-3 mr-1" />Akan Datang</span>;
    }
  };

  const filteredPayments = payments.filter(payment =>
    payment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSavePayment = async (data: Parameters<typeof assignPayment>[0]) => {
    try {
      setModalLoading(true);
      if (selectedPayment) {
        await updatePayment(selectedPayment.id, data);
        showToast('success', 'Jadwal pembayaran diperbarui');
      } else {
        await assignPayment(data);
        showToast('success', `Tagihan ditambahkan untuk ${data.studentName}`);
      }
      setShowModal(false);
      await loadPayments();
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
      await deletePayment(payment.id);
      setPayments(prev => prev.filter(p => p.id !== payment.id));
      showToast('success', 'Jadwal dihapus');
    } catch (err) {
      console.error('Failed to delete:', err);
      showToast('error', 'Gagal menghapus jadwal');
    }
  };

  const upcomingCount = payments.filter(p => p.status === 'upcoming').length;
  const overdueCount = payments.filter(p => p.status === 'overdue').length;
  const paidCount = payments.filter(p => p.status === 'paid').length;

  return (
    <div className="page-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Jadwal Pembayaran</h1>
        <p className="text-slate-600">Assign tagihan langsung ke murid — otomatis tampil di akun orang tuanya</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Jadwal</p>
              <p className="text-2xl font-bold text-slate-900">{payments.length}</p>
            </div>
            <div className="p-2 bg-primary-100 rounded-xl"><Calendar className="h-6 w-6 text-primary-600" /></div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Akan Datang</p>
              <p className="text-2xl font-bold text-warning-600">{upcomingCount}</p>
            </div>
            <div className="p-2 bg-warning-100 rounded-xl"><Clock className="h-6 w-6 text-warning-600" /></div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Terlambat</p>
              <p className="text-2xl font-bold text-error-600">{overdueCount}</p>
            </div>
            <div className="p-2 bg-error-100 rounded-xl"><AlertCircle className="h-6 w-6 text-error-600" /></div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Lunas</p>
              <p className="text-2xl font-bold text-success-600">{paidCount}</p>
            </div>
            <div className="p-2 bg-success-100 rounded-xl"><CheckCircle className="h-6 w-6 text-success-600" /></div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari jadwal pembayaran..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 input"
          />
        </div>
        <button
          onClick={() => { setSelectedPayment(null); setShowModal(true); }}
          className="btn btn-primary flex items-center w-full sm:w-auto"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Tambah Jadwal
        </button>
      </div>

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
              {filteredPayments.map(payment => (
                <tr key={payment.id}>
                  <td className="font-medium text-slate-900">
                    {payment.studentName}
                    {!payment.parentUid && (
                      <div className="text-xs text-error-500">Belum tertaut akun ortu</div>
                    )}
                  </td>
                  <td><span className="badge badge-secondary">{payment.class}</span></td>
                  <td>
                    <div>
                      <div className="font-medium text-slate-900">{payment.type}</div>
                      <div className="text-sm text-slate-500">{payment.description}</div>
                    </div>
                  </td>
                  <td className="font-medium">{formatCurrency(payment.amount)}</td>
                  <td>{formatDate(payment.dueDate)}</td>
                  <td>{getStatusBadge(payment.status)}</td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => { setSelectedPayment(payment); setShowModal(true); }}
                        className="p-1 text-slate-500 hover:text-primary-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePayment(payment)}
                        className="p-1 text-slate-500 hover:text-error-600 transition-colors"
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
            <Calendar className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900">Tidak ada jadwal pembayaran</h3>
            <p className="mt-1 text-sm text-slate-500">
              {searchTerm ? 'Tidak ada jadwal yang sesuai dengan pencarian' : 'Belum ada jadwal pembayaran yang ditambahkan'}
            </p>
          </div>
        )}
      </div>

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
