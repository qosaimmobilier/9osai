import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building, Clock, CheckCircle, XCircle, PauseCircle, Home, TrendingUp, PlusCircle, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import type { Property, PropertyStatus } from '@/types';
import { PROPERTY_STATUS_LABELS, PROPERTY_STATUS_COLORS, formatPrice, formatDate } from '@/lib/constants';

export function AdvertiserDashboard() {
  const { session } = useAuth();
  const [stats, setStats] = useState<Record<string, number>>({});
  const [recentProperties, setRecentProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;
    const userId = session.user.id;

    Promise.all([
      supabase.from('properties').select('status').eq('advertiser_id', userId),
      supabase
        .from('properties')
        .select(`
          *,
          property_type:property_types(*),
          images:property_images(*)
        `)
        .eq('advertiser_id', userId)
        .order('created_at', { ascending: false })
        .limit(5),
    ]).then(([statsData, recentData]) => {
      const statusCounts: Record<string, number> = {
        total: statsData.data?.length || 0,
        published: 0, pending_review: 0, rejected: 0, suspended: 0,
        sold: 0, rented: 0, exchanged: 0,
      };
      statsData.data?.forEach((p: any) => {
        if (statusCounts[p.status] !== undefined) statusCounts[p.status]++;
      });
      setStats(statusCounts);
      if (recentData.data) setRecentProperties(recentData.data as Property[]);
      setLoading(false);
    });
  }, [session]);

  const statCards = [
    { label: 'إجمالي عقاراتي', value: stats.total || 0, icon: Building, color: 'bg-blue-50 text-blue-600' },
    { label: 'منشورة', value: stats.published || 0, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
    { label: 'قيد المراجعة', value: stats.pending_review || 0, icon: Clock, color: 'bg-amber-50 text-amber-600' },
    { label: 'مرفوضة', value: stats.rejected || 0, icon: XCircle, color: 'bg-red-50 text-red-600' },
    { label: 'متوقفة', value: stats.suspended || 0, icon: PauseCircle, color: 'bg-orange-50 text-orange-600' },
    { label: 'تم البيع', value: stats.sold || 0, icon: TrendingUp, color: 'bg-cyan-50 text-cyan-600' },
    { label: 'تم الكراء', value: stats.rented || 0, icon: Home, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'تم التبديل', value: stats.exchanged || 0, icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <DashboardLayout role="advertiser">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">لوحة العارض</h1>
          <p className="text-sm text-gray-500 mt-1">مرحبًا بك في لوحة التحكم</p>
        </div>
        <Link to="/dashboard/add-property" className="btn-primary flex items-center gap-2">
          <PlusCircle className="w-5 h-5" />
          إضافة عقار
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="card p-4">
            <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent properties */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">أحدث عقاراتي</h2>
          <Link to="/dashboard/properties" className="text-primary-600 text-sm font-medium hover:text-primary-700">
            عرض الكل
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card p-4">
                <div className="skeleton h-16 w-full"></div>
              </div>
            ))}
          </div>
        ) : recentProperties.length > 0 ? (
          <div className="space-y-3">
            {recentProperties.map((p) => {
              const cover = p.images?.find((img) => img.is_cover) || p.images?.[0];
              return (
                <Link
                  key={p.id}
                  to={`/dashboard/properties/${p.id}`}
                  className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    {cover ? (
                      <img src={cover.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Building className="w-8 h-8 text-gray-300 m-auto mt-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{p.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`badge ${PROPERTY_STATUS_COLORS[p.status as PropertyStatus]}`}>
                        {PROPERTY_STATUS_LABELS[p.status as PropertyStatus]}
                      </span>
                      <span className="text-sm text-gray-500">{formatPrice(p.price)}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 shrink-0 hidden sm:block">
                    {formatDate(p.created_at)}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="card p-12 text-center">
            <Building className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 mb-4">لم تقم بإضافة أي عقار بعد</p>
            <Link to="/dashboard/add-property" className="btn-primary inline-flex items-center gap-2">
              <PlusCircle className="w-5 h-5" />
              إضافة عقار
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
