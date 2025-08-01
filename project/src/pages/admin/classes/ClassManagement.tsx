import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useState, useEffect } from 'react';
import { PlusCircle, Search, Edit2, Trash2, Users } from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';
import ClassModal from '../../../components/admin/ClassModal';

interface Class {
  id: string;
  name: string;
  teacher: string;
  studentCount: number;
  academicYear: string;
  capacity: number;
  description?: string;
}



const ClassManagement = () => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);


  useEffect(() => {
  loadClasses();
}, []);

const loadClasses = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'classes'));
    const classData = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
      } as Class;
    });
    setClasses(classData);
  } catch (error) {
    console.error('Error loading classes:', error);
    showToast('error', 'Gagal memuat data kelas');
  }
};


  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.teacher.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddClass = () => {
    setSelectedClass(null);
    setShowModal(true);
  };

  const handleEditClass = (classData: Class) => {
    setSelectedClass(classData);
    setShowModal(true);
  };

  const handleSaveClass = async (
  classData: Omit<Class, 'id'>
) => {
  try {
    setModalLoading(true);
    if (selectedClass?.id) {
      await updateDoc(doc(db, 'classes', selectedClass.id), classData);
      showToast('success', 'Data kelas berhasil diperbarui');
    } else {
      await addDoc(collection(db, 'classes'), {
        ...classData,
        createdAt: Timestamp.now(),
      });
      showToast('success', 'Kelas baru berhasil ditambahkan');
    }

    await loadClasses();
    setShowModal(false);
  } catch (error) {
    console.error('Error saving class:', error);
    showToast('error', 'Gagal menyimpan data kelas');
  } finally {
    setModalLoading(false);
  }
};


 const handleDeleteClass = async (classData: Class) => {
  if (!window.confirm(`Apakah Anda yakin ingin menghapus kelas ${classData.name}?`)) return;

  try {
    await deleteDoc(doc(db, 'classes', classData.id));
    showToast('success', 'Kelas berhasil dihapus');
    await loadClasses();
  } catch (error) {
    console.error('Error deleting class:', error);
    showToast('error', 'Gagal menghapus kelas');
  }
};


  return (
    <div className="page-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Data Kelas</h1>
        <p className="text-gray-600">Kelola data kelas TK Ceria</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Kelas</p>
              <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
            </div>
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Siswa</p>
              <p className="text-2xl font-bold text-success-600">
                {classes.reduce((sum, cls) => sum + cls.studentCount, 0)}
              </p>
            </div>
            <div className="p-2 bg-success-100 rounded-lg">
              <Users className="h-6 w-6 text-success-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Kapasitas Total</p>
              <p className="text-2xl font-bold text-primary-600">
                {classes.reduce((sum, cls) => sum + cls.capacity, 0)}
              </p>
            </div>
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Tingkat Hunian</p>
              <p className="text-2xl font-bold text-warning-600">
                {Math.round((classes.reduce((sum, cls) => sum + cls.studentCount, 0) / 
                  classes.reduce((sum, cls) => sum + cls.capacity, 0)) * 100)}%
              </p>
            </div>
            <div className="p-2 bg-warning-100 rounded-lg">
              <Users className="h-6 w-6 text-warning-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari kelas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 input"
          />
        </div>

        {/* Add Class Button */}
        <button
          onClick={handleAddClass}
          className="btn btn-primary flex items-center w-full sm:w-auto"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Tambah Kelas
        </button>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map((cls) => (
          <div key={cls.id} className="card p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{cls.name}</h3>
                <p className="text-gray-600 text-sm mt-1">{cls.teacher}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditClass(cls)}
                  className="p-1 text-gray-500 hover:text-primary-600 transition-colors"
                  title="Edit"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteClass(cls)}
                  className="p-1 text-gray-500 hover:text-error-600 transition-colors"
                  title="Hapus"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center text-gray-700">
                <Users className="h-5 w-5 mr-2" />
                <span>{cls.studentCount}/{cls.capacity} Siswa</span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full" 
                  style={{ width: `${(cls.studentCount / cls.capacity) * 100}%` }}
                />
              </div>

              {cls.description && (
                <p className="text-sm text-gray-600">{cls.description}</p>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tahun Ajaran</span>
                <span className="font-medium text-gray-900">{cls.academicYear}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredClasses.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada data kelas</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Tidak ada kelas yang sesuai dengan pencarian' : 'Belum ada kelas yang ditambahkan'}
          </p>
        </div>
      )}

      {/* Class Modal */}
      <ClassModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveClass}
        classData={selectedClass}
        loading={modalLoading}
      />
    </div>
  );
};

export default ClassManagement;