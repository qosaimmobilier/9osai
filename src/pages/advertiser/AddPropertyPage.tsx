import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Upload, X, Image as ImageIcon, Video, Link2, Check, AlertCircle, Loader2, MapPin, Building, FileText, Phone, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { uploadPropertyImage, uploadPropertyVideo, validateImageFile, validateVideoFile, deleteStorageFile } from '@/lib/storage';
import { PROPERTY_IMAGE_BUCKET, PROPERTY_VIDEO_BUCKET } from '@/lib/supabase';
import { OPERATION_LABELS, CONDITION_LABELS, formatPrice } from '@/lib/constants';
import type { PropertyType, Location, Feature, OperationType, PropertyCondition, PropertyFormData } from '@/types';

const STEPS = [
  { num: 1, label: 'نوع العملية والعقار', icon: Building },
  { num: 2, label: 'الموقع والسعر', icon: MapPin },
  { num: 3, label: 'المواصفات', icon: Building },
  { num: 4, label: 'الوصف', icon: FileText },
  { num: 5, label: 'الصور والفيديو', icon: ImageIcon },
  { num: 6, label: 'معلومات التواصل', icon: Phone },
  { num: 7, label: 'مراجعة الإعلان', icon: Eye },
];

const emptyForm: PropertyFormData = {
  title: '', operation_type: 'sale', property_type_id: '', wilaya: '', municipality: '',
  area: '', address: '', price: '', currency: 'DZD', area_size: '', rooms: '', bathrooms: '',
  floors: '', floor_number: '', facades: '', age: '', condition: '', description: '',
  exchange_for: '', exchange_conditions: '', show_phone: true, show_whatsapp: true,
  contact_phone: '', contact_whatsapp: '', contact_name: '', feature_ids: [],
};

