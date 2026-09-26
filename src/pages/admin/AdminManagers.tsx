import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { PropertyType, DocumentType, Area } from '@/lib/types';

type ItemType = PropertyType | DocumentType | Area;

interface ManagerConfig {
  label: string;
  tableName: string;
  addFn: string;
  updateFn: string;
  deleteFn: string;
}

export function GenericManager({ config }: { config: ManagerConfig }) {
  const [items, setItems] = useState<ItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNameAr, setEditNameAr] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNameAr, setNewNameAr] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    supabase.from(config.tableName).select('*').order('sort_order').then(({ data }) => {
      setItems((data as ItemType[]) || []);
      setLoading(false);
    });
  }, [config.tableName]);

  const handleAdd = async () => {
    if (!newName.trim() || !newNameAr.trim()) return;
    setActionLoading(true);
    await supabase.rpc(config.addFn, { type_name: newName, type_name_ar: newNameAr });
    setNewName('');
    setNewNameAr('');
    setAdding(false);
    const { data } = await supabase.from(config.tableName).select('*').order('sort_order');
    setItems((data as ItemType[]) || []);
    setActionLoading(false);
  };

  const handleUpdate = async (itemId: string) => {
    if (!editName.trim() || !editNameAr.trim()) return;
    setActionLoading(true);
    await supabase.rpc(config.updateFn, {
      type_id: itemId,
      type_name: editName,
      type_name_ar: editNameAr,
    });
    setEditing(null);
    const { data } = await supabase.from(config.tableName).select('*').order('sort_order');
    setItems((data as ItemType[]) || []);
    setActionLoading(false);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('هل تريد حذف هذا العنصر؟')) return;
    setActionLoading(true);
    await supabase.rpc(config.deleteFn, { type_id: itemId });
    const { data } = await supabase.from(config.tableName).select('*').order('sort_order');
    setItems((data as ItemType[]) || []);
    setActionLoading(false);
  };

  if (loading) return <div className="text-center py-8 text-gray-400">جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{config.label}</h1>
        <button
          onClick={() => setAdding(!adding)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          إضافة
        </button>
      </div>

      {adding && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الاسم (إنجليزي)</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none text-sm" dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الاسم (عربي)</label>
              <input type="text" value={newNameAr} onChange={(e) => setNewNameAr(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 outline-none text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={actionLoading} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg disabled:opacity-50">إضافة</button>
            <button onClick={() => setAdding(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg">إلغاء</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        {items.map((item) => (
          <div key={item.id} className="p-4 flex items-center justify-between">
            {editing === item.id ? (
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 mr-4">
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 outline-none text-sm" dir="ltr" />
                <input type="text" value={editNameAr} onChange={(e) => setEditNameAr(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 outline-none text-sm" />
              </div>
            ) : (
              <div>
                <p className="font-medium text-gray-900">{item.name_ar}</p>
                <p className="text-xs text-gray-400" dir="ltr">{item.name}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              {editing === item.id ? (
                <>
                  <button onClick={() => handleUpdate(item.id)} disabled={actionLoading} className="p-2 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-emerald-600">
                    <Save className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditing(null)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setEditing(item.id); setEditName(item.name); setEditNameAr(item.name_ar); }}
                    className="p-2 bg-gray-50 hover:bg-primary-50 rounded-lg text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={actionLoading}
                    className="p-2 bg-gray-50 hover:bg-red-50 rounded-lg text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="p-8 text-center text-gray-400">لا توجد عناصر</div>
        )}
      </div>
    </div>
  );
}

// Wrapper components for each type
export function AdminPropertyTypes() {
  return <GenericManager config={{ label: 'أنواع العقارات', tableName: 'property_types', addFn: 'admin_add_property_type', updateFn: 'admin_update_property_type', deleteFn: 'admin_delete_property_type' }} />;
}

export function AdminDocumentTypes() {
  return <GenericManager config={{ label: 'أنواع السندات', tableName: 'document_types', addFn: 'admin_add_document_type', updateFn: 'admin_update_document_type', deleteFn: 'admin_delete_document_type' }} />;
}

export function AdminAreas() {
  return <GenericManager config={{ label: 'المناطق', tableName: 'areas', addFn: 'admin_add_area', updateFn: 'admin_update_area', deleteFn: 'admin_delete_area' }} />;
}
