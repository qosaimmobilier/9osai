/*
# Qasi Real Estate Platform - Complete Database Schema
# قصي للعقار - قصر البخاري

## Overview
Creates the complete database schema for a real estate platform with three user types:
- Visitors (anon, no login needed) - browse published properties only
- Advertisers (authenticated) - add and manage their own properties, submit for review
- Admins (authenticated) - review/approve/reject properties, manage advertisers and settings

## Tables Created
1. profiles - extends auth.users with role, name, phone, status
2. property_types - manageable property categories (منزل, شقة, فيلا, etc.)
3. locations - manageable locations (wilaya, municipality, area)
4. features - manageable property features (مرآب, حديقة, etc.)
5. properties - main property listings with full details
6. property_images - images linked to properties
7. property_videos - videos linked to properties
8. property_features - junction table for property-feature mapping
9. moderation_logs - audit trail of admin actions on properties
10. site_settings - platform configuration (single row)
11. notifications - in-app notifications for advertisers

## Security (RLS)
- Visitors can only SELECT published properties and their related data
- Advertisers can CRUD their own properties (cannot self-publish, cannot set featured)
- Admins have full access to all data
- Property status transitions enforced via triggers (advertisers cannot set status to published/rejected/suspended/archived)
- Storage buckets with path-based ownership (user_id prefix in file path)

## Key Design Decisions
- First registered user automatically becomes admin (for initial setup)
- Properties default to 'pending_review' status - never auto-published
- Advertisers can mark properties as sold/rented/exchanged but not published
- Moderation logs track all admin status changes with reasons
- Notifications auto-generated on publish/reject/suspend events
- Storage paths use {user_id}/{property_id}/ structure for ownership-based access control
*/

-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'advertiser' CHECK (role IN ('admin', 'advertiser')),
  name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned', 'pending_review')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 2. PROPERTY TYPES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS property_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 3. LOCATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wilaya text NOT NULL,
  municipality text NOT NULL,
  area text,
  active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 4. FEATURES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text,
  active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 5. PROPERTIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  operation_type text NOT NULL CHECK (operation_type IN ('sale', 'rent', 'exchange')),
  property_type_id uuid REFERENCES property_types(id),
  wilaya text,
  municipality text,
  area text,
  address text,
  price numeric,
  currency text DEFAULT 'DZD',
  area_size numeric,
  rooms int,
  bathrooms int,
  floors int,
  floor_number int,
  facades int,
  age int,
  condition text CHECK (condition IN ('new', 'good', 'needs_renovation', 'under_construction', 'completed')),
  description text,
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('draft', 'pending_review', 'published', 'rejected', 'suspended', 'sold', 'rented', 'exchanged', 'archived')),
  featured boolean DEFAULT false,
  rejection_reason text,
  admin_notes text,
  exchange_for text,
  exchange_conditions text,
  show_phone boolean DEFAULT true,
  show_whatsapp boolean DEFAULT true,
  contact_phone text,
  contact_whatsapp text,
  contact_name text,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_advertiser ON properties(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_properties_operation ON properties(operation_type);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type_id);
CREATE INDEX IF NOT EXISTS idx_properties_wilaya ON properties(wilaya);
CREATE INDEX IF NOT EXISTS idx_properties_municipality ON properties(municipality);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(featured);
CREATE INDEX IF NOT EXISTS idx_properties_created ON properties(created_at DESC);

-- ============================================================
-- 6. PROPERTY IMAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  storage_path text,
  sort_order int DEFAULT 0,
  is_cover boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_images_property ON property_images(property_id);

-- ============================================================
-- 7. PROPERTY VIDEOS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS property_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  video_url text NOT NULL,
  storage_path text,
  thumbnail_url text,
  is_external boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_videos_property ON property_videos(property_id);

-- ============================================================
-- 8. PROPERTY FEATURES JUNCTION TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS property_features (
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  feature_id uuid NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  PRIMARY KEY (property_id, feature_id)
);

-- ============================================================
-- 9. MODERATION LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS moderation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES profiles(id),
  action text NOT NULL,
  reason text,
  old_status text,
  new_status text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moderation_logs_property ON moderation_logs(property_id);

