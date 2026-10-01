/*
# تحديث دوال الإدارة: حذف العقار مع سبب
*/

-- Update admin_delete_property to accept a reason and archive instead of hard delete
-- so the exhibitor can see why their property was removed.
CREATE OR REPLACE FUNCTION public.admin_delete_property(prop_id uuid, reason text DEFAULT NULL)
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
  SET status = 'archived',
      rejection_reason = COALESCE(reason, 'تم حذف العقار من قبل الإدارة'),
      updated_at = now()
  WHERE id = prop_id;

  INSERT INTO public.audit_log (admin_id, action, entity_type, entity_id, details)
  VALUES (admin_uuid, 'delete_property', 'property', prop_id,
          jsonb_build_object('reason', reason));
END;
$$;

-- Also update admin_reject_property to log the rejection more verbosely
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
