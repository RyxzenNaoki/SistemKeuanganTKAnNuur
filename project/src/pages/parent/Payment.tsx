import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { CheckCircle, Clock, AlertCircle, Upload } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import UploadPaymentModal from '../../components/parent/PaymentProofModal';
import {
  fetchPaymentsByParent,
  fetchPaymentProofsByParent,
  Payment as PaymentRecord,
  PaymentProof,
} from '../../services/paymentService';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const STATUS_BADGE: Record<PaymentRecord['status'], JSX.Element> = {
  paid: <span className="badge badge-success flex items-center w-fit"><CheckCircle className="h-3 w-3 mr-1" />Lunas</span>,
  overdue: <span className="badge badge-error flex items-center w-fit"><AlertCircle className="h-3 w-3 mr-1" />Terlambat</span>,
  upcoming: <span className="badge badge-warning flex items-center w-fit"><Clock className="h-3 w-3 mr-1" />Akan Datang</span>,
};

const PROOF_STATUS_BADGE: Record<PaymentProof['status'], JSX.Element> = {
  verified: <span className="badge badge-success">Terverifikasi</span>,
  pending: <span className="badge badge-accent">Menunggu Verifikasi</span>,
  rejected: <span className="badge badge-error">Ditolak</span>,
};

const Payment = () => {
  const { currentUser } = useAuth();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const loadData = async () => {
    if (!currentUser) return;
    try {
      const [paymentList, proofList] = await Promise.all([
        fetchPaymentsByParent(currentUser.uid),
        fetchPaymentProofsByParent(currentUser.uid),
      ]);
      setPayments(paymentList);
      setProofs(proofList);
    } catch (err) {
      console.error('Error fetching payment data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Ringkasan jumlah, digabung dari tagihan (Jadwal Pembayaran admin) —
  // sumber kebenaran "jumlah" sesuai poin: "diintegrasikan dengan status pembayaran"
  const totalTagihan = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalLunas = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
  const totalBelumLunas = totalTagihan - totalLunas;

  return (
    <div className="page-transition space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold">Riwayat Pembayaran</h1>
          <p className="text-sm text-slate-500">Ringkasan tagihan dan bukti pembayaran yang sudah diupload</p>
        </div>
        <button className="btn btn-primary flex items-center" onClick={() => setShowModal(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Bukti
        </button>
      </div>

      {/* Ringkasan jumlah — terintegrasi dari Jadwal Pembayaran admin */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl p-4 shadow-soft stat-card-blue">
          <p className="text-sm text-slate-500">Total Tagihan</p>
          <p className="text-xl font-semibold text-slate-800">{formatCurrency(totalTagihan)}</p>
        </div>
        <div className="rounded-2xl p-4 shadow-soft bg-gradient-to-br from-success-50 to-white border border-success-100">
          <p className="text-sm text-slate-500">Sudah Lunas</p>
          <p className="text-xl font-semibold text-success-700">{formatCurrency(totalLunas)}</p>
        </div>
        <div className="rounded-2xl p-4 shadow-soft stat-card-pink">
          <p className="text-sm text-slate-500">Belum Lunas</p>
          <p className="text-xl font-semibold text-secondary-700">{formatCurrency(totalBelumLunas)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status tagihan, dari Jadwal Pembayaran admin */}
        <div className="card p-5">
          <h2 className="text-lg font-semibold mb-3">Status Tagihan</h2>
          {loading ? (
            <p className="text-slate-500 text-sm">Memuat data...</p>
          ) : payments.length === 0 ? (
            <p className="text-slate-400 text-sm py-6 text-center">Belum ada tagihan yang di-assign admin</p>
          ) : (
            <div className="space-y-3">
              {payments.map(p => (
                <div key={p.id} className="rounded-xl border border-slate-100 p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{p.type}</p>
                      <p className="text-xs text-slate-500">{p.description}</p>
                    </div>
                    {STATUS_BADGE[p.status]}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-800">{formatCurrency(p.amount)}</span>
                    <span className="text-slate-400">Jatuh tempo {dayjs(p.dueDate).format('DD MMM YYYY')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Histori bukti pembayaran yang sudah diupload */}
        <div className="card p-5">
          <h2 className="text-lg font-semibold mb-3">Histori Upload Bukti</h2>
          {loading ? (
            <p className="text-slate-500 text-sm">Memuat data...</p>
          ) : proofs.length === 0 ? (
            <p className="text-slate-400 text-sm py-6 text-center">Belum ada bukti pembayaran diupload</p>
          ) : (
            <div className="space-y-3">
              {proofs.map(proof => (
                <div key={proof.id} className="rounded-xl border border-slate-100 p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{proof.paymentType}</p>
                      <p className="text-xs text-slate-500">{dayjs(proof.paymentDate).format('DD MMM YYYY')}</p>
                    </div>
                    {PROOF_STATUS_BADGE[proof.status]}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-800">{formatCurrency(proof.amount)}</p>
                  {proof.notes && <p className="text-xs text-slate-400 italic mt-1">Catatan: {proof.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-4">
          <h2 className="text-lg font-semibold mb-2">Informasi Rekening Sekolah</h2>
          <ul className="text-sm text-slate-700 space-y-1">
            <li><strong>Bank:</strong> BNI</li>
            <li><strong>Atas Nama:</strong> Rita Ayu Bulan Trisna</li>
            <li><strong>No. Rekening:</strong> 0795834521</li>
            <li><strong>Catatan:</strong> Sertakan nama siswa dan jenis pembayaran saat transfer.</li>
          </ul>
        </div>

        <div className="card p-4">
          <h2 className="text-lg font-semibold mb-2">Keterangan</h2>
          <ul className="text-sm text-slate-700 space-y-1">
            <li>1. Uang sarana prasarana (Gedung) bisa diangsur selama <strong>3 Bulan</strong></li>
            <li>2. SPP bulanan sebesar Rp 250.000 (terdiri dari SPP, makan sehat, tabungan pentas seni)</li>
            <li>3. Hari efektif: <strong>Senin s.d. Jumat</strong></li>
            <li>4. Diskon Rp 150.000 Uang Gedung untuk saudara kandung alumni</li>
          </ul>
        </div>
      </div>

      <UploadPaymentModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); loadData(); }}
      />
    </div>
  );
};

export default Payment;
