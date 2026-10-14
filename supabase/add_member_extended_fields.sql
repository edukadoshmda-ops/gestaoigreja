-- Migração: Adiciona campos estendidos ao cadastro de membros para alimentar a carteirinha
-- Executar no Supabase SQL Editor se desejar persistir esses campos em colunas dedicadas
-- (O sistema também possui suporte automático a persistência via JSON em `notes` caso as colunas não existam)

ALTER TABLE members ADD COLUMN IF NOT EXISTS prefix text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS nickname text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS organ_donor text DEFAULT 'Não';
ALTER TABLE members ADD COLUMN IF NOT EXISTS nationality text DEFAULT 'Brasileira';
ALTER TABLE members ADD COLUMN IF NOT EXISTS education text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS profession text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS blood_type text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS special_needs text DEFAULT 'Não';
ALTER TABLE members ADD COLUMN IF NOT EXISTS cpf text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS rg text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS passport text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS mother_name text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS father_name text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS registration_updated_at date;
ALTER TABLE members ADD COLUMN IF NOT EXISTS custom_card_config jsonb;

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_members_cpf ON members(cpf);
CREATE INDEX IF NOT EXISTS idx_members_name ON members(name);
