-- Tabela de assinaturas/mensalidades das igrejas (R$ 150/mês)
-- Plataforma para até 100 igrejas

CREATE TABLE IF NOT EXISTS church_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('ativa', 'inadimplente', 'cancelada', 'trial')) DEFAULT 'ativa',
  plan_amount NUMERIC(10, 2) NOT NULL DEFAULT 150.00,
  due_day INTEGER NOT NULL DEFAULT 10,
  last_payment_at TIMESTAMP WITH TIME ZONE,
  next_due_at DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_church_subscriptions_church_id ON church_subscriptions(church_id);
CREATE INDEX IF NOT EXISTS idx_church_subscriptions_status ON church_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_church_subscriptions_next_due ON church_subscriptions(next_due_at);

-- Trigger para criar assinatura ao criar igreja
CREATE OR REPLACE FUNCTION create_subscription_for_new_church()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO church_subscriptions (church_id, status, next_due_at)
  VALUES (NEW.id, 'ativa', (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' + INTERVAL '9 days')::date);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_church_created_subscription ON churches;
CREATE TRIGGER on_church_created_subscription
  AFTER INSERT ON churches
  FOR EACH ROW EXECUTE PROCEDURE create_subscription_for_new_church();

-- Função para cadastro de igreja no checkout (usuários anônimos após pagamento)
CREATE OR REPLACE FUNCTION create_church_from_checkout(
  church_name TEXT,
  church_slug TEXT,
  admin_email TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_id UUID;
  existing_count INTEGER;
BEGIN
  SELECT count(*) INTO existing_count FROM churches;
  IF existing_count >= 100 THEN
    RAISE EXCEPTION 'Limite de 100 igrejas atingido.';
  END IF;

  INSERT INTO churches (name, slug)
  VALUES (church_name, church_slug)
  RETURNING id INTO new_id;

  -- Se create_church_with_admin existir e admin_email fornecido, vincular admin
  IF admin_email IS NOT NULL AND admin_email != '' THEN
    BEGIN
      UPDATE profiles SET church_id = new_id WHERE email = admin_email;
    EXCEPTION WHEN OTHERS THEN
      NULL; -- Ignora erro ao vincular admin
    END;
  END IF;

  RETURN new_id;
END;
$$;

-- RLS
ALTER TABLE church_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "SuperAdmin full access" ON church_subscriptions;
CREATE POLICY "SuperAdmin full access" ON church_subscriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );
