import { useEffect, useState } from 'react';
import { Save, AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { PlatformSettings } from '@/lib/types';

export function AdminSettings() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    supabase.from('platform_settings').select('*').eq('id', 1).maybeSingle().then(({ data }) => {
      if (data) setSettings(data as PlatformSettings);
    });
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    const updates = {
      site_name: settings.site_name,
      site_subtitle: settings.site_subtitle,
      contact_phone: settings.contact_phone,
      contact_email: settings.contact_email,
      contact_whatsapp: settings.contact_whatsapp,
      allow_direct_contact: settings.allow_direct_contact,
      show_contact_form: settings.show_contact_form,
    };

    const { error: rpcError } = await supabase.rpc('admin_update_settings', {
      setting_updates: updates as unknown as Record<string, unknown>,
    });

    if (rpcError) {
      setError(rpcError.message);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
    setSaving(false);
  };

  if (!settings) return <div className="text-center py-8 text-gray-400">جاري التحميل...</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Settings className="w-6 h-6" />
        إعدادات المنصة
      </h1>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-700 text-sm animate-fade-in">
          <CheckCircle className="w-5 h-5 shrink-0" /> تم حفظ الإعدادات بنجاح
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="font-bold text-gray-900">معلومات المنصة</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنصة</label>
          <input
            type="text"
            value={settings.site_name}
            onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">الوصف / العنوان الفرعي</label>
          <input
            type="text"
            value={settings.site_subtitle}
            onChange={(e) => setSettings({ ...settings, site_subtitle: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="font-bold text-gray-900">معلومات التواصل</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
          <input
            type="text"
            value={settings.contact_phone || ''}
            onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
            dir="ltr"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
          <input
            type="email"
            value={settings.contact_email || ''}
            onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
            dir="ltr"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">واتساب</label>
          <input
            type="text"
            value={settings.contact_whatsapp || ''}
            onChange={(e) => setSettings({ ...settings, contact_whatsapp: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none"
            dir="ltr"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="font-bold text-gray-900">إعدادات التواصل</h2>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.allow_direct_contact}
            onChange={(e) => setSettings({ ...settings, allow_direct_contact: e.target.checked })}
            className="w-5 h-5 rounded text-primary-600"
          />
          <span className="text-sm text-gray-700">السماح بالتواصل المباشر مع صاحب العقار</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.show_contact_form}
            onChange={(e) => setSettings({ ...settings, show_contact_form: e.target.checked })}
            className="w-5 h-5 rounded text-primary-600"
          />
          <span className="text-sm text-gray-700">إظهار نموذج التواصل في صفحة العقار</span>
        </label>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
      >
        <Save className="w-5 h-5" />
        {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
      </button>
    </div>
  );
}
