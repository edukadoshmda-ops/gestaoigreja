-- =========================================
-- SOLUÇÃO RÁPIDA: Email não confirmado
-- =========================================

-- OPÇÃO 1: Confirmar email de um usuário específico (RECOMENDADO)
-- Substitua 'seu-email@exemplo.com' pelo seu email real
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'seu-email@exemplo.com';

-- Verificar se funcionou:
SELECT email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'seu-email@exemplo.com';

-- =========================================

-- OPÇÃO 2: Confirmar TODOS os emails não confirmados (APENAS DESENVOLVIMENTO!)
-- ⚠️ CUIDADO: Use isso apenas em ambiente de desenvolvimento/teste
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- Verificar quantos foram atualizados:
SELECT COUNT(*) as total_confirmados 
FROM auth.users 
WHERE email_confirmed_at IS NOT NULL;

-- =========================================

-- OPÇÃO 3: Ver todos os usuários e seu status de confirmação
SELECT 
    email,
    CASE 
        WHEN email_confirmed_at IS NULL THEN 'NÃO CONFIRMADO ❌'
        ELSE 'CONFIRMADO ✅'
    END as status,
    email_confirmed_at,
    created_at
FROM auth.users
ORDER BY created_at DESC;

-- =========================================

-- BONUS: Deletar um usuário específico (se quiser recomeçar)
-- ⚠️ CUIDADO: Isso remove o usuário permanentemente!
-- DELETE FROM auth.users WHERE email = 'seu-email@exemplo.com';

-- =========================================
-- COMO EXECUTAR:
-- 1. Vá para https://supabase.com
-- 2. Abra seu projeto
-- 3. Clique em "SQL Editor" no menu lateral
-- 4. Cole e execute o comando desejado
-- =========================================
