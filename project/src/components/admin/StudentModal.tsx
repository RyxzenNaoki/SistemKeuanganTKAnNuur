import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { Student } from '../../services/studentService';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  student?: Student | null;
  loading?: boolean;
  availableClasses: string[];
}

const StudentModal = ({ isOpen, onClose, onSave, student, loading = false, availableClasses }: StudentModalProps) => {
  const [formData, setFormData] = useState({
    nis: '',
    name: '',
    class: '',
    academicYear: '',
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

  // Generate academic year options
  const getAcademicYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = -2; i <= 2; i++) {
      const year = currentYear + i;
      years.push(`${year}/${year + 1}`);
    }
    return years;
  };

  useEffect(() => {
    if (student) {
      setFormData({
        nis: student.nis || '',
        name: student.name,
        class: student.class,
        academicYear: student.academicYear || '',
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
      // Set default academic year to current year
      const currentYear = new Date().getFullYear();
      const defaultAcademicYear = `${currentYear}/${currentYear + 1}`;
      
      setFormData({
        nis: '',
        name: '',
        class: '',
        academicYear: defaultAcademicYear,
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
    if (!formData.academicYear.trim()) newErrors.academicYear = 'Tahun ajaran wajib diisi';
    if (!formData.parentName.trim()) newErrors.parentName = 'Nama orang tua wajib diisi';
    if (!formData.parentEmail.trim()) newErrors.parentEmail = 'Email orang tua wajib diisi';
    if (!formData.parentPhone.trim()) newErrors.parentPhone = 'Nomor telepon wajib diisi';
    if (!formData.address.trim()) newErrors.address = 'Alamat wajib diisi';
    if (!formData.emergencyContact.trim()) newErrors.emergencyContact = 'Kontak darurat wajib diisi';
    if (!formData.emergencyPhone.trim()) newErrors.emergencyPhone = 'Nomor darurat wajib diisi';

    // NIS validation (optional but must be unique if provided)
    if (formData.nis && formData.nis.trim()) {
      const nisRegex = /^[0-9]+$/;
      if (!nisRegex.test(formData.nis.trim())) {
        newErrors.nis = 'NIS hanya boleh berisi angka';
      }
    }

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
      const submitData = {
        ...formData,
        nis: formData.nis.trim() || undefined, // Send undefined if empty
      };
      await onSave(submitData);
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

  const generateNIS = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 999).toString().padStart(3, '0');
    const generatedNIS = `${year}${month}${random}`;
    
    setFormData(prev => ({
      ...prev,
      nis: generatedNIS
    }));
    
    // Clear NIS error if exists
    if (errors.nis) {
      setErrors(prev => ({ ...prev, nis: '' }));
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
                {/* NIS */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NIS (Nomor Induk Siswa)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="nis"
                      value={formData.nis}
                      onChange={handleInputChange}
                      className={`input flex-1 ${errors.nis ? 'border-error-500' : ''}`}
                      placeholder="Masukkan NIS atau generate otomatis"
                    />
                    <button
                      type="button"
                      onClick={generateNIS}
                      className="btn btn-secondary px-3 py-2 text-sm whitespace-nowrap"
                      title="Generate NIS otomatis"
                    >
                      Generate
                    </button>
                  </div>
                  {errors.nis && <p className="text-error-600 text-xs mt-1">{errors.nis}</p>}
                  <p className="text-xs text-gray-500 mt-1">
                    NIS bersifat opsional. Klik Generate untuk membuat NIS otomatis.
                  </p>
                </div>

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
                    {availableClasses.length > 0 ? (
                      availableClasses.map(className => (
                        <option key={className} value={className}>
                          {className}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="TK A">TK A</option>
                        <option value="TK B">TK B</option>
                        <option value="Daycare">Daycare</option>
                      </>
                    )}
                  </select>
                  {errors.class && <p className="text-error-600 text-xs mt-1">{errors.class}</p>}
                  {availableClasses.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      Tidak ada kelas tersedia. Silakan tambahkan kelas terlebih dahulu di menu Manajemen Kelas.
                    </p>
                  )}
                </div>

                {/* Academic Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tahun Ajaran *
                  </label>
                  <select
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleInputChange}
                    className={`input ${errors.academicYear ? 'border-error-500' : ''}`}
                  >
                    <option value="">Pilih Tahun Ajaran</option>
                    {getAcademicYearOptions().map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  {errors.academicYear && <p className="text-error-600 text-xs mt-1">{errors.academicYear}</p>}
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