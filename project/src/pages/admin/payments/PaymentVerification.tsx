import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  Loader2,
  ExternalLink,
  Check,
  X,
  AlertTriangle,
  ReceiptText,
  Image as ImageIcon,
} from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';
import { useStudents } from '../../../hooks/useStudents';
import {
  PaymentProof,
  Payment,
  fetchAllPaymentProofs,
  fetchAllPayments,
  verifyPaymentProof,
  rejectPaymentProof,
} from '../../../services/paymentService';
import { getDriveImageUrl } from '../../../utils/drive';

type Filter = 'pending' | 'verified' | 'rejected' | 'all';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'pending', label: 'Menunggu' },
  { key: 'verified', label: 'Terverifikasi' },
  { key: 'rejected', label: 'Ditolak' },
  { key: 'all', label: 'Semua' },
];

const STATUS_BADGE: Record<PaymentProof['status'], string> = {
  pending: 'badge badge-accent',
  verified: 'badge badge-success',
  rejected: 'badge badge-error',
};
const STATUS_LABEL: Record<PaymentProof['status'], string> = {
  pending: 'Menunggu',
  verified: 'Terverifikasi',
  rejected: 'Ditolak',
};

const rupiah = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;

const PaymentVerification = () => {
  const { showToast } = useToast();
  const { students } = useStudents();
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('pending');

  const [decision, setDecision] = useState<{ proof: PaymentProof; mode: 'approve' | 'reject' } | null>(null);
  const [recordAsIncome, setRecordAsIncome] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [proofList, paymentList] = await Promise.all([fetchAllPaymentProofs(), fetchAllPayments()]);
      setProofs(proofList);
      setPayments(paymentList);
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memuat bukti pembayaran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Identitas murid: dari tagihan yang ditautkan, kalau tidak ada dari akun ortu -> Data Siswa
  const resolveStudent = (proof: PaymentProof): { name: string; className: string; linked?: Payment } => {
    const linked = payments.find(p => p.id === proof.paymentId);
    if (linked) return { name: linked.studentName, className: linked.class, linked };
    const student = students.find(s => s.parentUid === proof.student);
    if (student) return { name: student.name, className: student.class };
    return { name: 'Akun ortu belum tertaut ke siswa', className: '-' };
  };

  const counts = useMemo(
    () => ({
      pending: proofs.filter(p => p.status === 'pending').length,
      verified: proofs.filter(p => p.status === 'verified').length,
      rejected: proofs.filter(p => p.status === 'rejected').length,
      all: proofs.length,
    }),
    [proofs]
  );

  const visible = filter === 'all' ? proofs : proofs.filter(p => p.status === filter);

  const openDecision = (proof: PaymentProof, mode: 'approve' | 'reject') => {
    setDecision({ proof, mode });
    setRecordAsIncome(true);
    setRejectReason('');
  };

  const handleConfirm = async () => {
    if (!decision) return;
    const { proof, mode } = decision;
    if (mode === 'reject' && !rejectReason.trim()) {
      showToast('error', 'Alasan penolakan wajib diisi');
      return;
    }
    setSaving(true);
    try {
      if (mode === 'approve') {
        await verifyPaymentProof({ proof, studentName: resolveStudent(proof).name, recordAsIncome });
        showToast('success', proof.paymentId ? 'Bukti disetujui, tagihan ditandai Lunas' : 'Bukti disetujui');
      } else {
        await rejectPaymentProof(proof.id, rejectReason.trim());
        showToast('success', 'Bukti ditolak, ortu akan melihat alasannya');
      }
      setDecision(null);
      await load();
    } catch (err) {
      console.error(err);
      showToast('error', 'Gagal memproses bukti pembayaran');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Verifikasi Pembayaran</h1>
        <p className="text-sm text-slate-500">Periksa bukti transfer dari orang tua, lalu setujui atau tolak</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f.key ? 'bg-primary-500 text-white shadow-soft' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            {f.label} <span className="opacity-70">({counts[f.key]})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
          <span className="ml-2 text-slate-500">Memuat bukti pembayaran...</span>
        </div>
      ) : visible.length === 0 ? (
        <div className="card p-12 text-center">
          <ReceiptText className="mx-auto h-10 w-10 text-slate-300 mb-2" />
          <p className="text-sm text-slate-500">Tidak ada bukti pembayaran pada kategori ini</p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map(proof => {
            const info = resolveStudent(proof);
            const mismatch = info.linked && info.linked.amount !== proof.amount;
            return (
              <div key={proof.id} className="card p-4 flex flex-col sm:flex-row gap-4">
                <a
                  href={proof.fileId ? `https://drive.google.com/file/d/${proof.fileId}/view` : undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="relative block h-40 sm:h-32 sm:w-32 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-50"
                >
                  {proof.fileId ? (
                    <img src={getDriveImageUrl(proof.fileId)} alt="Bukti transfer" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-slate-300"><ImageIcon className="h-8 w-8" /></span>
                  )}
                </a>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{info.name}</p>
                    {info.className !== '-' && <span className="badge badge-primary">{info.className}</span>}
                    <span className={STATUS_BADGE[proof.status]}>{STATUS_LABEL[proof.status]}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    {proof.paymentType} · <span className="font-semibold">{rupiah(proof.amount)}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Transfer {dayjs(proof.paymentDate).format('DD MMM YYYY')} · Ref {proof.referenceNumber || '-'} · diupload{' '}
                    {dayjs(proof.uploadedAt).format('DD MMM YYYY HH:mm')}
                  </p>
                  {proof.bankAccount && <p className="text-xs text-slate-400">{proof.bankAccount}</p>}
                  {proof.notes && <p className="text-xs italic text-slate-500 mt-1">Catatan ortu: {proof.notes}</p>}
                  {info.linked && (
                    <p className="text-xs text-slate-500 mt-1">
                      Tagihan: {info.linked.description} ({rupiah(info.linked.amount)})
                    </p>
                  )}
                  {mismatch && (
                    <p className="mt-1 inline-flex items-center gap-1 rounded-lg bg-accent-50 border border-accent-200 px-2 py-1 text-xs text-accent-800">
                      <AlertTriangle className="h-3.5 w-3.5" /> Jumlah berbeda dari tagihan — periksa dulu sebelum menyetujui
                    </p>
                  )}
                  {proof.status === 'rejected' && proof.rejectionReason && (
                    <p className="mt-1 text-xs text-error-600">Alasan ditolak: {proof.rejectionReason}</p>
                  )}
                </div>

                <div className="flex sm:flex-col gap-2 shrink-0 sm:justify-center">
                  {proof.fileId && (
                    <a
                      href={`https://drive.google.com/file/d/${proof.fileId}/view`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary flex items-center justify-center gap-1.5 text-xs"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Buka File
                    </a>
                  )}
                  {proof.status === 'pending' && (
                    <>
                      <button onClick={() => openDecision(proof, 'approve')} className="btn btn-success flex items-center justify-center gap-1.5 text-xs">
                        <Check className="h-3.5 w-3.5" /> Setujui
                      </button>
                      <button onClick={() => openDecision(proof, 'reject')} className="btn btn-error flex items-center justify-center gap-1.5 text-xs">
                        <X className="h-3.5 w-3.5" /> Tolak
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Konfirmasi setuju / tolak */}
      {decision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-slate-500 bg-opacity-75" onClick={() => !saving && setDecision(null)} />
          <div className="relative bg-white rounded-2xl shadow-soft-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              {decision.mode === 'approve' ? 'Setujui bukti pembayaran?' : 'Tolak bukti pembayaran?'}
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              {resolveStudent(decision.proof).name} · {decision.proof.paymentType} · {rupiah(decision.proof.amount)}
            </p>

            {decision.mode === 'approve' ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  {decision.proof.paymentId
                    ? 'Tagihan terkait akan otomatis ditandai Lunas di akun orang tua.'
                    : 'Bukti ini tidak terhubung ke tagihan, jadi tidak ada tagihan yang ditandai Lunas.'}
                </p>
                <label className="flex items-start gap-2 text-sm text-slate-700">
                  <input type="checkbox" className="mt-0.5" checked={recordAsIncome} onChange={e => setRecordAsIncome(e.target.checked)} />
                  <span>Catat otomatis sebagai Pemasukan (muncul di Pemasukan & Laporan Keuangan)</span>
                </label>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Alasan penolakan *</label>
                <textarea
                  className="input"
                  rows={3}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Contoh: Nominal transfer tidak sesuai / foto buram"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setDecision(null)} disabled={saving} className="btn btn-secondary">Batal</button>
              <button
                onClick={handleConfirm}
                disabled={saving}
                className={`btn ${decision.mode === 'approve' ? 'btn-success' : 'btn-error'} flex items-center gap-2`}
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {decision.mode === 'approve' ? 'Ya, Setujui' : 'Ya, Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentVerification;
