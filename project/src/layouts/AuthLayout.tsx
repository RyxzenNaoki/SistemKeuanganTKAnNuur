import { Outlet, Link, useLocation } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

const AuthLayout = () => {
  const location = useLocation();
  const isOnRegister = location.pathname === '/register';

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-100 to-primary-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-primary-600 p-3 rounded-full shadow-md">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sistem Keuangan TK An Nuur Rumah Cahaya
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <Outlet />

          {/* 👇 Tombol Daftar hanya muncul kalau belum di halaman /register */}
          {!isOnRegister && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Belum punya akun?{' '}
                <Link
                  to="/register"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Daftar di sini
                </Link>
              </p>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          © {new Date().getFullYear()} TK An Nuur Rumah Cahaya. Semua hak dilindungi.
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
