import { Link, useLocation } from 'react-router-dom';
import { 
  X, 
  Home,  
  Upload, 
  MessageSquare,
  GraduationCap
} from 'lucide-react';
import { APP_NAME, SCHOOL_NAME } from '../../config/branding';

interface ParentSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const ParentSidebar = ({ isOpen, setIsOpen }: ParentSidebarProps) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    return currentPath === path || currentPath.startsWith(`${path}/`);
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-600 bg-opacity-75 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 ease-in-out lg:z-30`}
      >
        {/* Sidebar header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="bg-gradient-to-br from-primary-400 to-secondary-400 p-1.5 rounded-xl shadow-soft">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div className="leading-tight">
              <p className="font-bold text-base text-slate-900">{APP_NAME}</p>
              <p className="text-[11px] text-slate-400">{SCHOOL_NAME}</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden text-slate-400 hover:text-slate-600 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar content */}
        <div className="overflow-y-auto h-full pb-4">
          <nav className="mt-4 px-2 space-y-1">
            {/* Dashboard */}
            <Link
              to="/parent"
              className={`sidebar-menu-item ${isActive('/parent') && !isActive('/parent/history') && !isActive('/parent/make-payment') && !isActive('/parent/upload') && !isActive('/parent/contact') ? 'active' : ''}`}
            >
              <Home className="h-5 w-5" />
              <span>Beranda</span>
            </Link>

            {/* Payment Page */}
            <Link
              to="/parent/payment"
              className={`sidebar-menu-item ${isActive('/parent/payment') ? 'active' : ''}`}
            >
              <Upload className="h-5 w-5" />
              <span>Upload Bukti Pembayaran</span>
            </Link>

            {/* Contact Admin */}
            <Link
              to="/parent/contact"
              className={`sidebar-menu-item ${isActive('/parent/contact') ? 'active' : ''}`}
            >
              <MessageSquare className="h-5 w-5" />
              <span>Kontak Admin</span>
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
};

export default ParentSidebar;