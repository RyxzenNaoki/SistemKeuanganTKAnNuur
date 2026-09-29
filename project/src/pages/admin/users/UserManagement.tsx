import { UserRole, AccountStatus, ROLE_LABEL, STATUS_LABEL, toAccountStatus } from '../../../config/roles';
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
import { useState, useEffect} from 'react';
import { User, UserPlus, Edit, Trash2, Search, Shield, Check, X, Clock } from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';
import UserModal from '../../../components/admin/UserModal';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
}

const UserManagement = () => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Sample data - replace with actual data from Firebase
  const [users, setUsers] = useState<UserData[]>([]);

  useEffect(() => {
  loadUsers();
}, []);

const loadUsers = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    const fetchedUsers = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        email: data.email,
        role: data.role,
        status: toAccountStatus(data.status),
      } as UserData;
    });
    setUsers(fetchedUsers);
  } catch (error) {
    console.error('Gagal memuat pengguna:', error);
    showToast('error', 'Gagal memuat data pengguna');
  }
};

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-error-100 text-error-800';
      case 'guru':
        return 'bg-accent-100 text-accent-800';
      case 'parent':
        return 'bg-primary-100 text-primary-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleEditUser = (user: UserData) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleSaveUser = async (rawData: Omit<UserData, 'id' | 'status'> & { password?: string }) => {
  try {
    setModalLoading(true);

    // Password tidak boleh disimpan di Firestore (akun login dikelola Firebase Authentication)
    const { password: _password, ...userData } = rawData;
    void _password;

    if (selectedUser?.id) {
      await updateDoc(doc(db, 'users', selectedUser.id), {
        ...userData,
      });
      showToast('success', 'Data pengguna berhasil diperbarui');
    } else {
      await addDoc(collection(db, 'users'), {
        ...userData,
        status: 'active',
        createdAt: Timestamp.now(),
      });
      showToast('success', 'Pengguna baru berhasil ditambahkan');
    }

    setShowModal(false);
    await loadUsers();
  } catch (error) {
    console.error('Error saving user:', error);
    showToast('error', 'Gagal menyimpan data pengguna');
  } finally {
    setModalLoading(false);
  }
};


  const handleDeleteUser = async (userId: string) => {
  const user = users.find(u => u.id === userId);
  if (!user) return;

  if (!window.confirm(`Apakah Anda yakin ingin menghapus pengguna ${user.name}?`)) return;

  try {
    await deleteDoc(doc(db, 'users', userId));
    showToast('success', 'Pengguna berhasil dihapus');
    await loadUsers();
  } catch (error) {
    console.error('Error deleting user:', error);
    showToast('error', 'Gagal menghapus pengguna');
  }
};


  const handleSetStatus = async (user: UserData, status: AccountStatus) => {
    if (
      status === 'rejected' &&
      !window.confirm(`Tolak pendaftaran ${user.name}? Akun ini tidak akan bisa mengakses SINAU.`)
    ) {
      return;
    }
    try {
      await updateDoc(doc(db, 'users', user.id), { status });
      showToast('success', status === 'active' ? `${user.name} disetujui` : `${user.name} ditolak`);
      await loadUsers();
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('error', 'Gagal memperbarui status pengguna');
    }
  };

  const getStatusBadge = (status: AccountStatus) => {
    if (status === 'pending') return 'badge badge-accent';
    if (status === 'rejected') return 'badge badge-error';
    return 'badge badge-success';
  };

  const pendingCount = users.filter(u => u.status === 'pending').length;

  // Yang menunggu persetujuan ditampilkan paling atas
  const filteredUsers = users
    .filter(
      (user) =>
        (user.name?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
        (user.role?.toLowerCase() ?? '').includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => Number(b.status === 'pending') - Number(a.status === 'pending'));


  return (
    <div className="page-transition">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Manajemen Pengguna</h1>
        <p className="text-slate-600">Kelola akun pengguna dan hak akses sistem</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Pengguna</p>
              <p className="text-2xl font-bold text-slate-900">{users.length}</p>
            </div>
            <div className="p-2 bg-primary-100 rounded-xl">
              <User className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Admin</p>
              <p className="text-2xl font-bold text-error-600">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
            <div className="p-2 bg-error-100 rounded-xl">
              <Shield className="h-6 w-6 text-error-600" />
            </div>
          </div>
        </div>

      

        <div className={`card p-4 ${pendingCount > 0 ? 'ring-2 ring-accent-300' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Menunggu Persetujuan</p>
              <p className="text-2xl font-bold text-accent-600">{pendingCount}</p>
            </div>
            <div className="p-2 bg-accent-100 rounded-xl">
              <Clock className="h-6 w-6 text-accent-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Guru</p>
              <p className="text-2xl font-bold text-accent-600">
                {users.filter(u => u.role === 'guru').length}
              </p>
            </div>
            <div className="p-2 bg-accent-100 rounded-xl">
              <User className="h-6 w-6 text-accent-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Orang Tua</p>
              <p className="text-2xl font-bold text-primary-600">
                {users.filter(u => u.role === 'parent').length}
              </p>
            </div>
            <div className="p-2 bg-primary-100 rounded-xl">
              <User className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>
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
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
        </div>
        <button
          onClick={handleAddUser}
          className="btn btn-primary flex items-center gap-2 w-full sm:w-auto"
        >
          <UserPlus className="h-5 w-5" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Pengguna</th>
                <th>Email</th>
                <th>Peran</th>
                <th>Status</th>
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
                        <div className="font-medium text-slate-900">{user.name}</div>
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
                      {ROLE_LABEL[user.role] ?? user.role}
                    </span>
                  </td>
                  <td className="whitespace-nowrap">
                    <span className={getStatusBadge(user.status)}>{STATUS_LABEL[user.status]}</span>
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {user.status !== 'active' && (
                        <button
                          onClick={() => handleSetStatus(user, 'active')}
                          className="inline-flex items-center gap-1 rounded-lg bg-success-100 px-2.5 py-1 text-xs font-medium text-success-700 hover:bg-success-200"
                          title="Setujui akun"
                        >
                          <Check className="h-4 w-4" /> Setujui
                        </button>
                      )}
                      {user.status === 'pending' && (
                        <button
                          onClick={() => handleSetStatus(user, 'rejected')}
                          className="inline-flex items-center gap-1 rounded-lg bg-error-100 px-2.5 py-1 text-xs font-medium text-error-700 hover:bg-error-200"
                          title="Tolak akun"
                        >
                          <X className="h-4 w-4" /> Tolak
                        </button>
                      )}
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-1 text-slate-400 hover:text-primary-600"
                        title="Edit pengguna"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1 text-slate-400 hover:text-error-600"
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
            <User className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900">Tidak ada pengguna</h3>
            <p className="mt-1 text-sm text-slate-500">
              {searchTerm ? 'Tidak ada pengguna yang sesuai dengan pencarian' : 'Belum ada pengguna yang ditambahkan'}
            </p>
          </div>
        )}
      </div>

      {/* User Modal */}
      <UserModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveUser}
        userData={selectedUser}
        loading={modalLoading}
      />
    </div>
  );
};

export default UserManagement;