-- ============================================================
-- 10. SITE SETTINGS TABLE (single row, id = 1)
-- ============================================================
CREATE TABLE IF NOT EXISTS site_settings (
  id int PRIMARY KEY DEFAULT 1,
  platform_name text DEFAULT 'قصي للعقار',
  platform_subtitle text DEFAULT 'قصر البخاري',
  logo_url text,
  description text,
  phone text,
  whatsapp text,
  email text,
  facebook text,
  require_approval boolean DEFAULT true,
  max_images int DEFAULT 10,
  max_image_size_mb int DEFAULT 5,
  allow_video boolean DEFAULT true,
  max_video_size_mb int DEFAULT 50,
  allow_registration boolean DEFAULT true,
  require_account_approval boolean DEFAULT false,
  allow_edit_after_publish boolean DEFAULT true,
  edit_resets_status boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- 11. NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS (SECURITY DEFINER for cross-table checks)
-- ============================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_active_advertiser()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'advertiser' AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create profile on signup (first user becomes admin)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_count int;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles;
  INSERT INTO profiles (id, name, phone, email, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.email,
    CASE WHEN user_count = 0 THEN 'admin' ELSE 'advertiser' END,
    'active'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS properties_updated_at ON properties;
CREATE TRIGGER properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS site_settings_updated_at ON site_settings;
CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON site_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Protect property fields from non-admin modification
-- Advertisers cannot: set published/rejected/suspended/archived status,
-- change featured flag, change advertiser_id, set rejection_reason/admin_notes
CREATE OR REPLACE FUNCTION protect_property_fields()
RETURNS trigger AS $$
BEGIN
  IF NOT (SELECT is_admin()) THEN
    IF NEW.status IN ('published', 'rejected', 'suspended', 'archived') THEN
      NEW.status = OLD.status;
    END IF;
    NEW.featured = OLD.featured;
    NEW.advertiser_id = OLD.advertiser_id;
    NEW.rejection_reason = OLD.rejection_reason;
    NEW.admin_notes = OLD.admin_notes;
  END IF;
  -- Set published_at and clear rejection_reason when publishing
  IF NEW.status = 'published' AND OLD.status <> 'published' THEN
    NEW.published_at = now();
    NEW.rejection_reason = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_property_fields_trigger ON properties;
CREATE TRIGGER protect_property_fields_trigger BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION protect_property_fields();

-- Log admin status changes to moderation_logs
CREATE OR REPLACE FUNCTION log_property_status_change()
RETURNS trigger AS $$
BEGIN
  IF NEW.status <> OLD.status AND (SELECT is_admin()) THEN
    INSERT INTO moderation_logs (property_id, admin_id, action, reason, old_status, new_status)
    VALUES (NEW.id, auth.uid(), NEW.status, NEW.rejection_reason, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS log_property_status ON properties;
CREATE TRIGGER log_property_status AFTER UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION log_property_status_change();

-- Send notifications on status changes
CREATE OR REPLACE FUNCTION notify_property_status_change()
RETURNS trigger AS $$
BEGIN
  IF NEW.status <> OLD.status THEN
    IF NEW.status = 'published' THEN
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (NEW.advertiser_id, 'تم نشر عقارك',
        'تم قبول ونشر عقارك "' || NEW.title || '" بنجاح.', 'property_published');
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (NEW.advertiser_id, 'تم رفض عقارك',
        'تم رفض عقارك "' || NEW.title || '"' ||
        COALESCE('. السبب: ' || NEW.rejection_reason, ''), 'property_rejected');
    ELSIF NEW.status = 'suspended' THEN
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (NEW.advertiser_id, 'تم إيقاف عقارك',
        'تم إيقاف عقارك "' || NEW.title || '" من طرف الإدارة.', 'property_suspended');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_property_status ON properties;
CREATE TRIGGER notify_property_status AFTER UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION notify_property_status_change();

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- profiles: users see own, admin sees all; users update own, admin updates all; admin deletes
DROP POLICY IF EXISTS "select_own_or_admin_profiles" ON profiles;
CREATE POLICY "select_own_or_admin_profiles" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id OR (SELECT is_admin()));

DROP POLICY IF EXISTS "update_own_or_admin_profiles" ON profiles;
CREATE POLICY "update_own_or_admin_profiles" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id OR (SELECT is_admin()))
  WITH CHECK (auth.uid() = id OR (SELECT is_admin()));

DROP POLICY IF EXISTS "delete_admin_profiles" ON profiles;
CREATE POLICY "delete_admin_profiles" ON profiles FOR DELETE
  TO authenticated USING ((SELECT is_admin()));

-- property_types: public read, admin write
DROP POLICY IF EXISTS "select_property_types" ON property_types;
CREATE POLICY "select_property_types" ON property_types FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_admin_property_types" ON property_types;
CREATE POLICY "insert_admin_property_types" ON property_types FOR INSERT
  TO authenticated WITH CHECK ((SELECT is_admin()));

DROP POLICY IF EXISTS "update_admin_property_types" ON property_types;
CREATE POLICY "update_admin_property_types" ON property_types FOR UPDATE
  TO authenticated USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));

