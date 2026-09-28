import { Outlet, Link, useLocation } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { APP_NAME, APP_FULL_NAME, APP_DESCRIPTION, APP_COPYRIGHT } from '../config/branding';

const AuthLayout = () => {
  const location = useLocation();
  const isOnRegister = location.pathname === '/register';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-gradient-to-br from-primary-400 to-secondary-400 p-3.5 rounded-2xl shadow-soft-lg">
            <GraduationCap className="h-9 w-9 text-white" />
          </div>
        </div>
        <h1 className="mt-5 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          {APP_NAME}
        </h1>
        <p className="mt-1.5 text-center text-sm text-slate-500">{APP_FULL_NAME}</p>
        <p className="text-center text-xs text-slate-400">{APP_DESCRIPTION}</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-soft-lg rounded-2xl border border-slate-100 sm:px-10">
          <Outlet />

          {/* 👇 Tombol Daftar hanya muncul kalau belum di halaman /register */}
          {!isOnRegister && (
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                Belum punya akun?{' '}
                <Link
                  to="/register"
                  className="font-medium text-primary-600 hover:text-primary-700"
                >
                  Daftar di sini
                </Link>
              </p>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">{APP_COPYRIGHT}</p>
      </div>
    </div>
  );
};

export default AuthLayout;
