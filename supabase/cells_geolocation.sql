-- Geolocalização para células: adiciona latitude e longitude
-- Execute no SQL Editor do Supabase ou via CLI: supabase db push

ALTER TABLE cells
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric;

COMMENT ON COLUMN cells.latitude IS 'Latitude do endereço da reunião (WGS84)';
COMMENT ON COLUMN cells.longitude IS 'Longitude do endereço da reunião (WGS84)';
