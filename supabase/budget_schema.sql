-- 1. Criar Tabela de Orçamentos (Budgets)
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

-- 2. Habilitar RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Isolamento para Budgets
DROP POLICY IF EXISTS "tenant_isolation" ON budgets;
CREATE POLICY "tenant_isolation" ON budgets 
FOR ALL USING (
  church_id = (SELECT church_id FROM profiles WHERE id = auth.uid()) OR 
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin'
);

-- 4. Garantir church_id na tabela de documentos (Secretaria)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS church_id UUID REFERENCES churches(id);

-- 5. Habilitar RLS em Documentos
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 6. Política de Isolamento para Documentos
DROP POLICY IF EXISTS "tenant_isolation" ON documents;
CREATE POLICY "tenant_isolation" ON documents 
FOR ALL USING (
  church_id = (SELECT church_id FROM profiles WHERE id = auth.uid()) OR 
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin'
);
