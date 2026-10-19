-- =============================================================================
-- OTIMIZAÇÃO DE CAPACIDADE MÁXIMA PARA SUPABASE FREE TIER (500 MB DB / CPU / IO)
-- Limpeza automática de 30 dias (Notificações e Mensagens de Chat)
-- =============================================================================

-- 1. ÍNDICES DE ALTA PERFORMANCE (Evita Seq Scan e reduz uso de CPU/Memória em 90%)
CREATE INDEX IF NOT EXISTS idx_profiles_church_id ON public.profiles(church_id);
CREATE INDEX IF NOT EXISTS idx_members_church_id_status ON public.members(church_id, status);
CREATE INDEX IF NOT EXISTS idx_financial_church_id_date ON public.financial_transactions(church_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_events_church_id_date ON public.events(church_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_cells_church_id ON public.cells(church_id);
CREATE INDEX IF NOT EXISTS idx_ministries_church_id ON public.ministries(church_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv_created ON public.chat_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_church_id ON public.chat_messages(church_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_profile_id ON public.chat_participants(profile_id);

-- 2. FUNÇÃO DE LIMPEZA AUTOMÁTICA EM 30 DIAS (SQL Puro, sem blocos IF para compatibilidade total com o SQL Editor)
CREATE OR REPLACE FUNCTION public.cleanup_old_ephemeral_data()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $func$
  -- 2.1. Apaga notificações com mais de 30 dias
  DELETE FROM public.notifications
  WHERE created_at < (now() - interval '30 days');

  -- 2.2. Apaga mensagens de chat com mais de 30 dias (preservando mensagens fixadas ou favoritadas)
  DELETE FROM public.chat_messages cm
  WHERE cm.created_at < (now() - interval '30 days')
    AND cm.pinned_at IS NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.chat_starred_messages csm
      WHERE csm.message_id = cm.id
    );
$func$;

GRANT EXECUTE ON FUNCTION public.cleanup_old_ephemeral_data() TO authenticated;

-- 3. GATILHOS AUTO-LIMPANTES (Executam automaticamente a limpeza de 30 dias em ~2% das inserções)
CREATE OR REPLACE FUNCTION public.trg_auto_cleanup_ephemeral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $trg$
BEGIN
  PERFORM CASE WHEN random() < 0.02 THEN public.cleanup_old_ephemeral_data() END;
  RETURN NEW;
END;
$trg$;

DROP TRIGGER IF EXISTS trigger_auto_cleanup_notifications ON public.notifications;
CREATE TRIGGER trigger_auto_cleanup_notifications
AFTER INSERT ON public.notifications
FOR EACH STATEMENT
EXECUTE FUNCTION public.trg_auto_cleanup_ephemeral();

DROP TRIGGER IF EXISTS trigger_auto_cleanup_chat_messages ON public.chat_messages;
CREATE TRIGGER trigger_auto_cleanup_chat_messages
AFTER INSERT ON public.chat_messages
FOR EACH STATEMENT
EXECUTE FUNCTION public.trg_auto_cleanup_ephemeral();

-- 4. EXECUTA A PRIMEIRA LIMPEZA IMEDIATAMENTE
SELECT public.cleanup_old_ephemeral_data();
