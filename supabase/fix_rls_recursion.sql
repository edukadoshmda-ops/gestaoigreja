-- 1. Remover funções e políticas problemáticas
DROP FUNCTION IF EXISTS get_my_church_id() CASCADE;
DROP FUNCTION IF EXISTS get_my_role() CASCADE;

-- 2. Recriar funções com SECURITY DEFINER e SET search_path (Crucial para evitar recursão)
-- Essas funções rodam com privilégios de 'postgres' e ignoram RLS nos seus SELECTs internos.
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

-- 3. Resetar políticas de isolamento para PROFILES
DROP POLICY IF EXISTS "Tenant isolation for profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_isolation" ON profiles;

-- Nova política para PROFILES:
-- Permite leitura se:
-- a) É o seu próprio perfil
-- b) O seu church_id (via função) coincide com o church_id da linha
-- c) Você é superadmin (via função)
CREATE POLICY "profiles_isolation" ON profiles
FOR ALL USING (
  id = auth.uid() OR 
  church_id = get_my_church_id() OR 
  get_my_role() = 'superadmin'
);

-- 4. Re-aplicar políticas em outras tabelas (Garantindo o uso das funções)
-- Members
DROP POLICY IF EXISTS "Tenant isolation for members" ON members;
CREATE POLICY "Tenant isolation for members" ON members
FOR ALL USING (church_id = get_my_church_id() OR get_my_role() = 'superadmin');

-- Ministries
DROP POLICY IF EXISTS "Tenant isolation for ministries" ON ministries;
CREATE POLICY "Tenant isolation for ministries" ON ministries
FOR ALL USING (church_id = get_my_church_id() OR get_my_role() = 'superadmin');

-- Cells
DROP POLICY IF EXISTS "Tenant isolation for cells" ON cells;
CREATE POLICY "Tenant isolation for cells" ON cells
FOR ALL USING (church_id = get_my_church_id() OR get_my_role() = 'superadmin');

-- Events
DROP POLICY IF EXISTS "Tenant isolation for events" ON events;
CREATE POLICY "Tenant isolation for events" ON events
FOR ALL USING (church_id = get_my_church_id() OR get_my_role() = 'superadmin');

-- Financial
DROP POLICY IF EXISTS "Tenant isolation for financial" ON financial_transactions;
CREATE POLICY "Tenant isolation for financial" ON financial_transactions
FOR ALL USING (church_id = get_my_church_id() OR get_my_role() = 'superadmin');

-- Budgets
DROP POLICY IF EXISTS "tenant_isolation" ON budgets;
CREATE POLICY "tenant_isolation" ON budgets 
FOR ALL USING (church_id = get_my_church_id() OR get_my_role() = 'superadmin');

-- Documentos (Secretaria)
DROP POLICY IF EXISTS "tenant_isolation" ON documents;
CREATE POLICY "tenant_isolation" ON documents 
FOR ALL USING (church_id = get_my_church_id() OR get_my_role() = 'superadmin');
