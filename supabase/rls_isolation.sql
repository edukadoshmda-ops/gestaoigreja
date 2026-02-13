-- 1. Habilitar RLS em todas as tabelas
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cell_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE discipleships ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 2. Criar função auxiliar para obter o church_id do usuário logado
CREATE OR REPLACE FUNCTION get_my_church_id()
RETURNS UUID AS $$
  SELECT church_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 3. Aplicar Políticas de Isolamento (Exemplo para Members)
-- Repetir este padrão para todas as tabelas

-- POLÍTICA PARA MEMBERS
DROP POLICY IF EXISTS "Tenant isolation for members" ON members;
CREATE POLICY "Tenant isolation for members" ON members
FOR ALL USING (
  church_id = get_my_church_id() OR 
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin'
);

-- POLÍTICA PARA MINISTRIES
DROP POLICY IF EXISTS "Tenant isolation for ministries" ON ministries;
CREATE POLICY "Tenant isolation for ministries" ON ministries
FOR ALL USING (
  church_id = get_my_church_id() OR 
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin'
);

-- POLÍTICA PARA CELLS
DROP POLICY IF EXISTS "Tenant isolation for cells" ON cells;
CREATE POLICY "Tenant isolation for cells" ON cells
FOR ALL USING (
  church_id = get_my_church_id() OR 
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin'
);

-- POLÍTICA PARA EVENTS
DROP POLICY IF EXISTS "Tenant isolation for events" ON events;
CREATE POLICY "Tenant isolation for events" ON events
FOR ALL USING (
  church_id = get_my_church_id() OR 
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin'
);

-- POLÍTICA PARA FINANCIAL TRANSACTIONS
DROP POLICY IF EXISTS "Tenant isolation for financial" ON financial_transactions;
CREATE POLICY "Tenant isolation for financial" ON financial_transactions
FOR ALL USING (
  church_id = get_my_church_id() OR 
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin'
);

-- POLÍTICA PARA PROFILES (O usuário pode ver outros da mesma igreja)
DROP POLICY IF EXISTS "Tenant isolation for profiles" ON profiles;
CREATE POLICY "Tenant isolation for profiles" ON profiles
FOR ALL USING (
  church_id = get_my_church_id() OR 
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin'
);
