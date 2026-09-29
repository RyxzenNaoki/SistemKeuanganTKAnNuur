// Sumber tunggal definisi role SINAU: Admin, Guru, Orang Tua.

export type UserRole = 'admin' | 'guru' | 'parent';

export const USER_ROLES: UserRole[] = ['admin', 'guru', 'parent'];

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Admin',
  guru: 'Guru',
  parent: 'Orang Tua',
};

// Halaman utama tiap role (dipakai untuk redirect setelah login & saat salah akses)
export const ROLE_HOME: Record<UserRole, string> = {
  admin: '/admin',
  guru: '/guru',
  parent: '/parent',
};

// Role yang boleh mendaftar sendiri lewat halaman Daftar Akun.
// Admin sengaja tidak ada: akun admin dibuat manual lewat Firebase.
export const SELF_REGISTER_ROLES: Exclude<UserRole, 'admin'>[] = ['parent', 'guru'];

export const isUserRole = (value: unknown): value is UserRole =>
  typeof value === 'string' && (USER_ROLES as string[]).includes(value);

// Status akun. Akun lama tanpa field "status" dianggap 'active'.
export type AccountStatus = 'pending' | 'active' | 'rejected';

export const STATUS_LABEL: Record<AccountStatus, string> = {
  pending: 'Menunggu Persetujuan',
  active: 'Aktif',
  rejected: 'Ditolak',
};

export const toAccountStatus = (value: unknown): AccountStatus =>
  value === 'pending' || value === 'rejected' ? value : 'active';

// Role yang harus disetujui admin dulu setelah mendaftar sendiri
export const ROLES_REQUIRING_APPROVAL: UserRole[] = ['guru'];

export const initialStatusFor = (role: UserRole): AccountStatus =>
  ROLES_REQUIRING_APPROVAL.includes(role) ? 'pending' : 'active';
