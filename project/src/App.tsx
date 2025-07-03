import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoadingScreen from './components/common/LoadingScreen';

// Layouts
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const ParentLayout = lazy(() => import('./layouts/ParentLayout'));
const AuthLayout = lazy(() => import('./layouts/AuthLayout'));

// Auth Pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));


// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const StudentManagement = lazy(() => import('./pages/admin/students/StudentManagement'));
const ClassManagement = lazy(() => import('./pages/admin/classes/ClassManagement'));
const UserManagement = lazy(() => import('./pages/admin/users/UserManagement'));
const PaymentSchedule = lazy(() => import('./pages/admin/payments/PaymentSchedule'));
const IncomeManagement = lazy(() => import('./pages/admin/finance/IncomeManagement'));
const ExpenseManagement = lazy(() => import('./pages/admin/finance/ExpenseManagement'));
const FinancialReports = lazy(() => import('./pages/admin/finance/FinancialReports'));
const NotificationManagement = lazy(() => import('./pages/admin/notifications/NotificationManagement'));

// Parent Pages
const ParentDashboard = lazy(() => import('./pages/parent/Dashboard'));
const PaymentHistory = lazy(() => import('./pages/parent/PaymentHistory'));
const MakePayment = lazy(() => import('./pages/parent/MakePayment'));
const UploadPaymentProof = lazy(() => import('./pages/parent/UploadPaymentProof'));
const ContactAdmin = lazy(() => import('./pages/parent/ContactAdmin'));

function App() {
  const { currentUser, userRole, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo(0, 0);
  }, [location.pathname]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            currentUser && (userRole === 'admin' || userRole === 'bendahara') ? (
              <AdminLayout />
            ) : (
              <Navigate to="/login\" replace />
            )
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<StudentManagement />} />
          <Route path="classes" element={<ClassManagement />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="schedule" element={<PaymentSchedule />} />
          <Route path="income" element={<IncomeManagement />} />
          <Route path="expenses" element={<ExpenseManagement />} />
          <Route path="reports" element={<FinancialReports />} />
          <Route path="notifications" element={<NotificationManagement />} />
        </Route>

        {/* Parent Routes */}
        <Route
          path="/parent/*"
          element={
            currentUser && userRole === 'parent' ? (
              <ParentLayout />
            ) : (
              <Navigate to="/login\" replace />
            )
          }
        >
          <Route index element={<ParentDashboard />} />
          <Route path="history" element={<PaymentHistory />} />
          <Route path="make-payment" element={<MakePayment />} />
          <Route path="upload" element={<UploadPaymentProof />} />
          <Route path="contact" element={<ContactAdmin />} />
        </Route>

        {/* Default redirects */}
        <Route
          path="/"
          element={
            currentUser ? (
              userRole === 'parent' ? (
                <Navigate to="/parent\" replace />
              ) : (
                <Navigate to="/admin" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/\" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;