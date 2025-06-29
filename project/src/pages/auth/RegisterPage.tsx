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

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (password !== confirm) {
            showToast('error', 'Password dan konfirmasi tidak sama.');
            setLoading(false);
            return;
        }

        try {
            const userCred = await createUserWithEmailAndPassword(auth, email, password);

            // Simpan user ke Firestore dengan role default 'parent'
            await setDoc(doc(db, 'users', userCred.user.uid), {
                email,
                role: 'parent',
                createdAt: serverTimestamp(),
            });

            showToast('success', 'Registrasi berhasil! Silakan login.');
            navigate('/login');
        } catch (error: unknown) {

            if (error instanceof Error) {
                showToast('error', error.message);
            } else {
                showToast('error', 'Terjadi kesalahan tidak diketahui.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
                Daftar Akun Baru
            </h2>

            <form onSubmit={handleRegister}>
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
