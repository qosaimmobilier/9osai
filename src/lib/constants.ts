import type { PropertyStatus, OperationType, PropertyCondition } from '@/types';

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  draft: 'مسودة',
  pending_review: 'قيد المراجعة',
  published: 'منشور',
  rejected: 'مرفوض',
  suspended: 'متوقف',
  sold: 'تم البيع',
  rented: 'تم الكراء',
  exchanged: 'تم التبديل',
  archived: 'مؤرشف',
};

export const PROPERTY_STATUS_COLORS: Record<PropertyStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending_review: 'bg-amber-100 text-amber-700',
  published: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  suspended: 'bg-orange-100 text-orange-700',
  sold: 'bg-blue-100 text-blue-700',
  rented: 'bg-cyan-100 text-cyan-700',
  exchanged: 'bg-purple-100 text-purple-700',
  archived: 'bg-gray-200 text-gray-600',
};

export const OPERATION_LABELS: Record<OperationType, string> = {
  sale: 'بيع',
  rent: 'كراء',
  exchange: 'تبديل',
};

export const OPERATION_COLORS: Record<OperationType, string> = {
  sale: 'bg-emerald-100 text-emerald-700',
  rent: 'bg-blue-100 text-blue-700',
  exchange: 'bg-amber-100 text-amber-700',
};

export const CONDITION_LABELS: Record<PropertyCondition, string> = {
  new: 'جديد',
  good: 'جيد',
  needs_renovation: 'يحتاج إلى ترميم',
  under_construction: 'قيد البناء',
  completed: 'مكتمل البناء',
};

export const PROPERTY_STATUSES: PropertyStatus[] = [
  'draft',
  'pending_review',
  'published',
  'rejected',
  'suspended',
  'sold',
  'rented',
  'exchanged',
  'archived',
];

export function formatPrice(price: number | null | undefined): string {
  if (price == null) return 'السعر عند الاتصال';
  const inDinar = price / 100;
  if (inDinar >= 1000000) {
    return (inDinar / 1000000).toFixed(2).replace(/\.00$/, '') + ' مليون دج';
  }
  if (inDinar >= 1000) {
    return (inDinar / 1000).toFixed(0) + ' ألف دج';
  }
  return inDinar.toFixed(0) + ' دج';
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('ar-DZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleString('ar-DZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
