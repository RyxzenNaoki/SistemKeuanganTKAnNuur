import { useEffect, useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { linkParentToStudent } from '../../services/studentService';
import { Loader2, UserPlus, Baby } from 'lucide-react';
import { ROLE_LABEL, SELF_REGISTER_ROLES, UserRole, initialStatusFor } from '../../config/roles';

// Dipakai kalau daftar kelas dari Data Kelas (admin) belum bisa dimuat
const DEFAULT_CLASSES = ['TK A', 'TK B', 'Daycare'];

const RegisterPage = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [role, setRole] = useState('parent');
    const [studentName, setStudentName] = useState('');
    const [studentNickname, setStudentNickname] = useState('');
    const [studentClass, setStudentClass] = useState('');
    const [classes, setClasses] = useState<string[]>(DEFAULT_CLASSES);
    const [loading, setLoading] = useState(false);

    // Ambil daftar kelas dari Data Kelas supaya pilihannya sama dengan yang dikelola admin
    useEffect(() => {
        const loadClasses = async () => {
            try {
                const snap = await getDocs(collection(db, 'classes'));
                const names = snap.docs
                    .map(d => String(d.data().name || '').trim())
                    .filter(Boolean);
                if (names.length > 0) setClasses(Array.from(new Set(names)).sort());
            } catch {
                // belum login -> aturan Firestore bisa menolak; pakai daftar bawaan
            }
        };
        loadClasses();
    }, []);

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

            const userData: Record<string, unknown> = {
                email: cleanEmail,
                role,
                // Guru harus disetujui admin dulu; orang tua langsung aktif
                status: initialStatusFor(role as UserRole),
                name: name.trim(),
                createdAt: serverTimestamp(),
            };

            if (role === 'parent') {
                userData.studentName = studentName.trim();
                userData.studentNickname = studentNickname.trim();
                userData.studentClass = studentClass;
            }

            await setDoc(doc(db, 'users', userCred.user.uid), userData);

            // Tautkan akun ortu ke data siswa (dipakai Admin & Guru)
            if (role === 'parent') {
                try {
                    const { studentId } = await linkParentToStudent({
                        uid: userCred.user.uid,
                        email: cleanEmail,
                        parentName: name.trim(),
                        studentName: studentName.trim(),
                        studentNickname: studentNickname.trim(),
                        studentClass,
                    });
                    await setDoc(doc(db, 'users', userCred.user.uid), { studentId }, { merge: true });
                } catch (linkError) {
                    console.warn('Gagal menautkan siswa, admin dapat menautkan manual:', linkError);
                }
            }

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
                                {classes.map(className => (
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
