import { Link, useLocation } from 'react-router-dom';
import { 
  X, 
  Home, 
  Users, 
  School, 
  UserCog, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  FileText,
  GraduationCap
} from 'lucide-react';
import { APP_NAME, SCHOOL_NAME } from '../../config/branding';

interface AdminSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const AdminSidebar = ({ isOpen, setIsOpen }: AdminSidebarProps) => {
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
              to="/admin"
              className={`sidebar-menu-item ${isActive('/admin') ? 'active' : ''}`}
            >
              <Home className="h-5 w-5" />
              <span>Beranda</span>
            </Link>

            {/* Data Management */}
            <div className="mt-6 mb-2 px-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Manajemen Data
              </h3>
            </div>

            <Link
              to="/admin/students"
              className={`sidebar-menu-item ${isActive('/admin/students') ? 'active' : ''}`}
            >
              <Users className="h-5 w-5" />
              <span>Data Siswa</span>
            </Link>

            <Link
              to="/admin/classes"
              className={`sidebar-menu-item ${isActive('/admin/classes') ? 'active' : ''}`}
            >
              <School className="h-5 w-5" />
              <span>Data Kelas</span>
            </Link>

            <Link
              to="/admin/users"
              className={`sidebar-menu-item ${isActive('/admin/users') ? 'active' : ''}`}
            >
              <UserCog className="h-5 w-5" />
              <span>Data Pengguna</span>
            </Link>

            {/* Financial Management */}
            <div className="mt-6 mb-2 px-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Manajemen Keuangan
              </h3>
            </div>

            <Link
              to="/admin/income"
              className={`sidebar-menu-item ${isActive('/admin/income') ? 'active' : ''}`}
            >
              <TrendingUp className="h-5 w-5" />
              <span>Pemasukan</span>
            </Link>

            <Link
              to="/admin/expenses"
              className={`sidebar-menu-item ${isActive('/admin/expenses') ? 'active' : ''}`}
            >
              <TrendingDown className="h-5 w-5" />
              <span>Pengeluaran</span>
            </Link>

            <Link
              to="/admin/reports"
              className={`sidebar-menu-item ${isActive('/admin/reports') ? 'active' : ''}`}
            >
              <FileText className="h-5 w-5" />
              <span>Laporan Keuangan</span>
            </Link>

            <Link
              to="/admin/schedule"
              className={`sidebar-menu-item ${isActive('/admin/schedule') ? 'active' : ''}`}
            >
              <Calendar className="h-5 w-5" />
              <span>Jadwal Pembayaran</span>
            </Link>

             <Link
              to="/admin/notifications"
              className={`sidebar-menu-item ${isActive('/admin/notifications') ? 'active' : ''}`}
            >
              <Calendar className="h-5 w-5" />
              <span>Pemberitahuan</span>
            </Link>
          </nav>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;