import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';

interface Expense {
  id?: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  attachments?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  expenseData?: Expense | null;
  loading?: boolean;
}

const ExpenseModal = ({ isOpen, onClose, onSave, expenseData, loading = false }: ExpenseModalProps) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    category: 'Operasional',
    date: new Date(),
    status: 'pending' as 'pending' | 'approved' | 'rejected',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = [
    'Utilitas',
    'ATK',
    'Maintenance',
    'Gaji',
    'Operasional',
    'Transport',
    'Konsumsi',
    'Lain-lain',
  ];

  useEffect(() => {
    if (expenseData) {
      setFormData({
        description: expenseData.description,
        amount: expenseData.amount,
        category: expenseData.category,
        date: expenseData.date,
        status: expenseData.status,
        notes: expenseData.notes || '',
      });
    } else {
      setFormData({
        description: '',
        amount: 0,
        category: 'Operasional',
        date: new Date(),
        status: 'pending',
        notes: '',
      });
    }
    setErrors({});
  }, [expenseData, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) newErrors.description = 'Deskripsi wajib diisi';
    if (formData.amount <= 0) newErrors.amount = 'Jumlah harus lebih dari 0';
    if (!formData.category.trim()) newErrors.category = 'Kategori wajib dipilih';

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
      console.error('Error saving expense:', error);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {expenseData ? 'Edit Pengeluaran' : 'Tambah Pengeluaran Baru'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="Contoh: Pembayaran Listrik"
                />
                {errors.description && <p className="text-error-600 text-xs mt-1">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    placeholder="750000"
                  />
                  {errors.amount && <p className="text-error-600 text-xs mt-1">{errors.amount}</p>}
                </div>

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

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`input ${errors.category ? 'border-error-500' : ''}`}
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {errors.category && <p className="text-error-600 text-xs mt-1">{errors.category}</p>}
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
                    <option value="pending">Menunggu Persetujuan</option>
                    <option value="approved">Disetujui</option>
                    <option value="rejected">Ditolak</option>
                  </select>
                </div>
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
                  {expenseData ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseModal;