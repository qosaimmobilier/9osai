import { PublicLayout } from '@/layouts/PublicLayout';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Phone, Mail, MapPin, Facebook, MessageCircle } from 'lucide-react';

export function ContactPage() {
  const { settings } = useSiteSettings();

  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">اتصل بنا</h1>
        <p className="text-gray-500 text-center mb-10">نحن هنا لمساعدتك في أي استفسار</p>

        <div className="card p-8">
          <div className="space-y-4">
            {settings?.phone && (
              <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">الهاتف</div>
                  <a href={`tel:${settings.phone}`} className="text-lg font-medium text-gray-900 hover:text-primary-600" dir="ltr">
                    {settings.phone}
                  </a>
                </div>
              </div>
            )}

            {settings?.whatsapp && (
              <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">واتساب</div>
                  <a
                    href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-medium text-gray-900 hover:text-green-600"
                    dir="ltr"
                  >
                    {settings.whatsapp}
                  </a>
                </div>
              </div>
            )}

            {settings?.email && (
              <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">البريد الإلكتروني</div>
                  <a href={`mailto:${settings.email}`} className="text-lg font-medium text-gray-900 hover:text-blue-600" dir="ltr">
                    {settings.email}
                  </a>
                </div>
              </div>
            )}

            {settings?.facebook && (
              <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Facebook className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">فيسبوك</div>
                  <a href={settings.facebook} target="_blank" rel="noopener noreferrer" className="text-lg font-medium text-gray-900 hover:text-blue-600">
                    صفحتنا على فيسبوك
                  </a>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">العنوان</div>
                <div className="text-lg font-medium text-gray-900">قصر البخاري، ولاية المدية، الجزائر</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
