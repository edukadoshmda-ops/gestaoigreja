-- RPC para envio em massa de boletins, avisos e devocionais
-- Insere notificações para todos os perfis da igreja

CREATE OR REPLACE FUNCTION send_broadcast(
  p_church_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'info',
  p_link TEXT DEFAULT NULL,
  p_leaders_only BOOLEAN DEFAULT FALSE
)
RETURNS JSON AS $$
DECLARE
  v_caller_id UUID;
  v_caller_role TEXT;
  v_caller_church UUID;
  v_count INT := 0;
  v_rec RECORD;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Não autenticado', 'count', 0);
  END IF;

  -- Obter perfil do chamador
  SELECT role, church_id INTO v_caller_role, v_caller_church
  FROM profiles WHERE id = v_caller_id;

  -- SuperAdmin pode enviar para qualquer igreja; outros precisam ser da mesma igreja
  IF v_caller_role <> 'superadmin' THEN
    IF v_caller_church IS NULL OR v_caller_church <> p_church_id THEN
      RETURN json_build_object('success', false, 'message', 'Sem permissão para enviar nesta igreja', 'count', 0);
    END IF;
    IF v_caller_role NOT IN ('admin', 'pastor', 'secretario') THEN
      RETURN json_build_object('success', false, 'message', 'Apenas admin, pastor ou secretário podem enviar', 'count', 0);
    END IF;
  END IF;

  -- Tipo válido
  IF p_type NOT IN ('info', 'warning', 'success', 'error') THEN
    p_type := 'info';
  END IF;

  -- Inserir notificação para cada perfil da igreja (todos ou apenas líderes)
  FOR v_rec IN (
    SELECT id FROM profiles
    WHERE church_id = p_church_id
      AND (NOT p_leaders_only OR role IN ('admin', 'pastor', 'secretario', 'lider_celula', 'lider_ministerio'))
  ) LOOP
    INSERT INTO notifications (user_id, title, message, type, read, link)
    VALUES (v_rec.id, p_title, p_message, p_type, false, p_link);
    v_count := v_count + 1;
  END LOOP;

  RETURN json_build_object('success', true, 'count', v_count, 'message', v_count || ' notificação(ões) enviada(s)');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION send_broadcast(UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;
