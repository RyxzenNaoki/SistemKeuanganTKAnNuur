import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoadingScreen from './components/common/LoadingScreen';
import ProtectedRoute from './components/common/ProtectedRoute';
import { ROLE_HOME } from './config/roles';

// Layouts
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const ParentLayout = lazy(() => import('./layouts/ParentLayout'));
const GuruLayout = lazy(() => import('./layouts/GuruLayout'));
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
const Payment = lazy(() => import('./pages/parent/Payment'));
const ContactAdmin = lazy(() => import('./pages/parent/ContactAdmin'));
const DigitalReport = lazy(() => import('./pages/parent/DigitalReport'));

// Guru Pages
const GuruDashboard = lazy(() => import('./pages/guru/Dashboard'));
const GuruAttendance = lazy(() => import('./pages/guru/Attendance'));
const GuruAssessment = lazy(() => import('./pages/guru/Assessment'));
const GuruStudents = lazy(() => import('./pages/guru/Students'));
const GuruTeachingDocs = lazy(() => import('./pages/guru/TeachingDocs'));

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
            <ProtectedRoute allow={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
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
            <ProtectedRoute allow={['parent']}>
              <ParentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ParentDashboard />} />
          <Route path="payment" element={<Payment/>} />
          <Route path="report" element={<DigitalReport />} />
          <Route path="report/:tab" element={<DigitalReport />} />
          <Route path="contact" element={<ContactAdmin />} />
        </Route>

        {/* Guru Routes */}
        <Route
          path="/guru/*"
          element={
            <ProtectedRoute allow={['guru']}>
              <GuruLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<GuruDashboard />} />
          <Route path="attendance" element={<GuruAttendance />} />
          <Route path="assessment" element={<GuruAssessment />} />
          <Route path="students" element={<GuruStudents />} />
          <Route path="teaching-docs" element={<GuruTeachingDocs />} />
        </Route>

        {/* Default redirects */}
        <Route
          path="/"
          element={
            currentUser && userRole ? (
              <Navigate to={ROLE_HOME[userRole]} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;