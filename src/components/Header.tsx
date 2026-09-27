import { Link, useNavigate } from 'react-router-dom';
import { Home, LogIn, LogOut, PlusCircle, LayoutDashboard, Menu, X, Building2 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';

export function Header() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">قصي للعقار</h1>
              <p className="text-xs text-gray-500 leading-tight">قصر البخاري</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-700 hover:text-primary-600 font-medium transition-colors flex items-center gap-1">
              <Home className="w-4 h-4" />
              الرئيسية
            </Link>
            <Link to="/properties" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
              العقارات
            </Link>
            <Link to="/properties?operation=sale" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
              للبيع
            </Link>
            <Link to="/properties?operation=rent" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
              للكراء
            </Link>
            <Link to="/properties?operation=exchange" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
              للتبديل
            </Link>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            {profile ? (
              <>
                <Link
                  to={profile.role === 'admin' ? '/admin' : '/dashboard'}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {profile.role === 'admin' ? 'لوحة الإدارة' : 'لوحتي'}
                </Link>
                {profile.role === 'exhibitor' && (
                  <Link
                    to="/dashboard/add-property"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    إضافة عقار
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  خروج
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors"
              >
                <LogIn className="w-4 h-4" />
                تسجيل الدخول
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white animate-fade-in">
          <div className="px-4 py-3 space-y-2">
            <Link to="/" onClick={() => setMenuOpen(false)} className="block py-2 text-gray-700 font-medium hover:text-primary-600">الرئيسية</Link>
            <Link to="/properties" onClick={() => setMenuOpen(false)} className="block py-2 text-gray-700 font-medium hover:text-primary-600">العقارات</Link>
            <Link to="/properties?operation=sale" onClick={() => setMenuOpen(false)} className="block py-2 text-gray-700 font-medium hover:text-primary-600">للبيع</Link>
            <Link to="/properties?operation=rent" onClick={() => setMenuOpen(false)} className="block py-2 text-gray-700 font-medium hover:text-primary-600">للكراء</Link>
            <Link to="/properties?operation=exchange" onClick={() => setMenuOpen(false)} className="block py-2 text-gray-700 font-medium hover:text-primary-600">للتبديل</Link>
            {profile ? (
              <>
                <Link to={profile.role === 'admin' ? '/admin' : '/dashboard'} onClick={() => setMenuOpen(false)} className="block py-2 text-primary-600 font-medium">لوحة التحكم</Link>
                {profile.role === 'exhibitor' && (
                  <Link to="/dashboard/add-property" onClick={() => setMenuOpen(false)} className="block py-2 text-primary-600 font-medium">إضافة عقار</Link>
                )}
                <button onClick={() => { handleSignOut(); setMenuOpen(false); }} className="block py-2 text-red-600 font-medium w-full text-right">تسجيل الخروج</button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block py-2 text-primary-600 font-medium">تسجيل الدخول</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
