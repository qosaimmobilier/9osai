import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, Home, Building, Search, MapPin, Phone, Info, LogIn, PlusCircle, LayoutDashboard, LogOut } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';

export function PublicHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const navLinks = [
    { to: '/', label: 'الرئيسية', icon: Home },
    { to: '/properties', label: 'العقارات', icon: Building },
    { to: '/properties?operation=sale', label: 'بيع', icon: Building },
    { to: '/properties?operation=rent', label: 'كراء', icon: Building },
    { to: '/properties?operation=exchange', label: 'تبديل', icon: Building },
    { to: '/about', label: 'من نحن', icon: Info },
    { to: '/contact', label: 'اتصل بنا', icon: Phone },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="shrink-0">
            <Logo size="md" />
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-primary-600 font-medium text-sm transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            {session && profile ? (
              <>
                <Link
                  to={profile.role === 'admin' ? '/admin' : '/dashboard'}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  لوحة التحكم
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  خروج
                </button>
              </>
            ) : (
              <Link to="/login" className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors">
                <LogIn className="w-4 h-4" />
                دخول العارض
              </Link>
            )}
            <Link to="/register" className="btn-primary flex items-center gap-2 text-sm">
              <PlusCircle className="w-4 h-4" />
              أضف عقارك
            </Link>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
          <nav className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm"
              >
                <link.icon className="w-5 h-5 text-gray-400" />
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              {session && profile ? (
                <>
                  <Link
                    to={profile.role === 'admin' ? '/admin' : '/dashboard'}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm"
                  >
                    <LayoutDashboard className="w-5 h-5 text-gray-400" />
                    لوحة التحكم
                  </Link>
                  <button
                    onClick={() => { handleSignOut(); setMenuOpen(false); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm w-full text-right"
                  >
                    <LogOut className="w-5 h-5 text-gray-400" />
                    خروج
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm"
                >
                  <LogIn className="w-5 h-5 text-gray-400" />
                  دخول العارض
                </Link>
              )}
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="btn-primary flex items-center justify-center gap-2 w-full"
              >
                <PlusCircle className="w-5 h-5" />
                أضف عقارك
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