export function AddPropertyPage() {
  const { session, profile } = useAuth();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<PropertyFormData>(emptyForm);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [existingImages, setExistingImages] = useState<{ id: string; url: string; path: string | null; is_cover: boolean }[]>([]);
  const [existingVideo, setExistingVideo] = useState<{ url: string; path: string | null } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('property_types').select('*').eq('active', true).order('sort_order'),
      supabase.from('locations').select('*').eq('active', true).order('sort_order'),
      supabase.from('features').select('*').eq('active', true).order('sort_order'),
    ]).then(([types, locs, feats]) => {
      if (types.data) setPropertyTypes(types.data as PropertyType[]);
      if (locs.data) setLocations(locs.data as Location[]);
      if (feats.data) setFeatures(feats.data as Feature[]);
      setLoading(false);
    });
  }, []);

  // Load existing property for edit
  useEffect(() => {
    if (!editId || !session?.user) return;
    supabase
      .from('properties')
      .select(`*, images:property_images(*), videos:property_videos(*)`)
      .eq('id', editId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        const p = data as any;
        setForm({
          title: p.title || '', operation_type: p.operation_type, property_type_id: p.property_type_id || '',
          wilaya: p.wilaya || '', municipality: p.municipality || '', area: p.area || '',
          address: p.address || '', price: p.price?.toString() || '', currency: p.currency || 'DZD',
          area_size: p.area_size?.toString() || '', rooms: p.rooms?.toString() || '',
          bathrooms: p.bathrooms?.toString() || '', floors: p.floors?.toString() || '',
          floor_number: p.floor_number?.toString() || '', facades: p.facades?.toString() || '',
          age: p.age?.toString() || '', condition: p.condition || '', description: p.description || '',
          exchange_for: p.exchange_for || '', exchange_conditions: p.exchange_conditions || '',
          show_phone: p.show_phone, show_whatsapp: p.show_whatsapp,
          contact_phone: p.contact_phone || '', contact_whatsapp: p.contact_whatsapp || '',
          contact_name: p.contact_name || '', feature_ids: [],
        });
        if (p.images) {
          setExistingImages(p.images.map((img: any) => ({ id: img.id, url: img.image_url, path: img.storage_path, is_cover: img.is_cover })));
        }
        if (p.videos && p.videos.length > 0) {
          setExistingVideo({ url: p.videos[0].video_url, path: p.videos[0].storage_path });
        }
        // Load features
        supabase.from('property_features').select('feature_id').eq('property_id', editId)
          .then(({ data: featData }) => {
            if (featData) setForm((f) => ({ ...f, feature_ids: featData.map((f: any) => f.feature_id) }));
          });
      });
  }, [editId, session]);

  const wilayas = Array.from(new Set(locations.map((l) => l.wilaya)));
  const municipalities = Array.from(new Set(locations.filter((l) => !form.wilaya || l.wilaya === form.wilaya).map((l) => l.municipality)));
  const areas = Array.from(new Set(locations.filter((l) => (!form.wilaya || l.wilaya === form.wilaya) && (!form.municipality || l.municipality === form.municipality)).map((l) => l.area).filter(Boolean)));

  const updateForm = (field: keyof PropertyFormData, value: any) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const toggleFeature = (id: string) => {
    setForm((f) => ({
      ...f,
      feature_ids: f.feature_ids.includes(id) ? f.feature_ids.filter((x) => x !== id) : [...f.feature_ids, id],
    }));
  };

  const handleImageSelect = (files: FileList | null) => {
    if (!files) return;
    const maxImages = settings?.max_images || 10;
    const maxSize = settings?.max_image_size_mb || 5;
    const newImages: File[] = [];
    const newPreviews: string[] = [];
    for (const file of Array.from(files)) {
      const err = validateImageFile(file, maxSize);
      if (err) { setError(err); continue; }
      if (images.length + existingImages.length + newImages.length >= maxImages) {
        setError(`الحد الأقصى ${maxImages} صور`);
        break;
      }
      newImages.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }
    setImages([...images, ...newImages]);
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (id: string, path: string | null) => {
    if (path) await deleteStorageFile(PROPERTY_IMAGE_BUCKET, path);
    await supabase.from('property_images').delete().eq('id', id);
    setExistingImages(existingImages.filter((img) => img.id !== id));
  };

  const handleVideoSelect = (file: File | null) => {
    if (!file) return;
    const maxSize = settings?.max_video_size_mb || 50;
    const err = validateVideoFile(file, maxSize);
    if (err) { setError(err); return; }
    setVideoFile(file);
  };

  const removeVideo = () => {
    setVideoFile(null);
  };

  const removeExistingVideo = async () => {
    if (existingVideo?.path) await deleteStorageFile(PROPERTY_VIDEO_BUCKET, existingVideo.path);
    await supabase.from('property_videos').delete().eq('video_url', existingVideo?.url || '');
    setExistingVideo(null);
  };

  const validateStep = (): boolean => {
    setError('');
    if (step === 1) {
      if (!form.title.trim()) { setError('يرجى إدخال عنوان الإعلان'); return false; }
      if (!form.operation_type) { setError('يرجى اختيار نوع العملية'); return false; }
      if (!form.property_type_id) { setError('يرجى اختيار نوع العقار'); return false; }
    }
    if (step === 2) {
      if (!form.wilaya) { setError('يرجى اختيار الولاية'); return false; }
      if (!form.municipality) { setError('يرجى اختيار البلدية'); return false; }
      if (!form.price && form.operation_type !== 'exchange') { setError('يرجى إدخال السعر'); return false; }
    }
    if (step === 4) {
      if (!form.description.trim()) { setError('يرجى إدخال وصف العقار'); return false; }
    }
    if (step === 5) {
      if (images.length === 0 && existingImages.length === 0) { setError('يرجى رفع صورة واحدة على الأقل'); return false; }
    }
    if (step === 6) {
      if (!form.contact_name.trim()) { setError('يرجى إدخال اسم شخص التواصل'); return false; }
      if (form.show_phone && !form.contact_phone.trim()) { setError('يرجى إدخال رقم الهاتف'); return false; }
      if (form.show_whatsapp && !form.contact_whatsapp.trim()) { setError('يرجى إدخال رقم الواتساب'); return false; }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(Math.min(step + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setStep(Math.max(step - 1, 1));
  };

  const handleSubmit = async () => {
    if (!session?.user || !profile) return;
    setError('');
    setUploading(true);

    try {
      const propertyData: any = {
        advertiser_id: session.user.id,
        title: form.title,
        operation_type: form.operation_type,
        property_type_id: form.property_type_id || null,
        wilaya: form.wilaya || null,
        municipality: form.municipality || null,
        area: form.area || null,
        address: form.address || null,
        price: form.price ? parseFloat(form.price) : null,
        currency: form.currency,
        area_size: form.area_size ? parseFloat(form.area_size) : null,
        rooms: form.rooms ? parseInt(form.rooms) : null,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
        floors: form.floors ? parseInt(form.floors) : null,
        floor_number: form.floor_number ? parseInt(form.floor_number) : null,
        facades: form.facades ? parseInt(form.facades) : null,
        age: form.age ? parseInt(form.age) : null,
        condition: form.condition || null,
        description: form.description,
        exchange_for: form.operation_type === 'exchange' ? form.exchange_for : null,
        exchange_conditions: form.operation_type === 'exchange' ? form.exchange_conditions : null,
        show_phone: form.show_phone,
        show_whatsapp: form.show_whatsapp,
        contact_phone: form.contact_phone || null,
        contact_whatsapp: form.contact_whatsapp || null,
        contact_name: form.contact_name,
        status: 'pending_review',
      };

      let propertyId: string;

      if (editId) {
        // Check if edit resets status
        const shouldReset = settings?.edit_resets_status ?? true;
        if (shouldReset) {
          propertyData.status = 'pending_review';
        }
        const { data, error: updateError } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', editId)
          .select('id')
          .single();
        if (updateError) throw updateError;
        propertyId = editId;
      } else {
        const { data, error: insertError } = await supabase
          .from('properties')
          .insert(propertyData)
          .select('id')
          .single();
        if (insertError) throw insertError;
        propertyId = data.id;
      }

      // Upload new images
      for (let i = 0; i < images.length; i++) {
        const result = await uploadPropertyImage(session.user.id, propertyId, images[i]);
        if (result) {
          await supabase.from('property_images').insert({
            property_id: propertyId,
            image_url: result.url,
            storage_path: result.path,
            sort_order: i,
            is_cover: i === coverIndex && existingImages.length === 0,
          });
        }
      }

      // Set cover on existing or new
      if (existingImages.length > 0 || images.length > 0) {
        // If no cover set yet, set first image as cover
        const { data: existingCovers } = await supabase
          .from('property_images')
          .select('id')
          .eq('property_id', propertyId)
          .eq('is_cover', true);
        if (!existingCovers || existingCovers.length === 0) {
          const { data: firstImg } = await supabase
            .from('property_images')
            .select('id')
            .eq('property_id', propertyId)
            .order('sort_order')
            .limit(1)
            .maybeSingle();
          if (firstImg) {
            await supabase.from('property_images').update({ is_cover: true }).eq('id', firstImg.id);
          }
        }
      }

      // Upload video
      if (videoFile) {
        if (existingVideo) await removeExistingVideo();
        const result = await uploadPropertyVideo(session.user.id, propertyId, videoFile);
        if (result) {
          await supabase.from('property_videos').insert({
            property_id: propertyId,
            video_url: result.url,
            storage_path: result.path,
            is_external: false,
          });
        }
      } else if (videoUrl && !existingVideo) {
        await supabase.from('property_videos').insert({
          property_id: propertyId,
          video_url: videoUrl,
          is_external: true,
        });
      }

      // Update features
      await supabase.from('property_features').delete().eq('property_id', propertyId);
      if (form.feature_ids.length > 0) {
        await supabase.from('property_features').insert(
          form.feature_ids.map((fid) => ({ property_id: propertyId, feature_id: fid }))
        );
      }

      setSuccess(true);
      setTimeout(() => navigate('/dashboard/properties'), 2000);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ العقار');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="advertiser">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (success) {
    return (
      <DashboardLayout role="advertiser">
        <div className="max-w-md mx-auto text-center py-20">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">تم إرسال عقارك بنجاح</h2>
          <p className="text-gray-500">سيتم نشره بعد مراجعته من الإدارة.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="advertiser">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{editId ? 'تعديل عقار' : 'إضافة عقار'}</h1>
        <p className="text-sm text-gray-500 mt-1">أكمل الخطوات التالية لإضافة عقارك</p>
      </div>

      {/* Steps indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between overflow-x-auto scrollbar-hide">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center shrink-0">
              <div className={`flex flex-col items-center gap-1 ${i <= step - 1 ? '' : 'opacity-40'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  i < step - 1 ? 'bg-green-500 text-white' : i === step - 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {i < step - 1 ? <Check className="w-5 h-5" /> : s.num}
                </div>
                <span className="text-xs text-gray-600 hidden md:block">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 md:w-12 h-0.5 mx-1 ${i < step - 1 ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Step content */}
      <div className="card p-6 mb-6">
        {/* Step 1: Operation & Type */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">عنوان الإعلان *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateForm('title', e.target.value)}
                className="input-field"
                placeholder="مثال: منزل للبيع في حي الشيخ مسعود"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع العملية *</label>
              <div className="grid grid-cols-3 gap-3">
                {(['sale', 'rent', 'exchange'] as OperationType[]).map((op) => (
                  <button
                    key={op}
                    onClick={() => updateForm('operation_type', op)}
                    className={`p-4 rounded-lg border-2 text-center font-medium transition-colors ${
                      form.operation_type === op ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {OPERATION_LABELS[op]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع العقار *</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {propertyTypes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => updateForm('property_type_id', t.id)}
                    className={`p-3 rounded-lg border-2 text-center text-sm font-medium transition-colors ${
                      form.property_type_id === t.id ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Location & Price */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الولاية *</label>
                <select value={form.wilaya} onChange={(e) => { updateForm('wilaya', e.target.value); updateForm('municipality', ''); updateForm('area', ''); }} className="input-field">
                  <option value="">اختر الولاية</option>
                  {wilayas.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">البلدية *</label>
                <select value={form.municipality} onChange={(e) => { updateForm('municipality', e.target.value); updateForm('area', ''); }} className="input-field" disabled={!form.wilaya}>
                  <option value="">اختر البلدية</option>
                  {municipalities.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المنطقة / الحي</label>
                <select value={form.area} onChange={(e) => updateForm('area', e.target.value)} className="input-field" disabled={!form.municipality}>
                  <option value="">اختر المنطقة</option>
                  {areas.map((a) => <option key={a as string} value={a as string}>{a}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">العنوان التقريبي</label>
              <input type="text" value={form.address} onChange={(e) => updateForm('address', e.target.value)} className="input-field" placeholder="مثال: قرب الطريق الرئيسي" />
            </div>
            {form.operation_type !== 'exchange' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">السعر (بالدينار) *</label>
                  <input type="number" value={form.price} onChange={(e) => updateForm('price', e.target.value)} className="input-field" placeholder="مثال: 35000000" dir="ltr" />
                  <p className="text-xs text-gray-400 mt-1">{form.price ? formatPrice(parseFloat(form.price)) : ''}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">العملة</label>
                  <select value={form.currency} onChange={(e) => updateForm('currency', e.target.value)} className="input-field">
                    <option value="DZD">دينار جزائري (DZD)</option>
                  </select>
                </div>
              </div>
            )}
            {form.operation_type === 'exchange' && (
              <div className="space-y-4 p-4 rounded-lg bg-amber-50 border border-amber-200">
                <h3 className="font-semibold text-amber-800">معلومات التبديل</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نوع العقار الذي تريد مبادلته</label>
                  <input type="text" value={form.exchange_for} onChange={(e) => updateForm('exchange_for', e.target.value)} className="input-field" placeholder="مثال: شقة في وسط المدينة" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">شروط التبديل</label>
                  <textarea value={form.exchange_conditions} onChange={(e) => updateForm('exchange_conditions', e.target.value)} className="input-field min-h-[80px]" placeholder="اكتب شروط التبديل هنا..." />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Specs */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المساحة (م²)</label>
                <input type="number" value={form.area_size} onChange={(e) => updateForm('area_size', e.target.value)} className="input-field" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">عدد الغرف</label>
                <input type="number" value={form.rooms} onChange={(e) => updateForm('rooms', e.target.value)} className="input-field" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">عدد الحمامات</label>
                <input type="number" value={form.bathrooms} onChange={(e) => updateForm('bathrooms', e.target.value)} className="input-field" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">عدد الطوابق</label>
                <input type="number" value={form.floors} onChange={(e) => updateForm('floors', e.target.value)} className="input-field" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الطابق</label>
                <input type="number" value={form.floor_number} onChange={(e) => updateForm('floor_number', e.target.value)} className="input-field" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">عدد الواجهات</label>
                <input type="number" value={form.facades} onChange={(e) => updateForm('facades', e.target.value)} className="input-field" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">عمر العقار (سنة)</label>
                <input type="number" value={form.age} onChange={(e) => updateForm('age', e.target.value)} className="input-field" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">حالة العقار</label>
                <select value={form.condition} onChange={(e) => updateForm('condition', e.target.value as PropertyCondition)} className="input-field">
                  <option value="">اختر الحالة</option>
                  {(Object.keys(CONDITION_LABELS) as PropertyCondition[]).map((c) => (
                    <option key={c} value={c}>{CONDITION_LABELS[c]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">المميزات</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {features.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => toggleFeature(f.id)}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 text-sm transition-colors ${
                      form.feature_ids.includes(f.id) ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${form.feature_ids.includes(f.id) ? 'bg-primary-500 border-primary-500' : 'border-gray-300'}`}>
                      {form.feature_ids.includes(f.id) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Description */}
        {step === 4 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">وصف العقار *</label>
            <textarea
              value={form.description}
              onChange={(e) => updateForm('description', e.target.value)}
              className="input-field min-h-[200px] resize-y"
              placeholder="اكتب وصفًا تفصيليًا للعقار...&#10;مثال: منزل للبيع في حي الشيخ مسعود، قريب من الطريق الرئيسي، يحتوي على..."
            />
            <p className="text-xs text-gray-400 mt-2">كلما كان الوصف أوضح، زادت فرص التواصل معك.</p>
          </div>
        )}

        {/* Step 5: Images & Video */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">صور العقار *</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary-400 transition-colors">
                <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => handleImageSelect(e.target.files)} className="hidden" id="image-upload" />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">اضغط لرفع الصور (حد أقصى {settings?.max_images || 10} صور)</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP - حد أقصى {settings?.max_image_size_mb || 5} ميجابايت</p>
                </label>
              </div>

              {/* Existing images */}
              {existingImages.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                  {existingImages.map((img) => (
                    <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      {img.is_cover && <span className="absolute top-1 right-1 badge bg-primary-500 text-white text-xs">رئيسية</span>}
                      <button onClick={() => removeExistingImage(img.id, img.path)} className="absolute top-1 left-1 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* New images preview */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                  {imagePreviews.map((preview, i) => (
                    <div key={i} className={`relative group aspect-square rounded-lg overflow-hidden border-2 ${coverIndex === i && existingImages.length === 0 ? 'border-primary-500' : 'border-gray-200'}`}>
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeImage(i)} className="absolute top-1 left-1 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-4 h-4" />
                      </button>
                      <button onClick={() => setCoverIndex(i)} className="absolute bottom-1 right-1 px-2 py-1 rounded bg-white/90 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        {coverIndex === i && existingImages.length === 0 ? 'رئيسية' : 'جعل رئيسية'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Video */}
            {settings?.allow_video !== false && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الفيديو</label>
                {existingVideo && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 mb-3">
                    <Video className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-600 flex-1">فيديو موجود</span>
                    <button onClick={removeExistingVideo} className="text-red-500 hover:text-red-700">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
                {!existingVideo && (
                  <>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-primary-400 transition-colors mb-3">
                      <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(e) => handleVideoSelect(e.target.files?.[0] || null)} className="hidden" id="video-upload" />
                      <label htmlFor="video-upload" className="cursor-pointer">
                        <Video className="w-8 h-8 mx-auto mb-1 text-gray-400" />
                        <p className="text-sm text-gray-600">رفع فيديو (حد أقصى {settings?.max_video_size_mb || 50} ميجابايت)</p>
                      </label>
                    </div>
                    {videoFile && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                        <Video className="w-5 h-5 text-gray-500" />
                        <span className="text-sm text-gray-600 flex-1 truncate">{videoFile.name}</span>
                        <button onClick={removeVideo} className="text-red-500 hover:text-red-700">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-2 my-2">
                      <div className="flex-1 h-px bg-gray-200"></div>
                      <span className="text-xs text-gray-400">أو</span>
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">رابط فيديو</label>
                      <div className="relative">
                        <Link2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="input-field pr-10" placeholder="https://youtube.com/..." dir="ltr" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 6: Contact */}
        {step === 6 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">اسم شخص التواصل *</label>
              <input type="text" value={form.contact_name} onChange={(e) => updateForm('contact_name', e.target.value)} className="input-field" placeholder="الاسم الذي يظهر للزبون" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                <input type="tel" value={form.contact_phone} onChange={(e) => updateForm('contact_phone', e.target.value)} className="input-field" placeholder="06XXXXXXXX" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رقم واتساب</label>
                <input type="tel" value={form.contact_whatsapp} onChange={(e) => updateForm('contact_whatsapp', e.target.value)} className="input-field" placeholder="06XXXXXXXX" dir="ltr" />
              </div>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.show_phone} onChange={(e) => updateForm('show_phone', e.target.checked)} className="w-5 h-5 accent-primary-600" />
                <span className="text-sm font-medium text-gray-700">إظهار رقم الهاتف للزوار</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.show_whatsapp} onChange={(e) => updateForm('show_whatsapp', e.target.checked)} className="w-5 h-5 accent-primary-600" />
                <span className="text-sm font-medium text-gray-700">إظهار واتساب</span>
              </label>
            </div>
          </div>
        )}

        {/* Step 7: Review */}
        {step === 7 && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900 mb-3">راجع معلوماتك قبل إرسال الإعلان</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <ReviewRow label="عنوان الإعلان" value={form.title} />
              <ReviewRow label="نوع العملية" value={OPERATION_LABELS[form.operation_type]} />
              <ReviewRow label="نوع العقار" value={propertyTypes.find((t) => t.id === form.property_type_id)?.name || '-'} />
              <ReviewRow label="الولاية" value={form.wilaya || '-'} />
              <ReviewRow label="البلدية" value={form.municipality || '-'} />
              <ReviewRow label="المنطقة" value={form.area || '-'} />
              <ReviewRow label="السعر" value={form.price ? formatPrice(parseFloat(form.price)) : '-'} />
              <ReviewRow label="المساحة" value={form.area_size ? `${form.area_size} م²` : '-'} />
              <ReviewRow label="الغرف" value={form.rooms || '-'} />
              <ReviewRow label="الحمامات" value={form.bathrooms || '-'} />
              <ReviewRow label="الحالة" value={form.condition ? CONDITION_LABELS[form.condition] : '-'} />
              <ReviewRow label="الوصف" value={form.description.substring(0, 100) + (form.description.length > 100 ? '...' : '')} />
              <ReviewRow label="عدد الصور" value={`${images.length + existingImages.length} صورة`} />
              <ReviewRow label="اسم التواصل" value={form.contact_name} />
              <ReviewRow label="الهاتف" value={form.show_phone ? form.contact_phone || '-' : 'مخفي'} />
              <ReviewRow label="واتساب" value={form.show_whatsapp ? form.contact_whatsapp || '-' : 'مخفي'} />
            </div>
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              <AlertCircle className="w-5 h-5 inline-block ml-2" />
              سيتم إرسال عقارك للمراجعة من الإدارة قبل نشره للعامة.
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={prevStep}
          disabled={step === 1}
          className="btn-secondary flex items-center gap-2 disabled:opacity-50"
        >
          <ChevronRight className="w-5 h-5" />
          السابق
        </button>
        {step < STEPS.length ? (
          <button onClick={nextStep} className="btn-primary flex items-center gap-2">
            التالي
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={uploading}
            className="btn-primary flex items-center gap-2 disabled:opacity-60"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            {uploading ? 'جاري الإرسال...' : 'إرسال للمراجعة'}
          </button>
        )}
      </div>
    </DashboardLayout>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-500 shrink-0">{label}:</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
