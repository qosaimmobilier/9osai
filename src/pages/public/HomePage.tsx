import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Home, Building, MapPin, TrendingUp, ArrowLeft, CheckCircle, Eye, Heart, Share2, Phone } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Property, PropertyType, Location } from '@/types';
import { formatPrice, OPERATION_LABELS, OPERATION_COLORS } from '@/lib/constants';
import { PublicLayout } from '@/layouts/PublicLayout';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { PropertyCard } from '@/components/PropertyCard';

export function HomePage() {
  const { settings } = useSiteSettings();
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [recentProperties, setRecentProperties] = useState<Property[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(true);

  // Search form state
  const [searchOperation, setSearchOperation] = useState('');
  const [searchType, setSearchType] = useState('');
  const [searchWilaya, setSearchWilaya] = useState('');
  const [searchMunicipality, setSearchMunicipality] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      supabase
        .from('properties')
        .select(`
          *,
          property_type:property_types(*),
          images:property_images(*)
        `)
        .eq('status', 'published')
        .eq('featured', true)
        .order('published_at', { ascending: false })
        .limit(6),
      supabase
        .from('properties')
        .select(`
          *,
          property_type:property_types(*),
          images:property_images(*)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(8),
      supabase.from('property_types').select('*').eq('active', true).order('sort_order'),
      supabase.from('locations').select('*').eq('active', true).order('sort_order'),
    ]).then(([featured, recent, types, locs]) => {
      if (featured.data) setFeaturedProperties(featured.data as Property[]);
      if (recent.data) setRecentProperties(recent.data as Property[]);
      if (types.data) setPropertyTypes(types.data as PropertyType[]);
      if (locs.data) {
        setLocations(locs.data as Location[]);
        const wSet = new Set((locs.data as Location[]).map((l) => l.wilaya));
        // setMunicipalities based on selected wilaya
      }
      setLoading(false);
    });
  }, []);

  const handleWilayaChange = (wilaya: string) => {
    setSearchWilaya(wilaya);
    const muniSet = new Set(
      locations.filter((l) => l.wilaya === wilaya).map((l) => l.municipality)
    );
    setMunicipalities(Array.from(muniSet));
    setSearchMunicipality('');
  };

  const buildSearchUrl = () => {
    const params = new URLSearchParams();
    if (searchOperation) params.set('operation', searchOperation);
    if (searchType) params.set('type', searchType);
    if (searchWilaya) params.set('wilaya', searchWilaya);
    if (searchMunicipality) params.set('municipality', searchMunicipality);
    return `/properties?${params.toString()}`;
  };

  const wilayas = Array.from(new Set(locations.map((l) => l.wilaya)));

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'url("https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1920")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              {settings?.platform_name || 'قصي للعقار'}
            </h1>
            <p className="text-lg md:text-xl text-gray-300">
              {settings?.platform_subtitle || 'قصر البخاري'}
            </p>
            <p className="text-sm md:text-base text-gray-400 mt-4 max-w-2xl mx-auto">
              منصة عقارية متكاملة للعثور على عقارات للبيع والكراء والتبديل في قصر البخاري والمناطق المحيطة
            </p>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl shadow-2xl p-4 md:p-6 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <select
                value={searchOperation}
                onChange={(e) => setSearchOperation(e.target.value)}
                className="input-field text-sm"
              >
                <option value="">كل العمليات</option>
                <option value="sale">بيع</option>
                <option value="rent">كراء</option>
                <option value="exchange">تبديل</option>
              </select>

              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="input-field text-sm"
              >
                <option value="">كل الأنواع</option>
                {propertyTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>

              <select
                value={searchWilaya}
                onChange={(e) => handleWilayaChange(e.target.value)}
                className="input-field text-sm"
              >
                <option value="">كل الولايات</option>
                {wilayas.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>

              <select
                value={searchMunicipality}
                onChange={(e) => setSearchMunicipality(e.target.value)}
                className="input-field text-sm"
                disabled={!searchWilaya}
              >
                <option value="">كل البلديات</option>
                {municipalities.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              <Link to={buildSearchUrl()} className="btn-primary flex items-center justify-center gap-2 text-sm">
                <Search className="w-5 h-5" />
                بحث
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      {featuredProperties.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary-600" />
              عقارات مميزة
            </h2>
            <Link to="/properties?featured=true" className="text-primary-600 font-medium text-sm hover:text-primary-700 flex items-center gap-1">
              عرض الكل
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </section>
      )}

      {/* Recent Properties */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">أحدث العقارات</h2>
          <Link to="/properties" className="text-primary-600 font-medium text-sm hover:text-primary-700 flex items-center gap-1">
            عرض الكل
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-4">
                <div className="skeleton h-48 rounded-lg mb-4"></div>
                <div className="skeleton h-4 w-3/4 mb-2"></div>
                <div className="skeleton h-4 w-1/2"></div>
              </div>
            ))}
          </div>
        ) : recentProperties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentProperties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Building className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>لا توجد عقارات منشورة حاليًا</p>
          </div>
        )}
      </section>

      {/* Property Categories */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">تصفح حسب نوع العقار</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {propertyTypes.map((type) => (
              <Link
                key={type.id}
                to={`/properties?type=${type.id}`}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-primary-300 hover:bg-primary-50 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
                  <Building className="w-6 h-6 text-gray-500 group-hover:text-primary-600" />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-primary-700">{type.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">كيف تعمل المنصة؟</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { num: '1', title: 'سجل كعارض', desc: 'أنشئ حسابك على المنصة في دقائق', icon: CheckCircle },
            { num: '2', title: 'أضف عقارك', desc: 'أدخل معلومات العقار وارفع الصور والفيديو', icon: Building },
            { num: '3', title: 'بعد المراجعة يظهر للزبائن', desc: 'تقوم الإدارة بمراجعة الإعلان ثم نشره', icon: Eye },
          ].map((step) => (
            <div key={step.num} className="text-center">
              <div className="relative inline-block mb-4">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                  <step.icon className="w-8 h-8 text-primary-600" />
                </div>
                <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center">
                  {step.num}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA for Advertisers */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">هل لديك عقار للبيع أو الكراء؟</h2>
          <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
            انضم إلى منصة قصي للعقار واعرض عقارك أمام آلاف الزبائن المحتملين
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-3 rounded-lg font-bold hover:bg-primary-50 transition-all shadow-lg"
          >
            أضف عقارك الآن
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </PublicLayout>
  );
}
