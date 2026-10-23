import { Loader2 } from 'lucide-react';

interface GoogleButtonProps {
  label: string;
  onClick: () => void;
  loading?: boolean;
}

// Tombol resmi-ish "G" Google (SVG inline, tanpa file gambar tambahan)
const GoogleButton = ({ label, onClick, loading = false }: GoogleButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    className="w-full btn btn-secondary flex items-center justify-center gap-3"
  >
    {loading ? (
      <Loader2 className="h-5 w-5 animate-spin" />
    ) : (
      <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
        <path fill="#FBBC05" d="M10.5 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.7l7.9-6.1z" />
        <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
      </svg>
    )}
    <span>{label}</span>
  </button>
);

// Pesan error yang ramah untuk kegagalan login/daftar Google
export const googleAuthErrorMessage = (error: unknown): string | null => {
  const code = (error as { code?: string })?.code;
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return null; // pengguna menutup jendela: tidak perlu pesan
    case 'auth/popup-blocked':
      return 'Jendela login Google diblokir browser. Izinkan pop-up untuk situs ini lalu coba lagi.';
    case 'auth/unauthorized-domain':
      return 'Domain situs ini belum didaftarkan di Firebase (Authentication > Settings > Authorized domains).';
    case 'auth/operation-not-allowed':
      return 'Login Google belum diaktifkan di Firebase (Authentication > Sign-in method).';
    case 'auth/account-exists-with-different-credential':
      return 'Email ini sudah terdaftar dengan cara masuk lain. Masuk dengan email dan password.';
    case 'auth/network-request-failed':
      return 'Koneksi internet bermasalah. Coba lagi.';
    default:
      return 'Login dengan Google gagal. Coba lagi.';
  }
};

export default GoogleButton;
