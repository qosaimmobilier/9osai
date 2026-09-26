import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, LogIn, AlertCircle, Mail, ArrowRight, KeyRound, Copy, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/recover-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ email: resetEmail }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setResetError(data.error || 'حدث خطأ، حاول مرة أخرى');
      } else {
        setNewPassword(data.password);
        setResetSent(true);
      }
    } catch {
      setResetError('تعذر الاتصال بالخادم، حاول مرة أخرى');
    }
    setResetLoading(false);
  };

  const copyPassword = () => {
    if (newPassword) {
      navigator.clipboard.writeText(newPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError);
      setLoading(false);
    } else {
      // Fetch profile to determine role-based redirect
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        if (profile?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        navigate('/');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">قصي للعقار</h1>
          <p className="text-gray-500 mt-1">قصر البخاري</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <LogIn className="w-5 h-5 text-primary-600" />
            تسجيل الدخول
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm animate-fade-in">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                placeholder="example@email.com"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                placeholder="••••••••"
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'جاري الدخول...' : 'دخول'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            <button
              onClick={() => setShowReset(true)}
              className="text-gray-500 hover:text-primary-600 transition-colors"
            >
              نسيت كلمة المرور؟
            </button>
            <p className="mt-3">ليس لديك حساب؟</p>
            <Link to="/signup" className="text-primary-600 hover:text-primary-700 font-medium mt-1 inline-block">
              إنشاء حساب جديد
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          الزوار يمكنهم تصفح العقارات بدون تسجيل دخول
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in">
            {resetSent ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-7 h-7 text-emerald-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">تم توليد كلمة مرور جديدة</h2>
                <p className="text-sm text-gray-500 mb-4">
                  تم إرسال كلمة المرور الجديدة إلى بريدك الإلكتروني {resetEmail}
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 flex items-center justify-between gap-2">
                  <code className="text-sm font-mono text-gray-800" dir="ltr">{newPassword}</code>
                  <button
                    onClick={copyPassword}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
                    title="نسخ"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
                  </button>
                </div>
                <p className="text-xs text-amber-600 mb-4 bg-amber-50 p-2 rounded-lg">
                  ننصحك بتغيير كلمة المرور بعد تسجيل الدخول من صفحة الملف الشخصي.
                </p>
                <button
                  onClick={() => { setShowReset(false); setResetSent(false); setResetEmail(''); setNewPassword(null); }}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition-colors"
                >
                  العودة لتسجيل الدخول
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">استرجاع كلمة المرور</h2>
                  <button onClick={() => setShowReset(false)} className="p-1 rounded-lg hover:bg-gray-100">
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  أدخل بريدك الإلكتروني وسنرسل لك كلمة مرور جديدة.
                </p>
                {resetError && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                      placeholder="example@email.com"
                      dir="ltr"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {resetLoading ? 'جاري الإرسال...' : 'إرسال كلمة المرور'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
