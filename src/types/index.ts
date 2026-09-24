export type UserRole = 'admin' | 'advertiser';
export type UserStatus = 'active' | 'suspended' | 'banned' | 'pending_review';

export type PropertyStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'rejected'
  | 'suspended'
  | 'sold'
  | 'rented'
  | 'exchanged'
  | 'archived';

export type OperationType = 'sale' | 'rent' | 'exchange';
export type PropertyCondition = 'new' | 'good' | 'needs_renovation' | 'under_construction' | 'completed';

export interface Profile {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  email: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface PropertyType {
  id: string;
  name: string;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Location {
  id: string;
  wilaya: string;
  municipality: string;
  area: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Feature {
  id: string;
  name: string;
  icon: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Property {
  id: string;
  advertiser_id: string;
  title: string;
  operation_type: OperationType;
  property_type_id: string | null;
  wilaya: string | null;
  municipality: string | null;
  area: string | null;
  address: string | null;
  price: number | null;
  currency: string;
  area_size: number | null;
  rooms: number | null;
  bathrooms: number | null;
  floors: number | null;
  floor_number: number | null;
  facades: number | null;
  age: number | null;
  condition: PropertyCondition | null;
  description: string | null;
  status: PropertyStatus;
  featured: boolean;
  rejection_reason: string | null;
  admin_notes: string | null;
  exchange_for: string | null;
  exchange_conditions: string | null;
  show_phone: boolean;
  show_whatsapp: boolean;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  contact_name: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  property_type?: PropertyType | null;
  advertiser?: Profile | null;
  images?: PropertyImage[];
  videos?: PropertyVideo[];
  features?: Feature[];
}

export interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  storage_path: string | null;
  sort_order: number;
  is_cover: boolean;
  created_at: string;
}

export interface PropertyVideo {
  id: string;
  property_id: string;
  video_url: string;
  storage_path: string | null;
  thumbnail_url: string | null;
  is_external: boolean;
  created_at: string;
}

export interface ModerationLog {
  id: string;
  property_id: string;
  admin_id: string | null;
  action: string;
  reason: string | null;
  old_status: string | null;
  new_status: string | null;
  created_at: string;
  admin?: Profile | null;
}

export interface SiteSettings {
  id: number;
  platform_name: string;
  platform_subtitle: string;
  logo_url: string | null;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  facebook: string | null;
  require_approval: boolean;
  max_images: number;
  max_image_size_mb: number;
  allow_video: boolean;
  max_video_size_mb: number;
  allow_registration: boolean;
  require_account_approval: boolean;
  allow_edit_after_publish: boolean;
  edit_resets_status: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string | null;
  type: string | null;
  read: boolean;
  created_at: string;
}

export interface PropertyFormData {
  title: string;
  operation_type: OperationType;
  property_type_id: string;
  wilaya: string;
  municipality: string;
  area: string;
  address: string;
  price: string;
  currency: string;
  area_size: string;
  rooms: string;
  bathrooms: string;
  floors: string;
  floor_number: string;
  facades: string;
  age: string;
  condition: PropertyCondition | '';
  description: string;
  exchange_for: string;
  exchange_conditions: string;
  show_phone: boolean;
  show_whatsapp: boolean;
  contact_phone: string;
  contact_whatsapp: string;
  contact_name: string;
  feature_ids: string[];
}
