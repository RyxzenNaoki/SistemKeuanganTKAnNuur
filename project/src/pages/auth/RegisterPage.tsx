import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { Loader2, UserPlus } from 'lucide-react';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [name, setName] = useState('');    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [role, setRole] = useState('parent');
    const [studentName, setStudentName] = useState('');
    const [studentClass, setStudentClass] = useState('');
    const [loading, setLoading] = useState(false);

    const classes = [
        'TK A',
        'TK B', 
        'Daycare',
    ];

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (password !== confirm) {
            showToast('error', 'Password dan konfirmasi tidak sama.');
            setLoading(false);
            return;
        }

        // Validasi khusus untuk parent
        if (role === 'parent' && (!studentName.trim() || !studentClass.trim())) {
            showToast('error', 'Nama anak dan kelas wajib diisi untuk orang tua.');
            setLoading(false);
            return;
        }

        try {
            const userCred = await createUserWithEmailAndPassword(auth, email, password);

            // Data yang akan disimpan ke Firestore
            const userData: any = {
                email,
                role,
                name: name.trim(),
                createdAt: serverTimestamp(),
            };

            // Tambahkan data student jika role adalah parent
            if (role === 'parent') {
                userData.studentName = studentName.trim();
                userData.studentClass = studentClass;
            }

            await setDoc(doc(db, 'users', userCred.user.uid), userData);

            showToast('success', 'Registrasi berhasil!');
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
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
                Daftar Akun
            </h2>

            <form onSubmit={handleRegister}>
                <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Lengkap
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
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                    </label>
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

                <div className="mb-4">
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                        Peran
                    </label>
                    <select
                        id="role"
                        className="input"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                    >
                        <option value="parent">Orang Tua</option>
                        <option value="guru">Guru</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>

                {/* Fields khusus untuk Parent */}
                {role === 'parent' && (
                    <>
                        <div className="mb-4">
                            <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 mb-1">
                                Nama Anak <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="studentName"
                                type="text"
                                required={role === 'parent'}
                                className="input"
                                value={studentName}
                                onChange={(e) => setStudentName(e.target.value)}
                                placeholder="Masukkan nama lengkap anak"
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="studentClass" className="block text-sm font-medium text-gray-700 mb-1">
                                Kelas Anak <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="studentClass"
                                className="input"
                                value={studentClass}
                                onChange={(e) => setStudentClass(e.target.value)}
                                required={role === 'parent'}
                            >
                                <option value="">Pilih Kelas</option>
                                {classes.map(className => (
                                    <option key={className} value={className}>{className}</option>
                                ))}
                            </select>
                        </div>
                    </>
                )}

                <div className="mb-4">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                    </label>
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
                    <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
                        Konfirmasi Password
                    </label>
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
                <p className="text-sm text-gray-600">
                    Sudah punya akun?{' '}
                    <a href="/login" className="text-primary-600 hover:text-primary-500">
                        Masuk di sini
                    </a>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;