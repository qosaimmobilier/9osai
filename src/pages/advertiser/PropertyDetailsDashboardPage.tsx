import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Building, MapPin, Phone, MessageCircle, Edit, ArrowRight, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import type { Property, Feature, PropertyStatus } from '@/types';
import { PROPERTY_STATUS_LABELS, PROPERTY_STATUS_COLORS, OPERATION_LABELS, OPERATION_COLORS, CONDITION_LABELS, formatPrice, formatDate, formatDateTime } from '@/lib/constants';

export function PropertyDetailsDashboardPage() {
  const { id } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase
        .from('properties')
        .select(`*, property_type:property_types(*), images:property_images(*), videos:property_videos(*)`)
        .eq('id', id)
        .maybeSingle(),
      supabase.from('property_features').select('feature:features(*)').eq('property_id', id),
    ]).then(([propData, featData]) => {
      if (propData.data) setProperty(propData.data as Property);
      if (featData.data) setFeatures(featData.data.map((f: any) => f.feature as Feature));
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout role="advertiser">
        <div className="animate-pulse space-y-4">
          <div className="skeleton h-8 w-1/3"></div>
          <div className="skeleton h-64 rounded-xl"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!property) {
    return (
      <DashboardLayout role="advertiser">
        <div className="text-center py-16">
          <Building className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">العقار غير موجود</p>
          <Link to="/dashboard/properties" className="btn-primary inline-flex mt-4">العودة لعقاراتي</Link>
        </div>
      </DashboardLayout>
    );
  }

  const cover = property.images?.find((img) => img.is_cover) || property.images?.[0];

  return (
    <DashboardLayout role="advertiser">
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Link to="/dashboard/properties" className="hover:text-primary-600">عقاراتي</Link>
        <ArrowRight className="w-4 h-4" />
        <span className="text-gray-700">{property.title}</span>
      </div>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className={`badge ${PROPERTY_STATUS_COLORS[property.status as PropertyStatus]}`}>
              {PROPERTY_STATUS_LABELS[property.status as PropertyStatus]}
            </span>
            <span className={`badge ${OPERATION_COLORS[property.operation_type]}`}>
              {OPERATION_LABELS[property.operation_type]}
            </span>
          </div>
        </div>
        <Link to={`/dashboard/edit-property/${property.id}`} className="btn-primary flex items-center gap-2">
          <Edit className="w-5 h-5" />
          تعديل
        </Link>
      </div>

      {property.status === 'rejected' && property.rejection_reason && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
          <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">تم رفض الإعلان</p>
            <p className="text-sm text-red-700 mt-1">السبب: {property.rejection_reason}</p>
            <p className="text-xs text-red-600 mt-2">يمكنك تعديل الإعلان وإعادة إرساله للمراجعة.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          {property.images && property.images.length > 0 && (
            <div className="card p-4">
              <h2 className="font-bold text-gray-900 mb-3">الصور ({property.images.length})</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {property.images.map((img) => (
                  <div key={img.id} className="relative aspect-video rounded-lg overflow-hidden border border-gray-200">
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                    {img.is_cover && <span className="absolute top-1 right-1 badge bg-primary-500 text-white text-xs">رئيسية</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Specs */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-900 mb-4">المواصفات</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <SpecItem label="نوع العقار" value={property.property_type?.name || '-'} />
              <SpecItem label="السعر" value={formatPrice(property.price)} />
              <SpecItem label="المساحة" value={property.area_size ? `${property.area_size} م²` : '-'} />
              <SpecItem label="الغرف" value={property.rooms?.toString() || '-'} />
              <SpecItem label="الحمامات" value={property.bathrooms?.toString() || '-'} />
              <SpecItem label="الطوابق" value={property.floors?.toString() || '-'} />
              <SpecItem label="الطابق" value={property.floor_number?.toString() || '-'} />
              <SpecItem label="الواجهات" value={property.facades?.toString() || '-'} />
              <SpecItem label="العمر" value={property.age ? `${property.age} سنة` : '-'} />
              <SpecItem label="الحالة" value={property.condition ? CONDITION_LABELS[property.condition] : '-'} />
            </div>
          </div>

          {/* Features */}
          {features.length > 0 && (
            <div className="card p-6">
              <h2 className="font-bold text-gray-900 mb-4">المميزات</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {features.map((f) => (
                  <div key={f.id} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    {f.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {property.description && (
            <div className="card p-6">
              <h2 className="font-bold text-gray-900 mb-3">الوصف</h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{property.description}</p>
            </div>
          )}

          {/* Video */}
          {property.videos && property.videos.length > 0 && (
            <div className="card p-4">
              <h2 className="font-bold text-gray-900 mb-3">الفيديو</h2>
              {property.videos[0].is_external ? (
                <a href={property.videos[0].video_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                  {property.videos[0].video_url}
                </a>
              ) : (
                <video src={property.videos[0].video_url} controls className="w-full rounded-lg" />
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="font-bold text-gray-900 mb-4">الموقع</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400" />
                {[property.wilaya, property.municipality, property.area].filter(Boolean).join('، ')}
              </div>
              {property.address && <p className="text-gray-500 text-xs">{property.address}</p>}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-bold text-gray-900 mb-4">معلومات التواصل</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-gray-400" />
                <span>{property.contact_name}</span>
              </div>
              {property.show_phone && property.contact_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span dir="ltr">{property.contact_phone}</span>
                </div>
              )}
              {property.show_whatsapp && property.contact_whatsapp && (
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-gray-400" />
                  <span dir="ltr">{property.contact_whatsapp}</span>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-bold text-gray-900 mb-4">معلومات الإعلان</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">تاريخ الإضافة:</span>
                <span className="text-gray-700">{formatDate(property.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">آخر تحديث:</span>
                <span className="text-gray-700">{formatDate(property.updated_at)}</span>
              </div>
              {property.published_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">تاريخ النشر:</span>
                  <span className="text-gray-700">{formatDate(property.published_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-medium text-gray-900">{value}</div>
    </div>
  );
}
