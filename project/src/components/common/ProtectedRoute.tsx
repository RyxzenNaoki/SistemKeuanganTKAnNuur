import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_HOME, UserRole } from '../../config/roles';
import AccountBlocked from './AccountBlocked';

interface ProtectedRouteProps {
  allow: UserRole[];
  children: ReactNode;
}

// Menjaga halaman per role:
// - belum login / role belum terbaca -> ke /login
// - akun belum aktif (menunggu persetujuan / ditolak) -> layar informasi
// - login tapi role tidak sesuai -> dikembalikan ke halaman role miliknya
const ProtectedRoute = ({ allow, children }: ProtectedRouteProps) => {
  const { currentUser, userRole, userStatus } = useAuth();

  if (!currentUser || !userRole) {
    return <Navigate to="/login" replace />;
  }

  if (userRole !== 'admin' && userStatus !== 'active') {
    return <AccountBlocked status={userStatus} />;
  }

  if (!allow.includes(userRole)) {
    return <Navigate to={ROLE_HOME[userRole]} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
