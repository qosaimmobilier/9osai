import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { PropertyType, Area, DocumentType, OperationType } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export interface SearchFilters {
  query: string;
  operationType: OperationType | '';
  propertyTypeId: string;
  areaId: string;
  priceMin: string;
  priceMax: string;
  rooms: string;
  documentTypeId: string;
}

interface SearchBarProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  variant?: 'home' | 'page';
}

export function SearchBar({ filters, onChange, variant = 'page' }: SearchBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [docTypes, setDocTypes] = useState<DocumentType[]>([]);

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

  const isHome = variant === 'home';

  const priceLabel = filters.operationType === 'sale' ? 'مليون' : filters.operationType === 'rent' ? 'دج' : '';
  const showPriceFilter = filters.operationType === 'sale' || filters.operationType === 'rent';

  return (
    <div className={`w-full ${isHome ? 'bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6' : 'bg-white rounded-xl shadow-sm border border-gray-100 p-4'}`}>
      {/* Basic search row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Text search */}
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ابحث عن عقار..."
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
            className="w-full pr-10 pl-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
          />
        </div>

        {/* Operation type */}
        <select
          value={filters.operationType}
          onChange={(e) => onChange({ ...filters, operationType: e.target.value as OperationType | '' })}
          className="px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all bg-white text-gray-700"
        >
          <option value="">كل العمليات</option>
          <option value="sale">للبيع</option>
          <option value="rent">للكراء</option>
          <option value="exchange">للتبديل</option>
        </select>

        {/* Property type */}
        <select
          value={filters.propertyTypeId}
          onChange={(e) => onChange({ ...filters, propertyTypeId: e.target.value })}
          className="px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all bg-white text-gray-700"
        >
          <option value="">كل الأنواع</option>
          {propertyTypes.map((t) => (
            <option key={t.id} value={t.id}>{t.name_ar}</option>
          ))}
        </select>

        {/* Area */}
        <select
          value={filters.areaId}
          onChange={(e) => onChange({ ...filters, areaId: e.target.value })}
          className="px-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all bg-white text-gray-700"
        >
          <option value="">كل المناطق</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>{a.name_ar}</option>
          ))}
        </select>

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
            showAdvanced
              ? 'bg-primary-600 text-white'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">فلاتر متقدمة</span>
        </button>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-gray-100 animate-slide-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {showPriceFilter && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    السعر الأدنى {priceLabel && `(${priceLabel})`}
                  </label>
                  <input
                    type="number"
                    placeholder={filters.operationType === 'sale' ? '100' : '10000'}
                    value={filters.priceMin}
                    onChange={(e) => onChange({ ...filters, priceMin: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    السعر الأقصى {priceLabel && `(${priceLabel})`}
                  </label>
                  <input
                    type="number"
                    placeholder={filters.operationType === 'sale' ? '300' : '30000'}
                    value={filters.priceMax}
                    onChange={(e) => onChange({ ...filters, priceMax: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">عدد الغرف</label>
              <select
                value={filters.rooms}
                onChange={(e) => onChange({ ...filters, rooms: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm bg-white"
              >
                <option value="">الكل</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5+</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">نوع السند</label>
              <select
                value={filters.documentTypeId}
                onChange={(e) => onChange({ ...filters, documentTypeId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none text-sm bg-white"
              >
                <option value="">الكل</option>
                {docTypes.map((d) => (
                  <option key={d.id} value={d.id}>{d.name_ar}</option>
                ))}
              </select>
            </div>
          </div>

          {(filters.priceMin || filters.priceMax || filters.rooms || filters.documentTypeId) && (
            <button
              onClick={() => onChange({
                ...filters,
                priceMin: '', priceMax: '', rooms: '', documentTypeId: ''
              })}
              className="mt-3 flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
              مسح الفلاتر المتقدمة
            </button>
          )}
        </div>
      )}
    </div>
  );
}
