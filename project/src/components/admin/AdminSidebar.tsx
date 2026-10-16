import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  X,
  Home,
  Users,
  School,
  UserCog,
  BookOpenText,
  Calendar,
  TrendingUp,
  TrendingDown,
  FileText,
  GraduationCap,
  CalendarRange,
  FolderOpen,
  ReceiptText,
  Bell,
  Wallet,
  ChevronDown,
  Database,
} from 'lucide-react';
import { APP_NAME, SCHOOL_NAME } from '../../config/branding';

interface AdminSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
}

interface NavGroup {
  key: string;
  label: string;
  icon: typeof Home;
  items: NavItem[];
}

// Menu dikelompokkan jadi dropdown supaya sidebar tidak terlalu panjang.
// Tambah menu baru cukup menambah satu baris di sini.
const NAV_GROUPS: NavGroup[] = [
  {
    key: 'data',
    label: 'Manajemen Data',
    icon: Database,
    items: [
      { to: '/admin/students', label: 'Data Siswa', icon: Users },
      { to: '/admin/classes', label: 'Data Kelas', icon: School },
      { to: '/admin/users', label: 'Data Pengguna', icon: UserCog },
    ],
  },
  {
    key: 'akademik',
    label: 'Akademik',
    icon: BookOpenText,
    items: [
      { to: '/admin/themes', label: 'Tema Pembelajaran', icon: BookOpenText },
      { to: '/admin/weekly-plans', label: 'Modul Ajar Mingguan', icon: CalendarRange },
      { to: '/admin/teaching-docs', label: 'Prosem & Dokumen Guru', icon: FolderOpen },
    ],
  },
  {
    key: 'keuangan',
    label: 'Manajemen Keuangan',
    icon: Wallet,
    items: [
      { to: '/admin/income', label: 'Pemasukan', icon: TrendingUp },
      { to: '/admin/expenses', label: 'Pengeluaran', icon: TrendingDown },
      { to: '/admin/reports', label: 'Laporan Keuangan', icon: FileText },
      { to: '/admin/schedule', label: 'Jadwal Pembayaran', icon: Calendar },
      { to: '/admin/payment-proofs', label: 'Verifikasi Pembayaran', icon: ReceiptText },
      { to: '/admin/notifications', label: 'Pemberitahuan', icon: Bell },
    ],
  },
];

const AdminSidebar = ({ isOpen, setIsOpen }: AdminSidebarProps) => {
  const { pathname } = useLocation();

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);
  const groupHasActive = (group: NavGroup) => group.items.some(item => isActive(item.to));

  // Grup yang memuat halaman aktif otomatis terbuka
  const [openGroups, setOpenGroups] = useState<string[]>(() =>
    NAV_GROUPS.filter(groupHasActive).map(g => g.key)
  );

  useEffect(() => {
    const active = NAV_GROUPS.find(groupHasActive);
    if (active) setOpenGroups(prev => (prev.includes(active.key) ? prev : [...prev, active.key]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const toggleGroup = (key: string) =>
    setOpenGroups(prev => (prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]));

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
        <div className="overflow-y-auto h-full pb-20">
          <nav className="mt-4 px-2 space-y-1">
            {/* Beranda: pencocokan persis supaya tidak aktif di semua halaman admin */}
            <Link
              to="/admin"
              onClick={() => setIsOpen(false)}
              className={`sidebar-menu-item ${pathname === '/admin' ? 'active' : ''}`}
            >
              <Home className="h-5 w-5" />
              <span>Beranda</span>
            </Link>

            {NAV_GROUPS.map(group => {
              const open = openGroups.includes(group.key);
              const hasActive = groupHasActive(group);
              return (
                <div key={group.key}>
                  <button
                    onClick={() => toggleGroup(group.key)}
                    aria-expanded={open}
                    className={`sidebar-menu-item w-full justify-between ${
                      hasActive && !open ? 'active' : hasActive ? '!text-primary-700' : ''
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <group.icon className="h-5 w-5" />
                      <span>{group.label}</span>
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>

                  {open && (
                    <div className="mt-1 ml-4 pl-3 border-l border-slate-100 space-y-0.5">
                      {group.items.map(item => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setIsOpen(false)}
                          className={`sidebar-menu-item text-[13px] py-2 ${isActive(item.to) ? 'active' : ''}`}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
