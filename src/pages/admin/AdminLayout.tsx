import { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Building2, LayoutDashboard, Home, Users, FileText, Settings,
  LogOut, Menu, X, ClipboardList, CheckSquare, Square, Bell,
  TrendingUp, KeyRound, RefreshCw, MapPin, Shield, UserCog, Globe,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function AdminLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navSections = [
    {
      label: 'الرئيسية',
      items: [
        { path: '/admin', label: 'لوحة التحكم', icon: LayoutDashboard },
      ],
    },
    {
      label: 'العقارات',
      items: [
        { path: '/admin/properties', label: 'كل العقارات', icon: Home },
        { path: '/admin/properties?status=in_review', label: 'قيد المراجعة', icon: Bell },
        { path: '/admin/properties?status=published', label: 'منشورة', icon: CheckSquare },
        { path: '/admin/properties?status=rejected', label: 'مرفوضة', icon: Square },
        { path: '/admin/properties?status=sold', label: 'مباعة', icon: TrendingUp },
        { path: '/admin/properties?status=rented', label: 'مكراة', icon: KeyRound },
        { path: '/admin/properties?status=exchanged', label: 'تبديل', icon: RefreshCw },
      ],
    },
    {
      label: 'الإدارة',
      items: [
        { path: '/admin/exhibitors', label: 'العارضون', icon: Users },
        { path: '/admin/document-review', label: 'مراجعة الوثائق', icon: FileText },
        { path: '/admin/property-types', label: 'أنواع العقارات', icon: Building2 },
        { path: '/admin/document-types', label: 'أنواع السندات', icon: FileText },
        { path: '/admin/areas', label: 'المناطق', icon: MapPin },
        { path: '/admin/settings', label: 'إعدادات المنصة', icon: Settings },
        { path: '/admin/audit-log', label: 'سجل العمليات', icon: ClipboardList },
        { path: '/admin/account', label: 'إعدادات الحساب', icon: UserCog },
      ],
    },
  ];

  const isActive = (path: string) => {
    const basePath = path.split('?')[0];
    if (basePath === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(basePath);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-gray-900 fixed h-screen overflow-y-auto">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">قصي للعقار</h2>
              <p className="text-xs text-gray-400">لوحة الإدارة</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-4">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="px-3 mb-1 text-xs font-bold text-gray-500 uppercase">{section.label}</p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive(item.path)
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            <Globe className="w-4 h-4" />
            تصفح الموقع
          </Link>
          <div className="flex items-center gap-2 px-2">
            <Shield className="w-5 h-5 text-primary-400" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile?.full_name || profile?.email}</p>
              <p className="text-xs text-gray-400">مدير المنصة</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors w-full text-sm"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-gray-900 h-full flex flex-col overflow-y-auto animate-slide-up">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">قصي للعقار</h2>
                  <p className="text-xs text-gray-400">لوحة الإدارة</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-gray-800">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-4">
              {navSections.map((section) => (
                <div key={section.label}>
                  <p className="px-3 mb-1 text-xs font-bold text-gray-500 uppercase">{section.label}</p>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isActive(item.path) ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
            <div className="p-4 border-t border-gray-800 space-y-2">
              <Link
                to="/"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors text-sm font-medium"
              >
                <Globe className="w-4 h-4" />
                تصفح الموقع
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors w-full text-sm"
              >
                <LogOut className="w-4 h-4" />
                تسجيل الخروج
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:mr-64">
        {/* Mobile header */}
        <header className="lg:hidden bg-gray-900 border-b border-gray-800 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white text-sm">لوحة الإدارة</span>
            </div>
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-800">
              <Menu className="w-6 h-6 text-gray-300" />
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
