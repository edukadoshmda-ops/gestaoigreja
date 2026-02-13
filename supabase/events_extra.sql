-- ==========================================
-- EVENTS EXTRA: CHECKLISTS & SERVICE SCALES
-- ==========================================

-- 1. Tabelas de Checklists
CREATE TABLE IF NOT EXISTS event_checklists (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    task TEXT NOT NULL,
    responsible_id UUID REFERENCES members(id) ON DELETE SET NULL,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. Tabelas de Escalas de Serviço
CREATE TABLE IF NOT EXISTS service_scales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    confirmed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 3. Habilitar RLS
ALTER TABLE event_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_scales ENABLE ROW LEVEL SECURITY;

-- 4. Funções auxiliares (se não existirem)
CREATE OR REPLACE FUNCTION get_my_church_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT church_id FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Políticas de Isolamento (Multi-tenant)
-- Nota: Como essas tabelas referenciam 'events', o isolamento deve seguir o do evento pai.
-- Para simplificar e garantir segurança, vamos vincular ao church_id do perfil do usuário.

DROP POLICY IF EXISTS "Tenant isolation for event_checklists" ON event_checklists;
CREATE POLICY "Tenant isolation for event_checklists" ON event_checklists
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM events e 
        WHERE e.id = event_checklists.event_id 
        AND (e.church_id = get_my_church_id() OR get_my_role() = 'superadmin')
    )
);

DROP POLICY IF EXISTS "Tenant isolation for service_scales" ON service_scales;
CREATE POLICY "Tenant isolation for service_scales" ON service_scales
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM events e 
        WHERE e.id = service_scales.event_id 
        AND (e.church_id = get_my_church_id() OR get_my_role() = 'superadmin')
    )
);
