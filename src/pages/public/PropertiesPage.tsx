import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Building, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Property, PropertyType, Location } from '@/types';
import { PublicLayout } from '@/layouts/PublicLayout';
import { PropertyCard } from '@/components/PropertyCard';
import { OPERATION_LABELS } from '@/lib/constants';

export function PropertiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Filter state
  const [operation, setOperation] = useState(searchParams.get('operation') || '');
  const [typeId, setTypeId] = useState(searchParams.get('type') || '');
  const [wilaya, setWilaya] = useState(searchParams.get('wilaya') || '');
  const [municipality, setMunicipality] = useState(searchParams.get('municipality') || '');
  const [area, setArea] = useState(searchParams.get('area') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [minArea, setMinArea] = useState(searchParams.get('minArea') || '');
  const [rooms, setRooms] = useState(searchParams.get('rooms') || '');
  const [featured, setFeatured] = useState(searchParams.get('featured') === 'true');

  useEffect(() => {
    supabase.from('property_types').select('*').eq('active', true).order('sort_order')
      .then(({ data }) => data && setPropertyTypes(data as PropertyType[]));
    supabase.from('locations').select('*').eq('active', true).order('sort_order')
      .then(({ data }) => data && setLocations(data as Location[]));
  }, []);

  const wilayas = Array.from(new Set(locations.map((l) => l.wilaya)));
  const municipalitiesList = Array.from(new Set(
    locations.filter((l) => (!wilaya || l.wilaya === wilaya)).map((l) => l.municipality)
  ));
  const areasList = Array.from(new Set(
    locations
      .filter((l) => (!wilaya || l.wilaya === wilaya) && (!municipality || l.municipality === municipality))
      .map((l) => l.area)
      .filter(Boolean)
  ));

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('properties')
      .select(`
        *,
        property_type:property_types(*),
        images:property_images(*)
      `)
      .eq('status', 'published')
      .order('featured', { ascending: false })
      .order('published_at', { ascending: false });

    if (operation) query = query.eq('operation_type', operation);
    if (typeId) query = query.eq('property_type_id', typeId);
    if (wilaya) query = query.eq('wilaya', wilaya);
    if (municipality) query = query.eq('municipality', municipality);
    if (area) query = query.eq('area', area);
    if (minPrice) query = query.gte('price', parseFloat(minPrice));
    if (maxPrice) query = query.lte('price', parseFloat(maxPrice));
    if (minArea) query = query.gte('area_size', parseFloat(minArea));
    if (rooms) query = query.gte('rooms', parseInt(rooms));
    if (featured) query = query.eq('featured', true);

    const { data, error, count } = await query.limit(24);

    if (!error && data) {
      setProperties(data as Property[]);
      setTotalCount(count || data.length);
    }
    setLoading(false);
  }, [operation, typeId, wilaya, municipality, area, minPrice, maxPrice, minArea, rooms, featured]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const applyFilters = () => {
    const params: Record<string, string> = {};
    if (operation) params.operation = operation;
    if (typeId) params.type = typeId;
    if (wilaya) params.wilaya = wilaya;
    if (municipality) params.municipality = municipality;
    if (area) params.area = area;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (minArea) params.minArea = minArea;
    if (rooms) params.rooms = rooms;
    if (featured) params.featured = 'true';
    setSearchParams(params);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setOperation(''); setTypeId(''); setWilaya(''); setMunicipality('');
    setArea(''); setMinPrice(''); setMaxPrice(''); setMinArea(''); setRooms(''); setFeatured(false);
    setSearchParams({});
  };

  const hasActiveFilters = operation || typeId || wilaya || municipality || area || minPrice || maxPrice || minArea || rooms || featured;

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">العقارات</h1>
            <p className="text-sm text-gray-500 mt-1">{totalCount} عقار متاح</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-medium"
          >
            <SlidersHorizontal className="w-4 h-4" />
            تصفية
          </button>
        </div>

        {/* Quick operation tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => { setOperation(''); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              !operation ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            الكل
          </button>
          {(['sale', 'rent', 'exchange'] as const).map((op) => (
            <button
              key={op}
              onClick={() => { setOperation(op); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                operation === op ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {OPERATION_LABELS[op]}
            </button>
          ))}
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="card p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">تصفية النتائج</h3>
              <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نوع العقار</label>
                <select value={typeId} onChange={(e) => setTypeId(e.target.value)} className="input-field text-sm">
                  <option value="">الكل</option>
                  {propertyTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الولاية</label>
                <select value={wilaya} onChange={(e) => { setWilaya(e.target.value); setMunicipality(''); setArea(''); }} className="input-field text-sm">
                  <option value="">الكل</option>
                  {wilayas.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البلدية</label>
                <select value={municipality} onChange={(e) => { setMunicipality(e.target.value); setArea(''); }} className="input-field text-sm" disabled={!wilaya}>
                  <option value="">الكل</option>
                  {municipalitiesList.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المنطقة</label>
                <select value={area} onChange={(e) => setArea(e.target.value)} className="input-field text-sm" disabled={!municipality}>
                  <option value="">الكل</option>
                  {areasList.map((a) => <option key={a} value={a as string}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">السعر الأدنى (دج)</label>
                <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="input-field text-sm" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">السعر الأعلى (دج)</label>
                <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="input-field text-sm" placeholder="10000000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المساحة الأدنى (م²)</label>
                <input type="number" value={minArea} onChange={(e) => setMinArea(e.target.value)} className="input-field text-sm" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">عدد الغرف (الأدنى)</label>
                <select value={rooms} onChange={(e) => setRooms(e.target.value)} className="input-field text-sm">
                  <option value="">الكل</option>
                  {[1, 2, 3, 4, 5].map((r) => <option key={r} value={r}>{r}+</option>)}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="w-4 h-4 accent-primary-600" />
                  <span className="text-sm font-medium text-gray-700">مميز فقط</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={applyFilters} className="btn-primary flex-1">تطبيق التصفية</button>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="btn-secondary">مسح الكل</button>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card p-4">
                <div className="skeleton h-48 rounded-lg mb-4"></div>
                <div className="skeleton h-4 w-3/4 mb-2"></div>
                <div className="skeleton h-4 w-1/2"></div>
              </div>
            ))}
          </div>
        ) : properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Building className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg">لا توجد عقارات مطابقة لبحثك حاليًا.</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-primary-600 font-medium mt-2 hover:text-primary-700">
                مسح التصفية
              </button>
            )}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
