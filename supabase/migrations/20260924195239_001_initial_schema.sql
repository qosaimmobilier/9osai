/*
# قصي للعقار - قاعدة البيانات الأولية

الوصف: إنشاء الجداول الأساسية لمنصة عقارية متعددة الأدوار (زبون، عارض، إدارة)
مع نظام صلاحيات RLS كامل.

الجداول الجديدة:
1. profiles - ملفات المستخدمين مع تحديد الدور (admin/exhibitor)
2. property_types - أنواع العقارات (قابلة للإدارة)
3. document_types - أنواع السندات العقارية (قابلة للإدارة)
4. areas - المناطق (قابلة للإدارة)
5. properties - العقارات الرئيسية
6. property_images - صور العقارات
7. property_documents - وثائق العقار الخاصة
8. audit_log - سجل العمليات الإدارية
9. platform_settings - إعدادات المنصة

الأمان:
- تفعيل RLS على جميع الجداول
- سياسات مخصصة لكل دور
- الزبون (anon): يقرأ العقارات المنشورة فقط
- العارض (authenticated): يدير عقاراته فقط
- الإدارة: صلاحيات كاملة عبر دوال SECURITY DEFINER
*/

-- 1. profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  phone text,
  role text NOT NULL DEFAULT 'exhibitor' CHECK (role IN ('admin', 'exhibitor')),
  username text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
CREATE POLICY "insert_own_profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- 2. property_types
CREATE TABLE IF NOT EXISTS public.property_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  name_ar text NOT NULL,
  icon text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.property_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pt_select_all" ON public.property_types;
CREATE POLICY "pt_select_all" ON public.property_types
  FOR SELECT TO anon, authenticated USING (is_active = true);

-- 3. document_types
CREATE TABLE IF NOT EXISTS public.document_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  name_ar text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dt_select_all" ON public.document_types;
CREATE POLICY "dt_select_all" ON public.document_types
  FOR SELECT TO anon, authenticated USING (is_active = true);

-- 4. areas
CREATE TABLE IF NOT EXISTS public.areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  name_ar text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "areas_select_all" ON public.areas;
CREATE POLICY "areas_select_all" ON public.areas
  FOR SELECT TO anon, authenticated USING (is_active = true);

-- 5. properties
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,

  title text NOT NULL,
  description text,

  operation_type text NOT NULL CHECK (operation_type IN ('sale', 'rent', 'exchange')),

  property_type_id uuid REFERENCES public.property_types(id) ON DELETE SET NULL,
  area_id uuid REFERENCES public.areas(id) ON DELETE SET NULL,

  price numeric,
  price_unit text CHECK (price_unit IN ('million', 'dzd_monthly', 'exchange_diff')),

  exchange_conditions text,
  exchange_target text,
  exchange_price_diff numeric,

  area_size numeric,
  rooms int,
  floors int,
  bathrooms int,

  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'in_review', 'published', 'rejected', 'paused',
    'sold', 'rented', 'exchanged', 'archived'
  )),

  document_type_id uuid REFERENCES public.document_types(id) ON DELETE SET NULL,
  document_number text,
  document_date date,
  document_authority text,
  document_notes text,
  document_verified text DEFAULT 'not_reviewed' CHECK (document_verified IN (
    'not_reviewed', 'in_review', 'verified', 'needs_additional', 'unclear'
  )),
  document_visible_to_public boolean NOT NULL DEFAULT false,
  document_review_notes text,

  rejection_reason text,
  admin_notes text,

  video_url text,

  contact_name text,
  contact_phone text,
  contact_email text,

  is_featured boolean NOT NULL DEFAULT false,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_owner ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_operation ON public.properties(operation_type);
CREATE INDEX IF NOT EXISTS idx_properties_type ON public.properties(property_type_id);
CREATE INDEX IF NOT EXISTS idx_properties_area ON public.properties(area_id);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Properties: public can read only published
DROP POLICY IF EXISTS "props_select_published" ON public.properties;
CREATE POLICY "props_select_published" ON public.properties
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

-- Properties: owner can read all their own properties
DROP POLICY IF EXISTS "props_select_own" ON public.properties;
CREATE POLICY "props_select_own" ON public.properties
  FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);

-- Properties: owner can insert (status must be draft or in_review)
DROP POLICY IF EXISTS "props_insert_own" ON public.properties;
CREATE POLICY "props_insert_own" ON public.properties
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id AND status IN ('draft', 'in_review'));

-- Properties: owner can update their own properties
DROP POLICY IF EXISTS "props_update_own" ON public.properties;
CREATE POLICY "props_update_own" ON public.properties
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Properties: owner can delete their own
DROP POLICY IF EXISTS "props_delete_own" ON public.properties;
CREATE POLICY "props_delete_own" ON public.properties
  FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

-- 6. property_images
CREATE TABLE IF NOT EXISTS public.property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_images_property ON public.property_images(property_id);

ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;

