import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Home as HomeIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { PropertyWithRelations } from '@/lib/types';
import { PropertyCard } from '@/components/PropertyCard';
import { SearchBar, type SearchFilters } from '@/components/SearchBar';

export function PropertiesPage() {
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState<PropertyWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || '',
    operationType: (searchParams.get('operation') as SearchFilters['operationType']) || '',
    propertyTypeId: searchParams.get('type') || '',
    areaId: searchParams.get('area') || '',
    priceMin: searchParams.get('minPrice') || '',
    priceMax: searchParams.get('maxPrice') || '',
    rooms: searchParams.get('rooms') || '',
    documentTypeId: searchParams.get('docType') || '',
  });

  useEffect(() => {
    async function fetchProperties() {
      setLoading(true);
      let query = supabase
        .from('properties')
        .select('*, property_type:property_types(*), area:areas(*), document_type:document_types(*), property_images(*)')
        .eq('status', 'published')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters.operationType) {
        query = query.eq('operation_type', filters.operationType);
      }
      if (filters.propertyTypeId) {
        query = query.eq('property_type_id', filters.propertyTypeId);
      }
      if (filters.areaId) {
        query = query.eq('area_id', filters.areaId);
      }
      if (filters.query) {
        query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
      }
      if (filters.priceMin) {
        query = query.gte('price', parseFloat(filters.priceMin));
      }
      if (filters.priceMax) {
        query = query.lte('price', parseFloat(filters.priceMax));
      }
      if (filters.rooms) {
        query = query.gte('rooms', parseInt(filters.rooms));
      }
      if (filters.documentTypeId) {
        query = query.eq('document_type_id', filters.documentTypeId);
      }

      const { data } = await query;
      setProperties((data as PropertyWithRelations[]) || []);
      setLoading(false);
    }
    fetchProperties();
  }, [filters]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">العقارات</h1>

        <div className="mb-6">
          <SearchBar filters={filters} onChange={setFilters} />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
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
        ) : properties.length > 0 ? (
          <>
            <p className="text-sm text-gray-500 mb-4">{properties.length} عقار</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((p) => <PropertyCard key={p.id} property={p} />)}
            </div>
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <HomeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">لا توجد عقارات مطابقة للبحث</p>
          </div>
        )}
      </div>
    </div>
  );
}
