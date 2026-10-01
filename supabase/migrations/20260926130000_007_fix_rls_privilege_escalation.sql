/*
# قصي للعقار - سد ثغرات صلاحيات (RLS Privilege Escalation)

المشكلة:
1. سياسة "props_update_own" كانت تتحقق فقط من الملكية (owner_id = auth.uid())
   دون أي قيد على الحقول أو القيم المسموح تعديلها. هذا يسمح لأي عارض
   بتجاوز مراجعة الإدارة كليًا عبر استدعاء مباشر لـ REST API وتعيين:
   - status = 'published' (نشر بدون موافقة الإدارة)
   - is_featured = true (تمييز العقار بنفسه)
   - document_verified = 'verified' (توثيق وثائقه بنفسه)
   - document_visible_to_public, admin_notes, rejection_reason (حقول إدارية)

2. سياسات storage.objects لمجلدي property-images و property-documents
   كانت تتحقق فقط من bucket_id دون أي تحقق فعلي من الملكية، رغم أن
   أسماء السياسات (images_update_owner, docs_read_owner...) توحي بعكس ذلك.
   هذا يسمح لأي مستخدم مسجل بقراءة/حذف/تعديل ملفات أي عقار آخر بما فيها
   الوثائق الخاصة (عقود الملكية) في property-documents.

الحل:
- Trigger على properties يعيد فرض القيم القديمة على الحقول الإدارية عند
  أي تحديث لا يقوم به admin، ويقيّد انتقالات status المسموحة للعارض.
- إعادة كتابة سياسات storage.objects للتحقق الفعلي من ملكية العقار عبر
  اسم المجلد (property_id) المطابق لـ owner_id في properties، والسماح
  للإدارة بالوصول الكامل، ومنع القراءة العامة عن property-documents.
*/

-- ============================================
-- 1. Trigger: منع تصعيد الصلاحيات على properties
-- ============================================
CREATE OR REPLACE FUNCTION public.protect_admin_only_property_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- الإدارة (سواء عبر استدعاء مباشر أو عبر admin_update_property) غير مقيدة
  IF public.is_admin(auth.uid()) THEN
    RETURN NEW;
  END IF;

  -- أي مستخدم آخر (العارض على عقاره الخاص): إعادة فرض القيم القديمة
  -- على الحقول التي يجب أن تبقى بيد الإدارة فقط
  NEW.owner_id := OLD.owner_id;
  NEW.is_featured := OLD.is_featured;
  NEW.document_verified := OLD.document_verified;
  NEW.document_visible_to_public := OLD.document_visible_to_public;
  NEW.document_review_notes := OLD.document_review_notes;
  NEW.admin_notes := OLD.admin_notes;
  NEW.rejection_reason := OLD.rejection_reason;
  NEW.created_at := OLD.created_at;

  -- تقييد انتقالات status: العارض يمكنه فقط التبديل بين draft/in_review،
  -- وفقط انطلاقًا من حالة قابلة للتعديل من طرفه
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status NOT IN ('draft', 'in_review', 'rejected', 'paused') THEN
      RAISE EXCEPTION 'لا يمكن تعديل حالة العقار في وضعه الحالي';
    END IF;
    IF NEW.status NOT IN ('draft', 'in_review') THEN
      RAISE EXCEPTION 'هذه الحالة يحددها فريق الإدارة فقط';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_admin_only_property_fields ON public.properties;
CREATE TRIGGER trg_protect_admin_only_property_fields
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.protect_admin_only_property_fields();

-- ============================================
-- 2. Storage: property-images — تحقق فعلي من الملكية
--    (مسار الملف بصيغة {property_id}/{filename} كما في PropertyForm.tsx)
-- ============================================
DROP POLICY IF EXISTS "images_insert_owner" ON storage.objects;
CREATE POLICY "images_insert_owner" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'property-images'
    AND EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND p.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "images_update_owner" ON storage.objects;
CREATE POLICY "images_update_owner" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'property-images'
    AND (
      public.is_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id::text = (storage.foldername(name))[1]
          AND p.owner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "images_delete_owner" ON storage.objects;
CREATE POLICY "images_delete_owner" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'property-images'
    AND (
      public.is_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id::text = (storage.foldername(name))[1]
          AND p.owner_id = auth.uid()
      )
    )
  );
-- ملاحظة: قراءة property-images تبقى عامة عمدًا (صور عقارات معروضة للجميع)،
-- سياسة "images_read_public" من migration 003 لا تحتاج تعديل.

-- ============================================
-- 3. Storage: property-documents — خاص بالكامل (لا قراءة عامة إطلاقًا)
-- ============================================
DROP POLICY IF EXISTS "docs_read_owner" ON storage.objects;
CREATE POLICY "docs_read_owner" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'property-documents'
    AND (
      public.is_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id::text = (storage.foldername(name))[1]
          AND p.owner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "docs_insert_owner" ON storage.objects;
CREATE POLICY "docs_insert_owner" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'property-documents'
    AND EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND p.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "docs_delete_owner" ON storage.objects;
CREATE POLICY "docs_delete_owner" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'property-documents'
    AND (
      public.is_admin(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.properties p
        WHERE p.id::text = (storage.foldername(name))[1]
          AND p.owner_id = auth.uid()
      )
    )
  );
