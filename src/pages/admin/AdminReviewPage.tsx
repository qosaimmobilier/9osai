import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Building, MapPin, Phone, Mail, User, CheckCircle, XCircle, Pause, Archive, Edit, AlertCircle, ArrowRight, Star, Bed, Bath, Maximize, Calendar, Layers, Check, Play } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import type { Property, Profile, Feature, PropertyStatus } from '@/types';
import { PROPERTY_STATUS_LABELS, PROPERTY_STATUS_COLORS, OPERATION_LABELS, OPERATION_COLORS, CONDITION_LABELS, formatPrice, formatDate, formatDateTime } from '@/lib/constants';

export function AdminReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [advertiser, setAdvertiser] = useState<Profile | null>(null);
  const [advertiserPropertyCount, setAdvertiserPropertyCount] = useState(0);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      supabase
        .from('properties')
        .select(`*, property_type:property_types(*), advertiser:profiles(*), images:property_images(*), videos:property_videos(*)`)
        .eq('id', id)
        .maybeSingle(),
      supabase.from('property_features').select('feature:features(*)').eq('property_id', id),
      supabase.from('moderation_logs').select('*, admin:profiles(name)').eq('property_id', id).order('created_at', { ascending: false }),
    ]).then(([propData, featData, logData]) => {
      if (propData.data) {
        const p = propData.data as Property;
        setProperty(p);
        if (p.advertiser) {
          setAdvertiser(p.advertiser as Profile);
          supabase.from('properties').select('id', { count: 'exact', head: true }).eq('advertiser_id', p.advertiser_id)
            .then(({ count }) => setAdvertiserPropertyCount(count || 0));
        }
      }
      if (featData.data) setFeatures(featData.data.map((f: any) => f.feature as Feature));
      if (logData.data) setLogs(logData.data);
      setLoading(false);
    });
  }, [id]);

  const handleStatusChange = async (status: PropertyStatus, reason?: string) => {
    if (!id) return;
    setActionLoading(true);
    const updateData: any = { status };
    if (status === 'rejected' && reason) updateData.rejection_reason = reason;
    if (status === 'published') updateData.rejection_reason = null;
    await supabase.from('properties').update(updateData).eq('id', id);
    setActionLoading(false);
    navigate('/admin/properties');
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    await handleStatusChange('rejected', rejectReason);
  };

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="animate-pulse space-y-4">
          <div className="skeleton h-8 w-1/3"></div>
          <div className="skeleton h-64 rounded-xl"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!property) {
    return (
      <DashboardLayout role="admin">
        <div className="text-center py-16">
          <Building className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">العقار غير موجود</p>
          <Link to="/admin/properties" className="btn-primary inline-flex mt-4">العودة للعقارات</Link>
        </div>
      </DashboardLayout>
    );
  }

  const cover = property.images?.find((img) => img.is_cover) || property.images?.[0];

  return (
    <DashboardLayout role="admin">
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Link to="/admin/properties" className="hover:text-primary-600">العقارات</Link>
        <ArrowRight className="w-4 h-4" />
        <span className="text-gray-700">{property.title}</span>
      </div>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className={`badge ${PROPERTY_STATUS_COLORS[property.status as PropertyStatus]}`}>
              {PROPERTY_STATUS_LABELS[property.status as PropertyStatus]}
            </span>
            <span className={`badge ${OPERATION_COLORS[property.operation_type]}`}>
              {OPERATION_LABELS[property.operation_type]}
            </span>
            {property.featured && <span className="badge bg-primary-100 text-primary-700 flex items-center gap-1"><Star className="w-3 h-3" /> مميز</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          {property.images && property.images.length > 0 && (
            <div className="card p-4">
              <h2 className="font-bold text-gray-900 mb-3">الصور ({property.images.length})</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {property.images.map((img) => (
                  <div key={img.id} className="relative aspect-video rounded-lg overflow-hidden border border-gray-200">
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                    {img.is_cover && <span className="absolute top-1 right-1 badge bg-primary-500 text-white text-xs">رئيسية</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Video */}
          {property.videos && property.videos.length > 0 && (
            <div className="card p-4">
              <h2 className="font-bold text-gray-900 mb-3">الفيديو</h2>
              {property.videos[0].is_external ? (
                <a href={property.videos[0].video_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                  {property.videos[0].video_url}
                </a>
              ) : (
                <video src={property.videos[0].video_url} controls className="w-full rounded-lg" />
              )}
            </div>
          )}

          {/* Specs */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-900 mb-4">المواصفات</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <SpecItem icon={Building} label="نوع العقار" value={property.property_type?.name || '-'} />
              <SpecItem icon={Maximize} label="المساحة" value={property.area_size ? `${property.area_size} م²` : '-'} />
              <SpecItem icon={Bed} label="الغرف" value={property.rooms?.toString() || '-'} />
              <SpecItem icon={Bath} label="الحمامات" value={property.bathrooms?.toString() || '-'} />
              <SpecItem icon={Layers} label="الطوابق" value={property.floors?.toString() || '-'} />
              <SpecItem icon={Layers} label="الطابق" value={property.floor_number?.toString() || '-'} />
              <SpecItem icon={Building} label="الواجهات" value={property.facades?.toString() || '-'} />
              <SpecItem icon={Calendar} label="العمر" value={property.age ? `${property.age} سنة` : '-'} />
              <SpecItem icon={Check} label="الحالة" value={property.condition ? CONDITION_LABELS[property.condition] : '-'} />
            </div>
          </div>

          {/* Features */}
          {features.length > 0 && (
            <div className="card p-6">
              <h2 className="font-bold text-gray-900 mb-4">المميزات</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {features.map((f) => (
                  <div key={f.id} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    {f.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {property.description && (
            <div className="card p-6">
              <h2 className="font-bold text-gray-900 mb-3">الوصف</h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{property.description}</p>
            </div>
          )}

          {/* Exchange info */}
          {property.operation_type === 'exchange' && (property.exchange_for || property.exchange_conditions) && (
            <div className="card p-6">
              <h2 className="font-bold text-gray-900 mb-4">معلومات التبديل</h2>
              {property.exchange_for && <p className="text-sm mb-2"><span className="text-gray-500">يبحث عن:</span> {property.exchange_for}</p>}
              {property.exchange_conditions && <p className="text-sm"><span className="text-gray-500">شروط التبديل:</span> {property.exchange_conditions}</p>}
            </div>
          )}

          {/* Moderation logs */}
          {logs.length > 0 && (
            <div className="card p-6">
              <h2 className="font-bold text-gray-900 mb-4">سجل الإجراءات</h2>
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm border-b border-gray-100 pb-3 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      <Edit className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-gray-900">
                        <span className="font-medium">{log.admin?.name || 'إدارة'}</span>
                        {' — '}
                        {log.new_status ? PROPERTY_STATUS_LABELS[log.new_status as PropertyStatus] : log.action}
                      </p>
                      {log.reason && <p className="text-gray-500 text-xs mt-1">السبب: {log.reason}</p>}
                      <p className="text-gray-400 text-xs mt-1">{formatDateTime(log.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Advertiser info */}
          {advertiser && (
            <div className="card p-6">
              <h2 className="font-bold text-gray-900 mb-4">معلومات العارض</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{advertiser.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span dir="ltr">{advertiser.phone}</span>
                </div>
                {advertiser.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span dir="ltr">{advertiser.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className={`badge ${advertiser.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {advertiser.status === 'active' ? 'نشط' : advertiser.status === 'suspended' ? 'موقوف' : advertiser.status === 'banned' ? 'محظور' : 'بانتظار المراجعة'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Building className="w-4 h-4" />
                  <span>{advertiserPropertyCount} إعلان</span>
                </div>
                <div className="text-xs text-gray-400">تاريخ التسجيل: {formatDate(advertiser.created_at)}</div>
              </div>
              <Link to={`/admin/advertisers/${advertiser.id}`} className="btn-secondary w-full mt-4 text-sm">
                عرض ملف العارض
              </Link>
            </div>
          )}

          {/* Location */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-900 mb-4">الموقع</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              {[property.wilaya, property.municipality, property.area].filter(Boolean).join('، ')}
            </div>
            {property.address && <p className="text-xs text-gray-500 mt-2">{property.address}</p>}
          </div>

          {/* Price */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-900 mb-2">السعر</h2>
            <p className="text-2xl font-bold text-primary-600">{formatPrice(property.price)}</p>
          </div>

          {/* Admin actions */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-900 mb-4">إجراءات الإدارة</h2>

            {rejectMode ? (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">سبب الرفض *</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="input-field min-h-[80px]"
                  placeholder="مثال: يرجى إضافة صور واضحة للعقار."
                />
                <div className="flex gap-2">
                  <button onClick={handleReject} disabled={!rejectReason.trim() || actionLoading} className="btn-danger flex-1 text-sm">
                    تأكيد الرفض
                  </button>
                  <button onClick={() => { setRejectMode(false); setRejectReason(''); }} className="btn-secondary text-sm">
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {property.status === 'pending_review' && (
                  <button
                    onClick={() => handleStatusChange('published')}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all disabled:opacity-60"
                  >
                    <CheckCircle className="w-5 h-5" />
                    قبول ونشر
                  </button>
                )}
                {property.status !== 'rejected' && property.status !== 'pending_review' && (
                  <button
                    onClick={() => handleStatusChange('pending_review')}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-amber-600 transition-all disabled:opacity-60"
                  >
                    <AlertCircle className="w-5 h-5" />
                    إعادة للمراجعة
                  </button>
                )}
                {property.status !== 'rejected' && (
                  <button
                    onClick={() => setRejectMode(true)}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-lg font-semibold hover:bg-red-100 transition-all"
                  >
                    <XCircle className="w-5 h-5" />
                    رفض
                  </button>
                )}
                {property.status === 'published' && (
                  <button
                    onClick={() => handleStatusChange('suspended')}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 bg-orange-50 text-orange-600 px-4 py-3 rounded-lg font-semibold hover:bg-orange-100 transition-all"
                  >
                    <Pause className="w-5 h-5" />
                    إيقاف
                  </button>
                )}
                {property.status === 'suspended' && (
                  <button
                    onClick={() => handleStatusChange('published')}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 bg-green-50 text-green-600 px-4 py-3 rounded-lg font-semibold hover:bg-green-100 transition-all"
                  >
                    <Play className="w-5 h-5" />
                    إعادة نشر
                  </button>
                )}
                <button
                  onClick={() => handleStatusChange('archived')}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gray-50 text-gray-600 px-4 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all"
                >
                  <Archive className="w-5 h-5" />
                  أرشفة
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function SpecItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
      <Icon className="w-5 h-5 text-gray-400 shrink-0" />
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-sm font-medium text-gray-900">{value}</div>
      </div>
    </div>
  );
}
