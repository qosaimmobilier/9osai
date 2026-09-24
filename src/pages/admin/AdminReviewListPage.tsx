import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Building, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import type { Property } from '@/types';
import { formatPrice, formatDate } from '@/lib/constants';

export function AdminReviewListPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('properties')
      .select(`*, property_type:property_types(*), advertiser:profiles(*), images:property_images(*)`)
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setProperties(data as Property[]);
        setLoading(false);
      });
  }, []);

  return (
    <DashboardLayout role="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">مراجعة العقارات</h1>
        <p className="text-sm text-gray-500 mt-1">{properties.length} عقار قيد المراجعة</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-4">
              <div className="skeleton h-20 w-full"></div>
            </div>
          ))}
        </div>
      ) : properties.length > 0 ? (
        <div className="space-y-3">
          {properties.map((p) => {
            const cover = p.images?.find((img) => img.is_cover) || p.images?.[0];
            return (
              <Link
                key={p.id}
                to={`/admin/review/${p.id}`}
                className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  {cover ? <img src={cover.image_url} alt="" className="w-full h-full object-cover" /> : <Building className="w-10 h-10 text-gray-300 m-auto mt-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{p.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
                    <span>{formatPrice(p.price)}</span>
                    <span>{p.wilaya} - {p.municipality}</span>
                    <span>العارض: {p.advertiser?.name || '-'}</span>
                    <span>{formatDate(p.created_at)}</span>
                  </div>
                </div>
                <span className="badge bg-amber-100 text-amber-700 shrink-0">قيد المراجعة</span>
                <ArrowLeft className="w-5 h-5 text-gray-400 shrink-0" />
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">لا توجد عقارات تنتظر المراجعة</p>
        </div>
      )}
    </DashboardLayout>
  );
}
