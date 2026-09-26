import type { OperationType, PriceUnit, PropertyStatus, DocumentVerified } from './types';

export function formatPrice(
  operationType: OperationType,
  price: number | null,
  priceUnit: PriceUnit | null
): string {
  if (operationType === 'sale') {
    if (price === null || price === undefined) return 'السعر غير محدد';
    return `${price} مليون`;
  }

  if (operationType === 'rent') {
    if (price === null || price === undefined) return 'السعر غير محدد';
    return `${price.toLocaleString('en-US')} دج / شهريًا`;
  }

  if (operationType === 'exchange') {
    return 'للتبديل';
  }

  return 'السعر غير محدد';
}

export function formatPricePreview(
  operationType: OperationType,
  price: number | null
): string {
  if (operationType === 'sale') {
    if (!price) return 'سيظهر للزبون: —';
    return `سيظهر للزبون: ${price} مليون`;
  }
  if (operationType === 'rent') {
    if (!price) return 'سيظهر للزبون: —';
    return `سيظهر للزبون: ${price.toLocaleString('en-US')} دج / شهريًا`;
  }
  return 'السعر اختياري في التبديل';
}

export function getOperationTypeLabel(type: OperationType): string {
  switch (type) {
    case 'sale': return 'للبيع';
    case 'rent': return 'للكراء';
    case 'exchange': return 'للتبديل';
  }
}

export function getPropertyStatusLabel(status: PropertyStatus): string {
  switch (status) {
    case 'draft': return 'مسودة';
    case 'in_review': return 'قيد المراجعة';
    case 'published': return 'منشور';
    case 'rejected': return 'مرفوض';
    case 'paused': return 'متوقف';
    case 'sold': return 'مباع';
    case 'rented': return 'مكترى';
    case 'exchanged': return 'تم التبديل';
    case 'archived': return 'مؤرشف';
  }
}

export function getPropertyStatusColor(status: PropertyStatus): string {
  switch (status) {
    case 'draft': return 'bg-gray-100 text-gray-700';
    case 'in_review': return 'bg-amber-100 text-amber-700';
    case 'published': return 'bg-emerald-100 text-emerald-700';
    case 'rejected': return 'bg-red-100 text-red-700';
    case 'paused': return 'bg-orange-100 text-orange-700';
    case 'sold': return 'bg-blue-100 text-blue-700';
    case 'rented': return 'bg-cyan-100 text-cyan-700';
    case 'exchanged': return 'bg-teal-100 text-teal-700';
    case 'archived': return 'bg-gray-200 text-gray-600';
  }
}

export function getDocumentVerifiedLabel(status: DocumentVerified): string {
  switch (status) {
    case 'not_reviewed': return 'لم تتم المراجعة';
    case 'in_review': return 'قيد المراجعة';
    case 'verified': return 'تمت المراجعة';
    case 'needs_additional': return 'يحتاج إلى وثيقة إضافية';
    case 'unclear': return 'الوثيقة غير واضحة';
  }
}

export function getDocumentVerifiedColor(status: DocumentVerified): string {
  switch (status) {
    case 'not_reviewed': return 'bg-gray-100 text-gray-700';
    case 'in_review': return 'bg-amber-100 text-amber-700';
    case 'verified': return 'bg-emerald-100 text-emerald-700';
    case 'needs_additional': return 'bg-orange-100 text-orange-700';
    case 'unclear': return 'bg-red-100 text-red-700';
  }
}

export function getAuditActionLabel(action: string): string {
  const labels: Record<string, string> = {
    approve_property: 'قبول عقار',
    reject_property: 'رفض عقار',
    change_property_status: 'تغيير حالة عقار',
    update_property: 'تعديل عقار',
    delete_property: 'حذف عقار',
    delete_image: 'حذف صورة',
    set_primary_image: 'تحديد صورة رئيسية',
    review_document: 'مراجعة وثيقة',
    add_property_type: 'إضافة نوع عقار',
    update_property_type: 'تعديل نوع عقار',
    delete_property_type: 'حذف نوع عقار',
    add_document_type: 'إضافة نوع سند',
    update_document_type: 'تعديل نوع سند',
    delete_document_type: 'حذف نوع سند',
    add_area: 'إضافة منطقة',
    update_area: 'تعديل منطقة',
    delete_area: 'حذف منطقة',
    update_settings: 'تحديث الإعدادات',
    update_profile: 'تعديل مستخدم',
    delete_document: 'حذف وثيقة',
  };
  return labels[action] || action;
}

export function formatPriceInputPlaceholder(operationType: OperationType): string {
  if (operationType === 'sale') return 'مثال: 120';
  if (operationType === 'rent') return 'مثال: 15000';
  return '';
}

export function formatPriceInputLabel(operationType: OperationType): string {
  if (operationType === 'sale') return 'السعر بالمليون';
  if (operationType === 'rent') return 'السعر بالدينار الجزائري / شهريًا';
  return 'فرق السعر إن وجد (اختياري)';
}
