import { useEffect, useState } from 'react';
import { MapPin, Plus, Trash2, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import type { Location } from '@/types';

export function AdminLocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWilaya, setNewWilaya] = useState('');
  const [newMunicipality, setNewMunicipality] = useState('');
  const [newArea, setNewArea] = useState('');

  useEffect(() => { fetchLocations(); }, []);

  const fetchLocations = async () => {
    const { data } = await supabase.from('locations').select('*').order('wilaya').order('municipality').order('sort_order');
    if (data) setLocations(data as Location[]);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newWilaya.trim() || !newMunicipality.trim()) return;
    const maxOrder = locations.filter((l) => l.wilaya === newWilaya && l.municipality === newMunicipality).length;
    await supabase.from('locations').insert({
      wilaya: newWilaya,
      municipality: newMunicipality,
      area: newArea || null,
      sort_order: maxOrder + 1,
    });
    setNewWilaya(''); setNewMunicipality(''); setNewArea('');
    fetchLocations();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المنطقة؟')) return;
    await supabase.from('locations').delete().eq('id', id);
    fetchLocations();
  };

  const handleToggle = async (loc: Location) => {
    await supabase.from('locations').update({ active: !loc.active }).eq('id', loc.id);
    fetchLocations();
  };

  // Group by wilaya
  const grouped = locations.reduce((acc, loc) => {
    if (!acc[loc.wilaya]) acc[loc.wilaya] = [];
    acc[loc.wilaya].push(loc);
    return acc;
  }, {} as Record<string, Location[]>);

  return (
    <DashboardLayout role="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">المناطق</h1>
        <p className="text-sm text-gray-500 mt-1">{locations.length} منطقة</p>
      </div>

      <div className="card p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">إضافة منطقة جديدة</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input type="text" value={newWilaya} onChange={(e) => setNewWilaya(e.target.value)} className="input-field" placeholder="الولاية" />
          <input type="text" value={newMunicipality} onChange={(e) => setNewMunicipality(e.target.value)} className="input-field" placeholder="البلدية" />
          <input type="text" value={newArea} onChange={(e) => setNewArea(e.target.value)} className="input-field" placeholder="المنطقة / الحي (اختياري)" />
          <button onClick={handleAdd} className="btn-primary flex items-center justify-center gap-2">
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
        <div className="space-y-4">
          {Object.entries(grouped).map(([wilaya, locs]) => (
            <div key={wilaya} className="card p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-600" />
                {wilaya}
              </h3>
              <div className="space-y-2">
                {locs.map((loc) => (
                  <div key={loc.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">{loc.municipality}</span>
                      {loc.area && <span className="text-gray-500 text-sm"> — {loc.area}</span>}
                    </div>
                    <button onClick={() => handleToggle(loc)} className={`px-3 py-1 rounded-full text-xs font-medium ${loc.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {loc.active ? 'مفعّل' : 'معطّل'}
                    </button>
                    <button onClick={() => handleDelete(loc.id)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
