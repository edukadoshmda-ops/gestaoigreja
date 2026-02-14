-- ==========================================
-- RPC: CONFIRM_PARTICIPATION
-- Permite confirmação de escala via link público
-- ==========================================

CREATE OR REPLACE FUNCTION confirm_participation(scale_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
    v_member_name TEXT;
    v_event_title TEXT;
    v_event_date DATE;
    v_event_time TIME;
    v_role TEXT;
BEGIN
    -- 1. Verificar se a escala existe e obter dados
    SELECT 
        m.name, e.title, e.date, e.time, s.role
    INTO 
        v_member_name, v_event_title, v_event_date, v_event_time, v_role
    FROM service_scales s
    JOIN members m ON s.member_id = m.id
    JOIN events e ON s.event_id = e.id
    WHERE s.id = scale_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Escala não encontrada');
    END IF;

    -- 2. Atualizar para confirmado
    UPDATE service_scales 
    SET confirmed = true 
    WHERE id = scale_id;

    -- 3. Retornar dados para o frontend (Exatamente o que o ConfirmScale.tsx espera)
    RETURN json_build_object(
        'success', true,
        'member_name', v_member_name,
        'event_title', v_event_title,
        'event_date', v_event_date,
        'event_time', (v_event_time::text),
        'role', v_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permissão para usuários anônimos executarem o RPC (necessário para o link público)
GRANT EXECUTE ON FUNCTION confirm_participation(UUID) TO anon;
GRANT EXECUTE ON FUNCTION confirm_participation(UUID) TO authenticated;
