/*
# إعادة إنشاء حساب الإدارة عبر دالة آمنة

إنشاء دالة SECURITY DEFINER تستخدم pgcrypt لتشفير كلمة المرور بشكل صحيح
متوافق مع Supabase Auth، مع تعيين raw_app_meta_data بشكل صحيح.
*/

-- Drop existing trigger to avoid conflict during manual user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the admin user with proper Supabase Auth format
DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
BEGIN
  -- Insert into auth.users with all required fields for Supabase Auth
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    last_sign_in_at,
    email_change_confirm_status,
    phone,
    phone_change_token,
    email_change_token_current,
    email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    'haouariabdrezak@gmail.com',
    crypt('abderrezak427', gen_salt('bf', 8)),
    now(),
    jsonb_build_object(
      'provider', 'email',
      'providers', array_to_json(ARRAY['email'])
    ),
    jsonb_build_object(
      'full_name', 'عبد الرزاق هواري',
      'username', 'abderrezak427'
    ),
    now(),
    now(),
    now(),
    0,
    '',
    '',
    '',
    ''
  );

  -- Insert the identity link (required for Supabase Auth)
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider_id,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    jsonb_build_object(
      'sub', new_user_id::text,
      'email', 'haouariabdrezak@gmail.com',
      'email_verified', true
    ),
    new_user_id::text,
    'email',
    now(),
    now(),
    now()
  );

  -- Create the admin profile
  INSERT INTO public.profiles (id, email, full_name, username, role, is_active)
  VALUES (
    new_user_id,
    'haouariabdrezak@gmail.com',
    'عبد الرزاق هواري',
    'abderrezak427',
    'admin',
    true
  )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Admin user created with ID: %', new_user_id;
END;
$$;

-- Recreate the trigger for future signups
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
