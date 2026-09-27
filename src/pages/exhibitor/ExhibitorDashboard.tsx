import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, CheckCircle, Clock, XCircle, PlusCircle, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Property } from '@/lib/types';
import { getPropertyStatusLabel, getPropertyStatusColor, formatPrice, getOperationTypeLabel } from '@/lib/format';

export function ExhibitorDashboard() {
  const { profile } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    supabase
      .from('properties')
      .select('*')
      .eq('owner_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProperties((data as Property[]) || []);
        setLoading(false);
      });
  }, [profile?.id]);

  const stats = {
    total: properties.length,
    published: properties.filter((p) => p.status === 'published').length,
    inReview: properties.filter((p) => p.status === 'in_review').length,
    rejected: properties.filter((p) => p.status === 'rejected').length,
    draft: properties.filter((p) => p.status === 'draft').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">مرحبًا، {profile?.full_name || profile?.email}</h1>
        <p className="text-gray-500 mt-1">لوحة تحكم العارض - قصي للعقار</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="إجمالي العقارات" value={stats.total} icon={Home} color="bg-primary-50 text-primary-600" />
        <StatCard label="منشورة" value={stats.published} icon={CheckCircle} color="bg-emerald-50 text-emerald-600" />
        <StatCard label="قيد المراجعة" value={stats.inReview} icon={Clock} color="bg-amber-50 text-amber-600" />
        <StatCard label="مرفوضة" value={stats.rejected} icon={XCircle} color="bg-red-50 text-red-600" />
        <StatCard label="مسودات" value={stats.draft} icon={Home} color="bg-gray-50 text-gray-600" />
      </div>

      {/* Add property button */}
      <Link
        to="/dashboard/add-property"
        className="flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors"
      >
        <PlusCircle className="w-5 h-5" />
        إضافة عقار جديد
      </Link>

      {/* Recent properties */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">أحدث عقاراتي</h2>
        {loading ? (
          <div className="text-center py-8 text-gray-400">جاري التحميل...</div>
        ) : properties.length > 0 ? (
          <div className="space-y-3">
            {properties.slice(0, 5).map((prop) => (
              <div key={prop.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{prop.title}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${getPropertyStatusColor(prop.status)}`}>
                      {getPropertyStatusLabel(prop.status)}
                    </span>
                    <span className="text-sm text-gray-500">{getOperationTypeLabel(prop.operation_type)}</span>
                    <span className="text-sm font-medium text-primary-600">
                      {formatPrice(prop.operation_type, prop.price, prop.price_unit)}
                    </span>
                  </div>
                  {prop.status === 'rejected' && prop.rejection_reason && (
                    <p className="text-sm text-red-600 mt-2 bg-red-50 p-2 rounded-lg">
                      سبب الرفض: {prop.rejection_reason}
                    </p>
                  )}
                </div>
                <Link
                  to={`/dashboard/edit-property/${prop.id}`}
                  className="shrink-0 p-2 rounded-lg bg-gray-50 hover:bg-primary-50 text-gray-600 hover:text-primary-600 transition-colors mr-2"
                >
                  <Eye className="w-5 h-5" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">لم تقم بإضافة أي عقار بعد</p>
            <Link to="/dashboard/add-property" className="text-primary-600 hover:text-primary-700 font-medium mt-2 inline-block">
              ابدأ بإضافة عقارك الأول
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
