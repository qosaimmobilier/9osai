import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building, Users, Clock, CheckCircle, XCircle, PauseCircle, TrendingUp, Home, ArrowLeft, ClipboardList, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import type { Property, Profile, PropertyStatus } from '@/types';
import { PROPERTY_STATUS_LABELS, PROPERTY_STATUS_COLORS, formatPrice, formatDate } from '@/lib/constants';

export function AdminDashboard() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [pendingProperties, setPendingProperties] = useState<Property[]>([]);
  const [advertiserStats, setAdvertiserStats] = useState({ total: 0, active: 0, suspended: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('properties').select('status'),
      supabase
        .from('properties')
        .select(`*, property_type:property_types(*), images:property_images(*)`)
        .eq('status', 'pending_review')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('profiles').select('status').eq('role', 'advertiser'),
    ]).then(([propData, pendingData, advData]) => {
      const statusCounts: Record<string, number> = {
        total: propData.data?.length || 0,
        published: 0, pending_review: 0, rejected: 0, suspended: 0,
        sold: 0, rented: 0, exchanged: 0, archived: 0,
      };
      propData.data?.forEach((p: any) => {
        if (statusCounts[p.status] !== undefined) statusCounts[p.status]++;
      });
      setStats(statusCounts);
      if (pendingData.data) setPendingProperties(pendingData.data as Property[]);
      const advTotal = advData.data?.length || 0;
      const advActive = advData.data?.filter((a: any) => a.status === 'active').length || 0;
      const advSuspended = advData.data?.filter((a: any) => a.status === 'suspended').length || 0;
      setAdvertiserStats({ total: advTotal, active: advActive, suspended: advSuspended });
      setLoading(false);
    });
  }, []);

  const statCards = [
    { label: 'إجمالي العقارات', value: stats.total || 0, icon: Building, color: 'bg-blue-50 text-blue-600', to: '/admin/properties' },
    { label: 'منشورة', value: stats.published || 0, icon: CheckCircle, color: 'bg-green-50 text-green-600', to: '/admin/properties?status=published' },
    { label: 'قيد المراجعة', value: stats.pending_review || 0, icon: Clock, color: 'bg-amber-50 text-amber-600', to: '/admin/review' },
    { label: 'مرفوضة', value: stats.rejected || 0, icon: XCircle, color: 'bg-red-50 text-red-600', to: '/admin/properties?status=rejected' },
    { label: 'متوقفة', value: stats.suspended || 0, icon: PauseCircle, color: 'bg-orange-50 text-orange-600', to: '/admin/properties?status=suspended' },
    { label: 'مباعة', value: stats.sold || 0, icon: TrendingUp, color: 'bg-cyan-50 text-cyan-600', to: '/admin/properties?status=sold' },
    { label: 'مؤجرة', value: stats.rented || 0, icon: Home, color: 'bg-indigo-50 text-indigo-600', to: '/admin/properties?status=rented' },
    { label: 'مبدلة', value: stats.exchanged || 0, icon: TrendingUp, color: 'bg-purple-50 text-purple-600', to: '/admin/properties?status=exchanged' },
    { label: 'العارضون', value: advertiserStats.total, icon: Users, color: 'bg-teal-50 text-teal-600', to: '/admin/advertisers' },
    { label: 'نشطون', value: advertiserStats.active, icon: CheckCircle, color: 'bg-green-50 text-green-600', to: '/admin/advertisers' },
  ];

  return (
    <DashboardLayout role="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">لوحة الإدارة</h1>
        <p className="text-sm text-gray-500 mt-1">نظرة عامة على المنصة</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((stat) => (
          <Link key={stat.label} to={stat.to} className="card p-4 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Pending review section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-amber-600" />
            إعلانات تحتاج إلى مراجعة
            {stats.pending_review > 0 && (
              <span className="badge bg-amber-100 text-amber-700">{stats.pending_review}</span>
            )}
          </h2>
          <Link to="/admin/review" className="text-primary-600 text-sm font-medium hover:text-primary-700 flex items-center gap-1">
            عرض الكل
            <ArrowLeft className="w-4 h-4" />
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
        ) : pendingProperties.length > 0 ? (
          <div className="space-y-3">
            {pendingProperties.map((p) => {
              const cover = p.images?.find((img) => img.is_cover) || p.images?.[0];
              return (
                <Link
                  key={p.id}
                  to={`/admin/review/${p.id}`}
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
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span>{formatPrice(p.price)}</span>
                      <span>{p.wilaya} - {p.municipality}</span>
                      <span>{formatDate(p.created_at)}</span>
                    </div>
                  </div>
                  <span className="badge bg-amber-100 text-amber-700 shrink-0">قيد المراجعة</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
            <p className="text-gray-500">لا توجد عقارات تنتظر المراجعة</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
