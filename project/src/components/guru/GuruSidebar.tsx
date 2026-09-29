import { Link, useLocation } from 'react-router-dom';
import {
  X,
  Home,
  ClipboardCheck,
  ClipboardList,
  Users,
  FolderUp,
  GraduationCap,
} from 'lucide-react';
import { APP_NAME, SCHOOL_NAME } from '../../config/branding';

interface GuruSidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const MENU = [
  { to: '/guru', label: 'Beranda', icon: Home, exact: true },
  { to: '/guru/attendance', label: 'Rekap Absensi', icon: ClipboardCheck },
  { to: '/guru/assessment', label: 'Rekap Asesmen', icon: ClipboardList },
  { to: '/guru/students', label: 'Data Siswa Semester Ini', icon: Users },
  { to: '/guru/teaching-docs', label: 'Upload RPPM & Modul Ajar', icon: FolderUp },
];

const GuruSidebar = ({ isOpen, setIsOpen }: GuruSidebarProps) => {
  const { pathname } = useLocation();

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-600 bg-opacity-75 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 ease-in-out lg:z-30`}
      >
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

        <div className="overflow-y-auto h-full pb-4">
          <nav className="mt-4 px-2 space-y-1">
            {MENU.map(({ to, label, icon: Icon, exact }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setIsOpen(false)}
                className={`sidebar-menu-item ${isActive(to, exact) ? 'active' : ''}`}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};

export default GuruSidebar;