DROP POLICY IF EXISTS "delete_admin_property_types" ON property_types;
CREATE POLICY "delete_admin_property_types" ON property_types FOR DELETE
  TO authenticated USING ((SELECT is_admin()));

-- locations: public read, admin write
DROP POLICY IF EXISTS "select_locations" ON locations;
CREATE POLICY "select_locations" ON locations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_admin_locations" ON locations;
CREATE POLICY "insert_admin_locations" ON locations FOR INSERT
  TO authenticated WITH CHECK ((SELECT is_admin()));

DROP POLICY IF EXISTS "update_admin_locations" ON locations;
CREATE POLICY "update_admin_locations" ON locations FOR UPDATE
  TO authenticated USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));

DROP POLICY IF EXISTS "delete_admin_locations" ON locations;
CREATE POLICY "delete_admin_locations" ON locations FOR DELETE
  TO authenticated USING ((SELECT is_admin()));

-- features: public read, admin write
DROP POLICY IF EXISTS "select_features" ON features;
CREATE POLICY "select_features" ON features FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_admin_features" ON features;
CREATE POLICY "insert_admin_features" ON features FOR INSERT
  TO authenticated WITH CHECK ((SELECT is_admin()));

DROP POLICY IF EXISTS "update_admin_features" ON features;
CREATE POLICY "update_admin_features" ON features FOR UPDATE
  TO authenticated USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));

DROP POLICY IF EXISTS "delete_admin_features" ON features;
CREATE POLICY "delete_admin_features" ON features FOR DELETE
  TO authenticated USING ((SELECT is_admin()));

-- properties: complex multi-role access
-- SELECT: anon sees published, advertiser sees own, admin sees all
DROP POLICY IF EXISTS "select_properties" ON properties;
CREATE POLICY "select_properties" ON properties FOR SELECT
  TO anon, authenticated USING (
    status = 'published' OR
    (auth.uid() = advertiser_id) OR
    (SELECT is_admin())
  );

-- INSERT: active advertisers only, must own, cannot self-publish
DROP POLICY IF EXISTS "insert_properties" ON properties;
CREATE POLICY "insert_properties" ON properties FOR INSERT
  TO authenticated WITH CHECK (
    advertiser_id = auth.uid() AND
    (SELECT is_active_advertiser()) AND
    status IN ('draft', 'pending_review') AND
    featured = false
  );

-- UPDATE: advertiser updates own (trigger restricts fields), admin updates all
DROP POLICY IF EXISTS "update_properties" ON properties;
CREATE POLICY "update_properties" ON properties FOR UPDATE
  TO authenticated USING (
    auth.uid() = advertiser_id OR (SELECT is_admin())
  ) WITH CHECK (
    auth.uid() = advertiser_id OR (SELECT is_admin())
  );

-- DELETE: admin only
DROP POLICY IF EXISTS "delete_properties" ON properties;
CREATE POLICY "delete_properties" ON properties FOR DELETE
  TO authenticated USING ((SELECT is_admin()));

-- property_images: public sees published property images, advertiser sees own, admin sees all
DROP POLICY IF EXISTS "select_property_images" ON property_images;
CREATE POLICY "select_property_images" ON property_images FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM properties WHERE properties.id = property_images.property_id AND properties.status = 'published') OR
    EXISTS (SELECT 1 FROM properties WHERE properties.id = property_images.property_id AND properties.advertiser_id = auth.uid()) OR
    (SELECT is_admin())
  );

