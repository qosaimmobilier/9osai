import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Send, ArrowRight, AlertCircle, Upload, X, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { PropertyType, Area, DocumentType, PropertyImage, OperationType, Property } from '@/lib/types';
import { formatPricePreview, formatPriceInputLabel, formatPriceInputPlaceholder } from '@/lib/format';

interface FormData {
  title: string;
  description: string;
  operation_type: OperationType;
  property_type_id: string;
  area_id: string;
  price: string;
  exchange_conditions: string;
  exchange_target: string;
  exchange_price_diff: string;
  area_size: string;
  rooms: string;
  floors: string;
  bathrooms: string;
  document_type_id: string;
  document_number: string;
  document_date: string;
  document_authority: string;
  document_notes: string;
  video_url: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
}

export function PropertyForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isEdit = !!id;

  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>('draft');

  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    operation_type: 'sale',
    property_type_id: '',
    area_id: '',
    price: '',
    exchange_conditions: '',
    exchange_target: '',
    exchange_price_diff: '',
    area_size: '',
    rooms: '',
    floors: '',
    bathrooms: '',
    document_type_id: '',
    document_number: '',
    document_date: '',
    document_authority: '',
    document_notes: '',
    video_url: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
  });

  useEffect(() => {
    Promise.all([
      supabase.from('property_types').select('*').order('sort_order'),
      supabase.from('areas').select('*').order('sort_order'),
      supabase.from('document_types').select('*').order('sort_order'),
    ]).then(([ptRes, areaRes, dtRes]) => {
      if (ptRes.data) setPropertyTypes(ptRes.data as PropertyType[]);
      if (areaRes.data) setAreas(areaRes.data as Area[]);
      if (dtRes.data) setDocTypes(dtRes.data as DocumentType[]);
    });
  }, []);

  useEffect(() => {
    if (!id) return;
    async function loadProperty() {
      const { data } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (data) {
        const p = data as Property;
        setExistingId(p.id);
        setCurrentStatus(p.status);
        setForm({
          title: p.title || '',
          description: p.description || '',
          operation_type: p.operation_type,
          property_type_id: p.property_type_id || '',
          area_id: p.area_id || '',
          price: p.price?.toString() || '',
          exchange_conditions: p.exchange_conditions || '',
          exchange_target: p.exchange_target || '',
          exchange_price_diff: p.exchange_price_diff?.toString() || '',
          area_size: p.area_size?.toString() || '',
          rooms: p.rooms?.toString() || '',
          floors: p.floors?.toString() || '',
          bathrooms: p.bathrooms?.toString() || '',
          document_type_id: p.document_type_id || '',
          document_number: p.document_number || '',
          document_date: p.document_date || '',
          document_authority: p.document_authority || '',
          document_notes: p.document_notes || '',
          video_url: p.video_url || '',
          contact_name: p.contact_name || '',
          contact_phone: p.contact_phone || '',
          contact_email: p.contact_email || '',
        });

        const { data: imgData } = await supabase
          .from('property_images')
          .select('*')
          .eq('property_id', id)
          .order('sort_order');
        if (imgData) setImages(imgData as PropertyImage[]);
      }
      setLoading(false);
    }
    loadProperty();
  }, [id]);

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const buildPropertyData = (status: 'draft' | 'in_review') => {
    const priceUnit = form.operation_type === 'sale' ? 'million' : form.operation_type === 'rent' ? 'dzd_monthly' : 'exchange_diff';
    return {
      title: form.title,
      description: form.description || null,
      operation_type: form.operation_type,
      property_type_id: form.property_type_id || null,
      area_id: form.area_id || null,
      price: form.operation_type === 'exchange'
        ? (form.exchange_price_diff ? parseFloat(form.exchange_price_diff) : null)
        : (form.price ? parseFloat(form.price) : null),
      price_unit: form.operation_type === 'exchange' ? (form.exchange_price_diff ? 'exchange_diff' : null) : priceUnit,
      exchange_conditions: form.exchange_conditions || null,
      exchange_target: form.exchange_target || null,
      exchange_price_diff: form.exchange_price_diff ? parseFloat(form.exchange_price_diff) : null,
      area_size: form.area_size ? parseFloat(form.area_size) : null,
      rooms: form.rooms ? parseInt(form.rooms) : null,
      floors: form.floors ? parseInt(form.floors) : null,
      bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
      document_type_id: form.document_type_id || null,
      document_number: form.document_number || null,
      document_date: form.document_date || null,
      document_authority: form.document_authority || null,
      document_notes: form.document_notes || null,
      video_url: form.video_url || null,
      contact_name: form.contact_name || null,
      contact_phone: form.contact_phone || null,
      contact_email: form.contact_email || null,
      status,
    };
  };

  const handleSave = async (submitForReview: boolean) => {
    setError(null);
    if (!form.title.trim()) {
      setError('العنوان مطلوب');
      return;
    }
    if (form.operation_type !== 'exchange' && !form.price) {
      setError('السعر مطلوب للبيع والكراء');
      return;
    }
    if (!form.property_type_id) {
      setError('نوع العقار مطلوب');
      return;
    }
    if (!form.area_id) {
      setError('المنطقة مطلوبة');
      return;
    }

    setSaving(true);
    const status = submitForReview ? 'in_review' : 'draft';
    const data = buildPropertyData(status);

    if (existingId) {
      // Only allow edit if not published/paused/sold/etc (owner can edit draft/rejected/in_review)
      const { error: updateError } = await supabase
        .from('properties')
        .update(data)
        .eq('id', existingId)
        .eq('owner_id', profile?.id);
      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
      navigate('/dashboard/my-properties');
    } else {
      const { data: newProp, error: insertError } = await supabase
        .from('properties')
        .insert({ ...data, owner_id: profile?.id })
        .select()
        .single();
      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
      setExistingId(newProp.id);
      setCurrentStatus(status);
      navigate('/dashboard/my-properties');
    }
    setSaving(false);
  };

  const handleImageUpload = async (files: FileList) => {
    if (!existingId && !profile?.id) return;
    setUploadingImages(true);

    // If no existing property, save as draft first
    let propId = existingId;
    if (!propId) {
      const data = buildPropertyData('draft');
      const { data: newProp, error } = await supabase
        .from('properties')
        .insert({ ...data, owner_id: profile?.id })
        .select()
        .single();
      if (error) {
        setError(error.message);
        setUploadingImages(false);
        return;
      }
      propId = newProp.id;
      setExistingId(propId);
      setCurrentStatus('draft');
    }

    const filesArray = Array.from(files);
    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${propId}/${Date.now()}_${i}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, file);

      if (uploadError) {
        setError(`خطأ في رفع الصورة: ${uploadError.message}`);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      const isFirst = images.length === 0 && i === 0;
      const { error: imgError } = await supabase
        .from('property_images')
        .insert({
          property_id: propId,
          image_url: urlData.publicUrl,
          is_primary: isFirst,
          sort_order: images.length + i,
        });

      if (imgError) {
        setError(`خطأ في حفظ الصورة: ${imgError.message}`);
      }
    }

    // Refresh images
    const { data: imgData } = await supabase
      .from('property_images')
      .select('*')
      .eq('property_id', propId)
      .order('sort_order');
    if (imgData) setImages(imgData as PropertyImage[]);
    setUploadingImages(false);
  };

  const handleDeleteImage = async (imgId: string) => {
    const { error } = await supabase.from('property_images').delete().eq('id', imgId);
    if (!error) {
      setImages(images.filter((img) => img.id !== imgId));
    }
  };

  const handleSetPrimary = async (imgId: string) => {
    if (!existingId) return;
    // Unset all primary
    await supabase.from('property_images').update({ is_primary: false }).eq('property_id', existingId);
    // Set selected as primary
    await supabase.from('property_images').update({ is_primary: true }).eq('id', imgId);
    setImages(images.map((img) => ({ ...img, is_primary: img.id === imgId })));
  };

  const canEdit = currentStatus === 'draft' || currentStatus === 'rejected' || currentStatus === 'in_review' || !isEdit;

  if (loading) {
    return <div className="text-center py-8 text-gray-400">جاري التحميل...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/dashboard/my-properties')} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowRight className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'تعديل العقار' : 'إضافة عقار جديد'}</h1>
      </div>

      {!canEdit && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>لا يمكن تعديل العقار في حالته الحالية. يمكن للمسؤول تعديل حالته لتمكين التعديل.</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Basic info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">المعلومات الأساسية</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">العنوان *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            disabled={!canEdit}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all disabled:bg-gray-50"
            placeholder="مثال: منزل للبيع - الشيخ مسعود"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نوع العملية *</label>
            <select
              value={form.operation_type}
              onChange={(e) => handleChange('operation_type', e.target.value)}
              disabled={!canEdit}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all bg-white disabled:bg-gray-50"
            >
              <option value="sale">بيع</option>
              <option value="rent">كراء</option>
              <option value="exchange">تبديل</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نوع العقار *</label>
            <select
              value={form.property_type_id}
              onChange={(e) => handleChange('property_type_id', e.target.value)}
              disabled={!canEdit}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all bg-white disabled:bg-gray-50"
            >
              <option value="">اختر النوع</option>
              {propertyTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name_ar}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">المنطقة *</label>
          <select
            value={form.area_id}
            onChange={(e) => handleChange('area_id', e.target.value)}
            disabled={!canEdit}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all bg-white disabled:bg-gray-50"
          >
            <option value="">اختر المنطقة</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>{a.name_ar}</option>
            ))}
          </select>
        </div>

        {/* Smart price field */}
        {form.operation_type !== 'exchange' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {formatPriceInputLabel(form.operation_type)} *
            </label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => handleChange('price', e.target.value)}
              disabled={!canEdit}
              placeholder={formatPriceInputPlaceholder(form.operation_type)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all disabled:bg-gray-50"
            />
            <p className="text-xs text-primary-600 mt-1">
              {formatPricePreview(form.operation_type, form.price ? parseFloat(form.price) : null)}
            </p>
          </div>
        )}

        {/* Exchange fields */}
        {form.operation_type === 'exchange' && (
          <div className="space-y-4 p-4 bg-teal-50 rounded-lg">
            <h3 className="font-bold text-teal-800 text-sm">معلومات التبديل</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">شروط التبديل</label>
              <textarea
                value={form.exchange_conditions}
                onChange={(e) => handleChange('exchange_conditions', e.target.value)}
                disabled={!canEdit}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all disabled:bg-gray-50"
                placeholder="مثال: التبديل بشقة F3 أو منزل، مع إمكانية دفع الفرق حسب الاتفاق."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">العقار المطلوب مقابل</label>
              <input
                type="text"
                value={form.exchange_target}
                onChange={(e) => handleChange('exchange_target', e.target.value)}
                disabled={!canEdit}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all disabled:bg-gray-50"
                placeholder="مثال: شقة F3 أو منزل"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">فرق السعر إن وجد (اختياري)</label>
              <input
                type="number"
                value={form.exchange_price_diff}
                onChange={(e) => handleChange('exchange_price_diff', e.target.value)}
                disabled={!canEdit}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all disabled:bg-gray-50"
                placeholder="مثال: 50"
              />
              <p className="text-xs text-gray-500 mt-1">القيمة بالمليون</p>
            </div>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">تفاصيل العقار</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المساحة (م²)</label>
            <input
              type="number"
              value={form.area_size}
              onChange={(e) => handleChange('area_size', e.target.value)}
              disabled={!canEdit}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm disabled:bg-gray-50"
              placeholder="120"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الغرف</label>
            <input
              type="number"
              value={form.rooms}
              onChange={(e) => handleChange('rooms', e.target.value)}
              disabled={!canEdit}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm disabled:bg-gray-50"
              placeholder="4"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الطوابق</label>
            <input
              type="number"
              value={form.floors}
              onChange={(e) => handleChange('floors', e.target.value)}
              disabled={!canEdit}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm disabled:bg-gray-50"
              placeholder="2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الحمامات</label>
            <input
              type="number"
              value={form.bathrooms}
              onChange={(e) => handleChange('bathrooms', e.target.value)}
              disabled={!canEdit}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm disabled:bg-gray-50"
              placeholder="2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            disabled={!canEdit}
            rows={4}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all disabled:bg-gray-50"
            placeholder="وصف تفصيلي للعقار..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">رابط الفيديو (اختياري)</label>
          <input
            type="url"
            value={form.video_url}
            onChange={(e) => handleChange('video_url', e.target.value)}
            disabled={!canEdit}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all disabled:bg-gray-50"
            placeholder="https://..."
            dir="ltr"
          />
        </div>
      </div>

      {/* Document info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">الوثيقة العقارية</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">نوع السند / الوثيقة</label>
          <select
            value={form.document_type_id}
            onChange={(e) => handleChange('document_type_id', e.target.value)}
            disabled={!canEdit}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all bg-white disabled:bg-gray-50"
          >
            <option value="">اختر نوع السند</option>
            {docTypes.map((d) => (
              <option key={d.id} value={d.id}>{d.name_ar}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">رقم الوثيقة (خاص - لا يظهر للزبون)</label>
            <input
              type="text"
              value={form.document_number}
              onChange={(e) => handleChange('document_number', e.target.value)}
              disabled={!canEdit}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الوثيقة</label>
            <input
              type="date"
              value={form.document_date}
              onChange={(e) => handleChange('document_date', e.target.value)}
              disabled={!canEdit}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all disabled:bg-gray-50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الجهة المصدرة</label>
          <input
            type="text"
            value={form.document_authority}
            onChange={(e) => handleChange('document_authority', e.target.value)}
            disabled={!canEdit}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all disabled:bg-gray-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات حول الوثيقة</label>
          <textarea
            value={form.document_notes}
            onChange={(e) => handleChange('document_notes', e.target.value)}
            disabled={!canEdit}
            rows={2}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all disabled:bg-gray-50"
          />
        </div>

        <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          ملاحظة: رقم الوثيقة والمعلومات الحساسة لا تظهر للزبون. تظهر للإدارة فقط.
          الموقع يعرض فقط نوع الوثيقة الذي صرحت به ولا يعطي حكمًا قانونيًا عليها.
        </p>
      </div>

      {/* Images */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">صور العقار</h2>

        {images.length > 0 && (
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
                  {!img.is_primary && canEdit && (
                    <button
                      onClick={() => handleSetPrimary(img.id)}
                      className="p-2 bg-white/90 rounded-lg text-gray-700 hover:bg-white"
                      title="تعيين كصورة رئيسية"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  {canEdit && (
                    <button
                      onClick={() => handleDeleteImage(img.id)}
                      className="p-2 bg-red-500/90 rounded-lg text-white hover:bg-red-500"
                      title="حذف"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {canEdit && (
          <label className="flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all">
            <Upload className="w-8 h-8 text-gray-400" />
            <span className="text-sm text-gray-500">{uploadingImages ? 'جاري الرفع...' : 'اضغط لرفع الصور'}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
              disabled={uploadingImages}
            />
          </label>
        )}
      </div>

      {/* Contact info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">معلومات التواصل</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
            <input
              type="text"
              value={form.contact_name}
              onChange={(e) => handleChange('contact_name', e.target.value)}
              disabled={!canEdit}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all disabled:bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الهاتف</label>
            <input
              type="tel"
              value={form.contact_phone}
              onChange={(e) => handleChange('contact_phone', e.target.value)}
              disabled={!canEdit}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all disabled:bg-gray-50"
              dir="ltr"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
          <input
            type="email"
            value={form.contact_email}
            onChange={(e) => handleChange('contact_email', e.target.value)}
            disabled={!canEdit}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all disabled:bg-gray-50"
            dir="ltr"
          />
        </div>
      </div>

      {/* Actions */}
      {canEdit && (
        <div className="flex flex-col sm:flex-row gap-3 pb-6">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            حفظ كمسودة
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            إرسال للمراجعة
          </button>
        </div>
      )}
    </div>
  );
}
