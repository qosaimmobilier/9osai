import { useEffect, useState } from 'react';
import { Settings, Save, CheckCircle, Building, Users, Phone } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useSiteSettings, clearSettingsCache } from '@/hooks/useSiteSettings';
import type { SiteSettings } from '@/types';

export function AdminSettingsPage() {
  const { settings, loading } = useSiteSettings();
  const [form, setForm] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) setForm({ ...settings });
  }, [settings]);

  const update = (field: keyof SiteSettings, value: any) => {
    if (!form) return;
    setForm({ ...form, [field]: value });
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    await supabase.from('site_settings').update({
      platform_name: form.platform_name,
      platform_subtitle: form.platform_subtitle,
      description: form.description,
      phone: form.phone,
      whatsapp: form.whatsapp,
      email: form.email,
      facebook: form.facebook,
      require_approval: form.require_approval,
      max_images: form.max_images,
      max_image_size_mb: form.max_image_size_mb,
      allow_video: form.allow_video,
      max_video_size_mb: form.max_video_size_mb,
      allow_registration: form.allow_registration,
      require_account_approval: form.require_account_approval,
      allow_edit_after_publish: form.allow_edit_after_publish,
      edit_resets_status: form.edit_resets_status,
    }).eq('id', 1);
    clearSettingsCache();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading || !form) {
    return (
      <DashboardLayout role="admin">
        <div className="animate-pulse space-y-4">
          <div className="skeleton h-8 w-1/3"></div>
          <div className="skeleton h-64 rounded-xl"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">الإعدادات</h1>
          <p className="text-sm text-gray-500 mt-1">إعدادات المنصة العامة</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          {!saving && <Save className="w-5 h-5" />}
        </button>
      </div>

      {saved && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2 text-green-700 text-sm">
          <CheckCircle className="w-5 h-5" />
          تم حفظ الإعدادات بنجاح
        </div>
      )}

      <div className="space-y-6">
        {/* Platform info */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Building className="w-5 h-5 text-primary-600" />
            معلومات المنصة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنصة</label>
              <input type="text" value={form.platform_name} onChange={(e) => update('platform_name', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الفرعي</label>
              <input type="text" value={form.platform_subtitle} onChange={(e) => update('platform_subtitle', e.target.value)} className="input-field" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
              <textarea value={form.description || ''} onChange={(e) => update('description', e.target.value)} className="input-field min-h-[80px]" />
            </div>
          </div>
        </div>

        {/* Contact settings */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary-600" />
            إعدادات التواصل
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف العام</label>
              <input type="tel" value={form.phone || ''} onChange={(e) => update('phone', e.target.value)} className="input-field" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">واتساب العام</label>
              <input type="tel" value={form.whatsapp || ''} onChange={(e) => update('whatsapp', e.target.value)} className="input-field" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
              <input type="email" value={form.email || ''} onChange={(e) => update('email', e.target.value)} className="input-field" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رابط فيسبوك</label>
              <input type="url" value={form.facebook || ''} onChange={(e) => update('facebook', e.target.value)} className="input-field" dir="ltr" />
            </div>
          </div>
        </div>

        {/* Property settings */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Building className="w-5 h-5 text-primary-600" />
            إعدادات العقارات
          </h2>
          <div className="space-y-4">
            <ToggleRow
              label="هل يحتاج العقار إلى موافقة قبل النشر؟"
              value={form.require_approval}
              onChange={(v) => update('require_approval', v)}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الحد الأقصى للصور</label>
                <input type="number" value={form.max_images} onChange={(e) => update('max_images', parseInt(e.target.value))} className="input-field" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الحد الأقصى لحجم الصورة (ميجابايت)</label>
                <input type="number" value={form.max_image_size_mb} onChange={(e) => update('max_image_size_mb', parseInt(e.target.value))} className="input-field" dir="ltr" />
              </div>
            </div>
            <ToggleRow
              label="السماح بالفيديو"
              value={form.allow_video}
              onChange={(v) => update('allow_video', v)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الحد الأقصى لحجم الفيديو (ميجابايت)</label>
              <input type="number" value={form.max_video_size_mb} onChange={(e) => update('max_video_size_mb', parseInt(e.target.value))} className="input-field" dir="ltr" />
            </div>
          </div>
        </div>

        {/* Advertiser settings */}
        <div className="card p-6">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-600" />
            إعدادات العارضين
          </h2>
          <div className="space-y-4">
            <ToggleRow
              label="السماح بالتسجيل"
              value={form.allow_registration}
              onChange={(v) => update('allow_registration', v)}
            />
            <ToggleRow
              label="هل يحتاج الحساب إلى موافقة؟"
              value={form.require_account_approval}
              onChange={(v) => update('require_account_approval', v)}
            />
            <ToggleRow
              label="هل يستطيع العارض تعديل الإعلان بعد نشره؟"
              value={form.allow_edit_after_publish}
              onChange={(v) => update('allow_edit_after_publish', v)}
            />
            <ToggleRow
              label="هل تعديل الإعلان يعيده إلى حالة المراجعة؟"
              value={form.edit_resets_status}
              onChange={(v) => update('edit_resets_status', v)}
            />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          {!saving && <Save className="w-5 h-5" />}
        </button>
      </div>
    </DashboardLayout>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg bg-gray-50">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-12 h-6 rounded-full transition-colors ${value ? 'bg-primary-600' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${value ? 'left-0.5' : 'right-0.5'}`} />
      </button>
    </label>
  );
}