DROP POLICY IF EXISTS "insert_property_images" ON property_images;
CREATE POLICY "insert_property_images" ON property_images FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM properties WHERE properties.id = property_id AND properties.advertiser_id = auth.uid()) OR
    (SELECT is_admin())
  );

DROP POLICY IF EXISTS "update_property_images" ON property_images;
CREATE POLICY "update_property_images" ON property_images FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM properties WHERE properties.id = property_id AND properties.advertiser_id = auth.uid()) OR
    (SELECT is_admin())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM properties WHERE properties.id = property_id AND properties.advertiser_id = auth.uid()) OR
    (SELECT is_admin())
  );

DROP POLICY IF EXISTS "delete_property_images" ON property_images;
CREATE POLICY "delete_property_images" ON property_images FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM properties WHERE properties.id = property_id AND properties.advertiser_id = auth.uid()) OR
    (SELECT is_admin())
  );

-- property_videos: same pattern as images
DROP POLICY IF EXISTS "select_property_videos" ON property_videos;
CREATE POLICY "select_property_videos" ON property_videos FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM properties WHERE properties.id = property_videos.property_id AND properties.status = 'published') OR
    EXISTS (SELECT 1 FROM properties WHERE properties.id = property_videos.property_id AND properties.advertiser_id = auth.uid()) OR
    (SELECT is_admin())
  );

DROP POLICY IF EXISTS "insert_property_videos" ON property_videos;
CREATE POLICY "insert_property_videos" ON property_videos FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM properties WHERE properties.id = property_id AND properties.advertiser_id = auth.uid()) OR
    (SELECT is_admin())
  );

DROP POLICY IF EXISTS "update_property_videos" ON property_videos;
CREATE POLICY "update_property_videos" ON property_videos FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM properties WHERE properties.id = property_id AND properties.advertiser_id = auth.uid()) OR
    (SELECT is_admin())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM properties WHERE properties.id = property_id AND properties.advertiser_id = auth.uid()) OR
    (SELECT is_admin())
  );

DROP POLICY IF EXISTS "delete_property_videos" ON property_videos;
CREATE POLICY "delete_property_videos" ON property_videos FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM properties WHERE properties.id = property_id AND properties.advertiser_id = auth.uid()) OR
    (SELECT is_admin())
  );

-- property_features: same pattern
DROP POLICY IF EXISTS "select_property_features" ON property_features;
CREATE POLICY "select_property_features" ON property_features FOR SELECT
  TO anon, authenticated USING (
    EXISTS (SELECT 1 FROM properties WHERE properties.id = property_features.property_id AND properties.status = 'published') OR
    EXISTS (SELECT 1 FROM properties WHERE properties.id = property_features.property_id AND properties.advertiser_id = auth.uid()) OR
    (SELECT is_admin())
  );

DROP POLICY IF EXISTS "insert_property_features" ON property_features;
CREATE POLICY "insert_property_features" ON property_features FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM properties WHERE properties.id = property_id AND properties.advertiser_id = auth.uid()) OR
    (SELECT is_admin())
  );

DROP POLICY IF EXISTS "delete_property_features" ON property_features;
CREATE POLICY "delete_property_features" ON property_features FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM properties WHERE properties.id = property_id AND properties.advertiser_id = auth.uid()) OR
    (SELECT is_admin())
  );

-- moderation_logs: admin only
DROP POLICY IF EXISTS "select_moderation_logs" ON moderation_logs;
CREATE POLICY "select_moderation_logs" ON moderation_logs FOR SELECT
  TO authenticated USING ((SELECT is_admin()));

DROP POLICY IF EXISTS "insert_moderation_logs" ON moderation_logs;
CREATE POLICY "insert_moderation_logs" ON moderation_logs FOR INSERT
  TO authenticated WITH CHECK ((SELECT is_admin()));

-- site_settings: public read, admin write
DROP POLICY IF EXISTS "select_site_settings" ON site_settings;
CREATE POLICY "select_site_settings" ON site_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "update_site_settings" ON site_settings;
CREATE POLICY "update_site_settings" ON site_settings FOR UPDATE
  TO authenticated USING ((SELECT is_admin())) WITH CHECK ((SELECT is_admin()));

-- notifications: users see own, admin sees all; admin can insert for any user
DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR (SELECT is_admin()));

