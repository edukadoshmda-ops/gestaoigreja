-- ==============================================================================
-- CORREÇÃO DE CHAVES ESTRANGEIRAS (FOREIGN KEYS) COM ON DELETE SET NULL / CASCADE
-- Permite excluir membros sem travar por constraints restritivas (ex: cells_host_id_fkey)
-- ==============================================================================

-- 1. Células (cells): se o membro for anfitrião ou líder, desvincula (SET NULL)
ALTER TABLE IF EXISTS cells 
  DROP CONSTRAINT IF EXISTS cells_host_id_fkey,
  ADD CONSTRAINT cells_host_id_fkey FOREIGN KEY (host_id) REFERENCES members(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS cells 
  DROP CONSTRAINT IF EXISTS cells_leader_id_fkey,
  ADD CONSTRAINT cells_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES members(id) ON DELETE SET NULL;

-- 2. Membros da Célula (cell_members): remove a participação se o membro for deletado
ALTER TABLE IF EXISTS cell_members 
  DROP CONSTRAINT IF EXISTS cell_members_member_id_fkey,
  ADD CONSTRAINT cell_members_member_id_fkey FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

-- 3. Ministérios (ministries): se for líder, desvincula
ALTER TABLE IF EXISTS ministries 
  DROP CONSTRAINT IF EXISTS ministries_leader_id_fkey,
  ADD CONSTRAINT ministries_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES members(id) ON DELETE SET NULL;

-- 4. Membros do Ministério (ministry_members): remove da equipe se o membro for deletado
ALTER TABLE IF EXISTS ministry_members 
  DROP CONSTRAINT IF EXISTS ministry_members_member_id_fkey,
  ADD CONSTRAINT ministry_members_member_id_fkey FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

-- 5. Eventos (events): responsável vira null se o membro for deletado
ALTER TABLE IF EXISTS events 
  DROP CONSTRAINT IF EXISTS events_responsible_id_fkey,
  ADD CONSTRAINT events_responsible_id_fkey FOREIGN KEY (responsible_id) REFERENCES members(id) ON DELETE SET NULL;

-- 6. Discipulado (discipleships): se mentor ou discípulo for deletado, remove vínculo
ALTER TABLE IF EXISTS discipleships 
  DROP CONSTRAINT IF EXISTS discipleships_disciple_id_fkey,
  ADD CONSTRAINT discipleships_disciple_id_fkey FOREIGN KEY (disciple_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS discipleships 
  DROP CONSTRAINT IF EXISTS discipleships_mentor_id_fkey,
  ADD CONSTRAINT discipleships_mentor_id_fkey FOREIGN KEY (mentor_id) REFERENCES members(id) ON DELETE CASCADE;

-- 7. Transações Financeiras (financial_transactions): mantém histórico mas desvincula membro
ALTER TABLE IF EXISTS financial_transactions 
  DROP CONSTRAINT IF EXISTS financial_transactions_member_id_fkey,
  ADD CONSTRAINT financial_transactions_member_id_fkey FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL;

-- 8. Alunos de Escolas / EBD (school_students): remove matrícula
ALTER TABLE IF EXISTS school_students 
  DROP CONSTRAINT IF EXISTS school_students_member_id_fkey,
  ADD CONSTRAINT school_students_member_id_fkey FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;
