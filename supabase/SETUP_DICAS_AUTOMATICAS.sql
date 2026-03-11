-- ============================================================
-- SETUP COMPLETO: Dicas automáticas por e-mail
-- Copie todo este arquivo e execute no SQL Editor do Supabase
-- ============================================================

-- 1. Tabelas
CREATE TABLE IF NOT EXISTS app_tips (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_short TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'both')),
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_app_tips_title_unique ON app_tips(title);

CREATE TABLE IF NOT EXISTS app_tip_deliveries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tip_id UUID REFERENCES app_tips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id UUID REFERENCES churches(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  sent_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  UNIQUE(tip_id, user_id, channel)
);

CREATE TABLE IF NOT EXISTS app_tip_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE NOT NULL,
  email_enabled BOOLEAN DEFAULT true,
  whatsapp_enabled BOOLEAN DEFAULT true,
  frequency TEXT DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'biweekly')),
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(church_id)
);

CREATE INDEX IF NOT EXISTS idx_app_tip_deliveries_user ON app_tip_deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_app_tip_deliveries_tip ON app_tip_deliveries(tip_id);
CREATE INDEX IF NOT EXISTS idx_app_tips_active_order ON app_tips(active, sort_order);

ALTER TABLE app_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_tip_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_tip_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_tips: leitura autenticados" ON app_tips;
CREATE POLICY "app_tips: leitura autenticados" ON app_tips FOR SELECT TO authenticated USING (active = true);
DROP POLICY IF EXISTS "app_tips: superadmin gerencia" ON app_tips;
CREATE POLICY "app_tips: superadmin gerencia" ON app_tips FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'));

DROP POLICY IF EXISTS "app_tip_deliveries: leitura próprio usuário" ON app_tip_deliveries;
CREATE POLICY "app_tip_deliveries: leitura próprio usuário" ON app_tip_deliveries
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "app_tip_preferences: igreja lê/edita própria" ON app_tip_preferences;
CREATE POLICY "app_tip_preferences: igreja lê/edita própria" ON app_tip_preferences
  FOR ALL USING (
    church_id IN (SELECT church_id FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );

-- 2. RPC para buscar usuários
CREATE OR REPLACE FUNCTION get_users_for_email_tips()
RETURNS TABLE(user_id UUID, user_email TEXT, church_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email::text, p.church_id
  FROM auth.users u
  JOIN public.profiles p ON p.id = u.id
  WHERE p.role IN ('admin','pastor','secretario','superadmin')
    AND p.church_id IS NOT NULL
    AND u.email IS NOT NULL AND trim(u.email) != ''
    AND (
      NOT EXISTS (SELECT 1 FROM app_tip_preferences pref WHERE pref.church_id = p.church_id)
      OR EXISTS (SELECT 1 FROM app_tip_preferences pref WHERE pref.church_id = p.church_id AND pref.email_enabled = true)
    );
END;
$$;

-- 3. Seed de dicas
INSERT INTO app_tips (title, content, content_short, channel, sort_order) VALUES
('Bem-vindo ao Gestão Igreja', '<h2>Olá! Bem-vindo ao Gestão Igreja</h2><p>Use o <strong>Dashboard</strong> para ver o resumo do dia: versículo, aniversariantes e ações rápidas.</p>', 'Comece pelo Dashboard.', 'both', 1),
('Cadastro de membros: dica rápida', '<h2>Dica: Cadastro de membros</h2><p>Em <strong>Membros</strong>, cadastre nome, telefone e categoria. Mantenha o telefone atualizado para escalas.</p>', 'Cadastre membros com foto e telefone.', 'both', 2),
('Como usar o Caixa Diário', '<h2>Caixa Diário</h2><p>Registre entradas e saídas. Feche o caixa diariamente.</p>', 'Controle financeiro.', 'email', 3),
('Escala de culto e confirmação', '<h2>Escala de culto</h2><p>Crie eventos, adicione escala e envie link de confirmação pelo WhatsApp.</p>', 'Confirmação online.', 'both', 4),
('Boletins e avisos', '<h2>Boletins</h2><p>Crie avisos e boletins. Envie para toda a igreja.</p>', 'Comunicação.', 'email', 5),
('PIX e doações', '<h2>PIX</h2><p>Cadastre a chave PIX e gere o QR Code para doações.</p>', 'Doações.', 'email', 6),
('Planos de leitura', '<h2>Planos de Leitura</h2><p>Crie planos e acompanhe o progresso.</p>', 'Leitura bíblica.', 'email', 7),
('Solicitações de oração', '<h2>Solicitações de Oração</h2><p>Registre e acompanhe pedidos de oração.</p>', 'Oração.', 'whatsapp', 8),
('Instale o app no celular (PWA)', '<h2>Instale no celular</h2><p>Adicione à tela inicial para usar como app.</p>', 'PWA.', 'both', 9)
ON CONFLICT (title) DO NOTHING;
