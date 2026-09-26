import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Home, CheckCircle, Clock, XCircle, Users, Bell, TrendingUp, KeyRound, RefreshCw, Archive, Eye, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Property } from '@/lib/types';
import { getAuditActionLabel } from '@/lib/format';

interface Stats {
  total: number;
  published: number;
  inReview: number;
  rejected: number;
  sold: number;
  rented: number;
  exchanged: number;
  exhibitors: number;
}

interface VisitStats {
  today: number;
  week: number;
  month: number;
  total: number;
  unique_visitors: number;
}

interface UserStats {
  total: number;
  exhibitors: number;
  admins: number;
  new_today: number;
  new_week: number;
}

interface AuditEntry {
  id: string;
  action: string;
  entity_type: string | null;
  created_at: string;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ total: 0, published: 0, inReview: 0, rejected: 0, sold: 0, rented: 0, exchanged: 0, exhibitors: 0 });
  const [visitStats, setVisitStats] = useState<VisitStats>({ today: 0, week: 0, month: 0, total: 0, unique_visitors: 0 });
  const [userStats, setUserStats] = useState<UserStats>({ total: 0, exhibitors: 0, admins: 0, new_today: 0, new_week: 0 });
  const [recentAudit, setRecentAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Get all properties via admin function
      const { data: propData } = await supabase.rpc('admin_get_all_properties');
      const props = (propData as Property[]) || [];

      // Get exhibitor count
      const { data: profiles } = await supabase.rpc('admin_get_all_profiles');

      // Get audit log
      const { data: audit } = await supabase.rpc('admin_get_audit_log', { limit_count: 10 });

      // Get visit stats
      const { data: visits } = await supabase.rpc('admin_get_visit_stats');

      // Get registered users stats
      const { data: users } = await supabase.rpc('admin_get_registered_count');

      setStats({
        total: props.length,
        published: props.filter((p) => p.status === 'published').length,
        inReview: props.filter((p) => p.status === 'in_review').length,
        rejected: props.filter((p) => p.status === 'rejected').length,
        sold: props.filter((p) => p.status === 'sold').length,
        rented: props.filter((p) => p.status === 'rented').length,
        exchanged: props.filter((p) => p.status === 'exchanged').length,
        exhibitors: (profiles as unknown[])?.length || 0,
      });

      if (visits) setVisitStats(visits as unknown as VisitStats);
      if (users) setUserStats(users as unknown as UserStats);
      if (audit) setRecentAudit(audit as unknown as AuditEntry[]);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="text-center py-8 text-gray-400">جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-gray-500 mt-1">إحصائيات ومنصة قصي للعقار</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="إجمالي العقارات" value={stats.total} icon={Home} color="bg-primary-50 text-primary-600" link="/admin/properties" />
        <StatCard label="قيد المراجعة" value={stats.inReview} icon={Bell} color="bg-amber-50 text-amber-600" link="/admin/properties?status=in_review" highlight={stats.inReview > 0} />
        <StatCard label="منشورة" value={stats.published} icon={CheckCircle} color="bg-emerald-50 text-emerald-600" link="/admin/properties?status=published" />
        <StatCard label="مرفوضة" value={stats.rejected} icon={XCircle} color="bg-red-50 text-red-600" link="/admin/properties?status=rejected" />
        <StatCard label="مباعة" value={stats.sold} icon={TrendingUp} color="bg-blue-50 text-blue-600" link="/admin/properties?status=sold" />
        <StatCard label="مكراة" value={stats.rented} icon={KeyRound} color="bg-cyan-50 text-cyan-600" link="/admin/properties?status=rented" />
        <StatCard label="تم التبديل" value={stats.exchanged} icon={RefreshCw} color="bg-teal-50 text-teal-600" link="/admin/properties?status=exchanged" />
        <StatCard label="العارضون" value={stats.exhibitors} icon={Users} color="bg-gray-50 text-gray-600" link="/admin/exhibitors" />
      </div>

      {/* Visits & Users stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visits chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">زيارات الموقع</h2>
              <p className="text-xs text-gray-500">إحصائيات الزوار</p>
            </div>
          </div>
          <div className="space-y-3">
            <VisitBar label="اليوم" value={visitStats.today} max={Math.max(visitStats.today, visitStats.week, visitStats.month, 1)} color="bg-blue-500" />
            <VisitBar label="هذا الأسبوع" value={visitStats.week} max={Math.max(visitStats.today, visitStats.week, visitStats.month, 1)} color="bg-blue-400" />
            <VisitBar label="هذا الشهر" value={visitStats.month} max={Math.max(visitStats.today, visitStats.week, visitStats.month, 1)} color="bg-blue-300" />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{visitStats.total.toLocaleString('ar-DZ')}</p>
              <p className="text-xs text-gray-500">إجمالي الزيارات</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{visitStats.unique_visitors.toLocaleString('ar-DZ')}</p>
              <p className="text-xs text-gray-500">زائر فريد</p>
            </div>
          </div>
        </div>

        {/* Registered users */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">المسجلون في الموقع</h2>
              <p className="text-xs text-gray-500">إحصائيات الأعضاء</p>
            </div>
          </div>
          <div className="space-y-3">
            <VisitBar label="إجمالي المسجلين" value={userStats.total} max={Math.max(userStats.total, 1)} color="bg-emerald-500" />
            <VisitBar label="العارضون" value={userStats.exhibitors} max={Math.max(userStats.total, 1)} color="bg-emerald-400" />
            <VisitBar label="الإدارة" value={userStats.admins} max={Math.max(userStats.total, 1)} color="bg-emerald-300" />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{userStats.new_today.toLocaleString('ar-DZ')}</p>
              <p className="text-xs text-gray-500">مسجل اليوم</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{userStats.new_week.toLocaleString('ar-DZ')}</p>
              <p className="text-xs text-gray-500">مسجل هذا الأسبوع</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending review alert */}
      {stats.inReview > 0 && (
        <Link to="/admin/properties?status=in_review" className="block p-4 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-amber-600" />
            <div>
              <p className="font-bold text-amber-800">{stats.inReview} عقار ينتظر المراجعة</p>
              <p className="text-sm text-amber-600">اضغط لمراجعة العقارات الجديدة</p>
            </div>
          </div>
        </Link>
      )}

      {/* Recent activity */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">آخر العمليات</h2>
        {recentAudit.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
            {recentAudit.map((entry) => (
              <div key={entry.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                    <Archive className="w-4 h-4 text-gray-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{getAuditActionLabel(entry.action)}</span>
                </div>
                <span className="text-xs text-gray-400">{new Date(entry.created_at).toLocaleString('ar-DZ')}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-white rounded-xl border border-gray-100 text-gray-400">
            لا توجد عمليات مسجلة
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, link, highlight }: { label: string; value: number; icon: React.ElementType; color: string; link: string; highlight?: boolean }) {
  return (
    <Link
      to={link}
      className={`bg-white rounded-xl shadow-sm border p-4 transition-all hover:shadow-md ${
        highlight ? 'border-amber-300 ring-2 ring-amber-100' : 'border-gray-100'
      }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </Link>
  );
}

function VisitBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-7 bg-gray-50 rounded-lg overflow-hidden relative">
        <div
          className={`h-full ${color} rounded-lg transition-all duration-700 flex items-center justify-end px-2`}
          style={{ width: `${Math.max(percent, value > 0 ? 8 : 0)}%` }}
        >
          {value > 0 && (
            <span className="text-xs font-bold text-white">{value.toLocaleString('ar-DZ')}</span>
          )}
        </div>
      </div>
      {value === 0 && <span className="text-xs text-gray-400 w-8 text-left">0</span>}
    </div>
  );
}
