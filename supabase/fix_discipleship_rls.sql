-- 1. Garantir que a coluna church_id existe na tabela de discipulado
ALTER TABLE discipleships ADD COLUMN IF NOT EXISTS church_id UUID REFERENCES churches(id);

-- 2. Habilitar RLS (caso não esteja)
ALTER TABLE discipleships ENABLE ROW LEVEL SECURITY;

-- 3. Criar política de isolamento para Discipulados
-- Usando a função get_my_church_id() que já deve existir no seu banco
DROP POLICY IF EXISTS "Tenant isolation for discipleships" ON discipleships;
CREATE POLICY "Tenant isolation for discipleships" ON discipleships
FOR ALL USING (
  church_id = (SELECT church_id FROM profiles WHERE id = auth.uid()) OR 
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin'
);

-- 4. Garantir que a coluna church_id existe na tabela de eventos e escalas (se não existirem)
ALTER TABLE events ADD COLUMN IF NOT EXISTS church_id UUID REFERENCES churches(id);
ALTER TABLE event_checklists ADD COLUMN IF NOT EXISTS church_id UUID REFERENCES churches(id);
ALTER TABLE service_scales ADD COLUMN IF NOT EXISTS church_id UUID REFERENCES churches(id);

-- 5. Habilitar RLS e criar políticas para Eventos e Escalas
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for events" ON events;
CREATE POLICY "Tenant isolation for events" ON events
FOR ALL USING (
  church_id = (SELECT church_id FROM profiles WHERE id = auth.uid()) OR 
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin'
);

ALTER TABLE event_checklists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for event_checklists" ON event_checklists;
CREATE POLICY "Tenant isolation for event_checklists" ON event_checklists
FOR ALL USING (
  church_id = (SELECT church_id FROM profiles WHERE id = auth.uid()) OR 
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin'
);

ALTER TABLE service_scales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for service_scales" ON service_scales;
CREATE POLICY "Tenant isolation for service_scales" ON service_scales
FOR ALL USING (
  church_id = (SELECT church_id FROM profiles WHERE id = auth.uid()) OR 
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin'
);
