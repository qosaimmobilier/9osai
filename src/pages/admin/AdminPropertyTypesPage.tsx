import { useEffect, useState } from 'react';
import { Tag, Plus, Edit2, Trash2, Check, X, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import type { PropertyType } from '@/types';

export function AdminPropertyTypesPage() {
  const [types, setTypes] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');

  useEffect(() => { fetchTypes(); }, []);

  const fetchTypes = async () => {
    const { data } = await supabase.from('property_types').select('*').order('sort_order');
    if (data) setTypes(data as PropertyType[]);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const maxOrder = types.length > 0 ? Math.max(...types.map((t) => t.sort_order)) : 0;
    await supabase.from('property_types').insert({ name: newName, sort_order: maxOrder + 1 });
    setNewName('');
    fetchTypes();
  };

  const handleEdit = async (id: string) => {
    if (!editName.trim()) return;
    await supabase.from('property_types').update({ name: editName }).eq('id', id);
    setEditingId(null);
    fetchTypes();
  };

  const handleToggle = async (t: PropertyType) => {
    await supabase.from('property_types').update({ active: !t.active }).eq('id', t.id);
    fetchTypes();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا النوع؟')) return;
    await supabase.from('property_types').delete().eq('id', id);
    fetchTypes();
  };

  return (
    <DashboardLayout role="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">أنواع العقارات</h1>
        <p className="text-sm text-gray-500 mt-1">{types.length} نوع</p>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="input-field"
            placeholder="اسم النوع الجديد..."
          />
          <button onClick={handleAdd} className="btn-primary flex items-center gap-2 shrink-0">
            <Plus className="w-5 h-5" />
            إضافة
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-14 rounded-lg"></div>)}
        </div>
      ) : (
        <div className="space-y-2">
          {types.map((t) => (
            <div key={t.id} className="card p-3 flex items-center gap-3">
              <Tag className="w-5 h-5 text-gray-400 shrink-0" />
              {editingId === t.id ? (
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEdit(t.id)}
                    className="input-field"
                    autoFocus
                  />
                  <button onClick={() => handleEdit(t.id)} className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100">
                    <Check className="w-5 h-5" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-2 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <>
                  <span className={`flex-1 font-medium ${t.active ? 'text-gray-900' : 'text-gray-400 line-through'}`}>{t.name}</span>
                  <button onClick={() => handleToggle(t)} className={`px-3 py-1 rounded-full text-xs font-medium ${t.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {t.active ? 'مفعّل' : 'معطّل'}
                  </button>
                  <button onClick={() => { setEditingId(t.id); setEditName(t.name); }} className="p-2 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