DROP POLICY IF EXISTS "insert_notifications" ON notifications;
CREATE POLICY "insert_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id OR (SELECT is_admin()));

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id OR (SELECT is_admin()));

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('property-videos', 'property-videos', true) ON CONFLICT DO NOTHING;

-- Storage: property-images policies
DROP POLICY IF EXISTS "Public read property images" ON storage.objects;
CREATE POLICY "Public read property images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'property-images');

DROP POLICY IF EXISTS "Auth upload own property images" ON storage.objects;
CREATE POLICY "Auth upload own property images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'property-images' AND name LIKE auth.uid()::text || '/%');

DROP POLICY IF EXISTS "Users update own property images" ON storage.objects;
CREATE POLICY "Users update own property images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'property-images' AND name LIKE auth.uid()::text || '/%')
  WITH CHECK (bucket_id = 'property-images' AND name LIKE auth.uid()::text || '/%');

DROP POLICY IF EXISTS "Users delete own property images" ON storage.objects;
CREATE POLICY "Users delete own property images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'property-images' AND name LIKE auth.uid()::text || '/%');

DROP POLICY IF EXISTS "Admin delete property images" ON storage.objects;
CREATE POLICY "Admin delete property images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'property-images' AND (SELECT is_admin()));

-- Storage: property-videos policies
DROP POLICY IF EXISTS "Public read property videos" ON storage.objects;
CREATE POLICY "Public read property videos" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'property-videos');

DROP POLICY IF EXISTS "Auth upload own property videos" ON storage.objects;
CREATE POLICY "Auth upload own property videos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'property-videos' AND name LIKE auth.uid()::text || '/%');

DROP POLICY IF EXISTS "Users update own property videos" ON storage.objects;
CREATE POLICY "Users update own property videos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'property-videos' AND name LIKE auth.uid()::text || '/%')
  WITH CHECK (bucket_id = 'property-videos' AND name LIKE auth.uid()::text || '/%');

DROP POLICY IF EXISTS "Users delete own property videos" ON storage.objects;
CREATE POLICY "Users delete own property videos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'property-videos' AND name LIKE auth.uid()::text || '/%');

DROP POLICY IF EXISTS "Admin delete property videos" ON storage.objects;
CREATE POLICY "Admin delete property videos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'property-videos' AND (SELECT is_admin()));

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default property types
INSERT INTO property_types (name, sort_order) VALUES
  ('منزل', 1), ('شقة', 2), ('فيلا', 3), ('أرض', 4), ('محل', 5),
  ('مكتب', 6), ('مستودع', 7), ('غرفة', 8), ('عقار تجاري', 9), ('عقار آخر', 10)
ON CONFLICT DO NOTHING;

-- Default features
INSERT INTO features (name, sort_order) VALUES
  ('مرآب', 1), ('حديقة', 2), ('شرفة', 3), ('سطح', 4), ('مدخل مستقل', 5),
  ('ماء', 6), ('كهرباء', 7), ('غاز', 8), ('صرف صحي', 9), ('طريق معبد', 10),
  ('قريب من المدرسة', 11), ('قريب من المسجد', 12), ('قريب من السوق', 13), ('قريب من الخدمات', 14)
ON CONFLICT DO NOTHING;

-- Default locations (المدية province, قصر البخاري municipality)
INSERT INTO locations (wilaya, municipality, area, sort_order) VALUES
  ('المدية', 'قصر البخاري', 'الشيخ مسعود', 1),
  ('المدية', 'قصر البخاري', 'الحلالية', 2),
  ('المدية', 'قصر البخاري', 'سونيلك', 3),
  ('المدية', 'قصر البخاري', 'حي الفتح', 4),
  ('المدية', 'قصر البخاري', 'المدينة الجديدة', 5),
  ('المدية', 'قصر البخاري', 'وسط المدينة', 6),
  ('المدية', 'بوسعادة', NULL, 7),
  ('المدية', 'برواقة', NULL, 8),
  ('المدية', 'أولاد براهيم', NULL, 9),
  ('المدية', 'تابلاط', NULL, 10),
  ('المدية', 'العزيزية', NULL, 11),
  ('المدية', 'الشلالة العذاورة', NULL, 12)
ON CONFLICT DO NOTHING;

-- Default site settings
INSERT INTO site_settings (id) VALUES (1) ON CONFLICT DO NOTHING;