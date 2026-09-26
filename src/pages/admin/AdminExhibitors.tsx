import { useEffect, useState } from 'react';
import { Users, Mail, Phone, Calendar, Home } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Profile, Property } from '@/lib/types';

interface ExhibitorWithCount extends Profile {
  property_count?: number;
}

export function AdminExhibitors() {
  const [exhibitors, setExhibitors] = useState<ExhibitorWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [exhibitorProps, setExhibitorProps] = useState<Property[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.rpc('admin_get_all_profiles');
      const profiles = (data as ExhibitorWithCount[]) || [];

      // Get property counts
      const { data: allProps } = await supabase.rpc('admin_get_all_properties');
      const props = (allProps as Property[]) || [];

      const withCounts = profiles.map((p) => ({
        ...p,
        property_count: props.filter((prop) => prop.owner_id === p.id).length,
      }));
      setExhibitors(withCounts);
      setLoading(false);
    }
    load();
  }, []);

  const handleExpand = async (exhibitorId: string) => {
    if (expandedId === exhibitorId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(exhibitorId);
    const { data: allProps } = await supabase.rpc('admin_get_all_properties');
    const props = (allProps as Property[]) || [];
    setExhibitorProps(props.filter((p) => p.owner_id === exhibitorId));
  };

  if (loading) return <div className="text-center py-8 text-gray-400">جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">العارضون</h1>

      {exhibitors.length > 0 ? (
        <div className="space-y-3">
          {exhibitors.map((ex) => (
            <div key={ex.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <button
                onClick={() => handleExpand(ex.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-right"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{ex.full_name || 'بدون اسم'}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> <span dir="ltr">{ex.email}</span></span>
                      {ex.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> <span dir="ltr">{ex.phone}</span></span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-primary-50 text-primary-700 text-xs font-bold px-3 py-1 rounded-full">{ex.property_count} عقار</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(ex.created_at).toLocaleDateString('ar-DZ')}</span>
                </div>
              </button>

              {expandedId === ex.id && (
                <div className="border-t border-gray-100 p-4 animate-fade-in">
                  {exhibitorProps.length > 0 ? (
                    <div className="space-y-2">
                      {exhibitorProps.map((prop) => (
                        <div key={prop.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Home className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">{prop.title}</span>
                          </div>
                          <a href={`/admin/property/${prop.id}`} className="text-xs text-primary-600 hover:underline">عرض التفاصيل</a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">لا توجد عقارات</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">لا يوجد عارضون مسجلون</p>
        </div>
      )}
    </div>
  );
}
