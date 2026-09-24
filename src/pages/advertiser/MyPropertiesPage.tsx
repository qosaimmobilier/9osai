import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building, PlusCircle, Eye, Edit, Pause, Play, Trash2, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import type { Property, PropertyStatus } from '@/types';
import { PROPERTY_STATUS_LABELS, PROPERTY_STATUS_COLORS, OPERATION_LABELS, OPERATION_COLORS, formatPrice, formatDate } from '@/lib/constants';

export function MyPropertiesPage() {
  const { session } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchProperties();
  }, [session]);

  const fetchProperties = async () => {
    if (!session?.user) return;
    const { data } = await supabase
      .from('properties')
      .select(`
        *,
        property_type:property_types(*),
        images:property_images(*)
      `)
      .eq('advertiser_id', session.user.id)
      .order('created_at', { ascending: false });
    if (data) setProperties(data as Property[]);
    setLoading(false);
  };

  const handleToggleSuspend = async (id: string, currentStatus: PropertyStatus) => {
    const newStatus = currentStatus === 'suspended' ? 'pending_review' : 'suspended';
    await supabase.from('properties').update({ status: newStatus }).eq('id', id);
    fetchProperties();
  };

  const handleMarkAs = async (id: string, status: PropertyStatus) => {
    await supabase.from('properties').update({ status }).eq('id', id);
    fetchProperties();
  };

  const filtered = filter === 'all' ? properties : properties.filter((p) => p.status === filter);

  const statusFilters: { value: string; label: string }[] = [
    { value: 'all', label: 'الكل' },
    { value: 'published', label: 'منشور' },
    { value: 'pending_review', label: 'قيد المراجعة' },
    { value: 'rejected', label: 'مرفوض' },
    { value: 'suspended', label: 'متوقف' },
    { value: 'sold', label: 'تم البيع' },
    { value: 'rented', label: 'تم الكراء' },
    { value: 'exchanged', label: 'تم التبديل' },
  ];

  return (
    <DashboardLayout role="advertiser">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">عقاراتي</h1>
          <p className="text-sm text-gray-500 mt-1">{properties.length} عقار</p>
        </div>
        <Link to="/dashboard/add-property" className="btn-primary flex items-center gap-2">
          <PlusCircle className="w-5 h-5" />
          إضافة عقار
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
        {statusFilters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.value ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
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
              <div className="skeleton h-20 w-full"></div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((p) => {
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
                      {p.featured && <span className="badge bg-primary-100 text-primary-700">مميز</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {[p.municipality, p.area].filter(Boolean).join('، ') || '-'}
                      </span>
                      <span>{formatPrice(p.price)}</span>
                      <span>{formatDate(p.created_at)}</span>
                    </div>
                    {p.status === 'rejected' && p.rejection_reason && (
                      <div className="mt-2 p-2 rounded-lg bg-red-50 text-red-700 text-sm">
                        سبب الرفض: {p.rejection_reason}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {p.status === 'published' && (
                      <Link to={`/property/${p.id}`} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100" title="عرض">
                        <Eye className="w-5 h-5" />
                      </Link>
                    )}
                    <Link to={`/dashboard/properties/${p.id}`} className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100" title="تفاصيل">
                      <Building className="w-5 h-5" />
                    </Link>
                    <Link to={`/dashboard/edit-property/${p.id}`} className="p-2 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100" title="تعديل">
                      <Edit className="w-5 h-5" />
                    </Link>
                    {(p.status === 'published' || p.status === 'suspended') && (
                      <button
                        onClick={() => handleToggleSuspend(p.id, p.status as PropertyStatus)}
                        className="p-2 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100"
                        title={p.status === 'suspended' ? 'إعادة تفعيل' : 'إيقاف'}
                      >
                        {p.status === 'suspended' ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                      </button>
                    )}
                    {p.status === 'published' && p.operation_type === 'sale' && (
                      <button onClick={() => handleMarkAs(p.id, 'sold')} className="p-2 rounded-lg bg-cyan-50 text-cyan-600 hover:bg-cyan-100" title="تم البيع">
                        <Building className="w-5 h-5" />
                      </button>
                    )}
                    {p.status === 'published' && p.operation_type === 'rent' && (
                      <button onClick={() => handleMarkAs(p.id, 'rented')} className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100" title="تم الكراء">
                        <Building className="w-5 h-5" />
                      </button>
                    )}
                    {p.status === 'published' && p.operation_type === 'exchange' && (
                      <button onClick={() => handleMarkAs(p.id, 'exchanged')} className="p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100" title="تم التبديل">
                        <Building className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Building className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 mb-4">
            {filter === 'all' ? 'لم تقم بإضافة أي عقار بعد' : 'لا توجد عقارات بهذه الحالة'}
          </p>
          <Link to="/dashboard/add-property" className="btn-primary inline-flex items-center gap-2">
            <PlusCircle className="w-5 h-5" />
            إضافة عقار
          </Link>
        </div>
      )}
    </DashboardLayout>
  );
}
