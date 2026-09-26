/*
# قصي للعقار - دوال الإدارة (SECURITY DEFINER)

إنشاء دوال آمنة تتيح للإدارة تنفيذ عمليات إدارية كاملة
مع منع العارضين والزبائن من تجاوز الصلاحيات.

جميع الدوال تتحقق من دور admin قبل التنفيذ.
*/

-- ============================================
-- Admin: approve property (in_review -> published)
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_approve_property(prop_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_uuid uuid := auth.uid();
BEGIN
  IF NOT public.is_admin(admin_uuid) THEN
    RAISE EXCEPTION 'غير مصرح: الإدارة فقط';
  END IF;

  UPDATE public.properties
  SET status = 'published',
      rejection_reason = NULL,
      updated_at = now()
  WHERE id = prop_id;

  INSERT INTO public.audit_log (admin_id, action, entity_type, entity_id, details)
  VALUES (admin_uuid, 'approve_property', 'property', prop_id,
          jsonb_build_object('new_status', 'published'));
END;
$$;

-- ============================================
-- Admin: reject property with reason
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_reject_property(prop_id uuid, reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_uuid uuid := auth.uid();
BEGIN
  IF NOT public.is_admin(admin_uuid) THEN
    RAISE EXCEPTION 'غير مصرح: الإدارة فقط';
  END IF;

  UPDATE public.properties
  SET status = 'rejected',
      rejection_reason = reason,
      updated_at = now()
  WHERE id = prop_id;

  INSERT INTO public.audit_log (admin_id, action, entity_type, entity_id, details)
  VALUES (admin_uuid, 'reject_property', 'property', prop_id,
          jsonb_build_object('reason', reason));
END;
$$;

-- ============================================
-- Admin: change property status
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_change_property_status(prop_id uuid, new_status text, reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_uuid uuid := auth.uid();
  old_status text;
BEGIN
  IF NOT public.is_admin(admin_uuid) THEN
    RAISE EXCEPTION 'غير مصرح: الإدارة فقط';
  END IF;

  SELECT status INTO old_status FROM public.properties WHERE id = prop_id;

  UPDATE public.properties
  SET status = new_status,
      rejection_reason = CASE WHEN new_status = 'rejected' THEN reason ELSE rejection_reason END,
      updated_at = now()
  WHERE id = prop_id;

  INSERT INTO public.audit_log (admin_id, action, entity_type, entity_id, details)
  VALUES (admin_uuid, 'change_property_status', 'property', prop_id,
          jsonb_build_object('old_status', old_status, 'new_status', new_status, 'reason', reason));
END;
$$;

-- ============================================
-- Admin: update property (full edit including admin fields)
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_update_property(prop_id uuid, updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_uuid uuid := auth.uid();
BEGIN
  IF NOT public.is_admin(admin_uuid) THEN
    RAISE EXCEPTION 'غير مصرح: الإدارة فقط';
  END IF;

  UPDATE public.properties
  SET
    title = COALESCE(updates->>'title', title),
    description = COALESCE(updates->>'description', description),
    operation_type = COALESCE(updates->>'operation_type', operation_type),
    property_type_id = COALESCE((updates->>'property_type_id')::uuid, property_type_id),
    area_id = COALESCE((updates->>'area_id')::uuid, area_id),
    price = COALESCE((updates->>'price')::numeric, price),
    price_unit = COALESCE(updates->>'price_unit', price_unit),
    exchange_conditions = COALESCE(updates->>'exchange_conditions', exchange_conditions),
    exchange_target = COALESCE(updates->>'exchange_target', exchange_target),
    exchange_price_diff = COALESCE((updates->>'exchange_price_diff')::numeric, exchange_price_diff),
    area_size = COALESCE((updates->>'area_size')::numeric, area_size),
    rooms = COALESCE((updates->>'rooms')::int, rooms),
    floors = COALESCE((updates->>'floors')::int, floors),
    bathrooms = COALESCE((updates->>'bathrooms')::int, bathrooms),
    document_type_id = COALESCE((updates->>'document_type_id')::uuid, document_type_id),
    document_number = COALESCE(updates->>'document_number', document_number),
    document_date = COALESCE((updates->>'document_date')::date, document_date),
    document_authority = COALESCE(updates->>'document_authority', document_authority),
    document_notes = COALESCE(updates->>'document_notes', document_notes),
    document_verified = COALESCE(updates->>'document_verified', document_verified),
    document_visible_to_public = COALESCE((updates->>'document_visible_to_public')::boolean, document_visible_to_public),
    document_review_notes = COALESCE(updates->>'document_review_notes', document_review_notes),
    admin_notes = COALESCE(updates->>'admin_notes', admin_notes),
    video_url = COALESCE(updates->>'video_url', video_url),
    contact_name = COALESCE(updates->>'contact_name', contact_name),
    contact_phone = COALESCE(updates->>'contact_phone', contact_phone),
    contact_email = COALESCE(updates->>'contact_email', contact_email),
    is_featured = COALESCE((updates->>'is_featured')::boolean, is_featured),
    updated_at = now()
  WHERE id = prop_id;

  INSERT INTO public.audit_log (admin_id, action, entity_type, entity_id, details)
  VALUES (admin_uuid, 'update_property', 'property', prop_id, updates);
END;
$$;

-- ============================================
-- Admin: delete property
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_delete_property(prop_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_uuid uuid := auth.uid();
BEGIN
  IF NOT public.is_admin(admin_uuid) THEN
    RAISE EXCEPTION 'غير مصرح: الإدارة فقط';
  END IF;

  DELETE FROM public.properties WHERE id = prop_id;

  INSERT INTO public.audit_log (admin_id, action, entity_type, entity_id)
  VALUES (admin_uuid, 'delete_property', 'property', prop_id);
END;
$$;

-- ============================================
-- Admin: delete property image
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_delete_property_image(img_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_uuid uuid := auth.uid();
BEGIN
  IF NOT public.is_admin(admin_uuid) THEN
    RAISE EXCEPTION 'غير مصرح: الإدارة فقط';
  END IF;

  DELETE FROM public.property_images WHERE id = img_id;

  INSERT INTO public.audit_log (admin_id, action, entity_type, entity_id)
  VALUES (admin_uuid, 'delete_image', 'property_image', img_id);
END;
$$;

-- ============================================
-- Admin: set primary image
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_set_primary_image(img_id uuid, prop_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_uuid uuid := auth.uid();
BEGIN
  IF NOT public.is_admin(admin_uuid) THEN
    RAISE EXCEPTION 'غير مصرح: الإدارة فقط';
  END IF;

  UPDATE public.property_images SET is_primary = false WHERE property_id = prop_id;
  UPDATE public.property_images SET is_primary = true WHERE id = img_id AND property_id = prop_id;

  INSERT INTO public.audit_log (admin_id, action, entity_type, entity_id)
  VALUES (admin_uuid, 'set_primary_image', 'property_image', img_id);
END;
$$;

-- ============================================
-- Admin: review document (update verification status)
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_review_document(prop_id uuid, verify_status text, review_notes text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_uuid uuid := auth.uid();
BEGIN
  IF NOT public.is_admin(admin_uuid) THEN
    RAISE EXCEPTION 'غير مصرح: الإدارة فقط';
  END IF;

  UPDATE public.properties
  SET document_verified = verify_status,
      document_review_notes = review_notes,
      updated_at = now()
  WHERE id = prop_id;

  INSERT INTO public.audit_log (admin_id, action, entity_type, entity_id, details)
  VALUES (admin_uuid, 'review_document', 'property', prop_id,
          jsonb_build_object('verify_status', verify_status, 'notes', review_notes));
END;
$$;

-- ============================================
-- Admin: manage property types (add)
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_add_property_type(type_name text, type_name_ar text, type_icon text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_uuid uuid := auth.uid();
  new_id uuid;
BEGIN
  IF NOT public.is_admin(admin_uuid) THEN
    RAISE EXCEPTION 'غير مصرح: الإدارة فقط';
  END IF;

  INSERT INTO public.property_types (name, name_ar, icon)
  VALUES (type_name, type_name_ar, type_icon)
  RETURNING id INTO new_id;

  INSERT INTO public.audit_log (admin_id, action, entity_type, entity_id, details)
  VALUES (admin_uuid, 'add_property_type', 'property_type', new_id,
          jsonb_build_object('name', type_name, 'name_ar', type_name_ar));

  RETURN new_id;
END;
$$;

-- ============================================
-- Admin: update property type
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_update_property_type(type_id uuid, type_name text DEFAULT NULL, type_name_ar text DEFAULT NULL, type_is_active boolean DEFAULT NULL, type_icon text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_uuid uuid := auth.uid();
BEGIN
  IF NOT public.is_admin(admin_uuid) THEN
    RAISE EXCEPTION 'غير مصرح: الإدارة فقط';
  END IF;

  UPDATE public.property_types
  SET
    name = COALESCE(type_name, name),
    name_ar = COALESCE(type_name_ar, name_ar),
    is_active = COALESCE(type_is_active, is_active),
    icon = COALESCE(type_icon, icon)
  WHERE id = type_id;

  INSERT INTO public.audit_log (admin_id, action, entity_type, entity_id)
  VALUES (admin_uuid, 'update_property_type', 'property_type', type_id);
END;
$$;

-- ============================================
-- Admin: delete property type
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_delete_property_type(type_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_uuid uuid := auth.uid();
BEGIN
  IF NOT public.is_admin(admin_uuid) THEN
    RAISE EXCEPTION 'غير مصرح: الإدارة فقط';
  END IF;

  DELETE FROM public.property_types WHERE id = type_id;

  INSERT INTO public.audit_log (admin_id, action, entity_type, entity_id)
  VALUES (admin_uuid, 'delete_property_type', 'property_type', type_id);
END;
$$;

-- ============================================
-- Admin: manage document types (add/update/delete)
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_add_document_type(type_name text, type_name_ar text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_uuid uuid := auth.uid();
  new_id uuid;
BEGIN
  IF NOT public.is_admin(admin_uuid) THEN
    RAISE EXCEPTION 'غير مصرح: الإدارة فقط';
  END IF;

  INSERT INTO public.document_types (name, name_ar)
  VALUES (type_name, type_name_ar)
  RETURNING id INTO new_id;

  INSERT INTO public.audit_log (admin_id, action, entity_type, entity_id, details)
  VALUES (admin_uuid, 'add_document_type', 'document_type', new_id,
          jsonb_build_object('name', type_name, 'name_ar', type_name_ar));

  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_document_type(type_id uuid, type_name text DEFAULT NULL, type_name_ar text DEFAULT NULL, type_is_active boolean DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_uuid uuid := auth.uid();
BEGIN
  IF NOT public.is_admin(admin_uuid) THEN
    RAISE EXCEPTION 'غير مصرح: الإدارة فقط';
  END IF;

  UPDATE public.document_types
  SET
    name = COALESCE(type_name, name),
    name_ar = COALESCE(type_name_ar, name_ar),
    is_active = COALESCE(type_is_active, is_active)
  WHERE id = type_id;

  INSERT INTO public.audit_log (admin_id, action, entity_type, entity_id)
  VALUES (admin_uuid, 'update_document_type', 'document_type', type_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_document_type(type_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_uuid uuid := auth.uid();
BEGIN
  IF NOT public.is_admin(admin_uuid) THEN
    RAISE EXCEPTION 'غير مصرح: الإدارة فقط';
  END IF;

  DELETE FROM public.document_types WHERE id = type_id;

  INSERT INTO public.audit_log (admin_id, action, entity_type, entity_id)
  VALUES (admin_uuid, 'delete_document_type', 'document_type', type_id);
END;
$$;

-- ============================================
-- Admin: manage areas (add/update/delete)
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_add_area(area_name text, area_name_ar text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_uuid uuid := auth.uid();
  new_id uuid;
BEGIN
  IF NOT public.is_admin(admin_uuid) THEN
    RAISE EXCEPTION 'غير مصرح: الإدارة فقط';
  END IF;

  INSERT INTO public.areas (name, name_ar)
  VALUES (area_name, area_name_ar)
  RETURNING id INTO new_id;

  INSERT INTO public.audit_log (admin_id, action, entity_type, entity_id, details)
  VALUES (admin_uuid, 'add_area', 'area', new_id,
          jsonb_build_object('name', area_name, 'name_ar', area_name_ar));

  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_area(area_id uuid, area_name text DEFAULT NULL, area_name_ar text DEFAULT NULL, area_is_active boolean DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_uuid uuid := auth.uid();
BEGIN
  IF NOT public.is_admin(admin_uuid) THEN
    RAISE EXCEPTION 'غير مصرح: الإدارة فقط';
  END IF;

  UPDATE public.areas
  SET
    name = COALESCE(area_name, name),
    name_ar = COALESCE(area_name_ar, name_ar),
    is_active = COALESCE(area_is_active, is_active)
  WHERE id = area_id;

  INSERT INTO public.audit_log (admin_id, action, entity_type, entity_id)
  VALUES (admin_uuid, 'update_area', 'area', area_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_area(area_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_uuid uuid := auth.uid();
BEGIN
  IF NOT public.is_admin(admin_uuid) THEN
    RAISE EXCEPTION 'غير مصرح: الإدارة فقط';
  END IF;

  DELETE FROM public.areas WHERE id = area_id;

  INSERT INTO public.audit_log (admin_id, action, entity_type, entity_id)
  VALUES (admin_uuid, 'delete_area', 'area', area_id);
END;
$$;

-- ============================================
-- Admin: update platform settings
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_update_settings(setting_updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_uuid uuid := auth.uid();
BEGIN
  IF NOT public.is_admin(admin_uuid) THEN
    RAISE EXCEPTION 'غير مصرح: الإدارة فقط';
  END IF;

  UPDATE public.platform_settings
  SET
    site_name = COALESCE(setting_updates->>'site_name', site_name),
    site_subtitle = COALESCE(setting_updates->>'site_subtitle', site_subtitle),
    contact_phone = COALESCE(setting_updates->>'contact_phone', contact_phone),
    contact_email = COALESCE(setting_updates->>'contact_email', contact_email),
    contact_whatsapp = COALESCE(setting_updates->>'contact_whatsapp', contact_whatsapp),
    allow_direct_contact = COALESCE((setting_updates->>'allow_direct_contact')::boolean, allow_direct_contact),
    show_contact_form = COALESCE((setting_updates->>'show_contact_form')::boolean, show_contact_form),
    updated_at = now()
  WHERE id = 1;

  INSERT INTO public.audit_log (admin_id, action, entity_type, details)
  VALUES (admin_uuid, 'update_settings', 'settings', setting_updates);
END;
$$;

-- ============================================
-- Admin: get all properties (including non-published) - via view
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_get_all_properties()
RETURNS SETOF public.properties
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT * FROM public.properties
  ORDER BY created_at DESC;
$$;

-- ============================================
-- Admin: get all profiles (exhibitors list)
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_get_all_profiles()
RETURNS SETOF public.profiles
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT * FROM public.profiles
  WHERE role = 'exhibitor'
  ORDER BY created_at DESC;
$$;

-- ============================================
-- Admin: get audit log
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_get_audit_log(limit_count int DEFAULT 100)
RETURNS SETOF public.audit_log
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT * FROM public.audit_log
  ORDER BY created_at DESC
  LIMIT limit_count;
$$;

-- ============================================
-- Admin: get property documents (all, not just own)
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_get_property_documents(prop_id uuid)
RETURNS SETOF public.property_documents
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT * FROM public.property_documents
  WHERE property_id = prop_id
  ORDER BY created_at DESC;
$$;

-- ============================================
-- Admin: delete property document
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_delete_property_document(doc_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_uuid uuid := auth.uid();
BEGIN
  IF NOT public.is_admin(admin_uuid) THEN
    RAISE EXCEPTION 'غير مصرح: الإدارة فقط';
  END IF;

  DELETE FROM public.property_documents WHERE id = doc_id;

  INSERT INTO public.audit_log (admin_id, action, entity_type, entity_id)
  VALUES (admin_uuid, 'delete_document', 'property_document', doc_id);
END;
$$;

-- ============================================
-- Admin: update user profile (role, active status)
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_update_profile(profile_id uuid, new_role text DEFAULT NULL, new_is_active boolean DEFAULT NULL, new_full_name text DEFAULT NULL, new_phone text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_uuid uuid := auth.uid();
BEGIN
  IF NOT public.is_admin(admin_uuid) THEN
    RAISE EXCEPTION 'غير مصرح: الإدارة فقط';
  END IF;

  UPDATE public.profiles
  SET
    role = COALESCE(new_role, role),
    is_active = COALESCE(new_is_active, is_active),
    full_name = COALESCE(new_full_name, full_name),
    phone = COALESCE(new_phone, phone),
    updated_at = now()
  WHERE id = profile_id;

  INSERT INTO public.audit_log (admin_id, action, entity_type, entity_id, details)
  VALUES (admin_uuid, 'update_profile', 'profile', profile_id,
          jsonb_build_object('role', new_role, 'is_active', new_is_active));
END;
$$;

-- ============================================
-- Grant execute on admin functions to authenticated
-- ============================================
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
