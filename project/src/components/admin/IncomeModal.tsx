import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';

interface Income {
  id?: string;
  date: Date;
  category: 'spp' | 'registration' | 'donation' | 'other';
  description: string;
  amount: number;
  student: string;
  paymentMethod: 'transfer' | 'cash';
  status: 'verified' | 'pending' | 'rejected';
  receiptNumber: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (incomeData: Omit<Income, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  incomeData?: Income | null;
  loading?: boolean;
}

const IncomeModal = ({ isOpen, onClose, onSave, incomeData, loading = false }: IncomeModalProps) => {
  const [formData, setFormData] = useState({
    date: new Date(),
    category: 'spp' as 'spp' | 'registration' | 'donation' | 'other',
    description: '',
    amount: 0,
    student: '',
    paymentMethod: 'transfer' as 'transfer' | 'cash',
    status: 'pending' as 'verified' | 'pending' | 'rejected',
    receiptNumber: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (incomeData) {
      setFormData({
        date: incomeData.date,
        category: incomeData.category,
        description: incomeData.description,
        amount: incomeData.amount,
        student: incomeData.student,
        paymentMethod: incomeData.paymentMethod,
        status: incomeData.status,
        receiptNumber: incomeData.receiptNumber,
        notes: incomeData.notes || '',
      });
    } else {
      // Generate receipt number for new income
      const now = new Date();
      const receiptNumber = `INC-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(Date.now()).slice(-3)}`;
      
      setFormData({
        date: new Date(),
        category: 'spp',
        description: '',
        amount: 0,
        student: '',
        paymentMethod: 'transfer',
        status: 'pending',
        receiptNumber,
        notes: '',
      });
    }
    setErrors({});
  }, [incomeData, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) newErrors.description = 'Deskripsi wajib diisi';
    if (!formData.student.trim()) newErrors.student = 'Nama siswa wajib diisi';
    if (formData.amount <= 0) newErrors.amount = 'Jumlah harus lebih dari 0';
    if (!formData.receiptNumber.trim()) newErrors.receiptNumber = 'Nomor kwitansi wajib diisi';

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
      console.error('Error saving income:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : 
               name === 'date' ? new Date(value) : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const getCategoryLabel = (category: string) => {
    const categories = {
      spp: 'SPP Bulanan',
      registration: 'Uang Pangkal',
      donation: 'Donasi',
      other: 'Lainnya',
    };
    return categories[category as keyof typeof categories] || category;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {incomeData ? 'Edit Pemasukan' : 'Tambah Pemasukan Baru'}
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
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date.toISOString().split('T')[0]}
                    onChange={handleInputChange}
                    className="input"
                  />
                </div>

                {/* Receipt Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    No. Kwitansi *
                  </label>
                  <input
                    type="text"
                    name="receiptNumber"
                    value={formData.receiptNumber}
                    onChange={handleInputChange}
                    className={`input ${errors.receiptNumber ? 'border-error-500' : ''}`}
                    placeholder="INC-2025-01-001"
                  />
                  {errors.receiptNumber && <p className="text-error-600 text-xs mt-1">{errors.receiptNumber}</p>}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="input"
                  >
                    <option value="spp">SPP Bulanan</option>
                    <option value="registration">Uang Pangkal</option>
                    <option value="donation">Donasi</option>
                    <option value="other">Lainnya</option>
                  </select>
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

                {/* Student */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Siswa *
                  </label>
                  <input
                    type="text"
                    name="student"
                    value={formData.student}
                    onChange={handleInputChange}
                    className={`input ${errors.student ? 'border-error-500' : ''}`}
                    placeholder="Nama siswa"
                  />
                  {errors.student && <p className="text-error-600 text-xs mt-1">{errors.student}</p>}
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    className="input"
                  >
                    <option value="transfer">Transfer Bank</option>
                    <option value="cash">Tunai</option>
                  </select>
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
                    <option value="pending">Menunggu Verifikasi</option>
                    <option value="verified">Terverifikasi</option>
                    <option value="rejected">Ditolak</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi *
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={`input ${errors.description ? 'border-error-500' : ''}`}
                  placeholder="Contoh: SPP Bulan Juni 2025"
                />
                {errors.description && <p className="text-error-600 text-xs mt-1">{errors.description}</p>}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="input"
                  placeholder="Catatan tambahan (opsional)"
                />
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
                  {incomeData ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomeModal;