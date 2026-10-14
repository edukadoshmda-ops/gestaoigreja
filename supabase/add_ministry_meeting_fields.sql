-- Adiciona campos de atividade e presença para ministérios
-- (Compatível com o formato JSON embutido em monthly_activity_report)

ALTER TABLE ministries ADD COLUMN IF NOT EXISTS visitors_count integer DEFAULT 0;
ALTER TABLE ministries ADD COLUMN IF NOT EXISTS members_present_count integer DEFAULT 0;
ALTER TABLE ministries ADD COLUMN IF NOT EXISTS meeting_date date DEFAULT CURRENT_DATE;

COMMENT ON COLUMN ministries.visitors_count IS 'Número de visitantes na reunião do ministério';
COMMENT ON COLUMN ministries.members_present_count IS 'Número de membros presentes na reunião';
COMMENT ON COLUMN ministries.meeting_date IS 'Data da reunião do ministério';
