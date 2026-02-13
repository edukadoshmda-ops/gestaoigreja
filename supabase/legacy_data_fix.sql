-- ===================================================
-- DATA INTEGRITY: VINCULAR DADOS ORFÃOS À PRIMEIRA IGREJA
-- (Versão simplificada para evitar erros de sintaxe)
-- ===================================================

-- 1. Vincular Membros
UPDATE members 
SET church_id = (SELECT id FROM churches LIMIT 1) 
WHERE church_id IS NULL;

-- 2. Vincular Transações Financeiras
UPDATE financial_transactions 
SET church_id = (SELECT id FROM churches LIMIT 1) 
WHERE church_id IS NULL;

-- 3. Vincular Documentos (Garantir que a coluna existe e vincular)
-- Se a tabela 'documents' existir, vincula os órfãos
UPDATE documents 
SET church_id = (SELECT id FROM churches LIMIT 1) 
WHERE church_id IS NULL;

-- 4. Vincular Ministérios, Células e Eventos
UPDATE ministries SET church_id = (SELECT id FROM churches LIMIT 1) WHERE church_id IS NULL;
UPDATE cells SET church_id = (SELECT id FROM churches LIMIT 1) WHERE church_id IS NULL;
UPDATE events SET church_id = (SELECT id FROM churches LIMIT 1) WHERE church_id IS NULL;

-- 5. Vincular Perfis de Usuários (Exceto SuperAdmins)
UPDATE profiles 
SET church_id = (SELECT id FROM churches LIMIT 1) 
WHERE church_id IS NULL AND role != 'superadmin';

-- 6. Verificar se ainda há algo nulo (Opcional - Debug)
SELECT 'members' as tabela, count(*) FROM members WHERE church_id IS NULL
UNION ALL
SELECT 'financial_transactions', count(*) FROM financial_transactions WHERE church_id IS NULL;
