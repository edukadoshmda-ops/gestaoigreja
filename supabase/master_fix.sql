-- ===================================================
-- MASTER FIX: MULTI-TENANT FOUNDATION & RLS RECURSION
-- ===================================================

-- 1. CRIAR TABELA DE IGREJAS (DEPENDÊNCIA BASE)
CREATE TABLE IF NOT EXISTS churches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2. GARANTIR CHURCH_ID NO PERFIL E OUTRAS TABELAS
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS church_id UUID REFERENCES churches(id);
ALTER TABLE members ADD COLUMN IF NOT EXISTS church_id UUID REFERENCES churches(id);

-- 3. CRIAR TABELA DE ORÇAMENTOS (BUDGETS)
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

-- 4. GARANTIR A COLUNA NA TABELA DOCUMENTS (SE EXISTIR)
DO $$ 
BEGIN 
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documents') THEN
    ALTER TABLE documents ADD COLUMN IF NOT EXISTS church_id UUID REFERENCES churches(id);
  END IF;
END $$;

-- 5. LIMPEZA DE FUNÇÕES CONFLITANTES
DROP FUNCTION IF EXISTS get_my_church_id() CASCADE;
DROP FUNCTION IF EXISTS get_my_role() CASCADE;

-- 6. FUNÇÕES COM PRIVILÉGIO DE SISTEMA (SECURITY DEFINER)
-- Isso resolve a recursão infinita no RLS
CREATE OR REPLACE FUNCTION get_my_church_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT church_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. APLICAR POLÍTICAS DE SEGURANÇA (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_isolation" ON profiles;
CREATE POLICY "profiles_isolation" ON profiles FOR ALL USING (id = auth.uid() OR church_id = get_my_church_id() OR get_my_role() = 'superadmin');

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation" ON budgets;
CREATE POLICY "tenant_isolation" ON budgets FOR ALL USING (church_id = get_my_church_id() OR get_my_role() = 'superadmin');

ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for financial" ON financial_transactions;
CREATE POLICY "Tenant isolation for financial" ON financial_transactions FOR ALL USING (church_id = get_my_church_id() OR get_my_role() = 'superadmin');

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for members" ON members;
CREATE POLICY "Tenant isolation for members" ON members FOR ALL USING (church_id = get_my_church_id() OR get_my_role() = 'superadmin');

-- Proteção extra para Documents (se existir)
DO $$ 
BEGIN 
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documents') THEN
    ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
    EXECUTE 'DROP POLICY IF EXISTS "tenant_isolation" ON documents';
    EXECUTE 'CREATE POLICY "tenant_isolation" ON documents FOR ALL USING (church_id = get_my_church_id() OR get_my_role() = ''superadmin'')';
  END IF;
END $$;
