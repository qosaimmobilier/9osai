import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Public pages
import { HomePage } from '@/pages/public/HomePage';
import { PropertiesPage } from '@/pages/public/PropertiesPage';
import { PropertyDetailsPage } from '@/pages/public/PropertyDetailsPage';
import { FavoritesPage } from '@/pages/public/FavoritesPage';
import { AboutPage } from '@/pages/public/AboutPage';
import { ContactPage } from '@/pages/public/ContactPage';

// Auth pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { BannedPage } from '@/pages/auth/BannedPage';

// Advertiser pages
import { AdvertiserDashboard } from '@/pages/advertiser/AdvertiserDashboard';
import { MyPropertiesPage } from '@/pages/advertiser/MyPropertiesPage';
import { AddPropertyPage } from '@/pages/advertiser/AddPropertyPage';
import { PropertyDetailsDashboardPage } from '@/pages/advertiser/PropertyDetailsDashboardPage';
import { NotificationsPage } from '@/pages/advertiser/NotificationsPage';

// Admin pages
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminPropertiesPage } from '@/pages/admin/AdminPropertiesPage';
import { AdminReviewListPage } from '@/pages/admin/AdminReviewListPage';
import { AdminReviewPage } from '@/pages/admin/AdminReviewPage';
import { AdminAdvertisersPage, AdminAdvertiserDetailsPage } from '@/pages/admin/AdminAdvertisersPage';
import { AdminPropertyTypesPage } from '@/pages/admin/AdminPropertyTypesPage';
import { AdminLocationsPage } from '@/pages/admin/AdminLocationsPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/properties" element={<PropertiesPage />} />
          <Route path="/property/:id" element={<PropertyDetailsPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/banned" element={<BannedPage />} />

          {/* Advertiser routes */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['advertiser']}><AdvertiserDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/properties" element={<ProtectedRoute allowedRoles={['advertiser']}><MyPropertiesPage /></ProtectedRoute>} />
          <Route path="/dashboard/add-property" element={<ProtectedRoute allowedRoles={['advertiser']}><AddPropertyPage /></ProtectedRoute>} />
          <Route path="/dashboard/edit-property/:id" element={<ProtectedRoute allowedRoles={['advertiser']}><AddPropertyPage /></ProtectedRoute>} />
          <Route path="/dashboard/properties/:id" element={<ProtectedRoute allowedRoles={['advertiser']}><PropertyDetailsDashboardPage /></ProtectedRoute>} />
          <Route path="/dashboard/notifications" element={<ProtectedRoute allowedRoles={['advertiser']}><NotificationsPage /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/properties" element={<ProtectedRoute allowedRoles={['admin']}><AdminPropertiesPage /></ProtectedRoute>} />
          <Route path="/admin/review" element={<ProtectedRoute allowedRoles={['admin']}><AdminReviewListPage /></ProtectedRoute>} />
          <Route path="/admin/review/:id" element={<ProtectedRoute allowedRoles={['admin']}><AdminReviewPage /></ProtectedRoute>} />
          <Route path="/admin/advertisers" element={<ProtectedRoute allowedRoles={['admin']}><AdminAdvertisersPage /></ProtectedRoute>} />
          <Route path="/admin/advertisers/:id" element={<ProtectedRoute allowedRoles={['admin']}><AdminAdvertiserDetailsPage /></ProtectedRoute>} />
          <Route path="/admin/property-types" element={<ProtectedRoute allowedRoles={['admin']}><AdminPropertyTypesPage /></ProtectedRoute>} />
          <Route path="/admin/locations" element={<ProtectedRoute allowedRoles={['admin']}><AdminLocationsPage /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettingsPage /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
