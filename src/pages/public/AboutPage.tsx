import { PublicLayout } from '@/layouts/PublicLayout';
import { Building, Shield, Users, Eye, CheckCircle } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export function AboutPage() {
  const { settings } = useSiteSettings();

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">من نحن</h1>
          <p className="text-lg text-gray-500">
            {settings?.platform_name || 'قصي للعقار'} - {settings?.platform_subtitle || 'قصر البخاري'}
          </p>
        </div>

        <div className="card p-8 mb-8">
          <p className="text-gray-700 leading-relaxed text-lg">
            منصة عقارية متكاملة تخدم منطقة قصر البخاري والمناطق المحيطة، تتيح لأصحاب العقارات عرض عقاراتهم للبيع أو الكراء أو التبديل،
            وتمكن الزبائن من تصفح العقارات والتواصل مباشرة مع أصحابها. تتميز المنصة بنظام مراجعة دقيق يضمن جودة الإعلانات وموثوقيتها.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-primary-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">موثوقية وأمان</h3>
            <p className="text-sm text-gray-500">نظام مراجعة دقيق لكل إعلان قبل نشره</p>
          </div>

          <div className="card p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">سهولة الاستخدام</h3>
            <p className="text-sm text-gray-500">تصفح العقارات بدون تسجيل وبتواصل مباشر</p>
          </div>

          <div className="card p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Eye className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">شفافية كاملة</h3>
            <p className="text-sm text-gray-500">صور وفيديو ومواصفات واضحة لكل عقار</p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
