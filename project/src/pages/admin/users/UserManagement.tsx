import { useState } from 'react';
import { User, UserPlus, Edit, Trash2, Search, Shield } from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'bendahara' | 'guru' | 'parent';
  status: 'active' | 'inactive';
  lastLogin?: string;
}

const UserManagement = () => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  // Sample data - replace with actual data from Firebase
  const [users] = useState<UserData[]>([
    {
      id: '1',
      name: 'Admin Utama',
      email: 'admin@tkceria.com',
      role: 'admin',
      status: 'active',
      lastLogin: '2025-06-15 08:30',
    },
    {
      id: '2',
      name: 'Bendahara Sekolah',
      email: 'bendahara@tkceria.com',
      role: 'bendahara',
      status: 'active',
      lastLogin: '2025-06-14 15:45',
    },
    {
      id: '3',
      name: 'Guru Kelas Mawar',
      email: 'guru.mawar@tkceria.com',
      role: 'guru',
      status: 'active',
      lastLogin: '2025-06-15 07:15',
    },
  ]);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-error-100 text-error-800';
      case 'bendahara':
        return 'bg-warning-100 text-warning-800';
      case 'guru':
        return 'bg-success-100 text-success-800';
      case 'parent':
        return 'bg-primary-100 text-primary-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active'
      ? 'bg-success-100 text-success-800'
      : 'bg-gray-100 text-gray-800';
  };

  const handleAddUser = () => {
    setShowAddModal(true);
    setSelectedUser(null);
  };

  const handleEditUser = (user: UserData) => {
    setSelectedUser(user);
    setShowAddModal(true);
  };

  const handleDeleteUser = (userId: string) => {
    // Implement delete functionality
    showToast('success', 'Pengguna berhasil dihapus');
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Pengguna</h1>
        <p className="text-gray-600">Kelola akun pengguna dan hak akses sistem</p>
      </div>

      {/* Search and Add User */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Cari pengguna..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        <button
          onClick={handleAddUser}
          className="btn btn-primary flex items-center gap-2"
        >
          <UserPlus className="h-5 w-5" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Pengguna</th>
                <th>Email</th>
                <th>Peran</th>
                <th>Status</th>
                <th>Login Terakhir</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">{user.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap">{user.email}</td>
                  <td className="whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                        user.role
                      )}`}
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        user.status
                      )}`}
                    >
                      {user.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin || '-'}
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-1 text-gray-400 hover:text-primary-600"
                        title="Edit pengguna"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1 text-gray-400 hover:text-error-600"
                        title="Hapus pengguna"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada pengguna</h3>
            <p className="mt-1 text-sm text-gray-500">
              Tidak ada pengguna yang sesuai dengan pencarian Anda.
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit User Modal would go here */}
      {/* Implement modal component for adding/editing users */}
    </div>
  );
};

export default UserManagement;