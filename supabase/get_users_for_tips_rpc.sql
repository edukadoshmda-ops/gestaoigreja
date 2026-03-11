-- RPC: retorna usuários que podem receber dicas por e-mail
-- Usa auth.users (service role / SECURITY DEFINER)
-- Execute após app_tips_schema.sql

CREATE OR REPLACE FUNCTION get_users_for_email_tips()
RETURNS TABLE(user_id UUID, user_email TEXT, church_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email::text, p.church_id
  FROM auth.users u
  JOIN public.profiles p ON p.id = u.id
  WHERE p.role IN ('admin','pastor','secretario','superadmin')
    AND p.church_id IS NOT NULL
    AND u.email IS NOT NULL AND trim(u.email) != ''
    AND (
      NOT EXISTS (SELECT 1 FROM app_tip_preferences pref WHERE pref.church_id = p.church_id)
      OR EXISTS (SELECT 1 FROM app_tip_preferences pref WHERE pref.church_id = p.church_id AND pref.email_enabled = true)
    );
END;
$$;
