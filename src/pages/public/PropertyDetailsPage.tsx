import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, Bed, Bath, Maximize, Building, Phone, MessageCircle, Share2, Heart, ChevronRight, Home, Calendar, Layers, Eye, ArrowLeft, Check, X, Play, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Property, Feature } from '@/types';
import { PublicLayout } from '@/layouts/PublicLayout';
import { formatPrice, OPERATION_LABELS, OPERATION_COLORS, CONDITION_LABELS, formatDate } from '@/lib/constants';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export function PropertyDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const [property, setProperty] = useState<Property | null>(null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase
        .from('properties')
        .select(`
          *,
          property_type:property_types(*),
          advertiser:profiles(*),
          images:property_images(*),
          videos:property_videos(*)
        `)
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('property_features')
        .select('feature:features(*)')
        .eq('property_id', id),
    ]).then(([propData, featData]) => {
      if (!propData.data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const p = propData.data as Property;
      if (p.status !== 'published') {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setProperty(p);
      if (featData.data) {
        setFeatures(featData.data.map((f: any) => f.feature as Feature));
      }
      setLoading(false);

      // Set document title for SEO
      document.title = `${p.title} - قصي للعقار`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', p.description?.substring(0, 160) || p.title);
    });

    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFavorite(favorites.includes(id));
  }, [id]);

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const newFavorites = isFavorite
      ? favorites.filter((fid: string) => fid !== id)
      : [...favorites, id];
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
  };

  const shareProperty = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: property?.title, url });
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="skeleton h-96 rounded-xl mb-6"></div>
          <div className="skeleton h-8 w-2/3 mb-4"></div>
          <div className="skeleton h-6 w-1/2 mb-4"></div>
          <div className="skeleton h-32 rounded-xl"></div>
        </div>
      </PublicLayout>
    );
  }

  if (notFound) {
    return (
      <PublicLayout>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <Building className="w-20 h-20 mx-auto mb-4 text-gray-300" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">العقار غير موجود</h1>
          <p className="text-gray-500 mb-6">قد يكون هذا العقار قد حُذف أو لم يعد متاحًا.</p>
          <Link to="/properties" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            العودة إلى العقارات
          </Link>
        </div>
      </PublicLayout>
    );
  }

  if (!property) return null;

  const images = property.images || [];
  const videos = property.videos || [];
  const coverImage = images.find((img) => img.is_cover) || images[0];

  const showPhone = property.show_phone && property.contact_phone;
  const showWhatsapp = property.show_whatsapp && property.contact_whatsapp;

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4 flex-wrap">
          <Link to="/" className="hover:text-primary-600 flex items-center gap-1">
            <Home className="w-4 h-4" />
            الرئيسية
          </Link>
          <ChevronRight className="w-4 h-4 rotate-180" />
          <Link to="/properties" className="hover:text-primary-600">العقارات</Link>
          <ChevronRight className="w-4 h-4 rotate-180" />
          <Link to={`/properties?operation=${property.operation_type}`} className="hover:text-primary-600">
            {OPERATION_LABELS[property.operation_type]}
          </Link>
          <ChevronRight className="w-4 h-4 rotate-180" />
          <span className="text-gray-700 truncate">{property.title}</span>
        </nav>

        {/* Gallery */}
        <div className="card overflow-hidden mb-6">
          <div className="relative h-64 md:h-96 bg-gray-100">
            {showVideo && videos.length > 0 ? (
              <video
                src={videos[0].video_url}
                controls
                className="w-full h-full object-contain bg-black"
              />
            ) : coverImage ? (
              <img
                src={activeImage < images.length ? images[activeImage].image_url : coverImage.image_url}
                alt={property.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building className="w-20 h-20 text-gray-300" />
              </div>
            )}
            <div className="absolute top-3 right-3 flex gap-2">
              <span className={`badge ${OPERATION_COLORS[property.operation_type]}`}>
                {OPERATION_LABELS[property.operation_type]}
              </span>
              {property.featured && (
                <span className="badge bg-primary-500 text-white flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  مميز
                </span>
              )}
            </div>
            <div className="absolute top-3 left-3 flex gap-2">
              <button onClick={toggleFavorite} className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors">
                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
              </button>
              <button onClick={shareProperty} className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors">
                <Share2 className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="p-3 flex gap-2 overflow-x-auto scrollbar-hide">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => { setActiveImage(i); setShowVideo(false); }}
                  className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    activeImage === i && !showVideo ? 'border-primary-500' : 'border-transparent'
                  }`}
                >
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
              {videos.length > 0 && (
                <button
                  onClick={() => setShowVideo(true)}
                  className={`shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 flex items-center justify-center bg-gray-900 transition-colors ${
                    showVideo ? 'border-primary-500' : 'border-transparent'
                  }`}
                >
                  <Play className="w-6 h-6 text-white" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & price */}
            <div className="card p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">{property.title}</h1>
              <div className="flex items-center gap-2 text-gray-500 mb-4">
                <MapPin className="w-5 h-5" />
                <span>{[property.wilaya, property.municipality, property.area].filter(Boolean).join('، ')}</span>
                {property.address && <span className="text-sm">- {property.address}</span>}
              </div>
              <div className="text-3xl font-bold text-primary-600">
                {formatPrice(property.price)}
              </div>
            </div>

            {/* Specs */}
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">مواصفات العقار</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {property.property_type && (
                  <SpecItem icon={Building} label="نوع العقار" value={property.property_type.name} />
                )}
                {property.area_size != null && (
                  <SpecItem icon={Maximize} label="المساحة" value={`${property.area_size} م²`} />
                )}
                {property.rooms != null && (
                  <SpecItem icon={Bed} label="الغرف" value={`${property.rooms}`} />
                )}
                {property.bathrooms != null && (
                  <SpecItem icon={Bath} label="الحمامات" value={`${property.bathrooms}`} />
                )}
                {property.floors != null && (
                  <SpecItem icon={Layers} label="الطوابق" value={`${property.floors}`} />
                )}
                {property.floor_number != null && (
                  <SpecItem icon={Layers} label="الطابق" value={`${property.floor_number}`} />
                )}
                {property.facades != null && (
                  <SpecItem icon={Building} label="الواجهات" value={`${property.facades}`} />
                )}
                {property.age != null && (
                  <SpecItem icon={Calendar} label="العمر" value={`${property.age} سنة`} />
                )}
                {property.condition && (
                  <SpecItem icon={Check} label="الحالة" value={CONDITION_LABELS[property.condition]} />
                )}
              </div>
            </div>

            {/* Features */}
            {features.length > 0 && (
              <div className="card p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">المميزات</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {features.map((f) => (
                    <div key={f.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-green-600" />
                      </div>
                      {f.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exchange info */}
            {property.operation_type === 'exchange' && (property.exchange_for || property.exchange_conditions) && (
              <div className="card p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">معلومات التبديل</h2>
                {property.exchange_for && (
                  <div className="mb-3">
                    <span className="text-sm text-gray-500">يبحث عن:</span>
                    <p className="text-gray-900 mt-1">{property.exchange_for}</p>
                  </div>
                )}
                {property.exchange_conditions && (
                  <div>
                    <span className="text-sm text-gray-500">شروط التبديل:</span>
                    <p className="text-gray-900 mt-1">{property.exchange_conditions}</p>
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {property.description && (
              <div className="card p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">الوصف</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{property.description}</p>
              </div>
            )}

            {/* Video */}
            {videos.length > 0 && !showVideo && (
              <div className="card p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">الفيديو</h2>
                <button
                  onClick={() => { setShowVideo(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-900 group"
                >
                  {videos[0].thumbnail_url ? (
                    <img src={videos[0].thumbnail_url} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-16 h-16 text-white/60" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-8 h-8 text-primary-600 mr-1" />
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Sidebar - Contact */}
          <div className="space-y-4">
            <div className="card p-6 sticky top-20">
              <h2 className="text-lg font-bold text-gray-900 mb-4">معلومات التواصل</h2>

              <div className="space-y-3">
                {property.contact_name && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                      {property.contact_name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">صاحب الإعلان</div>
                      <div className="font-medium text-gray-900">{property.contact_name}</div>
                    </div>
                  </div>
                )}

                {showPhone && (
                  <a
                    href={`tel:${property.contact_phone}`}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <Phone className="w-5 h-5" />
                    اتصل الآن
                  </a>
                )}

                {showWhatsapp && (
                  <a
                    href={`https://wa.me/${property.contact_whatsapp?.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600 transition-all"
                  >
                    <MessageCircle className="w-5 h-5" />
                    واتساب
                  </a>
                )}

                {!showPhone && !showWhatsapp && (
                  <div className="text-center text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                    للتواصل مع صاحب الإعلان، يرجى الاتصال برقم المنصة
                    {settings?.phone && (
                      <a href={`tel:${settings.phone}`} className="block text-primary-600 font-bold mt-2" dir="ltr">
                        {settings.phone}
                      </a>
                    )}
                  </div>
                )}

                <button
                  onClick={copyLink}
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <Share2 className="w-5 h-5" />
                  نسخ الرابط
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100 text-xs text-gray-400 space-y-1">
                <div>نُشر في: {formatDate(property.published_at || property.created_at)}</div>
                <div>آخر تحديث: {formatDate(property.updated_at)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

function SpecItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
      <Icon className="w-5 h-5 text-gray-400 shrink-0" />
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-sm font-medium text-gray-900">{value}</div>
      </div>
    </div>
  );
}
