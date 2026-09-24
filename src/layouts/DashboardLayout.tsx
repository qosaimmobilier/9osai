import type { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { LayoutDashboard, Building, Users, Settings, LogOut, Bell, Menu, X, Home, MapPin, Tag, ClipboardList, PlusCircle } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';

const adminNav = [
  { to: '/admin', label: 'لوحة التحكم', icon: LayoutDashboard, exact: true },
  { to: '/admin/properties', label: 'العقارات', icon: Building },
  { to: '/admin/review', label: 'مراجعة العقارات', icon: ClipboardList },
  { to: '/admin/advertisers', label: 'العارضون', icon: Users },
  { to: '/admin/property-types', label: 'أنواع العقارات', icon: Tag },
  { to: '/admin/locations', label: 'المناطق', icon: MapPin },
  { to: '/admin/settings', label: 'الإعدادات', icon: Settings },
];

const advertiserNav = [
  { to: '/dashboard', label: 'الرئيسية', icon: LayoutDashboard, exact: true },
  { to: '/dashboard/properties', label: 'عقاراتي', icon: Building },
  { to: '/dashboard/add-property', label: 'إضافة عقار', icon: PlusCircle },
  { to: '/dashboard/notifications', label: 'الإشعارات', icon: Bell },
];

export function DashboardLayout({ children, role }: { children: ReactNode; role: 'admin' | 'advertiser' }) {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { unreadCount } = useNotifications();

  const nav = role === 'admin' ? adminNav : advertiserNav;
  const basePath = role === 'admin' ? '/admin' : '/dashboard';

  const isActive = (link: { to: string; exact?: boolean }) => {
    if (link.exact) return location.pathname === link.to;
    return location.pathname.startsWith(link.to) && link.to !== basePath;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - desktop */}
      <aside className={`fixed lg:sticky top-0 right-0 h-screen w-64 bg-white border-l border-gray-200 z-50 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      }`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          <Link to={basePath}>
            <Logo size="sm" showSubtitle={false} />
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
          {nav.map((link) => {
            const active = isActive(link);
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <link.icon className="w-5 h-5" />
                <span>{link.label}</span>
                {link.label === 'الإشعارات' && unreadCount > 0 && (
                  <span className="mr-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
                {link.label === 'مراجعة العقارات' && role === 'admin' && (
                  <PendingReviewBadge />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
              {profile?.name?.charAt(0) || '؟'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{profile?.name}</div>
              <div className="text-xs text-gray-500">{role === 'admin' ? 'إدارة' : 'عارض'}</div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 w-full"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100">
            <Menu className="w-5 h-5" />
          </button>
          <Link to={basePath}>
            <Logo size="sm" showSubtitle={false} />
          </Link>
          <Link to={role === 'admin' ? '/admin' : '/dashboard'} className="p-2 rounded-lg hover:bg-gray-100">
            <Home className="w-5 h-5" />
          </Link>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

function PendingReviewBadge() {
  const { pendingCount } = useNotifications();
  if (pendingCount === 0) return null;
  return (
    <span className="mr-auto bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
      {pendingCount}
    </span>
  );
}
