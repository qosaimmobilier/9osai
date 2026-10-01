import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Property, PropertyType, Area, DocumentType } from '@/lib/types';
import { getDocumentVerifiedLabel, getDocumentVerifiedColor } from '@/lib/format';

interface DocReviewItem extends Property {
  property_type?: PropertyType | null;
  area?: Area | null;
  document_type?: DocumentType | null;
}

export function AdminDocumentReview() {
  const [items, setItems] = useState<DocReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    async function load() {
      const { data } = await supabase.rpc('admin_get_all_properties');
      let props = (data as DocReviewItem[]) || [];

      // Fetch relations
      const typeIds = [...new Set(props.map((p) => p.property_type_id).filter(Boolean))] as string[];
      const areaIds = [...new Set(props.map((p) => p.area_id).filter(Boolean))] as string[];
      const docTypeIds = [...new Set(props.map((p) => p.document_type_id).filter(Boolean))] as string[];

      const [typesRes, areasRes, docTypesRes] = await Promise.all([
        typeIds.length ? supabase.from('property_types').select('*').in('id', typeIds) : Promise.resolve({ data: [] }),
        areaIds.length ? supabase.from('areas').select('*').in('id', areaIds) : Promise.resolve({ data: [] }),
        docTypeIds.length ? supabase.from('document_types').select('*').in('id', docTypeIds) : Promise.resolve({ data: [] }),
      ]);

      const typeMap = new Map((typesRes.data as PropertyType[])?.map((t) => [t.id, t]) || []);
      const areaMap = new Map((areasRes.data as Area[])?.map((a) => [a.id, a]) || []);
      const docTypeMap = new Map((docTypesRes.data as DocumentType[])?.map((d) => [d.id, d]) || []);

      props = props.map((p) => ({
        ...p,
        property_type: p.property_type_id ? typeMap.get(p.property_type_id) || null : null,
        area: p.area_id ? areaMap.get(p.area_id) || null : null,
        document_type: p.document_type_id ? docTypeMap.get(p.document_type_id) || null : null,
      }));

      setItems(props);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = filter === 'all' ? items : items.filter((p) => p.document_verified === filter);

  if (loading) return <div className="text-center py-8 text-gray-400">جاري التحميل...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">مراجعة الوثائق</h1>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'all', label: 'الكل' },
          { value: 'not_reviewed', label: 'لم تتم المراجعة' },
          { value: 'in_review', label: 'قيد المراجعة' },
          { value: 'verified', label: 'تمت المراجعة' },
          { value: 'needs_additional', label: 'يحتاج وثيقة إضافية' },
          { value: 'unclear', label: 'غير واضحة' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.value ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Link
              key={item.id}
              to={`/admin/property/${item.id}`}
              className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="font-bold text-gray-900">{item.title}</h3>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${getDocumentVerifiedColor(item.document_verified)}`}>
                  {getDocumentVerifiedLabel(item.document_verified)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                {item.document_type && (
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {item.document_type.name_ar}
                  </span>
                )}
                {item.area && <span>{item.area.name_ar}</span>}
                {item.document_review_notes && (
                  <span className="flex items-center gap-1 text-amber-600">
                    <AlertCircle className="w-3.5 h-3.5" />
                    يوجد ملاحظات
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">لا توجد وثائق للمراجعة</p>
        </div>
      )}
    </div>
  );
}
