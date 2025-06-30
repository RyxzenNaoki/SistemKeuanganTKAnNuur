import { useState } from 'react';
import { X, Send, Loader2, MessageSquare, AlertCircle } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface ContactAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ContactData) => Promise<void>;
  loading?: boolean;
}

interface ContactData {
  subject: string;
  category: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  message: string;
  studentName?: string;
}

const ContactAdminModal = ({ isOpen, onClose, onSubmit, loading = false }: ContactAdminModalProps) => {
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState<ContactData>({
    subject: '',
    category: 'general',
    priority: 'normal',
    message: '',
    studentName: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = [
    { value: 'general', label: 'Pertanyaan Umum' },
    { value: 'payment', label: 'Pembayaran' },
    { value: 'academic', label: 'Akademik' },
    { value: 'schedule', label: 'Jadwal' },
    { value: 'complaint', label: 'Keluhan' },
    { value: 'suggestion', label: 'Saran' },
    { value: 'other', label: 'Lainnya' },
  ];

  const priorities = [
    { value: 'low', label: 'Rendah', color: 'text-gray-600' },
    { value: 'normal', label: 'Normal', color: 'text-blue-600' },
    { value: 'high', label: 'Tinggi', color: 'text-orange-600' },
    { value: 'urgent', label: 'Mendesak', color: 'text-red-600' },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.subject.trim()) newErrors.subject = 'Subjek wajib diisi';
    if (!formData.message.trim()) newErrors.message = 'Pesan wajib diisi';
    if (formData.message.trim().length < 10) newErrors.message = 'Pesan minimal 10 karakter';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await onSubmit(formData);
      showToast('success', 'Pesan berhasil dikirim! Admin akan merespons dalam 24 jam.');
      handleReset();
      onClose();
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('error', 'Gagal mengirim pesan. Silakan coba lagi.');
    }
  };

  const handleReset = () => {
    setFormData({
      subject: '',
      category: 'general',
      priority: 'normal',
      message: '',
      studentName: '',
    });
    setErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const getPriorityColor = (priority: string) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return priorityObj?.color || 'text-gray-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-6 w-6 text-primary-600" />
                <h3 className="text-lg font-medium text-gray-900">
                  Hubungi Admin
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subjek *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className={`input ${errors.subject ? 'border-error-500' : ''}`}
                  placeholder="Masukkan subjek pesan"
                />
                {errors.subject && <p className="text-error-600 text-xs mt-1">{errors.subject}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="input"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioritas
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className={`input ${getPriorityColor(formData.priority)}`}
                  >
                    {priorities.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Student Name (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Siswa (Opsional)
                </label>
                <input
                  type="text"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Jika pesan terkait siswa tertentu"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pesan *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={6}
                  className={`input resize-none ${errors.message ? 'border-error-500' : ''}`}
                  placeholder="Tulis pesan Anda di sini..."
                />
                {errors.message && <p className="text-error-600 text-xs mt-1">{errors.message}</p>}
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">Minimal 10 karakter</p>
                  <p className="text-xs text-gray-500">{formData.message.length} karakter</p>
                </div>
              </div>

              {/* Response Time Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Waktu Respons</h4>
                    <div className="mt-2 text-sm text-blue-800 space-y-1">
                      <p>• <strong>Normal:</strong> 1-2 hari kerja</p>
                      <p>• <strong>Tinggi:</strong> Dalam 24 jam</p>
                      <p>• <strong>Mendesak:</strong> Dalam 4 jam (hari kerja)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Kontak Darurat</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>📞 Telepon: +62 21 1234 5678</p>
                  <p>📧 Email: admin@tkceria.com</p>
                  <p>🕒 Jam Kerja: Senin-Jumat 08:00-16:00</p>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    handleReset();
                    onClose();
                  }}
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
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Kirim Pesan
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactAdminModal;