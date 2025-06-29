import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';

const ForgotPasswordPage = () => {
  const { resetPassword } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await resetPassword(email);
      setEmailSent(true);
      showToast('success', 'Email reset password telah dikirim!');
    } catch (error) {
      console.error('Reset password error:', error);
      showToast('error', 'Gagal mengirim email reset password. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">
        Reset Password
      </h2>
      
      {!emailSent ? (
        <>
          <p className="text-center text-gray-600 mb-6">
            Masukkan alamat email Anda untuk menerima link reset password.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="nama@email.com"
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
                  <Send className="h-5 w-5 mr-2" />
                  <span>Kirim Link Reset</span>
                </>
              )}
            </button>
          </form>
        </>
      ) : (
        <div className="text-center py-4">
          <div className="rounded-full bg-success-100 p-3 inline-flex items-center justify-center mb-4">
            <Send className="h-6 w-6 text-success-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Email Terkirim</h3>
          <p className="text-gray-600 mb-4">
            Kami telah mengirimkan email reset password ke {email}. Silakan periksa inbox Anda dan ikuti petunjuk untuk reset password.
          </p>
          <p className="text-sm text-gray-500">
            Tidak menerima email? Periksa folder spam atau junk Anda.
          </p>
        </div>
      )}

      <div className="mt-6 text-center">
        <Link
          to="/login"
          className="flex items-center justify-center text-sm font-medium text-primary-600 hover:text-primary-500"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>Kembali ke halaman login</span>
        </Link>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;