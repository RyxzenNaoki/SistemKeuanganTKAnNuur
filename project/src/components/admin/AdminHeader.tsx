import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AdminHeaderProps {
  onMenuButtonClick: () => void;
}

const AdminHeader = ({ onMenuButtonClick }: AdminHeaderProps) => {
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
    <header className="bg-white shadow-sm lg:static">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex justify-between h-16">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={onMenuButtonClick}
              className="lg:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
            
            {/* Page title - desktop only */}
            <div className="hidden lg:flex lg:items-center">
              <h1 className="text-2xl font-semibold text-gray-900">
                Panel Admin
              </h1>
            </div>
          </div>

          <div className="flex items-center">
            {/* Notifications dropdown */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <span className="sr-only">View notifications</span>
                <Bell className="h-6 w-6" />
              </button>
              
              {notificationsOpen && (
                <div className="dropdown-menu">
                  <div className="py-2 px-4 border-b border-gray-100">
                    <h3 className="text-sm font-medium">Notifikasi</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {/* Sample notification */}
                    <div className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">Pembayaran baru diterima</p>
                      <p className="text-xs text-gray-500 mt-1">Budi Santoso - SPP Mei 2025</p>
                    </div>
                    <div className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">Konfirmasi pembayaran</p>
                      <p className="text-xs text-gray-500 mt-1">Siti Rahayu - Uang Kegiatan</p>
                    </div>
                    <div className="px-4 py-3 hover:bg-gray-50">
                      <p className="text-sm font-medium text-gray-900">Pengingat jatuh tempo</p>
                      <p className="text-xs text-gray-500 mt-1">5 siswa belum membayar SPP</p>
                    </div>
                  </div>
                  <div className="py-2 px-4 border-t border-gray-100 text-center">
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
                <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {currentUser?.email?.[0].toUpperCase() || 'A'}
                  </span>
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700">
                  {currentUser?.email?.split('@')[0] || 'Admin'}
                </span>
              </button>
              
              {userMenuOpen && (
                <div className="dropdown-menu">
                  <Link
                    to="#"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      <span>Profil</span>
                    </div>
                  </Link>
                  <Link
                    to="#"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      <span>Pengaturan</span>
                    </div>
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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

export default AdminHeader;