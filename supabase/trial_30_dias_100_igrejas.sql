-- Trial 30 dias para 100 igrejas
-- Primeiro acesso: tela Institucional (obrigatório preencher dados + pastor presidente)
-- Após 30 dias: gravar lead e redirecionar para página de venda

-- 1. Colunas em churches para controle do trial
ALTER TABLE churches ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS institutional_completed_at TIMESTAMPTZ;

-- 2. Tabela trial_leads (dados salvos quando trial expira)
CREATE TABLE IF NOT EXISTS trial_leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  church_id UUID REFERENCES churches(id) ON DELETE SET NULL,
  church_name TEXT NOT NULL,
  president_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE trial_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "SuperAdmin can read trial_leads" ON trial_leads;
CREATE POLICY "SuperAdmin can read trial_leads" ON trial_leads
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );
DROP POLICY IF EXISTS "Service role can insert trial_leads" ON trial_leads;
CREATE POLICY "Service role can insert trial_leads" ON trial_leads
  FOR INSERT WITH CHECK (true);

-- 3. Função: contar igrejas em trial (limite 100)
CREATE OR REPLACE FUNCTION count_trial_churches()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  c INTEGER;
BEGIN
  SELECT count(*)::integer INTO c
  FROM church_subscriptions
  WHERE status = 'trial';
  RETURN COALESCE(c, 0);
END;
$$;

-- 4. Atualizar trigger de nova igreja: trial usa next_due = hoje + 30 dias
-- (O create_subscription_for_new_church existente cria com status 'ativa')
-- Criamos função separada para igrejas trial
CREATE OR REPLACE FUNCTION create_trial_subscription_for_church(p_church_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  trial_count INTEGER;
BEGIN
  SELECT count_trial_churches() INTO trial_count;
  IF trial_count >= 100 THEN
    RAISE EXCEPTION 'Limite de 100 igrejas em teste atingido.';
  END IF;

  -- Atualiza churches com trial_started_at
  UPDATE churches SET trial_started_at = NOW() WHERE id = p_church_id;

  -- Cria ou atualiza assinatura como trial, next_due = hoje + 30 dias
  INSERT INTO church_subscriptions (church_id, status, next_due_at)
  VALUES (p_church_id, 'trial', (CURRENT_DATE + INTERVAL '30 days')::date)
  ON CONFLICT (church_id) DO UPDATE SET
    status = 'trial',
    next_due_at = (CURRENT_DATE + INTERVAL '30 days')::date,
    updated_at = NOW();
END;
$$;

-- 5. Salvar lead quando trial expira
CREATE OR REPLACE FUNCTION save_trial_lead_and_expire(p_church_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO trial_leads (church_id, church_name, president_name, email, phone, address)
  SELECT id, name, president_name, email, phone, address
  FROM churches
  WHERE id = p_church_id;

  UPDATE church_subscriptions
  SET status = 'suspensa', updated_at = NOW()
  WHERE church_id = p_church_id AND status = 'trial';
END;
$$;

-- 6. RPC: obter info do trial (para frontend)
CREATE OR REPLACE FUNCTION get_trial_info(p_church_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  sub RECORD;
  ch RECORD;
  days_left INT;
  is_expired BOOLEAN;
  inst_completed BOOLEAN;
BEGIN
  IF p_church_id IS NULL THEN
    RETURN jsonb_build_object('isTrial', false);
  END IF;

  SELECT cs.status, cs.next_due_at
  INTO sub FROM church_subscriptions cs WHERE cs.church_id = p_church_id LIMIT 1;

  IF sub IS NULL OR sub.status != 'trial' THEN
    RETURN jsonb_build_object('isTrial', false);
  END IF;

  SELECT c.trial_started_at, c.institutional_completed_at, c.name, c.president_name
  INTO ch FROM churches c WHERE c.id = p_church_id;

  days_left := (sub.next_due_at::date - CURRENT_DATE);
  is_expired := days_left < 0;
  inst_completed := ch.institutional_completed_at IS NOT NULL
    OR (ch.name IS NOT NULL AND trim(ch.name) != '' AND ch.name != 'Igreja Comunidade Cristã'
        AND ch.president_name IS NOT NULL AND trim(ch.president_name) != '');

  RETURN jsonb_build_object(
    'isTrial', true,
    'trialStartedAt', ch.trial_started_at,
    'nextDueAt', sub.next_due_at,
    'daysLeft', greatest(0, days_left),
    'isExpired', is_expired,
    'institutionalCompleted', inst_completed
  );
END;
$$;

-- 7. RPC: marcar institucional como preenchida
CREATE OR REPLACE FUNCTION set_institutional_completed(p_church_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE churches
  SET institutional_completed_at = COALESCE(institutional_completed_at, NOW()),
      updated_at = NOW()
  WHERE id = p_church_id;
END;
$$;
