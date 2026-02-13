-- ==========================================
-- SCRIPT CONSOLIDADO: ESQUEMA E SEGURANÇA (RLS)
-- Resolve: Erro de recursão infinita + Tabelas faltando
-- ==========================================

-- 1. GARANTIR QUE AS TABELAS EXISTAM
-- Tabela de Orçamentos
CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  month TEXT NOT NULL, -- Formato YYYY-MM
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(church_id, category, month)
);

-- Tabela de Documentos (Garantir church_id)
-- Nota: 'documents' deve ter sido criada pelo sistema antes ou por outro script. 
-- Tentamos adicionar a coluna se não existir.
DO $$ 
BEGIN 
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documents') THEN
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS church_id UUID REFERENCES churches(id);
  END IF;
END $$;

-- 2. LIMPEZA DE FUNÇÕES E POLÍTICAS PROBLEMÁTICAS
DROP FUNCTION IF EXISTS get_my_church_id() CASCADE;
DROP FUNCTION IF EXISTS get_my_role() CASCADE;

-- 3. FUNÇÕES AUXILIARES COM PRIVILÉGIO DE SISTEMA (SECURITY DEFINER)
-- Isso quebra a recursão infinita no RLS.
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

-- 4. APLICAR POLÍTICAS DE ISOLAMENTO (RLS)

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_isolation" ON profiles;
CREATE POLICY "profiles_isolation" ON profiles
FOR ALL USING (id = auth.uid() OR church_id = get_my_church_id() OR get_my_role() = 'superadmin');

-- Members
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for members" ON members;
CREATE POLICY "Tenant isolation for members" ON members
FOR ALL USING (church_id = get_my_church_id() OR get_my_role() = 'superadmin');

-- Financial
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for financial" ON financial_transactions;
CREATE POLICY "Tenant isolation for financial" ON financial_transactions
FOR ALL USING (church_id = get_my_church_id() OR get_my_role() = 'superadmin');

-- Budgets
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON budgets;
CREATE POLICY "tenant_isolation" ON budgets 
FOR ALL USING (church_id = get_my_church_id() OR get_my_role() = 'superadmin');

-- Documents (Somente se a tabela existir)
DO $$ 
BEGIN 
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documents') THEN
    ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
    EXECUTE 'DROP POLICY IF EXISTS "tenant_isolation" ON documents';
    EXECUTE 'CREATE POLICY "tenant_isolation" ON documents FOR ALL USING (church_id = get_my_church_id() OR get_my_role() = ''superadmin'')';
  END IF;
END $$;

-- Outras tabelas relevantes (Opcional, mas recomendado)
ALTER TABLE ministries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for ministries" ON ministries;
CREATE POLICY "Tenant isolation for ministries" ON ministries FOR ALL USING (church_id = get_my_church_id() OR get_my_role() = 'superadmin');

ALTER TABLE cells ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for cells" ON cells;
CREATE POLICY "Tenant isolation for cells" ON cells FOR ALL USING (church_id = get_my_church_id() OR get_my_role() = 'superadmin');
