/*
# Fix function search_path security warnings

Sets explicit search_path on all SECURITY DEFINER functions to prevent search_path injection attacks.
This addresses the WARN-level security advisor findings.

## Changes:
- is_admin(): added search_path = public
- is_active_advertiser(): added search_path = public
- handle_new_user(): added search_path = public
- protect_property_fields(): added search_path = public
- log_property_status_change(): added search_path = public
- notify_property_status_change(): added search_path = public
- update_updated_at(): added search_path = public
*/

ALTER FUNCTION is_admin() SET search_path = public;
ALTER FUNCTION is_active_advertiser() SET search_path = public;
ALTER FUNCTION handle_new_user() SET search_path = public;
ALTER FUNCTION protect_property_fields() SET search_path = public;
ALTER FUNCTION log_property_status_change() SET search_path = public;
ALTER FUNCTION notify_property_status_change() SET search_path = public;
ALTER FUNCTION update_updated_at() SET search_path = public;