-- Dicas automáticas do app: estrutura para envio por e-mail e WhatsApp
-- Execute este script no SQL Editor do Supabase

-- 1. Tabela de dicas (conteúdo das dicas)
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

-- 2. Controle de envios (evita reenviar a mesma dica)
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

-- 3. Preferências por igreja (opt-in para receber dicas)
CREATE TABLE IF NOT EXISTS app_tip_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE NOT NULL,
  email_enabled BOOLEAN DEFAULT true,
  whatsapp_enabled BOOLEAN DEFAULT true,
  frequency TEXT DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'biweekly')),
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(church_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_app_tip_deliveries_user ON app_tip_deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_app_tip_deliveries_tip ON app_tip_deliveries(tip_id);
CREATE INDEX IF NOT EXISTS idx_app_tips_active_order ON app_tips(active, sort_order);

ALTER TABLE app_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_tip_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_tip_preferences ENABLE ROW LEVEL SECURITY;

-- RLS: leitura para authenticated, escrita para superadmin
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
