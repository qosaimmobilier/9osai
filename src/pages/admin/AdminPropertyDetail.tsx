import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight, MapPin, Maximize, BedDouble, Building, Layers, FileText,
  Phone, Mail, User, Calendar, Star, Trash2, CheckCircle, XCircle,
  AlertCircle, Save, Video, X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { PropertyWithRelations, PropertyDocument, DocumentType } from '@/lib/types';
import {
  formatPrice, getOperationTypeLabel, getPropertyStatusLabel, getPropertyStatusColor,
  getDocumentVerifiedLabel, getDocumentVerifiedColor,
} from '@/lib/format';

export function AdminPropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<PropertyWithRelations | null>(null);
  const [documents, setDocuments] = useState<PropertyDocument[]>([]);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [docVerifyStatus, setDocVerifyStatus] = useState('');
  const [docReviewNotes, setDocReviewNotes] = useState('');
  const [savingDoc, setSavingDoc] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectCustom, setRejectCustom] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteCustom, setDeleteCustom] = useState('');

  const rejectReasons = [
    'ينقص عقد الملكية / السند العقاري',
    'الصور غير واضحة أو غير كافية',
    'المعلومات غير مكتملة (المساحة، السعر، الموقع)',
    'السند العقاري غير مطابق للشروط',
    'يحتاج إلى وثائق إضافية تثبت الملكية',
    'مخالف لشروط النشر في الموقع',
  ];

  const deleteReasons = [
    'إعلان مكرر',
    'مخالف لشروط الاستخدام',
    'العقار غير متوفر فعليًا',
    'معلومات مضللة أو وهمية',
    'بناءً على طلب المالك',
  ];

  useEffect(() => {
    if (!id) return;
    async function load() {
      // Get property via admin function (bypasses published-only RLS)
      const { data: allProps } = await supabase.rpc('admin_get_all_properties');
      const prop = (allProps as PropertyWithRelations[])?.find((p) => p.id === id);

      if (prop) {
        // Fetch relations
        const [typeRes, areaRes, docTypeRes, imagesRes] = await Promise.all([
          prop.property_type_id ? supabase.from('property_types').select('*').eq('id', prop.property_type_id).maybeSingle() : Promise.resolve({ data: null }),
          prop.area_id ? supabase.from('areas').select('*').eq('id', prop.area_id).maybeSingle() : Promise.resolve({ data: null }),
          prop.document_type_id ? supabase.from('document_types').select('*').eq('id', prop.document_type_id).maybeSingle() : Promise.resolve({ data: null }),
          supabase.from('property_images').select('*').eq('property_id', id).order('sort_order'),
        ]);

        setProperty({
          ...prop,
          property_type: typeRes.data as PropertyWithRelations['property_type'],
          area: areaRes.data as PropertyWithRelations['area'],
          document_type: docTypeRes.data as PropertyWithRelations['document_type'],
          property_images: (imagesRes.data as PropertyWithRelations['property_images']) || [],
        });
        setAdminNotes(prop.admin_notes || '');
        setDocVerifyStatus(prop.document_verified || 'not_reviewed');
        setDocReviewNotes(prop.document_review_notes || '');
      }

      // Get private documents
      const { data: docs } = await supabase.rpc('admin_get_property_documents', { prop_id: id });
      if (docs) setDocuments(docs as PropertyDocument[]);

      // Get all doc types
      const { data: dtData } = await supabase.from('document_types').select('*').order('sort_order');
      if (dtData) setDocTypes(dtData as DocumentType[]);

      setLoading(false);
    }
    load();
  }, [id]);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    await supabase.rpc('admin_update_property', {
      prop_id: id,
      updates: { admin_notes: adminNotes } as unknown as Record<string, unknown>,
    });
    setSavingNotes(false);
  };

  const handleSaveDocReview = async () => {
    setSavingDoc(true);
    await supabase.rpc('admin_review_document', {
      prop_id: id,
      verify_status: docVerifyStatus,
      review_notes: docReviewNotes,
    });
    setSavingDoc(false);
  };

  const handleSetPrimaryImage = async (imgId: string) => {
    await supabase.rpc('admin_set_primary_image', { img_id: imgId, prop_id: id });
    // Refresh images
    const { data: imgData } = await supabase.from('property_images').select('*').eq('property_id', id).order('sort_order');
    if (property && imgData) {
      setProperty({ ...property, property_images: imgData as PropertyWithRelations['property_images'] });
    }
  };

  const handleDeleteImage = async (imgId: string) => {
    if (!confirm('هل تريد حذف هذه الصورة؟')) return;
    await supabase.rpc('admin_delete_property_image', { img_id: imgId });
    if (property) {
      setProperty({ ...property, property_images: property.property_images?.filter((img) => img.id !== imgId) });
    }
  };

  const handleAction = async (action: string) => {
    setActionLoading(true);
    if (action === 'approve') {
      await supabase.rpc('admin_approve_property', { prop_id: id });
    } else if (action === 'pause') {
      await supabase.rpc('admin_change_property_status', { prop_id: id, new_status: 'paused' });
    } else if (action === 'republish') {
      await supabase.rpc('admin_change_property_status', { prop_id: id, new_status: 'published' });
    } else if (action === 'sold') {
      await supabase.rpc('admin_change_property_status', { prop_id: id, new_status: 'sold' });
    } else if (action === 'rented') {
      await supabase.rpc('admin_change_property_status', { prop_id: id, new_status: 'rented' });
    } else if (action === 'exchanged') {
      await supabase.rpc('admin_change_property_status', { prop_id: id, new_status: 'exchanged' });
    } else if (action === 'archive') {
      await supabase.rpc('admin_change_property_status', { prop_id: id, new_status: 'archived' });
    }
    // Refresh
    const { data: allProps } = await supabase.rpc('admin_get_all_properties');
    const prop = (allProps as PropertyWithRelations[])?.find((p) => p.id === id);
    if (prop) setProperty((prev) => prev ? { ...prev, status: prop.status } : prev);
    setActionLoading(false);
  };

  if (loading) return <div className="text-center py-8 text-gray-400">جاري التحميل...</div>;
  if (!property) return (
    <div className="text-center py-8">
      <p className="text-gray-500">العقار غير موجود</p>
      <Link to="/admin/properties" className="text-primary-600 mt-2 inline-block">العودة للعقارات</Link>
    </div>
  );

  const images = property.property_images || [];

  const handleReject = async () => {
    const reason = rejectCustom || rejectReason;
    if (!reason.trim()) return;
    setActionLoading(true);
    await supabase.rpc('admin_reject_property', { prop_id: id, reason });
    setShowRejectModal(false);
    setRejectReason('');
    setRejectCustom('');
    // Refresh
    const { data: allProps } = await supabase.rpc('admin_get_all_properties');
    const prop = (allProps as PropertyWithRelations[])?.find((p) => p.id === id);
    if (prop) setProperty((prev) => prev ? { ...prev, status: prop.status, rejection_reason: prop.rejection_reason } : prev);
    setActionLoading(false);
  };

  const handleDelete = async () => {
    const reason = deleteCustom || deleteReason || 'تم حذف العقار من قبل الإدارة';
    setActionLoading(true);
    await supabase.rpc('admin_delete_property', { prop_id: id, reason });
    setShowDeleteModal(false);
    setActionLoading(false);
    navigate('/admin/properties');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/admin/properties')} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowRight className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 flex-1">{property.title}</h1>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${getPropertyStatusColor(property.status)}`}>
          {getPropertyStatusLabel(property.status)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gallery */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="font-bold text-gray-900 mb-3">صور العقار</h2>
            {images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((img) => (
                  <div key={img.id} className="relative group rounded-lg overflow-hidden border border-gray-200">
                    <img src={img.image_url} alt="" className="w-full h-32 object-cover" />
                    {img.is_primary && (
                      <span className="absolute top-2 right-2 bg-accent-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3" /> رئيسية
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {!img.is_primary && (
                        <button onClick={() => handleSetPrimaryImage(img.id)} className="p-2 bg-white/90 rounded-lg text-gray-700" title="تعيين كرئيسية">
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => handleDeleteImage(img.id)} className="p-2 bg-red-500/90 rounded-lg text-white" title="حذف">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">لا توجد صور</p>
            )}

            {property.video_url && (
              <a href={property.video_url} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm">
                <Video className="w-4 h-4" />
                مشاهدة الفيديو
              </a>
            )}
          </div>

          {/* Property details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">معلومات العقار</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <Detail icon={Building} label="نوع العقار" value={property.property_type?.name_ar || '-'} />
              <Detail icon={Maximize} label="المساحة" value={property.area_size ? `${property.area_size} م²` : '-'} />
              <Detail icon={BedDouble} label="الغرف" value={property.rooms?.toString() || '-'} />
              <Detail icon={Layers} label="الطوابق" value={property.floors?.toString() || '-'} />
            </div>
            <div className="flex items-center gap-2 text-gray-600 mb-3">
              <MapPin className="w-5 h-5 text-primary-500" />
              <span>{property.area?.name_ar || 'غير محدد'} - قصر البخاري</span>
            </div>
            <div className="text-2xl font-bold text-primary-700 mb-4">
              {formatPrice(property.operation_type, property.price, property.price_unit)}
            </div>
            {property.description && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-1">الوصف</p>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{property.description}</p>
              </div>
            )}
            {property.operation_type === 'exchange' && (
              <div className="mt-4 p-4 bg-teal-50 rounded-lg">
                {property.exchange_conditions && <p className="text-sm text-teal-800 mb-2"><span className="font-bold">شروط التبديل: </span>{property.exchange_conditions}</p>}
                {property.exchange_target && <p className="text-sm text-teal-800"><span className="font-bold">العقار المطلوب: </span>{property.exchange_target}</p>}
              </div>
            )}
          </div>

          {/* Document info (admin sees all) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">الوثيقة العقارية</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FileText className="w-5 h-5 text-primary-500" />
                <div>
                  <p className="text-xs text-gray-500">نوع السند</p>
                  <p className="font-bold text-gray-900">{property.document_type?.name_ar || 'غير محدد'}</p>
                </div>
              </div>
              {property.document_number && (
                <div className="text-sm"><span className="text-gray-500">رقم الوثيقة: </span><span className="font-medium text-gray-900" dir="ltr">{property.document_number}</span></div>
              )}
              {property.document_date && (
                <div className="text-sm"><span className="text-gray-500">تاريخ الوثيقة: </span><span className="font-medium text-gray-900">{property.document_date}</span></div>
              )}
              {property.document_authority && (
                <div className="text-sm"><span className="text-gray-500">الجهة المصدرة: </span><span className="font-medium text-gray-900">{property.document_authority}</span></div>
              )}
              {property.document_notes && (
                <div className="text-sm"><span className="text-gray-500">ملاحظات الوثيقة: </span><span className="text-gray-700">{property.document_notes}</span></div>
              )}

              {/* Private document images */}
              {documents.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-700 mb-2">صور الوثائق الخاصة (لا تظهر للزبون)</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {documents.map((doc) => (
                      <div key={doc.id} className="relative group rounded-lg overflow-hidden border border-gray-200">
                        <img src={doc.document_url} alt="" className="w-full h-32 object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <a href={doc.document_url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/90 rounded-lg text-gray-700">فتح</a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">معلومات التواصل</h2>
            <div className="space-y-2">
              {property.contact_name && <div className="flex items-center gap-2 text-sm"><User className="w-4 h-4 text-gray-400" /><span className="text-gray-700">{property.contact_name}</span></div>}
              {property.contact_phone && <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-gray-400" /><span className="text-gray-700" dir="ltr">{property.contact_phone}</span></div>}
              {property.contact_email && <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-gray-400" /><span className="text-gray-700" dir="ltr">{property.contact_email}</span></div>}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">إجراءات</h2>
            <div className="space-y-2">
              {property.status === 'in_review' && (
                <>
                  <button onClick={() => handleAction('approve')} disabled={actionLoading} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" /> قبول ونشر
                  </button>
                  <button onClick={() => setShowRejectModal(true)} disabled={actionLoading} className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                    <XCircle className="w-5 h-5" /> رفض مع إبلاغ الناشر
                  </button>
                </>
              )}
              {property.status === 'published' && (
                <button onClick={() => handleAction('pause')} disabled={actionLoading} className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition-colors">إيقاف النشر</button>
              )}
              {property.status === 'paused' && (
                <button onClick={() => handleAction('republish')} disabled={actionLoading} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors">إعادة النشر</button>
              )}
              {(property.status === 'published' || property.status === 'paused') && property.operation_type === 'sale' && (
                <button onClick={() => handleAction('sold')} disabled={actionLoading} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors">تحديد كمباع</button>
              )}
              {(property.status === 'published' || property.status === 'paused') && property.operation_type === 'rent' && (
                <button onClick={() => handleAction('rented')} disabled={actionLoading} className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg transition-colors">تحديد كمكترى</button>
              )}
              {(property.status === 'published' || property.status === 'paused') && property.operation_type === 'exchange' && (
                <button onClick={() => handleAction('exchanged')} disabled={actionLoading} className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition-colors">تم التبديل</button>
              )}
              {property.status !== 'archived' && (
                <>
                  <button onClick={() => handleAction('archive')} disabled={actionLoading} className="w-full py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition-colors">أرشفة</button>
                  <button onClick={() => setShowDeleteModal(true)} disabled={actionLoading} className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 border border-red-200">
                    <Trash2 className="w-5 h-5" /> حذف العقار
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Document review */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">مراجعة الوثيقة</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">حالة المراجعة</label>
                <select value={docVerifyStatus} onChange={(e) => setDocVerifyStatus(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none text-sm bg-white">
                  <option value="not_reviewed">لم تتم المراجعة</option>
                  <option value="in_review">قيد المراجعة</option>
                  <option value="verified">تمت المراجعة</option>
                  <option value="needs_additional">يحتاج إلى وثيقة إضافية</option>
                  <option value="unclear">الوثيقة غير واضحة</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات الإدارة (داخلية)</label>
                <textarea value={docReviewNotes} onChange={(e) => setDocReviewNotes(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none text-sm" />
              </div>
              <button onClick={handleSaveDocReview} disabled={savingDoc} className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors text-sm disabled:opacity-50">
                {savingDoc ? 'جاري الحفظ...' : 'حفظ مراجعة الوثيقة'}
              </button>
              <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${getDocumentVerifiedColor(property.document_verified)}`}>
                {getDocumentVerifiedLabel(property.document_verified)}
              </span>
            </div>
          </div>

          {/* Admin notes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">ملاحظات الإدارة</h2>
            <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={4} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none text-sm" placeholder="ملاحظات داخلية..." />
            <button onClick={handleSaveNotes} disabled={savingNotes} className="mt-2 flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
              <Save className="w-4 h-4" /> {savingNotes ? 'جاري الحفظ...' : 'حفظ الملاحظات'}
            </button>
          </div>

          {/* Rejection reason */}
          {property.rejection_reason && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700"><span className="font-bold">سبب الرفض: </span>{property.rejection_reason}</p>
            </div>
          )}

          {/* Created date */}
          <div className="text-sm text-gray-400 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            أضيف في: {new Date(property.created_at).toLocaleString('ar-DZ')}
          </div>
        </div>
      </div>
      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                رفض العقار وإبلاغ الناشر
              </h2>
              <button onClick={() => setShowRejectModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">اختر سبب الرفض أو اكتب سببًا مخصصًا. سيظهر هذا السبب للناشر في لوحته.</p>
            <div className="space-y-2 mb-4">
              {rejectReasons.map((r) => (
                <button
                  key={r}
                  onClick={() => { setRejectReason(r); setRejectCustom(''); }}
                  className={`w-full text-right px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                    rejectReason === r && !rejectCustom
                      ? 'border-red-400 bg-red-50 text-red-800 font-medium'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`
                }
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">أو اكتب سببًا مخصصًا</label>
              <textarea
                value={rejectCustom}
                onChange={(e) => { setRejectCustom(e.target.value); setRejectReason(''); }}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none text-sm"
                placeholder="اكتب السبب هنا..."
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowRejectModal(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition-colors">
                إلغاء
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || (!rejectReason && !rejectCustom.trim())}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'جاري الرفض...' : 'تأكيد الرفض'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600" />
                حذف العقار نهائيًا
              </h2>
              <button onClick={() => setShowDeleteModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-4 bg-red-50 rounded-lg mb-4 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">سيتم أرشفة العقار وإبلاغ الناشر بالسبب. لا يمكن للناشر إعادة نشر هذا العقار.</p>
            </div>
            <p className="text-sm font-medium text-gray-700 mb-3">اختر سبب الحذف:</p>
            <div className="space-y-2 mb-4">
              {deleteReasons.map((r) => (
                <button
                  key={r}
                  onClick={() => { setDeleteReason(r); setDeleteCustom(''); }}
                  className={`w-full text-right px-4 py-2.5 rounded-lg border text-sm transition-colors ${
                    deleteReason === r && !deleteCustom
                      ? 'border-red-400 bg-red-50 text-red-800 font-medium'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`
                }
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">أو اكتب سببًا مخصصًا</label>
              <textarea
                value={deleteCustom}
                onChange={(e) => { setDeleteCustom(e.target.value); setDeleteReason(''); }}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none text-sm"
                placeholder="اكتب السبب هنا..."
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition-colors">
                إلغاء
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'جاري الحذف...' : 'تأكيد الحذف'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="text-center p-3 bg-gray-50 rounded-xl">
      <Icon className="w-6 h-6 text-primary-500 mx-auto mb-1" />
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-bold text-gray-900 text-sm">{value}</p>
    </div>
  );
}
