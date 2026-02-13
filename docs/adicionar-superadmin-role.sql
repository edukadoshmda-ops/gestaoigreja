-- =========================================
-- ADICIONAR ROLE 'SUPERADMIN' AO SCHEMA
-- =========================================

-- Passo 1: Remover a constraint antiga
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Passo 2: Adicionar nova constraint com 'superadmin' incluído
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN (
    'admin', 
    'secretario', 
    'tesoureiro', 
    'membro', 
    'lider_celula', 
    'lider_ministerio', 
    'aluno', 
    'congregado',
    'superadmin'  -- ← NOVO ROLE ADICIONADO
));

-- Passo 3: Verificar se a constraint foi criada corretamente
SELECT 
    constraint_name, 
    check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'profiles_role_check';

-- =========================================
-- AGORA VOCÊ PODE ATUALIZAR SEU PERFIL
-- =========================================

-- Atualizar seu perfil para SuperAdmin
UPDATE profiles 
SET role = 'superadmin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'edukadoshmda@gmail.com');

-- Verificar se funcionou
SELECT 
    p.full_name,
    p.role,
    u.email,
    p.church_id
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'edukadoshmda@gmail.com';

-- =========================================
-- INSTRUÇÕES:
-- 1. Vá para https://supabase.com
-- 2. Abra seu projeto
-- 3. Clique em "SQL Editor"
-- 4. Cole TODO este código
-- 5. Clique em "Run" para executar
-- =========================================
