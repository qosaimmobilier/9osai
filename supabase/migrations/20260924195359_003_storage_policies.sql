/*
# قصي للعقار - سياسات Storage

إنشاء سياسات RLS لمجلدات التخزين:
1. property-images: صور العقارات العامة (عامة للقراءة، العارض يرفع لها)
2. property-documents: الوثائق الخاصة (خاصة، العارض يرفع، الإدارة تقرأ)
*/

-- Storage policies for property-images bucket
DROP POLICY IF EXISTS "images_read_public" ON storage.objects;
CREATE POLICY "images_read_public" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'property-images');

DROP POLICY IF EXISTS "images_insert_owner" ON storage.objects;
CREATE POLICY "images_insert_owner" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'property-images');

DROP POLICY IF EXISTS "images_update_owner" ON storage.objects;
CREATE POLICY "images_update_owner" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'property-images');

DROP POLICY IF EXISTS "images_delete_owner" ON storage.objects;
CREATE POLICY "images_delete_owner" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'property-images');

-- Storage policies for property-documents bucket (private)
DROP POLICY IF EXISTS "docs_read_owner" ON storage.objects;
CREATE POLICY "docs_read_owner" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'property-documents');

DROP POLICY IF EXISTS "docs_insert_owner" ON storage.objects;
CREATE POLICY "docs_insert_owner" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'property-documents');

DROP POLICY IF EXISTS "docs_delete_owner" ON storage.objects;
CREATE POLICY "docs_delete_owner" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'property-documents');
