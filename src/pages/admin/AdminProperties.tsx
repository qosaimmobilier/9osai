import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, CheckCircle, XCircle, Pause, Play, Eye, Archive, Home, TrendingUp, KeyRound, RefreshCw, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Property, PropertyType, Area, PropertyImage } from '@/lib/types';
import { getPropertyStatusLabel, getPropertyStatusColor, formatPrice, getOperationTypeLabel } from '@/lib/format';

interface AdminProperty extends Property {
  property_type?: PropertyType | null;
  area?: Area | null;
  property_images?: PropertyImage[];
}

export function AdminProperties() {
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || '';
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const quickRejectReasons = [
    'ينقص عقد الملكية',
    'الصور غير واضحة',
    'المعلومات غير مكتملة',
    'مخالف لشروط النشر',
  ];

  const quickDeleteReasons = [
    'إعلان مكرر',
    'مخالف لشروط الاستخدام',
    'العقار غير متوفر فعليًا',
    'معلومات مضللة',
  ];

  const loadProperties = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc('admin_get_all_properties');
    let props = (data as AdminProperty[]) || [];

    if (statusFilter) {
      props = props.filter((p) => p.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      props = props.filter((p) => p.title.toLowerCase().includes(q));
    }

    // Fetch relations
    if (props.length > 0) {
      const typeIds = [...new Set(props.map((p) => p.property_type_id).filter(Boolean))] as string[];
      const areaIds = [...new Set(props.map((p) => p.area_id).filter(Boolean))] as string[];
      const propIds = props.map((p) => p.id);

      const [typesRes, areasRes, imagesRes] = await Promise.all([
        typeIds.length ? supabase.from('property_types').select('*').in('id', typeIds) : Promise.resolve({ data: [] }),
        areaIds.length ? supabase.from('areas').select('*').in('id', areaIds) : Promise.resolve({ data: [] }),
        supabase.from('property_images').select('*').in('property_id', propIds),
      ]);

      const typeMap = new Map((typesRes.data as PropertyType[])?.map((t) => [t.id, t]) || []);
      const areaMap = new Map((areasRes.data as Area[])?.map((a) => [a.id, a]) || []);
      const imageMap = new Map<string, PropertyImage[]>();
      (imagesRes.data as PropertyImage[])?.forEach((img) => {
        if (!imageMap.has(img.property_id)) imageMap.set(img.property_id, []);
        imageMap.get(img.property_id)!.push(img);
      });

      props = props.map((p) => ({
        ...p,
        property_type: p.property_type_id ? typeMap.get(p.property_type_id) || null : null,
        area: p.area_id ? areaMap.get(p.area_id) || null : null,
        property_images: imageMap.get(p.id) || [],
      }));
    }

    setProperties(props);
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const handleAction = async (propId: string, action: string, extra?: string) => {
    setActionLoading(true);
    try {
      if (action === 'approve') {
        await supabase.rpc('admin_approve_property', { prop_id: propId });
      } else if (action === 'reject') {
        await supabase.rpc('admin_reject_property', { prop_id: propId, reason: extra });
        setRejectingId(null);
        setRejectReason('');
      } else if (action === 'pause') {
        await supabase.rpc('admin_change_property_status', { prop_id: propId, new_status: 'paused' });
      } else if (action === 'republish') {
        await supabase.rpc('admin_change_property_status', { prop_id: propId, new_status: 'published' });
      } else if (action === 'sold') {
        await supabase.rpc('admin_change_property_status', { prop_id: propId, new_status: 'sold' });
      } else if (action === 'rented') {
        await supabase.rpc('admin_change_property_status', { prop_id: propId, new_status: 'rented' });
      } else if (action === 'exchanged') {
        await supabase.rpc('admin_change_property_status', { prop_id: propId, new_status: 'exchanged' });
      } else if (action === 'archive') {
        await supabase.rpc('admin_change_property_status', { prop_id: propId, new_status: 'archived' });
      } else if (action === 'delete') {
        await supabase.rpc('admin_delete_property', { prop_id: propId, reason: extra || 'تم حذف العقار من قبل الإدارة' });
        setDeletingId(null);
        setDeleteReason('');
      }
      await loadProperties();
    } catch (err) {
      console.error('Action failed:', err);
    }
    setActionLoading(false);
  };

  const statusTitle = statusFilter ? getPropertyStatusLabel(statusFilter as Property['status']) : 'كل العقارات';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{statusTitle}</h1>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث..."
            className="pr-9 pl-4 py-2 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">جاري التحميل...</div>
      ) : properties.length > 0 ? (
        <div className="space-y-3">
          {properties.map((prop) => {
            const primaryImg = prop.property_images?.find((img) => img.is_primary) || prop.property_images?.[0];
            return (
              <div key={prop.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-40 h-32 sm:h-auto bg-gray-100 shrink-0">
                    {primaryImg ? (
                      <img src={primaryImg.image_url} alt={prop.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-gray-900">{prop.title}</h3>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${getPropertyStatusColor(prop.status)}`}>
                        {getPropertyStatusLabel(prop.status)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
                      <span>{getOperationTypeLabel(prop.operation_type)}</span>
                      <span className="font-medium text-primary-600">{formatPrice(prop.operation_type, prop.price, prop.price_unit)}</span>
                      {prop.property_type && <span>{prop.property_type.name_ar}</span>}
                      {prop.area && <span>{prop.area.name_ar}</span>}
                    </div>

                    {prop.rejection_reason && (
                      <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg mt-2">سبب الرفض: {prop.rejection_reason}</p>
                    )}

                    {/* Actions */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Link
                        to={`/admin/property/${prop.id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" /> تفاصيل
                      </Link>

                      {prop.status === 'in_review' && (
                        <>
                          <button
                            onClick={() => handleAction(prop.id, 'approve')}
                            disabled={actionLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-sm text-emerald-700 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" /> قبول
                          </button>
                          <button
                            onClick={() => { setRejectingId(prop.id); setRejectReason(''); }}
                            disabled={actionLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-sm text-red-700 transition-colors"
                          >
                            <XCircle className="w-4 h-4" /> رفض
                          </button>
                        </>
                      )}

                      {prop.status === 'published' && (
                        <button
                          onClick={() => handleAction(prop.id, 'pause')}
                          disabled={actionLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 rounded-lg text-sm text-orange-700 transition-colors"
                        >
                          <Pause className="w-4 h-4" /> إيقاف
                        </button>
                      )}

                      {prop.status === 'paused' && (
                        <button
                          onClick={() => handleAction(prop.id, 'republish')}
                          disabled={actionLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-sm text-emerald-700 transition-colors"
                        >
                          <Play className="w-4 h-4" /> إعادة نشر
                        </button>
                      )}

                      {(prop.status === 'published' || prop.status === 'paused') && (
                        <>
                          {prop.operation_type === 'sale' && (
                            <button
                              onClick={() => handleAction(prop.id, 'sold')}
                              disabled={actionLoading}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm text-blue-700 transition-colors"
                            >
                              <TrendingUp className="w-4 h-4" /> مباع
                            </button>
                          )}
                          {prop.operation_type === 'rent' && (
                            <button
                              onClick={() => handleAction(prop.id, 'rented')}
                              disabled={actionLoading}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 rounded-lg text-sm text-cyan-700 transition-colors"
                            >
                              <KeyRound className="w-4 h-4" /> مكترى
                            </button>
                          )}
                          {prop.operation_type === 'exchange' && (
                            <button
                              onClick={() => handleAction(prop.id, 'exchanged')}
                              disabled={actionLoading}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 rounded-lg text-sm text-teal-700 transition-colors"
                            >
                              <RefreshCw className="w-4 h-4" /> تم التبديل
                            </button>
                          )}
                        </>
                      )}

                      {prop.status !== 'archived' && (
                        <>
                          <button
                            onClick={() => handleAction(prop.id, 'archive')}
                            disabled={actionLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-600 transition-colors"
                          >
                            <Archive className="w-4 h-4" /> أرشفة
                          </button>
                          <button
                            onClick={() => { setDeletingId(prop.id); setDeleteReason(''); }}
                            disabled={actionLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg text-sm text-red-700 transition-colors border border-red-200"
                          >
                            <Trash2 className="w-4 h-4" /> حذف
                          </button>
                        </>
                      )}
                    </div>

                    {/* Reject form */}
                    {rejectingId === prop.id && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg space-y-2 animate-fade-in">
                        <p className="text-xs font-medium text-red-800">اختر سببًا سريعًا أو اكتب سببًا:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {quickRejectReasons.map((r) => (
                            <button
                              key={r}
                              onClick={() => setRejectReason(r)}
                              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                                rejectReason === r
                                  ? 'border-red-400 bg-red-100 text-red-800 font-medium'
                                  : 'border-red-200 bg-white text-red-600 hover:bg-red-50'
                              }`
                            }
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="سبب الرفض..."
                          className="w-full px-3 py-2 rounded-lg border border-red-200 outline-none text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(prop.id, 'reject', rejectReason)}
                            disabled={actionLoading || !rejectReason.trim()}
                            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                          >
                            تأكيد الرفض
                          </button>
                          <button
                            onClick={() => setRejectingId(null)}
                            className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Delete form */}
                    {deletingId === prop.id && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2 animate-fade-in border border-gray-200">
                        <p className="text-xs font-medium text-gray-800">اختر سبب الحذف أو اكتب سببًا:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {quickDeleteReasons.map((r) => (
                            <button
                              key={r}
                              onClick={() => setDeleteReason(r)}
                              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                                deleteReason === r
                                  ? 'border-red-400 bg-red-100 text-red-800 font-medium'
                                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                              }`
                            }
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={deleteReason}
                          onChange={(e) => setDeleteReason(e.target.value)}
                          placeholder="سبب الحذف (اختياري)..."
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAction(prop.id, 'delete', deleteReason)}
                            disabled={actionLoading}
                            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg"
                          >
                            تأكيد الحذف
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">لا توجد عقارات</p>
        </div>
      )}
    </div>
  );
}
