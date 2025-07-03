import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { Student } from '../../services/studentService';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  student?: Student | null;
  loading?: boolean;
}

const StudentModal = ({ isOpen, onClose, onSave, student, loading = false }: StudentModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    class: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    status: 'active' as 'active' | 'alumni',
    registrationDate: new Date(),
    birthDate: new Date(),
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    medicalNotes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name,
        class: student.class,
        parentName: student.parentName,
        parentEmail: student.parentEmail,
        parentPhone: student.parentPhone,
        status: student.status,
        registrationDate: student.registrationDate,
        birthDate: student.birthDate,
        address: student.address,
        emergencyContact: student.emergencyContact,
        emergencyPhone: student.emergencyPhone,
        medicalNotes: student.medicalNotes || '',
      });
    } else {
      setFormData({
        name: '',
        class: '',
        parentName: '',
        parentEmail: '',
        parentPhone: '',
        status: 'active',
        registrationDate: new Date(),
        birthDate: new Date(),
        address: '',
        emergencyContact: '',
        emergencyPhone: '',
        medicalNotes: '',
      });
    }
    setErrors({});
  }, [student, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Nama siswa wajib diisi';
    if (!formData.class.trim()) newErrors.class = 'Kelas wajib diisi';
    if (!formData.parentName.trim()) newErrors.parentName = 'Nama orang tua wajib diisi';
    if (!formData.parentEmail.trim()) newErrors.parentEmail = 'Email orang tua wajib diisi';
    if (!formData.parentPhone.trim()) newErrors.parentPhone = 'Nomor telepon wajib diisi';
    if (!formData.address.trim()) newErrors.address = 'Alamat wajib diisi';
    if (!formData.emergencyContact.trim()) newErrors.emergencyContact = 'Kontak darurat wajib diisi';
    if (!formData.emergencyPhone.trim()) newErrors.emergencyPhone = 'Nomor darurat wajib diisi';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.parentEmail && !emailRegex.test(formData.parentEmail)) {
      newErrors.parentEmail = 'Format email tidak valid';
    }

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
      console.error('Error saving student:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'registrationDate' || name === 'birthDate' ? new Date(value) : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
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
                {student ? 'Edit Siswa' : 'Tambah Siswa Baru'}
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
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`input ${errors.name ? 'border-error-500' : ''}`}
                    placeholder="Masukkan nama siswa"
                  />
                  {errors.name && <p className="text-error-600 text-xs mt-1">{errors.name}</p>}
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
                    <option value="TK A">TK A</option>
                    <option value="TK B">TK B</option>
                    <option value="Daycare">Daycare</option>
                  </select>
                  {errors.class && <p className="text-error-600 text-xs mt-1">{errors.class}</p>}
                </div>

                {/* Birth Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Lahir *
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate.toISOString().split('T')[0]}
                    onChange={handleInputChange}
                    className="input"
                  />
                </div>

                {/* Registration Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Daftar *
                  </label>
                  <input
                    type="date"
                    name="registrationDate"
                    value={formData.registrationDate.toISOString().split('T')[0]}
                    onChange={handleInputChange}
                    className="input"
                  />
                </div>

                {/* Parent Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Orang Tua *
                  </label>
                  <input
                    type="text"
                    name="parentName"
                    value={formData.parentName}
                    onChange={handleInputChange}
                    className={`input ${errors.parentName ? 'border-error-500' : ''}`}
                    placeholder="Masukkan nama orang tua"
                  />
                  {errors.parentName && <p className="text-error-600 text-xs mt-1">{errors.parentName}</p>}
                </div>

                {/* Parent Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Orang Tua *
                  </label>
                  <input
                    type="email"
                    name="parentEmail"
                    value={formData.parentEmail}
                    onChange={handleInputChange}
                    className={`input ${errors.parentEmail ? 'border-error-500' : ''}`}
                    placeholder="email@example.com"
                  />
                  {errors.parentEmail && <p className="text-error-600 text-xs mt-1">{errors.parentEmail}</p>}
                </div>

                {/* Parent Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telepon Orang Tua *
                  </label>
                  <input
                    type="tel"
                    name="parentPhone"
                    value={formData.parentPhone}
                    onChange={handleInputChange}
                    className={`input ${errors.parentPhone ? 'border-error-500' : ''}`}
                    placeholder="08xxxxxxxxxx"
                  />
                  {errors.parentPhone && <p className="text-error-600 text-xs mt-1">{errors.parentPhone}</p>}
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
                    <option value="active">Aktif</option>
                    <option value="alumni">Alumni</option>
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alamat *
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={2}
                  className={`input ${errors.address ? 'border-error-500' : ''}`}
                  placeholder="Masukkan alamat lengkap"
                />
                {errors.address && <p className="text-error-600 text-xs mt-1">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Emergency Contact */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kontak Darurat *
                  </label>
                  <input
                    type="text"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleInputChange}
                    className={`input ${errors.emergencyContact ? 'border-error-500' : ''}`}
                    placeholder="Nama kontak darurat"
                  />
                  {errors.emergencyContact && <p className="text-error-600 text-xs mt-1">{errors.emergencyContact}</p>}
                </div>

                {/* Emergency Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telepon Darurat *
                  </label>
                  <input
                    type="tel"
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={handleInputChange}
                    className={`input ${errors.emergencyPhone ? 'border-error-500' : ''}`}
                    placeholder="08xxxxxxxxxx"
                  />
                  {errors.emergencyPhone && <p className="text-error-600 text-xs mt-1">{errors.emergencyPhone}</p>}
                </div>
              </div>

              {/* Medical Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan Medis
                </label>
                <textarea
                  name="medicalNotes"
                  value={formData.medicalNotes}
                  onChange={handleInputChange}
                  rows={2}
                  className="input"
                  placeholder="Alergi, kondisi khusus, dll. (opsional)"
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
                  {student ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentModal;