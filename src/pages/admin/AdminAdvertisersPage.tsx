import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Users, Search, Phone, Mail, Building, Pause, Play, Ban, CheckCircle, ArrowRight, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import type { Profile, Property, PropertyStatus } from '@/types';
import { PROPERTY_STATUS_LABELS, PROPERTY_STATUS_COLORS, formatDate } from '@/lib/constants';

export function AdminAdvertisersPage() {
  const [advertisers, setAdvertisers] = useState<(Profile & { property_count?: number; published_count?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchAdvertisers();
  }, [search, statusFilter]);

  const fetchAdvertisers = async () => {
    setLoading(true);
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'advertiser')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (search) query = query.ilike('name', `%${search}%`);

    const { data } = await query.limit(50);
    if (data) {
      const advList = data as Profile[];
      // Get property counts
      const withCounts = await Promise.all(
        advList.map(async (adv) => {
          const [{ count: total }, { count: published }] = await Promise.all([
            supabase.from('properties').select('id', { count: 'exact', head: true }).eq('advertiser_id', adv.id),
            supabase.from('properties').select('id', { count: 'exact', head: true }).eq('advertiser_id', adv.id).eq('status', 'published'),
          ]);
          return { ...adv, property_count: total || 0, published_count: published || 0 };
        })
      );
      setAdvertisers(withCounts);
    }
    setLoading(false);
  };

  const handleStatusChange = async (id: string, status: string) => {
    await supabase.from('profiles').update({ status }).eq('id', id);
    fetchAdvertisers();
  };

  return (
    <DashboardLayout role="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">العارضون</h1>
        <p className="text-sm text-gray-500 mt-1">{advertisers.length} عارض</p>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pr-10" placeholder="بحث بالاسم..." />
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
        {[
          { value: 'all', label: 'الكل' },
          { value: 'active', label: 'نشط' },
          { value: 'suspended', label: 'موقوف' },
          { value: 'banned', label: 'محظور' },
          { value: 'pending_review', label: 'بانتظار المراجعة' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === f.value ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4">
              <div className="skeleton h-16 w-full"></div>
            </div>
          ))}
        </div>
      ) : advertisers.length > 0 ? (
        <div className="space-y-3">
          {advertisers.map((adv) => (
            <div key={adv.id} className="card p-4">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold shrink-0">
                  {adv.name?.charAt(0) || '؟'}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900">{adv.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> <span dir="ltr">{adv.phone}</span></span>
                    {adv.email && <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> <span dir="ltr">{adv.email}</span></span>}
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDate(adv.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className={`badge ${adv.status === 'active' ? 'bg-green-100 text-green-700' : adv.status === 'suspended' ? 'bg-orange-100 text-orange-700' : adv.status === 'banned' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {adv.status === 'active' ? 'نشط' : adv.status === 'suspended' ? 'موقوف' : adv.status === 'banned' ? 'محظور' : 'بانتظار المراجعة'}
                    </span>
                    <span className="text-sm text-gray-500">{adv.property_count} عقار ({adv.published_count} منشور)</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Link to={`/admin/advertisers/${adv.id}`} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100" title="عرض الملف">
                    <Users className="w-5 h-5" />
                  </Link>
                  {adv.status === 'active' && (
                    <button onClick={() => handleStatusChange(adv.id, 'suspended')} className="p-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100" title="إيقاف">
                      <Pause className="w-5 h-5" />
                    </button>
                  )}
                  {adv.status === 'suspended' && (
                    <button onClick={() => handleStatusChange(adv.id, 'active')} className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100" title="إعادة تفعيل">
                      <Play className="w-5 h-5" />
                    </button>
                  )}
                  {adv.status !== 'banned' && (
                    <button onClick={() => handleStatusChange(adv.id, 'banned')} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" title="حظر">
                      <Ban className="w-5 h-5" />
                    </button>
                  )}
                  {adv.status === 'banned' && (
                    <button onClick={() => handleStatusChange(adv.id, 'active')} className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100" title="إلغاء الحظر">
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">لا يوجد عارضون</p>
        </div>
      )}
    </DashboardLayout>
  );
}

export function AdminAdvertiserDetailsPage() {
  const { id } = useParams();
  const [advertiser, setAdvertiser] = useState<Profile | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('properties')
        .select(`*, property_type:property_types(*), images:property_images(*)`)
        .eq('advertiser_id', id)
        .order('created_at', { ascending: false }),
    ]).then(([advData, propData]) => {
      if (advData.data) setAdvertiser(advData.data as Profile);
      if (propData.data) setProperties(propData.data as Property[]);
      setLoading(false);
    });
  }, [id]);

  const handleStatusChange = async (status: string) => {
    if (!id) return;
    await supabase.from('profiles').update({ status }).eq('id', id);
    if (advertiser) setAdvertiser({ ...advertiser, status: status as any });
  };

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="animate-pulse space-y-4">
          <div className="skeleton h-8 w-1/3"></div>
          <div className="skeleton h-32 rounded-xl"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!advertiser) {
    return (
      <DashboardLayout role="admin">
        <div className="text-center py-16">
          <p className="text-gray-500">العارض غير موجود</p>
          <Link to="/admin/advertisers" className="btn-primary inline-flex mt-4">العودة للعارضين</Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Link to="/admin/advertisers" className="hover:text-primary-600">العارضون</Link>
        <ArrowRight className="w-4 h-4" />
        <span className="text-gray-700">{advertiser.name}</span>
      </div>

      <div className="card p-6 mb-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-2xl shrink-0">
            {advertiser.name?.charAt(0) || '؟'}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">{advertiser.name}</h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 flex-wrap">
              <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> <span dir="ltr">{advertiser.phone}</span></span>
              {advertiser.email && <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> <span dir="ltr">{advertiser.email}</span></span>}
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDate(advertiser.created_at)}</span>
            </div>
            <div className="mt-2">
              <span className={`badge ${advertiser.status === 'active' ? 'bg-green-100 text-green-700' : advertiser.status === 'suspended' ? 'bg-orange-100 text-orange-700' : advertiser.status === 'banned' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                {advertiser.status === 'active' ? 'نشط' : advertiser.status === 'suspended' ? 'موقوف' : advertiser.status === 'banned' ? 'محظور' : 'بانتظار المراجعة'}
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {advertiser.status === 'active' ? (
              <button onClick={() => handleStatusChange('suspended')} className="btn-secondary text-sm flex items-center gap-2">
                <Pause className="w-4 h-4" /> إيقاف
              </button>
            ) : advertiser.status === 'suspended' ? (
              <button onClick={() => handleStatusChange('active')} className="btn-primary text-sm flex items-center gap-2">
                <Play className="w-4 h-4" /> تفعيل
              </button>
            ) : null}
            {advertiser.status !== 'banned' ? (
              <button onClick={() => handleStatusChange('banned')} className="btn-danger text-sm flex items-center gap-2">
                <Ban className="w-4 h-4" /> حظر
              </button>
            ) : (
              <button onClick={() => handleStatusChange('active')} className="btn-primary text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> إلغاء الحظر
              </button>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">عقاراته ({properties.length})</h2>
        {properties.length > 0 ? (
          <div className="space-y-3">
            {properties.map((p) => {
              const cover = p.images?.find((img) => img.is_cover) || p.images?.[0];
              return (
                <Link key={p.id} to={`/admin/review/${p.id}`} className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    {cover ? <img src={cover.image_url} alt="" className="w-full h-full object-cover" /> : <Building className="w-8 h-8 text-gray-300 m-auto mt-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{p.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`badge ${PROPERTY_STATUS_COLORS[p.status as PropertyStatus]}`}>
                        {PROPERTY_STATUS_LABELS[p.status as PropertyStatus]}
                      </span>
                      <span className="text-sm text-gray-500">{formatDate(p.created_at)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <Building className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">لا توجد عقارات</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
