import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Loader2, UserPlus, Baby, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { createUserProfile } from '../../services/registrationService';
import { ROLE_HOME, ROLE_LABEL, SELF_REGISTER_ROLES, UserRole } from '../../config/roles';
import { CLASS_OPTIONS } from '../../config/classes';

// Langkah kedua pendaftaran dengan Google: akun Google sudah ada, tinggal
// memilih peran dan (untuk orang tua) mengisi data anak.
const CompleteRegistrationPage = () => {
  const { currentUser, userRole, refreshProfile, signOut } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [role, setRole] = useState<Exclude<UserRole, 'admin'>>('parent');
  const [name, setName] = useState(currentUser?.displayName ?? '');
  const [studentName, setStudentName] = useState('');
  const [studentNickname, setStudentNickname] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!currentUser) return <Navigate to="/login" replace />;
  // Profil sudah ada (mis. halaman dibuka ulang) -> langsung ke beranda
  if (userRole) return <Navigate to={ROLE_HOME[userRole]} replace />;

  const label = 'block text-sm font-medium text-slate-600 mb-1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('error', 'Nama lengkap wajib diisi.');
      return;
    }
    if (role === 'parent' && (!studentName.trim() || !studentNickname.trim() || !studentClass)) {
      showToast('error', 'Nama lengkap, nama panggilan, dan kelas anak wajib diisi.');
      return;
    }
    if (!currentUser.email) {
      showToast('error', 'Akun Google ini tidak memiliki email.');
      return;
    }

    setSubmitting(true);
    try {
      await createUserProfile({
        uid: currentUser.uid,
        email: currentUser.email,
        role,
        name,
        studentName,
        studentNickname,
        studentClass,
      });
      await refreshProfile();
      showToast(
        'success',
        role === 'guru' ? 'Pendaftaran berhasil! Akun guru aktif setelah disetujui admin.' : 'Pendaftaran berhasil!'
      );
      navigate(ROLE_HOME[role], { replace: true });
    } catch (error) {
      console.error('Gagal melengkapi pendaftaran:', error);
      showToast('error', 'Gagal menyimpan pendaftaran. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-center text-slate-900 mb-1">Lengkapi Pendaftaran</h2>
      <p className="text-center text-sm text-slate-400 mb-6">Satu langkah lagi untuk mulai memakai SINAU</p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className={label}>Akun Google</label>
          <input className="input bg-slate-50" value={currentUser.email ?? ''} disabled />
        </div>

        <div className="mb-4">
          <label htmlFor="role" className={label}>Daftar sebagai</label>
          <select id="role" className="input" value={role} onChange={e => setRole(e.target.value as Exclude<UserRole, 'admin'>)}>
            {SELF_REGISTER_ROLES.map(r => (
              <option key={r} value={r}>{ROLE_LABEL[r]}</option>
            ))}
          </select>
          {role === 'guru' && (
            <p className="mt-2 rounded-xl bg-accent-50 border border-accent-100 px-3 py-2 text-xs text-accent-800">
              Akun guru perlu disetujui admin sebelum bisa digunakan.
            </p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="name" className={label}>
            {role === 'parent' ? 'Nama Lengkap Orang Tua' : 'Nama Lengkap Guru'}
          </label>
          <input id="name" className="input" required value={name} onChange={e => setName(e.target.value)} />
        </div>

        {role === 'parent' && (
          <div className="mb-4 rounded-2xl border border-secondary-100 bg-secondary-50/60 p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-secondary-700">
              <Baby className="h-4 w-4" />
              Data Anak
            </div>
            <div>
              <label htmlFor="studentName" className={label}>Nama Lengkap Anak <span className="text-error-500">*</span></label>
              <input id="studentName" className="input bg-white" required value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Sesuai akta kelahiran" />
            </div>
            <div>
              <label htmlFor="studentNickname" className={label}>Nama Panggilan Anak <span className="text-error-500">*</span></label>
              <input id="studentNickname" className="input bg-white" required value={studentNickname} onChange={e => setStudentNickname(e.target.value)} placeholder="Nama yang dipanggil sehari-hari" />
            </div>
            <div>
              <label htmlFor="studentClass" className={label}>Kelas <span className="text-error-500">*</span></label>
              <select id="studentClass" className="input bg-white" required value={studentClass} onChange={e => setStudentClass(e.target.value)}>
                <option value="">Pilih Kelas</option>
                {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}

        <p className="mb-4 text-xs text-slate-500 text-center">
          Dengan melanjutkan, Anda menyetujui{' '}
          <Link to="/privacy-policy" target="_blank" className="text-primary-600 underline hover:text-primary-700">
            Kebijakan Privasi
          </Link>{' '}
          SINAU{role === 'parent' ? ', termasuk pengelolaan data anak Anda oleh sekolah' : ''}.
        </p>

        <button type="submit" disabled={submitting} className="w-full btn btn-primary flex justify-center items-center">
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (<><UserPlus className="h-5 w-5 mr-2" /><span>Selesaikan Pendaftaran</span></>)}
        </button>
      </form>

      <button onClick={() => signOut()} className="mt-4 w-full inline-flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <LogOut className="h-4 w-4" /> Batal dan keluar
      </button>
    </div>
  );
};

export default CompleteRegistrationPage;
