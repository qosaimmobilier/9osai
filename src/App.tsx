import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { trackVisit } from '@/lib/visits';
import { AuthProvider, useAuth } from '@/lib/auth';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Public pages
import { HomePage } from '@/pages/HomePage';
import { PropertiesPage } from '@/pages/PropertiesPage';
import { PropertyDetailPage } from '@/pages/PropertyDetailPage';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';

// Exhibitor pages
import { ExhibitorLayout } from '@/pages/exhibitor/ExhibitorLayout';
import { ExhibitorDashboard } from '@/pages/exhibitor/ExhibitorDashboard';
import { PropertyForm } from '@/pages/exhibitor/PropertyForm';
import { MyProperties } from '@/pages/exhibitor/MyProperties';
import { ExhibitorProfile } from '@/pages/exhibitor/ExhibitorProfile';

// Admin pages
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminProperties } from '@/pages/admin/AdminProperties';
import { AdminPropertyDetail } from '@/pages/admin/AdminPropertyDetail';
import { AdminExhibitors } from '@/pages/admin/AdminExhibitors';
import { AdminDocumentReview } from '@/pages/admin/AdminDocumentReview';
import { AdminPropertyTypes, AdminDocumentTypes, AdminAreas } from '@/pages/admin/AdminManagers';
import { AdminSettings } from '@/pages/admin/AdminSettings';
import { AdminAuditLog } from '@/pages/admin/AdminAuditLog';
import { AdminAccount } from '@/pages/admin/AdminAccount';
import type { ReactNode } from 'react';

function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function ExhibitorRoute({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">جاري التحميل...</div>;
  if (!profile) return <Navigate to="/login" replace />;
  if (profile.role === 'admin') return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">جاري التحميل...</div>;
  if (!profile) return <Navigate to="/login" replace />;
  if (profile.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const location = useLocation();
  useEffect(() => {
    trackVisit(location.pathname);
  }, [location.pathname]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
      <Route path="/properties" element={<PublicLayout><PropertiesPage /></PublicLayout>} />
      <Route path="/properties/:id" element={<PublicLayout><PropertyDetailPage /></PublicLayout>} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Exhibitor routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <ExhibitorRoute>
              <ExhibitorLayout />
            </ExhibitorRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<ExhibitorDashboard />} />
        <Route path="add-property" element={<PropertyForm />} />
        <Route path="edit-property/:id" element={<PropertyForm />} />
        <Route path="my-properties" element={<MyProperties />} />
        <Route path="profile" element={<ExhibitorProfile />} />
      </Route>

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="properties" element={<AdminProperties />} />
        <Route path="property/:id" element={<AdminPropertyDetail />} />
        <Route path="exhibitors" element={<AdminExhibitors />} />
        <Route path="document-review" element={<AdminDocumentReview />} />
        <Route path="property-types" element={<AdminPropertyTypes />} />
        <Route path="document-types" element={<AdminDocumentTypes />} />
        <Route path="areas" element={<AdminAreas />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="audit-log" element={<AdminAuditLog />} />
        <Route path="account" element={<AdminAccount />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
