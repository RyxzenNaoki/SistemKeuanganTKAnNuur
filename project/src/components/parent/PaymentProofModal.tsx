import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { X, Upload, Loader2, FileCheck2 } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { PAYMENT_TYPES, Payment, submitPaymentProof } from '../../services/paymentService';
import { uploadToDrive, UPLOAD_ACCEPT, buildFilePrefix } from '../../utils/upload';
import { useParentStudents } from '../../hooks/useStudents';
import { getClassCode } from '../../config/classes';

interface PaymentProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
  unpaidPayments: Payment[]; // tagihan milik ortu yang belum lunas
  pendingPaymentIds: string[]; // tagihan yang buktinya sedang menunggu verifikasi
}

const BANK_ACCOUNTS = ['BNI - 0795834521 a.n Rita Ayu Bulan Trisna'];
const NO_INVOICE = '__other__';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const PaymentProofModal = ({ isOpen, onClose, onSubmitted, unpaidPayments, pendingPaymentIds }: PaymentProofModalProps) => {
  const { showToast } = useToast();
  const { currentUser } = useAuth();
  const { student } = useParentStudents();

  const [selectedPaymentId, setSelectedPaymentId] = useState<string>(NO_INVOICE);
  const [paymentType, setPaymentType] = useState<string>(PAYMENT_TYPES[0]);
  const [amount, setAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [bankAccount, setBankAccount] = useState(BANK_ACCOUNTS[0]);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const selectablePayments = unpaidPayments.filter(p => !pendingPaymentIds.includes(p.id));
  const linkedPayment = unpaidPayments.find(p => p.id === selectedPaymentId);

  const resetForm = () => {
    setSelectedPaymentId(NO_INVOICE);
    setPaymentType(PAYMENT_TYPES[0]);
    setAmount(0);
    setPaymentDate(dayjs().format('YYYY-MM-DD'));
    setBankAccount(BANK_ACCOUNTS[0]);
    setReferenceNumber('');
    setNotes('');
    setProofFile(null);
    setErrors({});
  };

  // Saat modal dibuka, otomatis pilih tagihan pertama yang belum dibayar
  useEffect(() => {
    if (!isOpen) return;
    resetForm();
    if (selectablePayments.length > 0) {
      const first = selectablePayments[0];
      setSelectedPaymentId(first.id);
      setPaymentType(first.type);
      setAmount(first.amount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSelectPayment = (id: string) => {
    setSelectedPaymentId(id);
    const payment = unpaidPayments.find(p => p.id === id);
    if (payment) {
      setPaymentType(payment.type);
      setAmount(payment.amount);
    }
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (amount <= 0) next.amount = 'Jumlah pembayaran harus lebih dari 0';
    if (!paymentDate) next.paymentDate = 'Tanggal transfer wajib diisi';
    if (!referenceNumber.trim()) next.referenceNumber = 'Nomor referensi wajib diisi';
    if (!proofFile) next.proofFile = 'Bukti pembayaran wajib diupload';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !validate() || !proofFile) return;

    setSubmitting(true);
    try {
      const uploaded = await uploadToDrive(proofFile, 'payment-proof', {
        namePrefix: buildFilePrefix([
          getClassCode(linkedPayment?.class ?? student?.class),
          'BAYAR',
          paymentDate,
          linkedPayment?.studentName ?? student?.nickname ?? student?.name,
        ]),
      });
      await submitPaymentProof({
        student: currentUser.uid,
        paymentId: linkedPayment?.id,
        paymentType,
        amount,
        paymentDate: new Date(paymentDate),
        bankAccount,
        referenceNumber: referenceNumber.trim(),
        notes: notes.trim() || undefined,
        fileId: uploaded.fileId,
        fileName: uploaded.fileName,
      });
      showToast('success', 'Bukti pembayaran terkirim. Menunggu verifikasi admin.');
      onSubmitted();
      onClose();
    } catch (err) {
      console.error(err);
      showToast('error', err instanceof Error ? err.message : 'Terjadi kesalahan saat mengupload.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const label = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75" onClick={() => !submitting && onClose()} />

        <div className="relative bg-white rounded-2xl shadow-soft-lg w-full max-w-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Upload Bukti Pembayaran</h3>
            <button onClick={onClose} disabled={submitting} className="text-slate-400 hover:text-slate-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={label}>Tagihan yang dibayar</label>
              <select className="input" value={selectedPaymentId} onChange={e => handleSelectPayment(e.target.value)}>
                {selectablePayments.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.type} — {formatCurrency(p.amount)} (jatuh tempo {dayjs(p.dueDate).format('DD MMM YYYY')})
                  </option>
                ))}
                <option value={NO_INVOICE}>Pembayaran lainnya (tanpa tagihan)</option>
              </select>
              {pendingPaymentIds.length > 0 && (
                <p className="mt-1 text-xs text-slate-400">
                  Tagihan yang buktinya sedang diverifikasi tidak ditampilkan.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={label}>Jenis Pembayaran</label>
                <select
                  className="input"
                  value={paymentType}
                  onChange={e => setPaymentType(e.target.value)}
                  disabled={!!linkedPayment}
                >
                  {PAYMENT_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label}>Jumlah Dibayar (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  className={`input ${errors.amount ? 'border-error-500' : ''}`}
                  value={amount}
                  onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                />
                {errors.amount && <p className="text-error-600 text-xs mt-1">{errors.amount}</p>}
              </div>
              <div>
                <label className={label}>Tanggal Transfer</label>
                <input
                  type="date"
                  className={`input ${errors.paymentDate ? 'border-error-500' : ''}`}
                  value={paymentDate}
                  max={dayjs().format('YYYY-MM-DD')}
                  onChange={e => setPaymentDate(e.target.value)}
                />
                {errors.paymentDate && <p className="text-error-600 text-xs mt-1">{errors.paymentDate}</p>}
              </div>
              <div>
                <label className={label}>Nomor Referensi</label>
                <input
                  className={`input ${errors.referenceNumber ? 'border-error-500' : ''}`}
                  value={referenceNumber}
                  onChange={e => setReferenceNumber(e.target.value)}
                  placeholder="No. referensi transfer"
                />
                {errors.referenceNumber && <p className="text-error-600 text-xs mt-1">{errors.referenceNumber}</p>}
              </div>
            </div>

            <div>
              <label className={label}>Rekening Tujuan</label>
              <select className="input" value={bankAccount} onChange={e => setBankAccount(e.target.value)}>
                {BANK_ACCOUNTS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={label}>Bukti Transfer (gambar/PDF, maks. 4 MB)</label>
              <label
                onDragEnter={e => { e.preventDefault(); setDragActive(true); }}
                onDragOver={e => e.preventDefault()}
                onDragLeave={() => setDragActive(false)}
                onDrop={e => {
                  e.preventDefault();
                  setDragActive(false);
                  const dropped = e.dataTransfer.files?.[0];
                  if (dropped) setProofFile(dropped);
                }}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed p-5 cursor-pointer transition-colors ${
                  dragActive ? 'border-primary-400 bg-primary-50' : errors.proofFile ? 'border-error-300' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                {proofFile ? (
                  <>
                    <FileCheck2 className="h-6 w-6 text-success-600" />
                    <span className="text-sm text-slate-700">{proofFile.name}</span>
                    <span className="text-xs text-slate-400">Klik untuk mengganti file</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-slate-400" />
                    <span className="text-sm text-slate-500">Klik atau tarik file ke sini</span>
                  </>
                )}
                <input
                  type="file"
                  accept={UPLOAD_ACCEPT['payment-proof']}
                  className="hidden"
                  onChange={e => setProofFile(e.target.files?.[0] ?? null)}
                />
              </label>
              {errors.proofFile && <p className="text-error-600 text-xs mt-1">{errors.proofFile}</p>}
            </div>

            <div>
              <label className={label}>Catatan (opsional)</label>
              <textarea className="input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} disabled={submitting} className="btn btn-secondary">
                Batal
              </button>
              <button type="submit" disabled={submitting} className="btn btn-primary flex items-center gap-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Kirim Bukti
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentProofModal;
