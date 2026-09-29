import { useState } from 'react';
import { Clock, XCircle, Loader2, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AccountStatus, ROLE_LABEL } from '../../config/roles';
import { APP_NAME, APP_DESCRIPTION } from '../../config/branding';

interface AccountBlockedProps {
  status: AccountStatus;
}

// Ditampilkan untuk akun yang belum boleh masuk (mis. guru yang belum disetujui admin)
const AccountBlocked = ({ status }: AccountBlockedProps) => {
  const { userRole, refreshProfile, signOut } = useAuth();
  const [checking, setChecking] = useState(false);
  const isRejected = status === 'rejected';
  const roleLabel = userRole ? ROLE_LABEL[userRole] : 'Pengguna';

  const handleRefresh = async () => {
    setChecking(true);
    try {
      await refreshProfile();
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-soft-lg">
        <div
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
            isRejected ? 'bg-error-100 text-error-600' : 'bg-accent-100 text-accent-700'
          }`}
        >
          {isRejected ? <XCircle className="h-7 w-7" /> : <Clock className="h-7 w-7" />}
        </div>

        <h1 className="text-xl font-bold text-slate-900">
          {isRejected ? 'Pendaftaran Belum Disetujui' : 'Menunggu Persetujuan Admin'}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {isRejected
            ? `Pendaftaran akun ${roleLabel} Anda belum disetujui. Silakan hubungi admin sekolah untuk informasi lebih lanjut.`
            : `Akun ${roleLabel} Anda sudah terdaftar. Admin perlu menyetujui akun ini sebelum Anda dapat mengakses ${APP_NAME}.`}
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button onClick={handleRefresh} disabled={checking} className="btn btn-primary flex items-center justify-center gap-2">
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Periksa Status
          </button>
          <button onClick={() => signOut()} className="btn btn-secondary flex items-center justify-center gap-2">
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>

        <p className="mt-6 text-xs text-slate-400">{APP_DESCRIPTION}</p>
      </div>
    </div>
  );
};

export default AccountBlocked;
