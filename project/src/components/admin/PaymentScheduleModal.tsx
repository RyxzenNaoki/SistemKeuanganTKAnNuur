import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';

interface PaymentSchedule {
  id?: string;
  type: string;
  amount: number;
  dueDate: Date;
  description: string;
  status: 'upcoming' | 'overdue' | 'paid';
  studentName: string;
  class: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PaymentScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (scheduleData: Omit<PaymentSchedule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  scheduleData?: PaymentSchedule | null;
  loading?: boolean;
}

const PaymentScheduleModal = ({ isOpen, onClose, onSave, scheduleData, loading = false }: PaymentScheduleModalProps) => {
  const [formData, setFormData] = useState({
    type: 'SPP Bulanan',
    amount: 0,
    dueDate: new Date(),
    description: '',
    status: 'upcoming' as 'upcoming' | 'overdue' | 'paid',
    studentName: '',
    class: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const paymentTypes = [
    'SPP Bulanan',
    'Uang Pangkal',
    'Uang Kegiatan',
    'Uang Seragam',
    'Uang Buku',
    'Lainnya',
  ];

  const classes = [
    'TK A - Melati',
    'TK B - Mawar',
    'TK B - Anggrek',
  ];

  useEffect(() => {
    if (scheduleData) {
      setFormData({
        type: scheduleData.type,
        amount: scheduleData.amount,
        dueDate: scheduleData.dueDate,
        description: scheduleData.description,
        status: scheduleData.status,
        studentName: scheduleData.studentName,
        class: scheduleData.class,
      });
    } else {
      setFormData({
        type: 'SPP Bulanan',
        amount: 0,
        dueDate: new Date(),
        description: '',
        status: 'upcoming',
        studentName: '',
        class: '',
      });
    }
    setErrors({});
  }, [scheduleData, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.type.trim()) newErrors.type = 'Jenis pembayaran wajib dipilih';
    if (!formData.studentName.trim()) newErrors.studentName = 'Nama siswa wajib diisi';
    if (!formData.class.trim()) newErrors.class = 'Kelas wajib dipilih';
    if (formData.amount <= 0) newErrors.amount = 'Jumlah harus lebih dari 0';
    if (!formData.description.trim()) newErrors.description = 'Deskripsi wajib diisi';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving payment schedule:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : 
               name === 'dueDate' ? new Date(value) : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {scheduleData ? 'Edit Jadwal Pembayaran' : 'Tambah Jadwal Pembayaran'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Student Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Siswa *
                  </label>
                  <input
                    type="text"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleInputChange}
                    className={`input ${errors.studentName ? 'border-error-500' : ''}`}
                    placeholder="Nama siswa"
                  />
                  {errors.studentName && <p className="text-error-600 text-xs mt-1">{errors.studentName}</p>}
                </div>

                {/* Class */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kelas *
                  </label>
                  <select
                    name="class"
                    value={formData.class}
                    onChange={handleInputChange}
                    className={`input ${errors.class ? 'border-error-500' : ''}`}
                  >
                    <option value="">Pilih Kelas</option>
                    {classes.map(className => (
                      <option key={className} value={className}>{className}</option>
                    ))}
                  </select>
                  {errors.class && <p className="text-error-600 text-xs mt-1">{errors.class}</p>}
                </div>

                {/* Payment Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jenis Pembayaran *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className={`input ${errors.type ? 'border-error-500' : ''}`}
                  >
                    {paymentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {errors.type && <p className="text-error-600 text-xs mt-1">{errors.type}</p>}
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jumlah (Rp) *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    min="0"
                    step="1000"
                    className={`input ${errors.amount ? 'border-error-500' : ''}`}
                    placeholder="500000"
                  />
                  {errors.amount && <p className="text-error-600 text-xs mt-1">{errors.amount}</p>}
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jatuh Tempo *
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate.toISOString().split('T')[0]}
                    onChange={handleInputChange}
                    className="input"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="input"
                  >
                    <option value="upcoming">Akan Datang</option>
                    <option value="overdue">Terlambat</option>
                    <option value="paid">Lunas</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className={`input ${errors.description ? 'border-error-500' : ''}`}
                  placeholder="Contoh: SPP Bulan Juli 2025"
                />
                {errors.description && <p className="text-error-600 text-xs mt-1">{errors.description}</p>}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex items-center"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
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