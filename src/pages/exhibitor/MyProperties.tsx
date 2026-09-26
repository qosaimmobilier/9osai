import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, PlusCircle, Eye, Pencil, AlertCircle, Archive } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Property, PropertyImage } from '@/lib/types';
import { getPropertyStatusLabel, getPropertyStatusColor, formatPrice, getOperationTypeLabel } from '@/lib/format';

interface PropertyWithImages extends Property {
  property_images?: PropertyImage[];
}

export function MyProperties() {
  const { profile } = useAuth();
  const [properties, setProperties] = useState<PropertyWithImages[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    supabase
      .from('properties')
      .select('*, property_images(*)')
      .eq('owner_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProperties((data as PropertyWithImages[]) || []);
        setLoading(false);
      });
  }, [profile?.id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">عقاراتي</h1>
        <Link
          to="/dashboard/add-property"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
          إضافة عقار
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">جاري التحميل...</div>
      ) : properties.length > 0 ? (
        <div className="space-y-4">
          {properties.map((prop) => {
            const primaryImg = prop.property_images?.find((img) => img.is_primary) || prop.property_images?.[0];
            const canEdit = prop.status === 'draft' || prop.status === 'rejected' || prop.status === 'in_review';
            return (
              <div key={prop.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row">
                  {/* Image */}
                  <div className="sm:w-48 h-40 sm:h-auto bg-gray-100 shrink-0">
                    {primaryImg ? (
                      <img src={primaryImg.image_url} alt={prop.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="w-10 h-10 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-gray-900">{prop.title}</h3>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${getPropertyStatusColor(prop.status)}`}>
                        {getPropertyStatusLabel(prop.status)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                      <span>{getOperationTypeLabel(prop.operation_type)}</span>
                      <span className="font-medium text-primary-600">
                        {formatPrice(prop.operation_type, prop.price, prop.price_unit)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      {prop.area_size && <span>{prop.area_size} م²</span>}
                      {prop.rooms != null && <span>{prop.rooms} غرف</span>}
                      <span>{new Date(prop.created_at).toLocaleDateString('ar-DZ')}</span>
                    </div>

                    {prop.status === 'rejected' && prop.rejection_reason && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg flex items-start gap-2 text-sm text-red-700">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold mb-1">تم رفض العقار</p>
                          <p>{prop.rejection_reason}</p>
                          <p className="mt-1 text-xs text-red-600">يرجى تصحيح المشكلة وإعادة إرسال العقار للمراجعة.</p>
                        </div>
                      </div>
                    )}

                    {prop.status === 'archived' && prop.rejection_reason && (
                      <div className="mt-3 p-3 bg-gray-100 rounded-lg flex items-start gap-2 text-sm text-gray-700">
                        <Archive className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold mb-1">تم حذف العقار من قبل الإدارة</p>
                          <p>{prop.rejection_reason}</p>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-2">
                      <Link
                        to={`/properties/${prop.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        عرض
                      </Link>
                      {canEdit && (
                        <Link
                          to={`/dashboard/edit-property/${prop.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 hover:bg-primary-100 rounded-lg text-sm text-primary-700 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                          تعديل
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">لا توجد عقارات بعد</p>
          <Link to="/dashboard/add-property" className="text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block">
            ابدأ بإضافة عقارك الأول
          </Link>
        </div>
      )}
    </div>
  );
}
