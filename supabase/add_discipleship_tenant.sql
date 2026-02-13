-- Adicionar church_id à tabela de discipulado para isolamento multi-tenant
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'discipleships' AND column_name = 'church_id'
    ) THEN
        ALTER TABLE discipleships ADD COLUMN church_id UUID REFERENCES churches(id);
    END IF;
END $$;

-- Atualizar RLS para a tabela de discipulado
ALTER TABLE discipleships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for discipleships" ON discipleships;
CREATE POLICY "Tenant isolation for discipleships" ON discipleships
FOR ALL USING (
    church_id = (SELECT church_id FROM profiles WHERE id = auth.uid()) 
    OR 
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'superadmin'
);
