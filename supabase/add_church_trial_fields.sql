-- Campos adicionais para cadastro de igreja trial
ALTER TABLE churches ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE churches ADD COLUMN IF NOT EXISTS pastor_phone TEXT;
