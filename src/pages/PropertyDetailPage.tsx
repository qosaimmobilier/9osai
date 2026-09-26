import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Maximize, BedDouble, Building, Layers, FileText, Phone, Mail, Share2, ArrowRight, Play, User, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { PropertyWithRelations } from '@/lib/types';
import { formatPrice, getOperationTypeLabel, getDocumentVerifiedLabel, getDocumentVerifiedColor } from '@/lib/format';

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [property, setProperty] = useState<PropertyWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function fetchProperty() {
      const { data } = await supabase
        .from('properties')
        .select('*, property_type:property_types(*), area:areas(*), document_type:document_types(*), property_images(*)')
        .eq('id', id)
        .eq('status', 'published')
        .maybeSingle();

      if (data) {
        const prop = data as PropertyWithRelations;
        setProperty(prop);
        const primary = prop.property_images?.find((img) => img.is_primary);
        setSelectedImage(primary?.image_url || prop.property_images?.[0]?.image_url || null);
      }
      setLoading(false);
    }
    fetchProperty();
  }, [id]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: property?.title, url }); } catch { /* ignore */ }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert('تم نسخ الرابط');
      } catch { /* ignore */ }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">جاري التحميل...</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">العقار غير موجود أو غير منشور</p>
          <Link to="/properties" className="text-primary-600 hover:text-primary-700 font-medium">
            العودة للعقارات
          </Link>
        </div>
      </div>
    );
  }

  const images = property.property_images || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-primary-600">الرئيسية</Link>
          <ArrowRight className="w-4 h-4" />
          <Link to="/properties" className="hover:text-primary-600">العقارات</Link>
          <ArrowRight className="w-4 h-4" />
          <span className="text-gray-700 truncate">{property.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {selectedImage ? (
                <div className="relative aspect-video bg-gray-100">
                  <img src={selectedImage} alt={property.title} className="w-full h-full object-cover" />
                  {property.video_url && (
                    <a
                      href={property.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-black/80 transition-colors"
                    >
                      <Play className="w-5 h-5" />
                      مشاهدة الفيديو
                    </a>
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
                  <MapPin className="w-16 h-16 text-primary-300" />
                </div>
              )}

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="p-4 flex gap-2 overflow-x-auto">
                  {images.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(img.image_url)}
                      className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === img.image_url ? 'border-primary-500' : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title and key info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="inline-block bg-primary-50 text-primary-700 text-sm font-bold px-3 py-1 rounded-full mb-2">
                    {getOperationTypeLabel(property.operation_type)}
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>
                </div>
                <button
                  onClick={handleShare}
                  className="shrink-0 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
                  title="مشاركة"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {/* Price */}
              <div className="text-3xl font-bold text-primary-700 mb-4">
                {formatPrice(property.operation_type, property.price, property.price_unit)}
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-gray-600 mb-6">
                <MapPin className="w-5 h-5 text-primary-500" />
                <span>{property.area?.name_ar || 'غير محدد'} - قصر البخاري</span>
              </div>

              {/* Specs grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {property.property_type && (
                  <div className="flex flex-col items-center text-center p-3 bg-gray-50 rounded-xl">
                    <Building className="w-6 h-6 text-primary-500 mb-1" />
                    <span className="text-xs text-gray-500">نوع العقار</span>
                    <span className="font-bold text-gray-900 text-sm">{property.property_type.name_ar}</span>
                  </div>
                )}
                {property.area_size && (
                  <div className="flex flex-col items-center text-center p-3 bg-gray-50 rounded-xl">
                    <Maximize className="w-6 h-6 text-primary-500 mb-1" />
                    <span className="text-xs text-gray-500">المساحة</span>
                    <span className="font-bold text-gray-900 text-sm">{property.area_size} م²</span>
                  </div>
                )}
                {property.rooms != null && (
                  <div className="flex flex-col items-center text-center p-3 bg-gray-50 rounded-xl">
                    <BedDouble className="w-6 h-6 text-primary-500 mb-1" />
                    <span className="text-xs text-gray-500">الغرف</span>
                    <span className="font-bold text-gray-900 text-sm">{property.rooms}</span>
                  </div>
                )}
                {property.floors != null && (
                  <div className="flex flex-col items-center text-center p-3 bg-gray-50 rounded-xl">
                    <Layers className="w-6 h-6 text-primary-500 mb-1" />
                    <span className="text-xs text-gray-500">الطوابق</span>
                    <span className="font-bold text-gray-900 text-sm">{property.floors}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {property.description && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">وصف العقار</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{property.description}</p>
              </div>
            )}

            {/* Exchange info */}
            {property.operation_type === 'exchange' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">شروط التبديل</h2>
                {property.exchange_conditions && (
                  <p className="text-gray-600 leading-relaxed mb-3">{property.exchange_conditions}</p>
                )}
                {property.exchange_target && (
                  <p className="text-gray-600"><span className="font-medium">العقار المطلوب: </span>{property.exchange_target}</p>
                )}
                {property.exchange_price_diff != null && property.exchange_price_diff > 0 && (
                  <p className="text-gray-600 mt-2">
                    <span className="font-medium">فرق السعر: </span>
                    {property.exchange_price_diff} مليون
                  </p>
                )}
              </div>
            )}

            {/* Document type (public display) */}
            {property.document_type && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">الوضعية القانونية</h2>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <FileText className="w-6 h-6 text-primary-500" />
                  <div>
                    <p className="text-sm text-gray-500">نوع السند</p>
                    <p className="font-bold text-gray-900">{property.document_type.name_ar}</p>
                  </div>
                </div>
                {property.document_notes && (
                  <p className="text-sm text-gray-500 mt-3">{property.document_notes}</p>
                )}
                <p className="text-xs text-gray-400 mt-3">
                  * الموقع يعرض فقط نوع الوثيقة الذي صرح به صاحب العقار ولا يعطي حكمًا قانونيًا عليها.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar - Contact */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4">معلومات التواصل</h2>

              {!showContact ? (
                <button
                  onClick={() => setShowContact(true)}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors"
                >
                  عرض معلومات التواصل
                </button>
              ) : (
                <div className="space-y-3 animate-fade-in">
                  {property.contact_name && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <User className="w-5 h-5 text-primary-500" />
                      <div>
                        <p className="text-xs text-gray-500">الاسم</p>
                        <p className="font-medium text-gray-900">{property.contact_name}</p>
                      </div>
                    </div>
                  )}
                  {property.contact_phone && (
                    <a href={`tel:${property.contact_phone}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors">
                      <Phone className="w-5 h-5 text-primary-500" />
                      <div>
                        <p className="text-xs text-gray-500">الهاتف</p>
                        <p className="font-medium text-gray-900" dir="ltr">{property.contact_phone}</p>
                      </div>
                    </a>
                  )}
                  {property.contact_email && (
                    <a href={`mailto:${property.contact_email}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-primary-50 transition-colors">
                      <Mail className="w-5 h-5 text-primary-500" />
                      <div>
                        <p className="text-xs text-gray-500">البريد</p>
                        <p className="font-medium text-gray-900 text-sm" dir="ltr">{property.contact_email}</p>
                      </div>
                    </a>
                  )}
                  {!property.contact_name && !property.contact_phone && !property.contact_email && (
                    <p className="text-gray-500 text-sm">لا توجد معلومات تواصل متاحة</p>
                  )}
                </div>
              )}

              {/* Published date */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>نشر في: {new Date(property.created_at).toLocaleDateString('ar-DZ')}</span>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                <p className="text-xs text-amber-700">
                  تنبيه: قصي للعقار منصة وسيطة ولا تتحمل مسؤولية صحة المعلومات. يرجى التحقق شخصيًا.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
