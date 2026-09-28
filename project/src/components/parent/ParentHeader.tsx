import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ParentHeaderProps {
  onMenuButtonClick: () => void;
}

const ParentHeader = ({ onMenuButtonClick }: ParentHeaderProps) => {
  const { currentUser, signOut } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white border-b border-slate-100 lg:static">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex justify-between h-16">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={onMenuButtonClick}
              className="lg:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-400"
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
            
            {/* Page title - desktop only */}
            <div className="hidden lg:flex lg:items-center">
              <h1 className="text-2xl font-semibold text-slate-900">
                Portal Orang Tua
              </h1>
            </div>
          </div>

          <div className="flex items-center">
            {/* Notifications dropdown */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400"
              >
                <span className="sr-only">View notifications</span>
                <Bell className="h-6 w-6" />
              </button>
              
              {notificationsOpen && (
                <div className="dropdown-menu">
                  <div className="py-2 px-4 border-b border-slate-100">
                    <h3 className="text-sm font-medium">Notifikasi</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {/* Sample notifications */}
                    <div className="px-4 py-3 hover:bg-slate-50 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-900">Pembayaran diterima</p>
                      <p className="text-xs text-slate-500 mt-1">SPP Mei 2025 telah dikonfirmasi</p>
                    </div>
                    <div className="px-4 py-3 hover:bg-slate-50 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-900">Pengingat Pembayaran</p>
                      <p className="text-xs text-slate-500 mt-1">SPP Juni 2025 jatuh tempo dalam 5 hari</p>
                    </div>
                    <div className="px-4 py-3 hover:bg-slate-50">
                      <p className="text-sm font-medium text-slate-900">Informasi Kegiatan</p>
                      <p className="text-xs text-slate-500 mt-1">Pembayaran Uang Kegiatan tanggal 15/06</p>
                    </div>
                  </div>
                  <div className="py-2 px-4 border-t border-slate-100 text-center">
                    <Link to="#" className="text-xs font-medium text-primary-600 hover:text-primary-500">
                      Lihat semua notifikasi
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User dropdown */}
            <div className="relative ml-4" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-secondary-400 to-accent-400 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {currentUser?.email?.[0].toUpperCase() || 'P'}
                  </span>
                </div>
                <span className="hidden md:block text-sm font-medium text-slate-600">
                  {currentUser?.email?.split('@')[0] || 'Orang Tua'}
                </span>
              </button>
              
              {userMenuOpen && (
                <div className="dropdown-menu">
                  <Link
                    to="#"
                    className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-xl mx-1.5"
                  >
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      <span>Profil</span>
                    </div>
                  </Link>
                  <Link
                    to="#"
                    className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-xl mx-1.5"
                  >
                    <div className="flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      <span>Pengaturan</span>
                    </div>
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-xl mx-1.5"
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

export default ParentHeader;