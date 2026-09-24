import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowLeft, Building } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Property } from '@/types';
import { PublicLayout } from '@/layouts/PublicLayout';
import { PropertyCard } from '@/components/PropertyCard';

export function FavoritesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (favorites.length === 0) {
      setLoading(false);
      return;
    }
    supabase
      .from('properties')
      .select(`
        *,
        property_type:property_types(*),
        images:property_images(*)
      `)
      .eq('status', 'published')
      .in('id', favorites)
      .then(({ data }) => {
        if (data) setProperties(data as Property[]);
        setLoading(false);
      });
  }, []);

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Heart className="w-7 h-7 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900">المفضلة</h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
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
            <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 text-lg mb-4">لا توجد عقارات في المفضلة بعد</p>
            <Link to="/properties" className="btn-primary inline-flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              تصفح العقارات
            </Link>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
