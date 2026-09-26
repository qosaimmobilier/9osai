/*
# تتبع زيارات الموقع

1. New Tables
- `site_visits` — يسجل كل زيارة للموقع
  - `id` (uuid, primary key)
  - `visitor_session` (text, معرف جلسة الزائر)
  - `page` (text, الصفحة المزارة)
  - `visited_at` (timestamptz, وقت الزيارة)
2. Security
- RLS enabled
- anon + authenticated can INSERT (للسماح بتسجيل الزيارات من جميع الزوار)
- admin-only SELECT عبر دالة admin_get_visit_stats
3. New Functions
- `admin_get_visit_stats()` — إحصائيات الزيارات: اليوم، الأسبوع، الشهر، الإجمالي
- `admin_get_registered_count()` — عدد المسجلين الكلي
*/

CREATE TABLE IF NOT EXISTS public.site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_session text,
  page text,
  visited_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visits_visited_at ON public.site_visits(visited_at DESC);

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "visits_insert_all" ON public.site_visits;
CREATE POLICY "visits_insert_all" ON public.site_visits
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Function: admin get visit stats
CREATE OR REPLACE FUNCTION public.admin_get_visit_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_uuid uuid := auth.uid();
  today_count int;
  week_count int;
  month_count int;
  total_count int;
  unique_visitors int;
BEGIN
  IF NOT public.is_admin(admin_uuid) THEN
    RAISE EXCEPTION 'غير مصرح: الإدارة فقط';
  END IF;

  SELECT count(*) INTO today_count
  FROM public.site_visits
  WHERE visited_at >= CURRENT_DATE;

  SELECT count(*) INTO week_count
  FROM public.site_visits
  WHERE visited_at >= date_trunc('week', now());

  SELECT count(*) INTO month_count
  FROM public.site_visits
  WHERE visited_at >= date_trunc('month', now());

  SELECT count(*) INTO total_count
  FROM public.site_visits;

  SELECT count(DISTINCT visitor_session) INTO unique_visitors
  FROM public.site_visits
  WHERE visitor_session IS NOT NULL;

  RETURN jsonb_build_object(
    'today', today_count,
    'week', week_count,
    'month', month_count,
    'total', total_count,
    'unique_visitors', unique_visitors
  );
END;
$$;

-- Function: admin get registered users count (all roles)
CREATE OR REPLACE FUNCTION public.admin_get_registered_count()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_uuid uuid := auth.uid();
  total_users int;
  exhibitors int;
  admins int;
  new_today int;
  new_week int;
BEGIN
  IF NOT public.is_admin(admin_uuid) THEN
    RAISE EXCEPTION 'غير مصرح: الإدارة فقط';
  END IF;

  SELECT count(*) INTO total_users FROM public.profiles;
  SELECT count(*) INTO exhibitors FROM public.profiles WHERE role = 'exhibitor';
  SELECT count(*) INTO admins FROM public.profiles WHERE role = 'admin';
  SELECT count(*) INTO new_today FROM public.profiles WHERE created_at >= CURRENT_DATE;
  SELECT count(*) INTO new_week FROM public.profiles WHERE created_at >= date_trunc('week', now());

  RETURN jsonb_build_object(
    'total', total_users,
    'exhibitors', exhibitors,
    'admins', admins,
    'new_today', new_today,
    'new_week', new_week
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_visit_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_registered_count TO authenticated;
