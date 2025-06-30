import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';

interface Class {
  id?: string;
  name: string;
  teacher: string;
  studentCount: number;
  academicYear: string;
  capacity: number;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (classData: Omit<Class, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  classData?: Class | null;
  loading?: boolean;
}

const ClassModal = ({ isOpen, onClose, onSave, classData, loading = false }: ClassModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    teacher: '',
    studentCount: 0,
    academicYear: '2024/2025',
    capacity: 20,
    description: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (classData) {
      setFormData({
        name: classData.name,
        teacher: classData.teacher,
        studentCount: classData.studentCount,
        academicYear: classData.academicYear,
        capacity: classData.capacity,
        description: classData.description || '',
      });
    } else {
      setFormData({
        name: '',
        teacher: '',
        studentCount: 0,
        academicYear: '2024/2025',
        capacity: 20,
        description: '',
      });
    }
    setErrors({});
  }, [classData, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Nama kelas wajib diisi';
    if (!formData.teacher.trim()) newErrors.teacher = 'Nama guru wajib diisi';
    if (!formData.academicYear.trim()) newErrors.academicYear = 'Tahun ajaran wajib diisi';
    if (formData.capacity < 1) newErrors.capacity = 'Kapasitas harus lebih dari 0';

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
      console.error('Error saving class:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'studentCount' || name === 'capacity' ? parseInt(value) || 0 : value
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
                {classData ? 'Edit Kelas' : 'Tambah Kelas Baru'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Class Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Kelas *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`input ${errors.name ? 'border-error-500' : ''}`}
                  placeholder="Contoh: TK A - Melati"
                />
                {errors.name && <p className="text-error-600 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Teacher */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Guru Kelas *
                </label>
                <input
                  type="text"
                  name="teacher"
                  value={formData.teacher}
                  onChange={handleInputChange}
                  className={`input ${errors.teacher ? 'border-error-500' : ''}`}
                  placeholder="Nama guru kelas"
                />
                {errors.teacher && <p className="text-error-600 text-xs mt-1">{errors.teacher}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <option value="2024/2025">2024/2025</option>
                    <option value="2025/2026">2025/2026</option>
                    <option value="2026/2027">2026/2027</option>
                  </select>
                  {errors.academicYear && <p className="text-error-600 text-xs mt-1">{errors.academicYear}</p>}
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kapasitas *
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    min="1"
                    max="30"
                    className={`input ${errors.capacity ? 'border-error-500' : ''}`}
                  />
                  {errors.capacity && <p className="text-error-600 text-xs mt-1">{errors.capacity}</p>}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="input"
                  placeholder="Deskripsi kelas (opsional)"
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
                  {classData ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassModal;