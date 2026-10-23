import { useEffect, useRef, useState } from 'react';
import { Bell, X, Loader2, Smartphone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { PushState, detectPushState, enablePush, syncPushToken, listenForeground } from '../../services/pushService';

const DISMISS_KEY = 'sinau_push_banner_dismissed';

// Mengurus notifikasi push di semua portal:
// - banner ajakan mengaktifkan notifikasi (sekali, bisa ditutup)
// - petunjuk khusus iPhone/iPad (harus dipasang ke Layar Utama)
// - sinkronisasi token perangkat otomatis bila izin sudah diberikan
// - menampilkan notifikasi yang masuk saat aplikasi sedang dibuka (toast)
const PushNotificationManager = () => {
  const { currentUser, userRole } = useAuth();
  const { showToast } = useToast();
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === '1');
  const synced = useRef(false);

  useEffect(() => {
    detectPushState().then(setState).catch(() => setState('unsupported'));
  }, []);

  // Izin sudah ada: pastikan token perangkat ini tercatat untuk akun yang sedang login
  useEffect(() => {
    if (state !== 'granted' || !currentUser || !userRole || synced.current) return;
    synced.current = true;
    syncPushToken({ uid: currentUser.uid, role: userRole }).catch(err => {
      synced.current = false;
      console.warn('Sinkronisasi token notifikasi gagal:', err);
    });
  }, [state, currentUser, userRole]);

  // Notifikasi yang masuk saat aplikasi terbuka
  useEffect(() => {
    if (state !== 'granted') return;
    try {
      return listenForeground(message => {
        if (message.title) showToast('info', `${message.title}${message.body ? ` — ${message.body}` : ''}`);
      });
    } catch {
      return undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  const handleEnable = async () => {
    if (!currentUser || !userRole) return;
    setBusy(true);
    try {
      await enablePush({ uid: currentUser.uid, role: userRole });
      setState('granted');
      showToast('success', 'Notifikasi diaktifkan di perangkat ini');
    } catch (err) {
      console.error(err);
      setState(await detectPushState());
      showToast('error', err instanceof Error ? err.message : 'Gagal mengaktifkan notifikasi');
    } finally {
      setBusy(false);
    }
  };

  if (dismissed || !state) return null;

  if (state === 'ios-install') {
    return (
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-primary-100 bg-primary-50 p-4">
        <Smartphone className="h-5 w-5 mt-0.5 shrink-0 text-primary-600" />
        <p className="flex-1 text-sm text-slate-700">
          <span className="font-semibold">Ingin menerima notifikasi di iPhone/iPad?</span> Ketuk tombol Bagikan di Safari,
          pilih <em>Tambahkan ke Layar Utama</em>, lalu buka SINAU dari ikon di layar utama.
        </p>
        <button onClick={dismiss} className="text-slate-400 hover:text-slate-600" title="Tutup"><X className="h-4 w-4" /></button>
      </div>
    );
  }

  if (state !== 'default') return null;

  return (
    <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-accent-200 bg-gradient-to-r from-accent-50 to-white p-4 shadow-soft">
      <div className="flex items-start gap-3 flex-1">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-200 text-accent-800">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Aktifkan notifikasi</p>
          <p className="text-xs text-slate-500">Terima pengumuman, tagihan, dan pembaruan penting langsung di perangkat ini.</p>
        </div>
      </div>
      <div className="flex gap-2 sm:shrink-0">
        <button onClick={handleEnable} disabled={busy} className="btn btn-primary flex items-center gap-2 text-sm">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />} Aktifkan
        </button>
        <button onClick={dismiss} disabled={busy} className="btn btn-secondary text-sm">Nanti</button>
      </div>
    </div>
  );
};

export default PushNotificationManager;
