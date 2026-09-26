import { Link } from 'react-router-dom';
import { Building2, Phone, Mail, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { PlatformSettings } from '@/lib/types';

export function Footer() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);

  useEffect(() => {
    supabase.from('platform_settings').select('*').eq('id', 1).maybeSingle()
      .then(({ data }) => {
        if (data) setSettings(data as PlatformSettings);
      });
  }, []);

  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{settings?.site_name || 'قصي للعقار'}</h2>
                <p className="text-sm text-gray-400">{settings?.site_subtitle || 'قصر البخاري'}</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              منصة عقارية متخصصة في عرض وبيع وكراء وتبديل العقارات في قصر البخاري والمناطق المحيطة بها.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-bold mb-4">روابط سريعة</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-primary-400 transition-colors">الرئيسية</Link></li>
              <li><Link to="/properties" className="hover:text-primary-400 transition-colors">كل العقارات</Link></li>
              <li><Link to="/properties?operation=sale" className="hover:text-primary-400 transition-colors">عقارات للبيع</Link></li>
              <li><Link to="/properties?operation=rent" className="hover:text-primary-400 transition-colors">عقارات للكراء</Link></li>
              <li><Link to="/properties?operation=exchange" className="hover:text-primary-400 transition-colors">عقارات للتبديل</Link></li>
              <li><Link to="/login" className="hover:text-primary-400 transition-colors">تسجيل الدخول</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold mb-4">معلومات التواصل</h3>
            <ul className="space-y-3 text-sm">
              {settings?.contact_phone && (
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary-400" />
                  <span dir="ltr">{settings.contact_phone}</span>
                </li>
              )}
              {settings?.contact_email && (
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary-400" />
                  <span dir="ltr">{settings.contact_email}</span>
                </li>
              )}
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary-400" />
                <span>قصر البخاري، المدية، الجزائر</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} قصي للعقار - قصر البخاري. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  );
}
