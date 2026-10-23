import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { createUserProfile } from '../../services/registrationService';
import { useAuth } from '../../contexts/AuthContext';
import GoogleButton, { googleAuthErrorMessage } from '../../components/auth/GoogleButton';
import { Loader2, UserPlus, Baby } from 'lucide-react';
import { ROLE_LABEL, SELF_REGISTER_ROLES, UserRole } from '../../config/roles';
import { CLASS_OPTIONS } from '../../config/classes';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { signInWithGoogle } = useAuth();
    const [googleLoading, setGoogleLoading] = useState(false);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [role, setRole] = useState('parent');
    const [studentName, setStudentName] = useState('');
    const [studentNickname, setStudentNickname] = useState('');
    const [studentClass, setStudentClass] = useState('');
    const [loading, setLoading] = useState(false);

    // Daftar dengan Google: pilih akun, lalu lengkapi data (peran & data anak) di halaman berikutnya
    const handleGoogle = async () => {
        setGoogleLoading(true);
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error('Google register error:', error);
            const message = googleAuthErrorMessage(error);
            if (message) showToast('error', message);
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (password !== confirm) {
            showToast('error', 'Password dan konfirmasi tidak sama.');
            setLoading(false);
            return;
        }

        if (role === 'parent' && (!studentName.trim() || !studentNickname.trim() || !studentClass.trim())) {
            showToast('error', 'Nama lengkap, nama panggilan, dan kelas anak wajib diisi.');
            setLoading(false);
            return;
        }

        try {
            // Email selalu huruf kecil supaya cocok dengan Data Siswa & aturan keamanan Firestore
            const cleanEmail = email.trim().toLowerCase();
            const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, password);

            await createUserProfile({
                uid: userCred.user.uid,
                email: cleanEmail,
                role: role as Exclude<UserRole, 'admin'>,
                name,
                studentName,
                studentNickname,
                studentClass,
            });

            showToast(
                'success',
                role === 'guru'
                    ? 'Registrasi berhasil! Akun guru aktif setelah disetujui admin.'
                    : 'Registrasi berhasil!'
            );
            navigate('/login');
        } catch (error: unknown) {
            if (error instanceof Error && 'code' in error) {
                const firebaseError = error as { code: string; message: string };

                if (firebaseError.code === 'auth/email-already-in-use') {
                    showToast('error', 'Email sudah digunakan. Silakan login.');
                } else if (firebaseError.code === 'auth/invalid-email') {
                    showToast('error', 'Format email tidak valid.');
                } else if (firebaseError.code === 'auth/weak-password') {
                    showToast('error', 'Password minimal 6 karakter.');
                } else {
                    showToast('error', firebaseError.message || 'Registrasi gagal.');
                }
            } else {
                showToast('error', 'Terjadi kesalahan saat mendaftar.');
            }
        } finally {
            setLoading(false);
        }
    };

    const label = 'block text-sm font-medium text-slate-600 mb-1';

    return (
        <div>
            <h2 className="text-2xl font-bold text-center text-slate-900 mb-1">Daftar Akun</h2>
            <p className="text-center text-sm text-slate-400 mb-6">Buat akun untuk mengakses SINAU</p>

            <GoogleButton label="Daftar dengan Google" onClick={handleGoogle} loading={googleLoading} />
            <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-white text-slate-400">atau daftar dengan email</span>
                </div>
            </div>

            <form onSubmit={handleRegister}>
                <div className="mb-4">
                    <label htmlFor="role" className={label}>Daftar sebagai</label>
                    <select
                        id="role"
                        className="input"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                    >
                        {SELF_REGISTER_ROLES.map(r => (
                            <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                        ))}
                    </select>
                    <p className="mt-1 text-xs text-slate-400">
                        Akun Admin didaftarkan manual oleh pengelola sistem melalui Firebase.
                    </p>
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
                    <input
                        id="name"
                        type="text"
                        required
                        className="input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Masukkan nama lengkap Anda"
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="email" className={label}>Email</label>
                    <input
                        id="email"
                        type="email"
                        required
                        className="input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nama@email.com"
                    />
                </div>

                {/* Data anak — hanya untuk Orang Tua */}
                {role === 'parent' && (
                    <div className="mb-4 rounded-2xl border border-secondary-100 bg-secondary-50/60 p-4 space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-secondary-700">
                            <Baby className="h-4 w-4" />
                            Data Anak
                        </div>

                        <div>
                            <label htmlFor="studentName" className={label}>
                                Nama Lengkap Anak <span className="text-error-500">*</span>
                            </label>
                            <input
                                id="studentName"
                                type="text"
                                required
                                className="input bg-white"
                                value={studentName}
                                onChange={(e) => setStudentName(e.target.value)}
                                placeholder="Sesuai akta kelahiran"
                            />
                        </div>

                        <div>
                            <label htmlFor="studentNickname" className={label}>
                                Nama Panggilan Anak <span className="text-error-500">*</span>
                            </label>
                            <input
                                id="studentNickname"
                                type="text"
                                required
                                className="input bg-white"
                                value={studentNickname}
                                onChange={(e) => setStudentNickname(e.target.value)}
                                placeholder="Nama yang dipanggil sehari-hari"
                            />
                        </div>

                        <div>
                            <label htmlFor="studentClass" className={label}>
                                Kelas <span className="text-error-500">*</span>
                            </label>
                            <select
                                id="studentClass"
                                className="input bg-white"
                                value={studentClass}
                                onChange={(e) => setStudentClass(e.target.value)}
                                required
                            >
                                <option value="">Pilih Kelas</option>
                                {CLASS_OPTIONS.map(className => (
                                    <option key={className} value={className}>{className}</option>
                                ))}
                            </select>
                        </div>
                        <p className="text-xs text-slate-500">
                            Data ini otomatis terhubung ke Data Siswa, sehingga nama anak Anda akan
                            dikenali oleh admin dan guru.
                        </p>
                    </div>
                )}

                <div className="mb-4">
                    <label htmlFor="password" className={label}>Password</label>
                    <input
                        id="password"
                        type="password"
                        required
                        className="input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                    />
                </div>

                <div className="mb-6">
                    <label htmlFor="confirm" className={label}>Konfirmasi Password</label>
                    <input
                        id="confirm"
                        type="password"
                        required
                        className="input"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="••••••••"
                    />
                </div>

                <p className="mb-4 text-xs text-slate-500 text-center">
                    Dengan mendaftar, Anda menyetujui{' '}
                    <Link to="/privacy-policy" target="_blank" className="text-primary-600 underline hover:text-primary-700">
                        Kebijakan Privasi
                    </Link>{' '}
                    SINAU, termasuk pengelolaan data anak Anda oleh sekolah.
                </p>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn btn-primary flex justify-center items-center"
                >
                    {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <>
                            <UserPlus className="h-5 w-5 mr-2" />
                            <span>Daftar</span>
                        </>
                    )}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-slate-500">
                    Sudah punya akun?{' '}
                    <a href="/login" className="font-medium text-primary-600 hover:text-primary-700">
                        Masuk di sini
                    </a>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
