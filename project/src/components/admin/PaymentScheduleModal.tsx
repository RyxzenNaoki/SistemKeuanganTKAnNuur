import { useEffect, useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { useStudents } from '../../hooks/useStudents';
import { getDisplayName } from '../../services/studentService';
import { PAYMENT_TYPES, Payment } from '../../services/paymentService';

interface PaymentScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    studentId: string;
    studentName: string;
    parentUid: string;
    class: string;
    type: string;
    amount: number;
    dueDate: Date;
    description: string;
  }) => Promise<void>;
  scheduleData?: Payment | null;
  loading?: boolean;
}

const PaymentScheduleModal = ({ isOpen, onClose, onSave, scheduleData, loading = false }: PaymentScheduleModalProps) => {
  const { students } = useStudents({ onlyActive: true });

  const [studentId, setStudentId] = useState('');
  const [type, setType] = useState<string>(PAYMENT_TYPES[0]);
  const [amount, setAmount] = useState(0);
  const [dueDate, setDueDate] = useState(new Date());
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedStudent = students.find(s => s.id === studentId);

  useEffect(() => {
    if (scheduleData) {
      setStudentId(scheduleData.studentId);
      setType(scheduleData.type);
      setAmount(scheduleData.amount);
      setDueDate(scheduleData.dueDate);
      setDescription(scheduleData.description);
    } else {
      setStudentId('');
      setType(PAYMENT_TYPES[0]);
      setAmount(0);
      setDueDate(new Date());
      setDescription('');
    }
    setErrors({});
  }, [scheduleData, isOpen]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!studentId) next.studentId = 'Murid wajib dipilih';
    if (amount <= 0) next.amount = 'Jumlah harus lebih dari 0';
    if (!description.trim()) next.description = 'Deskripsi wajib diisi';
    if (studentId && !selectedStudent?.parentUid) {
      next.studentId = 'Murid ini belum tertaut ke akun orang tua, tagihan tidak akan muncul di akun ortu';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !selectedStudent) return;

    await onSave({
      studentId: selectedStudent.id ?? '',
      studentName: selectedStudent.name,
      parentUid: selectedStudent.parentUid ?? '',
      class: selectedStudent.class,
      type,
      amount,
      dueDate,
      description,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-soft-lg transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-slate-900">
                {scheduleData ? 'Edit Jadwal Pembayaran' : 'Tambah Jadwal Pembayaran'}
              </h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Murid *</label>
                <select
                  className={`input ${errors.studentId ? 'border-error-500' : ''}`}
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                >
                  <option value="">Pilih Murid</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.nickname ? `(${getDisplayName(s)})` : ''} — {s.class}
                      {!s.parentUid ? ' · belum tertaut akun ortu' : ''}
                    </option>
                  ))}
                </select>
                {errors.studentId && <p className="text-error-600 text-xs mt-1">{errors.studentId}</p>}
                <p className="mt-1 text-xs text-slate-400">
                  Tagihan otomatis muncul di akun orang tua murid yang dipilih.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Pembayaran *</label>
                  <select className="input" value={type} onChange={e => setType(e.target.value)}>
                    {PAYMENT_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah (Rp) *</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    className={`input ${errors.amount ? 'border-error-500' : ''}`}
                    value={amount}
                    onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                    placeholder="500000"
                  />
                  {errors.amount && <p className="text-error-600 text-xs mt-1">{errors.amount}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jatuh Tempo *</label>
                  <input
                    type="date"
                    className="input"
                    value={dueDate.toISOString().split('T')[0]}
                    onChange={e => setDueDate(new Date(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kelas</label>
                  <input className="input bg-slate-50" value={selectedStudent?.class ?? '-'} disabled />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi *</label>
                <textarea
                  className={`input ${errors.description ? 'border-error-500' : ''}`}
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Contoh: SPP Bulan Juli 2026"
                />
                {errors.description && <p className="text-error-600 text-xs mt-1">{errors.description}</p>}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary flex items-center" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  {scheduleData ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentScheduleModal;
