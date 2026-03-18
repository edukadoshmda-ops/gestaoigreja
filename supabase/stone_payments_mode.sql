-- Configuração Stone/Pagar.me por igreja (marketplace recomendado)
-- Objetivo:
-- - Definir valores válidos para stone_mode
-- - Trocar o default para 'marketplace' (mais seguro)
-- - Manter compatibilidade com instalações antigas

ALTER TABLE public.churches
  ADD COLUMN IF NOT EXISTS stone_mode text,
  ADD COLUMN IF NOT EXISTS stone_api_key text,
  ADD COLUMN IF NOT EXISTS stone_recipient_id text;

-- Default recomendado
ALTER TABLE public.churches
  ALTER COLUMN stone_mode SET DEFAULT 'marketplace';

-- Backfill para quem já tinha NULL
UPDATE public.churches
SET stone_mode = 'marketplace'
WHERE stone_mode IS NULL;

-- Apenas valores válidos
ALTER TABLE public.churches
  DROP CONSTRAINT IF EXISTS churches_stone_mode_check;

ALTER TABLE public.churches
  ADD CONSTRAINT churches_stone_mode_check
  CHECK (stone_mode IN ('direct', 'marketplace'));

