import { useState } from 'react';
import { PlusCircle, Search, Edit2, Trash2, Users } from 'lucide-react';

interface Class {
  id: string;
  name: string;
  teacher: string;
  studentCount: number;
  academicYear: string;
}

const ClassManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Sample data - in real app, this would come from Firestore
  const [classes] = useState<Class[]>([
    {
      id: '1',
      name: 'TK A - Melati',
      teacher: 'Ibu Sri Wahyuni',
      studentCount: 15,
      academicYear: '2024/2025',
    },
    {
      id: '2',
      name: 'TK B - Mawar',
      teacher: 'Ibu Ratna Sari',
      studentCount: 18,
      academicYear: '2024/2025',
    },
    // Add more sample data as needed
  ]);

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.teacher.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Data Kelas</h1>
        <p className="text-gray-600">Kelola data kelas TK Ceria</p>
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
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary flex items-center"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Tambah Kelas
        </button>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map((cls) => (
          <div key={cls.id} className="card p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{cls.name}</h3>
                <p className="text-gray-600 text-sm mt-1">{cls.teacher}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {/* Handle edit */}}
                  className="p-1 text-gray-500 hover:text-primary-600 transition-colors"
                  title="Edit"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {/* Handle delete */}}
                  className="p-1 text-gray-500 hover:text-error-600 transition-colors"
                  title="Hapus"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center text-gray-700">
              <Users className="h-5 w-5 mr-2" />
              <span>{cls.studentCount} Siswa</span>
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
          <p className="text-gray-500">Tidak ada data kelas yang ditemukan</p>
        </div>
      )}

      {/* Add/Edit Class Modal would go here */}
      {/* Implementation of modal component omitted for brevity */}
    </div>
  );
};

export default ClassManagement;