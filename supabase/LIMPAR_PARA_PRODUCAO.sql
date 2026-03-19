-- =====================================================
-- LIMPAR TUDO PARA USO REAL - App Gestão Igreja
-- =====================================================
-- Este script remove todos os usuários de teste,
-- todas as igrejas fictícias e membros de exemplo.
-- MANTÉM apenas o seu acesso de SuperAdmin.
--
-- INSTRUÇÕES:
-- 1. Verifique seu e-mail abaixo em 'meu_email'.
-- 2. Execute este script no SQL Editor do Supabase.
-- 3. O app estará pronto para o primeiro uso real.
-- =====================================================

DO $$
DECLARE
  -- Digite seu e-mail principal aqui para NÃO ser deletado:
  meu_email text := 'edukadoshmda@gmail.com'; 
BEGIN
  -- 1. Limpar TODAS as tabelas de dados na ordem correta de dependências (FKs)
  
  -- Tabelas de junção e dependentes
  IF to_regclass('public.financial_transactions') IS NOT NULL THEN DELETE FROM public.financial_transactions; END IF;
  IF to_regclass('public.cell_members') IS NOT NULL THEN DELETE FROM public.cell_members; END IF;
  IF to_regclass('public.ministry_members') IS NOT NULL THEN DELETE FROM public.ministry_members; END IF;
  IF to_regclass('public.cell_reports') IS NOT NULL THEN DELETE FROM public.cell_reports; END IF;
  IF to_regclass('public.discipleships') IS NOT NULL THEN DELETE FROM public.discipleships; END IF;
  IF to_regclass('public.notifications') IS NOT NULL THEN DELETE FROM public.notifications; END IF;
  IF to_regclass('public.documents') IS NOT NULL THEN DELETE FROM public.documents; END IF;
  IF to_regclass('public.church_pastors') IS NOT NULL THEN DELETE FROM public.church_pastors; END IF;
  IF to_regclass('public.prayer_requests') IS NOT NULL THEN DELETE FROM public.prayer_requests; END IF;
  IF to_regclass('public.church_social_links') IS NOT NULL THEN DELETE FROM public.church_social_links; END IF;
  IF to_regclass('public.church_pix') IS NOT NULL THEN DELETE FROM public.church_pix; END IF;
  IF to_regclass('public.church_president') IS NOT NULL THEN DELETE FROM public.church_president; END IF;
  IF to_regclass('public.school_students') IS NOT NULL THEN DELETE FROM public.school_students; END IF;
  IF to_regclass('public.school_reports') IS NOT NULL THEN DELETE FROM public.school_reports; END IF;
  IF to_regclass('public.schools') IS NOT NULL THEN DELETE FROM public.schools; END IF;
  IF to_regclass('public.budget_schema') IS NOT NULL THEN DELETE FROM public.budget_schema; END IF; -- se for o nome da tabela
  IF to_regclass('public.budgets') IS NOT NULL THEN DELETE FROM public.budgets; END IF;
  
  -- 2. Limpar entidades principais (anulando FKs primeiro)
  IF to_regclass('public.cells') IS NOT NULL THEN 
    UPDATE public.cells SET leader_id = NULL, host_id = NULL; 
    DELETE FROM public.cells;
  END IF;
  
  IF to_regclass('public.ministries') IS NOT NULL THEN 
    UPDATE public.ministries SET leader_id = NULL; 
    DELETE FROM public.ministries;
  END IF;
  
  IF to_regclass('public.events') IS NOT NULL THEN 
    UPDATE public.events SET responsible_id = NULL; 
    DELETE FROM public.events;
  END IF;
  
  IF to_regclass('public.members') IS NOT NULL THEN DELETE FROM public.members; END IF;
  
  -- 3. Limpar assinaturas e pagamentos
  IF to_regclass('public.church_subscription_payments') IS NOT NULL THEN DELETE FROM public.church_subscription_payments; END IF;
  IF to_regclass('public.church_subscriptions') IS NOT NULL THEN DELETE FROM public.church_subscriptions; END IF;
  
  -- 4. Limpar TODAS as igrejas (tenants)
  IF to_regclass('public.churches') IS NOT NULL THEN DELETE FROM public.churches; END IF;
  
  -- 5. Limpar usuários antigos (Profiles e Auth)
  -- Mantendo apenas o e-mail em 'meu_email' ou padrões edukadosh se necessário
  
  -- Primeiro remove tokens e sessões dos outros para evitar erros de FK
  DELETE FROM auth.refresh_tokens WHERE user_id::text IN (SELECT id::text FROM auth.users WHERE LOWER(email) != LOWER(meu_email));
  DELETE FROM auth.sessions WHERE user_id::text IN (SELECT id::text FROM auth.users WHERE LOWER(email) != LOWER(meu_email));
  DELETE FROM auth.identities WHERE user_id::text IN (SELECT id::text FROM auth.users WHERE LOWER(email) != LOWER(meu_email));
  
  -- Deleta do auth.users (profiles será removido via ON DELETE CASCADE se configurado, senão removemos manualmente)
  -- Nota: Se a FK em profiles não for ON DELETE CASCADE, precisamos deletar do profiles primeiro.
  DELETE FROM public.profiles WHERE id::text IN (SELECT id::text FROM auth.users WHERE LOWER(email) != LOWER(meu_email));
  DELETE FROM auth.users WHERE LOWER(email) != LOWER(meu_email);

  -- 6. Garantir que o usuário sobrevivente é SuperAdmin e não está vinculado a nenhuma igreja deletada
  UPDATE public.profiles p
  SET role = 'superadmin', church_id = NULL
  FROM auth.users u
  WHERE p.id::text = u.id::text AND LOWER(u.email) = LOWER(meu_email);

  RAISE NOTICE 'App preparado com sucesso! Todos os dados de teste e usuários antigos foram removidos.';
END $$;
