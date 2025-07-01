import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';

interface User {
    id?: string;
    name: string;
    email: string;
    role: 'admin' | 'bendahara' | 'guru' | 'parent';
    password?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    userData?: User | null;
    loading?: boolean;
}

const UserModal = ({ isOpen, onClose, onSave, userData, loading = false }: UserModalProps) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'parent' as 'admin' | 'bendahara' | 'guru' | 'parent',
        password: '',
        confirmPassword: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (userData) {
            setFormData({
                name: userData.name,
                email: userData.email,
                role: userData.role,
                password: '',
                confirmPassword: '',
            });
        } else {
            setFormData({
                name: '',
                email: '',
                role: 'parent',
                password: '',
                confirmPassword: '',
            });
        }
        setErrors({});
    }, [userData, isOpen]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = 'Nama wajib diisi';
        if (!formData.email.trim()) newErrors.email = 'Email wajib diisi';

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) {
            newErrors.email = 'Format email tidak valid';
        }

        // Password validation for new users
        if (!userData) {
            if (!formData.password) newErrors.password = 'Password wajib diisi';
            if (formData.password && formData.password.length < 6) {
                newErrors.password = 'Password minimal 6 karakter';
            }
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Konfirmasi password tidak cocok';
            }
        }

        // Password validation for existing users (only if password is provided)
        if (userData && formData.password) {
            if (formData.password.length < 6) {
                newErrors.password = 'Password minimal 6 karakter';
            }
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Konfirmasi password tidak cocok';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            const submitData = {
                name: formData.name,
                email: formData.email,
                role: formData.role,
                ...(formData.password ? { password: formData.password } : {})
            };

            await onSave(submitData);
            onClose();
        } catch (error: unknown) {
            if (
                error instanceof Error &&
                'code' in error
            ) {
                const firebaseError = error as { code: string; message: string };
                console.error(`Firebase error [${firebaseError.code}]: ${firebaseError.message}`);
            } else if (error instanceof Error) {
                console.error('Error saving user:', error.message);
            } else {
                console.error('Unknown error saving user:', error);
            }
        }

    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const getRoleLabel = (role: string) => {
        const roles = {
            admin: 'Administrator',
            bendahara: 'Bendahara',
            guru: 'Guru',
            parent: 'Orang Tua',
        };
        return roles[role as keyof typeof roles] || role;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">
                                {userData ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nama Lengkap *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={`input ${errors.name ? 'border-error-500' : ''}`}
                                    placeholder="Masukkan nama lengkap"
                                />
                                {errors.name && <p className="text-error-600 text-xs mt-1">{errors.name}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={`input ${errors.email ? 'border-error-500' : ''}`}
                                    placeholder="email@example.com"
                                />
                                {errors.email && <p className="text-error-600 text-xs mt-1">{errors.email}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Role */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Peran *
                                    </label>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleInputChange}
                                        className="input"
                                    >
                                        <option value="parent">Orang Tua</option>
                                        <option value="guru">Guru</option>
                                        <option value="bendahara">Bendahara</option>
                                        <option value="admin">Administrator</option>
                                    </select>
                                </div>
                            </div>

                            {/* Password Section */}
                            <div className="border-t border-gray-200 pt-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-3">
                                    {userData ? 'Ubah Password (Opsional)' : 'Password *'}
                                </h4>

                                {/* Password */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Password {!userData && '*'}
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className={`input ${errors.password ? 'border-error-500' : ''}`}
                                        placeholder={userData ? 'Kosongkan jika tidak ingin mengubah' : 'Minimal 6 karakter'}
                                    />
                                    {errors.password && <p className="text-error-600 text-xs mt-1">{errors.password}</p>}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Konfirmasi Password {!userData && '*'}
                                    </label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        className={`input ${errors.confirmPassword ? 'border-error-500' : ''}`}
                                        placeholder="Ulangi password"
                                    />
                                    {errors.confirmPassword && <p className="text-error-600 text-xs mt-1">{errors.confirmPassword}</p>}
                                </div>
                            </div>

                            {/* Role Description */}
                            <div className="bg-gray-50 rounded-lg p-3">
                                <h5 className="text-sm font-medium text-gray-900 mb-1">
                                    Hak Akses: {getRoleLabel(formData.role)}
                                </h5>
                                <p className="text-xs text-gray-600">
                                    {formData.role === 'admin' && 'Akses penuh ke semua fitur sistem'}
                                    {formData.role === 'bendahara' && 'Akses ke manajemen keuangan dan laporan'}
                                    {formData.role === 'guru' && 'Akses ke data siswa dan kelas'}
                                    {formData.role === 'parent' && 'Akses ke portal orang tua dan pembayaran'}
                                </p>
                            </div>

                            {/* Form Actions */}
                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="btn btn-secondary"
                                    disabled={loading}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary flex items-center"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <Save className="h-4 w-4 mr-2" />
                                    )}
                                    {userData ? 'Update' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserModal;