import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, TrendingUp, Home as HomeIcon, KeyRound, RefreshCw, ArrowLeft, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { PropertyWithRelations } from '@/lib/types';
import { PropertyCard } from '@/components/PropertyCard';
import { SearchBar, type SearchFilters } from '@/components/SearchBar';
import { formatPrice, getOperationTypeLabel } from '@/lib/format';

export function HomePage() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<PropertyWithRelations[]>([]);
  const [latest, setLatest] = useState<PropertyWithRelations[]>([]);
  const [forSale, setForSale] = useState<PropertyWithRelations[]>([]);
  const [forRent, setForRent] = useState<PropertyWithRelations[]>([]);
  const [forExchange, setForExchange] = useState<PropertyWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroImage, setHeroImage] = useState<string>('');

  const [filters, setFilters] = useState<SearchFilters>({
    query: '', operationType: '', propertyTypeId: '', areaId: '',
    priceMin: '', priceMax: '', rooms: '', documentTypeId: '',
  });

  useEffect(() => {
    async function fetchProperties() {
      const select = '*, property_type:property_types(*), area:areas(*), document_type:document_types(*), property_images(*)';

      const [featRes, latestRes, saleRes, rentRes, exchangeRes] = await Promise.all([
        supabase.from('properties').select(select).eq('status', 'published').eq('is_featured', true).order('created_at', { ascending: false }).limit(6),
        supabase.from('properties').select(select).eq('status', 'published').order('created_at', { ascending: false }).limit(8),
        supabase.from('properties').select(select).eq('status', 'published').eq('operation_type', 'sale').order('created_at', { ascending: false }).limit(4),
        supabase.from('properties').select(select).eq('status', 'published').eq('operation_type', 'rent').order('created_at', { ascending: false }).limit(4),
        supabase.from('properties').select(select).eq('status', 'published').eq('operation_type', 'exchange').order('created_at', { ascending: false }).limit(4),
      ]);

      if (featRes.data) setFeatured(featRes.data as PropertyWithRelations[]);
      if (latestRes.data) setLatest(latestRes.data as PropertyWithRelations[]);
      if (saleRes.data) setForSale(saleRes.data as PropertyWithRelations[]);
      if (rentRes.data) setForRent(rentRes.data as PropertyWithRelations[]);
      if (exchangeRes.data) setForExchange(exchangeRes.data as PropertyWithRelations[]);
      setLoading(false);

      // Set hero image from first featured property
      const allProps = [...(featRes.data || []), ...(latestRes.data || [])];
      const firstImg = allProps.find(p => p.property_images?.length)?.property_images?.[0];
      if (firstImg) setHeroImage(firstImg.image_url);
    }
    fetchProperties();
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (filters.query) params.set('q', filters.query);
    if (filters.operationType) params.set('operation', filters.operationType);
    if (filters.propertyTypeId) params.set('type', filters.propertyTypeId);
    if (filters.areaId) params.set('area', filters.areaId);
    if (filters.priceMin) params.set('minPrice', filters.priceMin);
    if (filters.priceMax) params.set('maxPrice', filters.priceMax);
    if (filters.rooms) params.set('rooms', filters.rooms);
    if (filters.documentTypeId) params.set('docType', filters.documentTypeId);
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative min-h-[500px] flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900" />
        {heroImage && (
          <div className="absolute inset-0 opacity-20">
            <img src={heroImage} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/50 to-transparent" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 border border-white/20">
            <MapPin className="w-4 h-4 text-accent-400" />
            <span className="text-white text-sm font-medium">قصر البخاري والمناطق المحيطة</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4 leading-tight">
            قصي للعقار
          </h1>
          <p className="text-lg sm:text-xl text-primary-100 mb-8">
            منصة عقارية متكاملة للبيع والكراء وتبديل العقارات في قصر البخاري
          </p>

          {/* Search bar */}
          <div className="max-w-4xl mx-auto" onKeyDown={(e) => e.key === 'Enter' && handleSearch()}>
            <SearchBar filters={filters} onChange={setFilters} variant="home" />
            <button
              onClick={handleSearch}
              className="mt-4 px-8 py-3 bg-accent-500 hover:bg-accent-600 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-105"
            >
              بحث
            </button>
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/properties?operation=sale" className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-4 hover:shadow-xl transition-all hover:-translate-y-1 group">
            <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
              <TrendingUp className="w-7 h-7 text-primary-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">عقارات للبيع</h3>
              <p className="text-sm text-gray-500">تصفح عقارات البيع</p>
            </div>
          </Link>

          <Link to="/properties?operation=rent" className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-4 hover:shadow-xl transition-all hover:-translate-y-1 group">
            <div className="w-14 h-14 rounded-xl bg-accent-50 flex items-center justify-center group-hover:bg-accent-100 transition-colors">
              <KeyRound className="w-7 h-7 text-accent-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">عقارات للكراء</h3>
              <p className="text-sm text-gray-500">تصفح عقارات الكراء</p>
            </div>
          </Link>

          <Link to="/properties?operation=exchange" className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-4 hover:shadow-xl transition-all hover:-translate-y-1 group">
            <div className="w-14 h-14 rounded-xl bg-teal-50 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
              <RefreshCw className="w-7 h-7 text-teal-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">عقارات للتبديل</h3>
              <p className="text-sm text-gray-500">تصفح عقارات التبديل</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Featured Properties */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">عقارات مميزة</h2>
            <Link to="/properties" className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 text-sm">
              عرض الكل <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>
        </section>
      )}

      {/* Latest Properties */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">أحدث العقارات</h2>
          <Link to="/properties" className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 text-sm">
            عرض الكل <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                <div className="h-52 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-6 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : latest.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {latest.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <HomeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">لا توجد عقارات منشورة حاليًا</p>
          </div>
        )}
      </section>

      {/* For Sale */}
      {forSale.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">عقارات للبيع</h2>
            <Link to="/properties?operation=sale" className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 text-sm">
              عرض الكل <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {forSale.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>
        </section>
      )}

      {/* For Rent */}
      {forRent.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">عقارات للكراء</h2>
            <Link to="/properties?operation=rent" className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 text-sm">
              عرض الكل <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {forRent.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>
        </section>
      )}

      {/* For Exchange */}
      {forExchange.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">عقارات للتبديل</h2>
            <Link to="/properties?operation=exchange" className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 text-sm">
              عرض الكل <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {forExchange.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