-- Images: public can read images of published properties
DROP POLICY IF EXISTS "img_select_published" ON public.property_images;
CREATE POLICY "img_select_published" ON public.property_images
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.status = 'published'
    )
  );

-- Images: owner can read all images of their properties
DROP POLICY IF EXISTS "img_select_own" ON public.property_images;
CREATE POLICY "img_select_own" ON public.property_images
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.owner_id = auth.uid()
    )
  );

-- Images: owner can insert
DROP POLICY IF EXISTS "img_insert_own" ON public.property_images;
CREATE POLICY "img_insert_own" ON public.property_images
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.owner_id = auth.uid()
    )
  );

-- Images: owner can update
DROP POLICY IF EXISTS "img_update_own" ON public.property_images;
CREATE POLICY "img_update_own" ON public.property_images
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.owner_id = auth.uid()
    )
  );

-- Images: owner can delete
DROP POLICY IF EXISTS "img_delete_own" ON public.property_images;
CREATE POLICY "img_delete_own" ON public.property_images
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.owner_id = auth.uid()
    )
  );

-- 7. property_documents (private document images)
CREATE TABLE IF NOT EXISTS public.property_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  document_url text NOT NULL,
  document_type_id uuid REFERENCES public.document_types(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_docs_property ON public.property_documents(property_id);

ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;

-- Documents: only owner can read (NEVER public)
DROP POLICY IF EXISTS "doc_select_own" ON public.property_documents;
CREATE POLICY "doc_select_own" ON public.property_documents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.owner_id = auth.uid()
    )
  );

-- Documents: owner can insert
DROP POLICY IF EXISTS "doc_insert_own" ON public.property_documents;
CREATE POLICY "doc_insert_own" ON public.property_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.owner_id = auth.uid()
    )
  );

-- Documents: owner can delete
DROP POLICY IF EXISTS "doc_delete_own" ON public.property_documents;
CREATE POLICY "doc_delete_own" ON public.property_documents
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.owner_id = auth.uid()
    )
  );

-- 8. audit_log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_log(entity_type, entity_id);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- 9. platform_settings
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id int PRIMARY KEY DEFAULT 1,
  site_name text NOT NULL DEFAULT 'قصي للعقار',
  site_subtitle text NOT NULL DEFAULT 'قصر البخاري',
  contact_phone text,
  contact_email text,
  contact_whatsapp text,
  allow_direct_contact boolean NOT NULL DEFAULT true,
  show_contact_form boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_select_all" ON public.platform_settings;
CREATE POLICY "settings_select_all" ON public.platform_settings
  FOR SELECT TO anon, authenticated USING (true);

-- 10. Helper function: is_admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_uuid AND role = 'admin'
  );
$$;

-- 11. Seed data: property types
INSERT INTO public.property_types (name, name_ar, sort_order) VALUES
  ('house', 'منزل', 1),
  ('apartment', 'شقة', 2),
  ('land', 'أرض', 3),
  ('commercial', 'محل تجاري', 4),
  ('office', 'مكتب', 5),
  ('villa', 'فيلا', 6),
  ('building_land', 'قطعة أرض للبناء', 7),
  ('garage', 'مرآب', 8),
  ('warehouse', 'مستودع', 9),
  ('other', 'عقار آخر', 10)
ON CONFLICT (name) DO NOTHING;

-- 12. Seed data: document types
INSERT INTO public.document_types (name, name_ar, sort_order) VALUES
  ('livret', 'دفتر عقاري', 1),
  ('ownership', 'عقد ملكية', 2),
  ('possession_cert', 'شهادة حيازة', 3),
  ('possession_contract', 'عقد حيازة / سند حيازة', 4),
  ('concession', 'عقد امتياز', 5),
  ('admin_contract', 'عقد إداري', 6),
  ('admin_decision', 'قرار إداري', 7),
  ('notarized', 'عقد موثق', 8),
  ('other_doc', 'وثيقة أخرى', 9),
  ('no_doc', 'بدون وثيقة / غير محدد', 10)
ON CONFLICT (name) DO NOTHING;

-- 13. Seed data: areas
INSERT INTO public.areas (name, name_ar, sort_order) VALUES
  ('ksar_el_boukhari', 'قصر البخاري', 1),
  ('cheikh_massoud', 'الشيخ مسعود', 2),
  ('medea', 'المدية', 3),
  ('beni_slimane', 'بني سليمان', 4),
  ('ouled_antar', 'أولاد عنتر', 5),
  ('tablat', 'تابلاط', 6),
  ('ouzmor', 'أوزمور', 7),
  ('other_area', 'منطقة أخرى', 99)
ON CONFLICT (name) DO NOTHING;

-- 14. Seed data: platform settings
INSERT INTO public.platform_settings (id, site_name, site_subtitle)
VALUES (1, 'قصي للعقار', 'قصر البخاري')
ON CONFLICT (id) DO NOTHING;

-- 15. Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', ''),
    'exhibitor'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
