import { useState, useEffect } from 'react';
import { PlusCircle, Search, Edit2, Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Student } from '../../../services/studentService';
import { useToast } from '../../../contexts/ToastContext';
import StudentModal from '../../../components/admin/StudentModal';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../../firebase/config';

interface Class {
  id: string;
  name: string;
  teacher: string;
  studentCount: number;
  academicYear: string;
  capacity: number;
  description?: string;
}

const StudentManagement = () => {
  const { showToast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Load students and classes on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Filter students when search term or filters change
  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, selectedClass, selectedStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadStudents(), loadClasses()]);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('error', 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'students'));
      const data = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          registrationDate: data.registrationDate?.toDate() || new Date(),
          birthDate: data.birthDate?.toDate() || new Date(),
        } as Student;
      });
      setStudents(data);
    } catch (error) {
      console.error('Error loading students:', error);
      throw error;
    }
  };

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
      throw error;
    }
  };

  const updateClassStudentCount = async () => {
    try {
      // Count students by class
      const classCounts: Record<string, number> = {};
      students.filter(s => s.status === 'active').forEach(student => {
        classCounts[student.class] = (classCounts[student.class] || 0) + 1;
      });

      // Update each class with current student count
      const updatePromises = classes.map(async (classItem) => {
        const currentCount = classCounts[classItem.name] || 0;
        if (classItem.studentCount !== currentCount) {
          await updateDoc(doc(db, 'classes', classItem.id), {
            studentCount: currentCount
          });
        }
      });

      await Promise.all(updatePromises);
      
      // Reload classes to get updated counts
      await loadClasses();
    } catch (error) {
      console.error('Error updating class student counts:', error);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.nis && student.nis.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by class
    if (selectedClass !== 'all') {
      filtered = filtered.filter(student => student.class === selectedClass);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(student => student.status === selectedStatus);
    }

    setFilteredStudents(filtered);
  };

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setShowModal(true);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  const handleSaveStudent = async (studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setModalLoading(true);

      // Check if NIS already exists (only for new students or when NIS is changed)
      if (studentData.nis) {
        const existingStudent = students.find(s => 
          s.nis === studentData.nis && s.id !== selectedStudent?.id
        );
        if (existingStudent) {
          showToast('error', 'NIS sudah digunakan oleh siswa lain');
          return;
        }
      }

      const payload = {
        ...studentData,
        registrationDate: Timestamp.fromDate(studentData.registrationDate),
        birthDate: Timestamp.fromDate(studentData.birthDate),
      };

      if (selectedStudent?.id) {
        const ref = doc(db, 'students', selectedStudent.id);
        await updateDoc(ref, payload);
        showToast('success', 'Data siswa berhasil diperbarui');
      } else {
        await addDoc(collection(db, 'students'), payload);
        showToast('success', 'Siswa baru berhasil ditambahkan');
      }

      await loadStudents();
      await updateClassStudentCount();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving student:', error);
      showToast('error', 'Gagal menyimpan data siswa');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteStudent = async (student: Student) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus data ${student.name}?`)) return;

    try {
      await deleteDoc(doc(db, 'students', student.id!));
      showToast('success', 'Data siswa berhasil dihapus');
      await loadStudents();
      await updateClassStudentCount();
    } catch (error) {
      console.error('Error deleting student:', error);
      showToast('error', 'Gagal menghapus data siswa');
    }
  };

  const getAvailableClasses = () => {
    return classes.map(cls => cls.name);
  };

  const getUniqueClasses = () => {
    const classNames = [...new Set(students.map(student => student.class))];
    return classNames.sort();
  };

  if (loading) {
    return (
      <div className="page-transition">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          <span className="ml-2 text-gray-600">Memuat data siswa...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Data Siswa</h1>
        <p className="text-gray-600">Kelola data siswa TK An Nuur Rumah Cahaya</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Siswa</p>
              <p className="text-2xl font-bold text-gray-900">{students.length}</p>
            </div>
            <div className="p-2 bg-primary-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Siswa Aktif</p>
              <p className="text-2xl font-bold text-success-600">
                {students.filter(s => s.status === 'active').length}
              </p>
            </div>
            <div className="p-2 bg-success-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-success-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Alumni</p>
              <p className="text-2xl font-bold text-gray-600">
                {students.filter(s => s.status === 'alumni').length}
              </p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <XCircle className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Kelas</p>
              <p className="text-2xl font-bold text-primary-600">
                {getUniqueClasses().length}
              </p>
            </div>
            <div className="p-2 bg-primary-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari siswa (nama, NIS, kelas, orang tua)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="input min-w-[150px]"
            >
              <option value="all">Semua Kelas</option>
              {getUniqueClasses().map(className => (
                <option key={className} value={className}>{className}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input min-w-[120px]"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="alumni">Alumni</option>
            </select>
          </div>
        </div>

        {/* Add Student Button */}
        <button
          onClick={handleAddStudent}
          className="btn btn-primary flex items-center w-full sm:w-auto"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Tambah Siswa
        </button>
      </div>

      {/* Students Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>NIS</th>
                <th>Nama Siswa</th>
                <th>Kelas</th>
                <th>Nama Orang Tua</th>
                <th>Email Orang Tua</th>
                <th>Status</th>
                <th>Tanggal Daftar</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td className="font-mono text-sm text-gray-600">
                    {student.nis || '-'}
                  </td>
                  <td className="font-medium text-gray-900">{student.name}</td>
                  <td>
                    <span className="badge badge-secondary">{student.class}</span>
                  </td>
                  <td>{student.parentName}</td>
                  <td className="text-sm text-gray-600">{student.parentEmail}</td>
                  <td>
                    {student.status === 'active' ? (
                      <span className="badge badge-success flex items-center w-fit">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Aktif
                      </span>
                    ) : (
                      <span className="badge badge-secondary flex items-center w-fit">
                        <XCircle className="h-3 w-3 mr-1" />
                        Alumni
                      </span>
                    )}
                  </td>
                  <td>{student.registrationDate.toLocaleDateString('id-ID')}</td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditStudent(student)}
                        className="p-1 text-gray-500 hover:text-primary-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student)}
                        className="p-1 text-gray-500 hover:text-error-600 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchTerm || selectedClass !== 'all' || selectedStatus !== 'all'
                ? 'Tidak ada siswa yang sesuai dengan filter'
                : 'Belum ada data siswa'}
            </p>
          </div>
        )}
      </div>

      {/* Student Modal */}
      <StudentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveStudent}
        student={selectedStudent}
        loading={modalLoading}
        availableClasses={getAvailableClasses()}
      />
    </div>
  );
};

export default StudentManagement;