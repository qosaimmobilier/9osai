import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Building, Eye, CheckCircle, XCircle, Pause, Play, Archive, Trash2, Star, MapPin, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import type { Property, PropertyStatus } from '@/types';
import { PROPERTY_STATUS_LABELS, PROPERTY_STATUS_COLORS, OPERATION_LABELS, OPERATION_COLORS, formatPrice, formatDate } from '@/lib/constants';

export function AdminPropertiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');

  useEffect(() => {
    fetchProperties();
  }, [statusFilter, search]);

  const fetchProperties = async () => {
    setLoading(true);
    let query = supabase
      .from('properties')
      .select(`
        *,
        property_type:property_types(*),
        advertiser:profiles(*),
        images:property_images(*)
      `)
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (search) query = query.ilike('title', `%${search}%`);

    const { data } = await query.limit(50);
    if (data) setProperties(data as Property[]);
    setLoading(false);
  };

  const handleStatusChange = async (id: string, status: PropertyStatus, reason?: string) => {
    const updateData: any = { status };
    if (status === 'rejected' && reason) updateData.rejection_reason = reason;
    if (status === 'published') updateData.rejection_reason = null;
    await supabase.from('properties').update(updateData).eq('id', id);
    fetchProperties();
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    await supabase.from('properties').update({ featured: !current }).eq('id', id);
    fetchProperties();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العقار نهائيًا؟')) return;
    await supabase.from('properties').delete().eq('id', id);
    fetchProperties();
  };

  const statusFilters = [
    { value: 'all', label: 'الكل' },
    { value: 'pending_review', label: 'قيد المراجعة' },
    { value: 'published', label: 'منشور' },
    { value: 'rejected', label: 'مرفوض' },
    { value: 'suspended', label: 'متوقف' },
    { value: 'sold', label: 'تم البيع' },
    { value: 'rented', label: 'تم الكراء' },
    { value: 'exchanged', label: 'تم التبديل' },
    { value: 'archived', label: 'مؤرشف' },
  ];

  return (
    <DashboardLayout role="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">إدارة العقارات</h1>
        <p className="text-sm text-gray-500 mt-1">{properties.length} عقار</p>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pr-10"
            placeholder="بحث بالعنوان..."
          />
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
        {statusFilters.map((f) => (
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
          {[...Array(5)].map((_, i) => (
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
              <div key={p.id} className="card p-4">
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    {cover ? (
                      <img src={cover.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Building className="w-10 h-10 text-gray-300 m-auto mt-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{p.title}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`badge ${OPERATION_COLORS[p.operation_type]}`}>
                        {OPERATION_LABELS[p.operation_type]}
                      </span>
                      <span className={`badge ${PROPERTY_STATUS_COLORS[p.status as PropertyStatus]}`}>
                        {PROPERTY_STATUS_LABELS[p.status as PropertyStatus]}
                      </span>
                      {p.featured && <span className="badge bg-primary-100 text-primary-700 flex items-center gap-1"><Star className="w-3 h-3" /> مميز</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 flex-wrap">
                      <span>{formatPrice(p.price)}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{p.municipality || '-'}</span>
                      <span>العارض: {p.advertiser?.name || '-'}</span>
                      <span>{formatDate(p.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {p.status === 'pending_review' && (
                      <Link to={`/admin/review/${p.id}`} className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100" title="مراجعة">
                        <Eye className="w-5 h-5" />
                      </Link>
                    )}
                    {p.status === 'published' && (
                      <Link to={`/property/${p.id}`} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100" title="عرض">
                        <Eye className="w-5 h-5" />
                      </Link>
                    )}
                    <button
                      onClick={() => handleToggleFeatured(p.id, p.featured)}
                      className={`p-2 rounded-lg ${p.featured ? 'bg-primary-100 text-primary-600' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                      title="تمييز"
                    >
                      <Star className="w-5 h-5" />
                    </button>
                    {p.status === 'pending_review' && (
                      <button onClick={() => handleStatusChange(p.id, 'published')} className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100" title="قبول ونشر">
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    {p.status === 'pending_review' && (
                      <button onClick={() => { const reason = prompt('سبب الرفض:'); if (reason) handleStatusChange(p.id, 'rejected', reason); }} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" title="رفض">
                        <XCircle className="w-5 h-5" />
                      </button>
                    )}
                    {p.status === 'published' && (
                      <button onClick={() => handleStatusChange(p.id, 'suspended')} className="p-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100" title="إيقاف">
                        <Pause className="w-5 h-5" />
                      </button>
                    )}
                    {p.status === 'suspended' && (
                      <button onClick={() => handleStatusChange(p.id, 'published')} className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100" title="إعادة نشر">
                        <Play className="w-5 h-5" />
                      </button>
                    )}
                    <button onClick={() => handleStatusChange(p.id, 'archived')} className="p-2 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100" title="أرشفة">
                      <Archive className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" title="حذف نهائي">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Building className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">لا توجد عقارات</p>
        </div>
      )}
    </DashboardLayout>
  );
}
