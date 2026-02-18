-- Integração Hotmart - Adiciona campos e funcionalidades para rastreamento de compras via Hotmart
-- Execute este arquivo no SQL Editor do Supabase

-- 1. Adicionar campos Hotmart na tabela churches
ALTER TABLE churches
ADD COLUMN IF NOT EXISTS hotmart_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS hotmart_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS hotmart_buyer_email TEXT;

-- 2. Criar índice para buscas rápidas por transação Hotmart
CREATE INDEX IF NOT EXISTS idx_churches_hotmart_transaction 
ON churches(hotmart_transaction_id);

-- 3. Atualizar função create_church_from_checkout para suportar Hotmart
-- Esta função permite criar igrejas após checkout (direto ou via Hotmart)
CREATE OR REPLACE FUNCTION create_church_from_checkout(
  church_name TEXT,
  church_slug TEXT,
  admin_email TEXT DEFAULT NULL,
  hotmart_transaction_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_id UUID;
  existing_count INTEGER;
BEGIN
  -- Verificar limite de 100 igrejas
  SELECT count(*) INTO existing_count FROM churches;
  IF existing_count >= 100 THEN
    RAISE EXCEPTION 'Limite de 100 igrejas atingido.';
  END IF;

  -- Criar igreja com dados da Hotmart (se fornecidos)
  INSERT INTO churches (name, slug, hotmart_transaction_id, hotmart_buyer_email)
  VALUES (church_name, church_slug, hotmart_transaction_id, admin_email)
  RETURNING id INTO new_id;

  -- Vincular admin se e-mail fornecido
  IF admin_email IS NOT NULL AND admin_email != '' THEN
    BEGIN
      UPDATE profiles SET church_id = new_id WHERE email = admin_email;
    EXCEPTION WHEN OTHERS THEN
      NULL; -- Ignora erro se usuário não existir
    END;
  END IF;

  RETURN new_id;
END;
$$;

-- Nota: A trigger create_subscription_for_new_church (definida em church_subscriptions.sql)
-- criará automaticamente a assinatura quando uma nova igreja for inserida.
