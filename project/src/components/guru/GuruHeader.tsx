import { useEffect, useRef, useState } from 'react';
import { Menu, Bell, LogOut } from 'lucide-react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import dayjs from 'dayjs';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

interface GuruHeaderProps {
  onMenuButtonClick: () => void;
}

interface HeaderNotification {
  id: string;
  title: string;
  message: string;
  createdAt: Date;
}

const GuruHeader = ({ onMenuButtonClick }: GuruHeaderProps) => {
  const { currentUser, signOut } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Notifikasi asli dari koleksi "notifications" (bukan data contoh)
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(5))
        );
        setNotifications(
          snap.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              title: data.title,
              message: data.message,
              createdAt: data.createdAt?.toDate?.() ?? new Date(),
            };
          })
        );
      } catch (error) {
        console.error('Gagal memuat notifikasi:', error);
      }
    };
    load();
  }, []);

  return (
    <header className="bg-white border-b border-slate-100 lg:static">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={onMenuButtonClick}
              className="lg:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-400"
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
            <div className="hidden lg:flex lg:items-center">
              <h1 className="text-2xl font-semibold text-slate-900">Portal Guru</h1>
            </div>
          </div>

          <div className="flex items-center">
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400"
              >
                <span className="sr-only">Lihat notifikasi</span>
                <Bell className="h-6 w-6" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-secondary-400" />
                )}
              </button>

              {notificationsOpen && (
                <div className="dropdown-menu">
                  <div className="py-2 px-4 border-b border-slate-100">
                    <h3 className="text-sm font-medium">Pengumuman</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-6 text-center text-xs text-slate-400">
                        Belum ada pengumuman
                      </p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0">
                          <p className="text-sm font-medium text-slate-900">{n.title}</p>
                          <p className="text-xs text-slate-500 mt-1">{n.message}</p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {dayjs(n.createdAt).format('DD MMM YYYY, HH:mm')}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative ml-4" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-accent-400 to-primary-400 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {currentUser?.email?.[0].toUpperCase() || 'G'}
                  </span>
                </div>
                <span className="hidden md:block text-sm font-medium text-slate-600">
                  {currentUser?.email?.split('@')[0] || 'Guru'}
                </span>
              </button>

              {userMenuOpen && (
                <div className="dropdown-menu">
                  <button
                    onClick={() => signOut()}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg mx-1.5"
                  >
                    <div className="flex items-center">
                      <LogOut className="h-4 w-4 mr-2" />
                      <span>Keluar</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default GuruHeader;
