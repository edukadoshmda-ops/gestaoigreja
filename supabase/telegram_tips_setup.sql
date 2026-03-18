-- ============================================================
-- Telegram + Email tips setup (n8n + Supabase)
-- Projeto: App Gestao Igreja
-- ============================================================
--
-- O que este script faz:
-- 1) Adiciona telegram_chat_id em profiles
-- 2) Adiciona telegram_enabled em app_tip_preferences
-- 3) Cria tabela de tokens temporarios para vinculo seguro
-- 4) Cria RPCs para:
--    - gerar token de vinculo
--    - consumir token e salvar chat_id
--    - buscar usuarios elegiveis por canal
--    - buscar proxima dica sem repeticao por usuario/canal
--
-- Requisitos:
-- - Tabelas: profiles, app_tips, app_tip_deliveries, app_tip_preferences
-- - Extensao pgcrypto para gen_random_uuid()
--
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

telegram_tips_setup.sql-- ------------------------------------------------------------
-- 1) Profiles: canal Telegram
-- ------------------------------------------------------------
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS telegram_chat_id text;

CREATE INDEX IF NOT EXISTS idx_profiles_telegram_chat_id
  ON public.profiles(telegram_chat_id);

-- ------------------------------------------------------------
-- 2) Preferences: separar Telegram de WhatsApp
-- ------------------------------------------------------------
ALTER TABLE public.app_tip_preferences
ADD COLUMN IF NOT EXISTS telegram_enabled boolean DEFAULT true;

-- ------------------------------------------------------------
-- 3) Tokens de vinculacao Telegram
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.telegram_link_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telegram_link_tokens_user_id
  ON public.telegram_link_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_telegram_link_tokens_token
  ON public.telegram_link_tokens(token);

-- Opcional de limpeza periodica: DELETE FROM public.telegram_link_tokens WHERE expires_at < now() - interval '7 days';

-- ------------------------------------------------------------
-- 4) RPC: gera token temporario (10 minutos)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_telegram_link_token()
RETURNS TABLE(token text, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text;
  v_expires timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario nao autenticado';
  END IF;

  -- Invalida tokens anteriores ainda validos do mesmo usuario
  UPDATE public.telegram_link_tokens AS t
  SET used_at = now()
  WHERE t.user_id = auth.uid()
    AND t.used_at IS NULL
    AND t.expires_at > now();

  v_token := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  v_expires := now() + interval '10 minutes';

  INSERT INTO public.telegram_link_tokens (user_id, token, expires_at)
  VALUES (auth.uid(), v_token, v_expires);

  RETURN QUERY
  SELECT v_token, v_expires;
END;
$$;

-- ------------------------------------------------------------
-- 5) RPC: consome token e salva chat_id no profile
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.consume_telegram_link_token(
  p_token text,
  p_chat_id text
)
RETURNS TABLE(success boolean, user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT t.user_id
    INTO v_user_id
  FROM public.telegram_link_tokens t
  WHERE t.token = upper(trim(p_token))
    AND t.used_at IS NULL
    AND t.expires_at > now()
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid;
    RETURN;
  END IF;

  UPDATE public.profiles
  SET telegram_chat_id = trim(p_chat_id)
  WHERE id = v_user_id;

  UPDATE public.telegram_link_tokens
  SET used_at = now()
  WHERE token = upper(trim(p_token));

  RETURN QUERY SELECT true, v_user_id;
END;
$$;

-- ------------------------------------------------------------
-- 6) RPC: usuarios elegiveis para envios de dicas
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_users_for_tips_channels()
RETURNS TABLE (
  user_id uuid,
  user_email text,
  church_id uuid,
  telegram_chat_id text,
  email_enabled boolean,
  telegram_enabled boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id AS user_id,
    u.email::text AS user_email,
    p.church_id,
    p.telegram_chat_id,
    COALESCE(pref.email_enabled, true) AS email_enabled,
    COALESCE(pref.telegram_enabled, true) AS telegram_enabled
  FROM auth.users u
  JOIN public.profiles p ON p.id = u.id
  LEFT JOIN public.app_tip_preferences pref ON pref.church_id = p.church_id
  WHERE p.role IN ('admin','pastor','secretario','superadmin')
    AND p.church_id IS NOT NULL
    AND u.email IS NOT NULL
    AND trim(u.email) <> '';
$$;

-- ------------------------------------------------------------
-- 7) RPC: proxima dica sem repeticao por usuario/canal
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_next_tip_for_user(
  p_user_id uuid,
  p_channel text -- 'email' ou 'whatsapp'
)
RETURNS TABLE (
  tip_id uuid,
  title text,
  content text,
  content_short text,
  channel text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.id AS tip_id,
    t.title,
    t.content,
    t.content_short,
    t.channel
  FROM public.app_tips t
  WHERE t.active = true
    AND (t.channel = 'both' OR t.channel = p_channel)
    AND NOT EXISTS (
      SELECT 1
      FROM public.app_tip_deliveries d
      WHERE d.tip_id = t.id
        AND d.user_id = p_user_id
        AND d.channel = p_channel
        AND d.status = 'sent'
    )
  ORDER BY t.sort_order ASC, t.created_at ASC
  LIMIT 1;
$$;

-- ------------------------------------------------------------
-- 8) Permissoes de execucao para app e service role
-- ------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.create_telegram_link_token() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.consume_telegram_link_token(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_users_for_tips_channels() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_next_tip_for_user(uuid, text) TO service_role;

-- ------------------------------------------------------------
-- 9) Verificacoes rapidas
-- ------------------------------------------------------------
-- SELECT * FROM public.get_users_for_tips_channels() LIMIT 10;
-- SELECT * FROM public.get_next_tip_for_user('<USER_ID>', 'email');
-- SELECT * FROM public.get_next_tip_for_user('<USER_ID>', 'whatsapp');

