import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Phone, Mail, Facebook, MapPin } from 'lucide-react';

export function PublicFooter() {
  const { settings } = useSiteSettings();

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Logo size="md" showSubtitle={true} className="mb-4 [&_*]:text-white" />
            <p className="text-sm text-gray-400 leading-relaxed mt-4">
              منصة عقارية متكاملة لعرض العقارات للبيع والكراء والتبديل في قصر البخاري والمناطق المحيطة.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">روابط سريعة</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/properties" className="hover:text-primary-400 transition-colors">جميع العقارات</Link></li>
              <li><Link to="/properties?operation=sale" className="hover:text-primary-400 transition-colors">عقارات للبيع</Link></li>
              <li><Link to="/properties?operation=rent" className="hover:text-primary-400 transition-colors">عقارات للكراء</Link></li>
              <li><Link to="/properties?operation=exchange" className="hover:text-primary-400 transition-colors">عقارات للتبديل</Link></li>
              <li><Link to="/register" className="hover:text-primary-400 transition-colors">أضف عقارك</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">تواصل معنا</h3>
            <ul className="space-y-3 text-sm">
              {settings?.phone && (
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary-400" />
                  <span dir="ltr">{settings.phone}</span>
                </li>
              )}
              {settings?.whatsapp && (
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary-400" />
                  <span dir="ltr">واتساب: {settings.whatsapp}</span>
                </li>
              )}
              {settings?.email && (
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary-400" />
                  <span dir="ltr">{settings.email}</span>
                </li>
              )}
              {settings?.facebook && (
                <li className="flex items-center gap-2">
                  <Facebook className="w-4 h-4 text-primary-400" />
                  <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-primary-400 transition-colors">فيسبوك</a>
                </li>
              )}
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-400" />
                <span>قصر البخاري، ولاية المدية</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} قصي للعقار - قصر البخاري. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
}
