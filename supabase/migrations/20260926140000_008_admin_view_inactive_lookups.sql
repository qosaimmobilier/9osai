/*
# السماح للإدارة برؤية كل العناصر (بما فيها غير الفعالة) في جداول
# property_types / document_types / areas

المشكلة: سياسة SELECT الوحيدة على هذه الجداول الثلاثة هي:
  USING (is_active = true)
وهي تُطبَّق على الجميع بمن فيهم الإدارة (لا توجد سياسة استثناء للإدارة).
هذا يعني أن أي عنصر يُعطَّل (is_active=false) يختفي نهائيًا حتى من لوحة
تحكم الإدارة نفسها، رغم أن دالة admin_update_* تدعم تفعيله/تعطيله.
*/

DROP POLICY IF EXISTS "pt_select_admin_all" ON public.property_types;
CREATE POLICY "pt_select_admin_all" ON public.property_types
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "dt_select_admin_all" ON public.document_types;
CREATE POLICY "dt_select_admin_all" ON public.document_types
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "areas_select_admin_all" ON public.areas;
CREATE POLICY "areas_select_admin_all" ON public.areas
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
