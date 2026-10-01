export type UserRole = 'admin' | 'exhibitor';

export type OperationType = 'sale' | 'rent' | 'exchange';

export type PropertyStatus =
  | 'draft'
  | 'in_review'
  | 'published'
  | 'rejected'
  | 'paused'
  | 'sold'
  | 'rented'
  | 'exchanged'
  | 'archived';

export type DocumentVerified =
  | 'not_reviewed'
  | 'in_review'
  | 'verified'
  | 'needs_additional'
  | 'unclear';

export type PriceUnit = 'million' | 'dzd_monthly' | 'exchange_diff';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  username: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PropertyType {
  id: string;
  name: string;
  name_ar: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface DocumentType {
  id: string;
  name: string;
  name_ar: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Area {
  id: string;
  name: string;
  name_ar: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Property {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  operation_type: OperationType;
  property_type_id: string | null;
  area_id: string | null;
  price: number | null;
  price_unit: PriceUnit | null;
  exchange_conditions: string | null;
  exchange_target: string | null;
  exchange_price_diff: number | null;
  area_size: number | null;
  rooms: number | null;
  floors: number | null;
  bathrooms: number | null;
  status: PropertyStatus;
  document_type_id: string | null;
  document_number: string | null;
  document_date: string | null;
  document_authority: string | null;
  document_notes: string | null;
  document_verified: DocumentVerified;
  document_visible_to_public: boolean;
  document_review_notes: string | null;
  rejection_reason: string | null;
  admin_notes: string | null;
  video_url: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface PropertyDocument {
  id: string;
  property_id: string;
  document_url: string;
  document_type_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  admin_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface PlatformSettings {
  id: number;
  site_name: string;
  site_subtitle: string;
  contact_phone: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  allow_direct_contact: boolean;
  show_contact_form: boolean;
  updated_at: string;
}

export interface PropertyWithRelations extends Property {
  property_type?: PropertyType | null;
  area?: Area | null;
  document_type?: DocumentType | null;
  property_images?: PropertyImage[];
  owner?: Profile | null;
}
