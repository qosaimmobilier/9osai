import { Link } from 'react-router-dom';
import { ShieldX, Home } from 'lucide-react';
import { Logo } from '@/components/Logo';

export function BannedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">تم حظر حسابك</h1>
        <p className="text-gray-500 mb-8">
          تم حظر حسابك من قبل إدارة المنصة. إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع الإدارة.
        </p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <Home className="w-5 h-5" />
          العودة إلى الرئيسية
        </Link>
      </div>
    </div>
  );
}
