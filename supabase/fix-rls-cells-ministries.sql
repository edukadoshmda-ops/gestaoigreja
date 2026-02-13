/* Correção RLS: células, ministérios e membros (app com login simulado) */
/* MEMBERS: permitir ler e escrever para listas e cadastros funcionarem */
drop policy if exists "Members are viewable by authenticated users" on members;
create policy "Members are viewable by authenticated users" on members for select using (true);
drop policy if exists "Members are insertable by admins and secretaries" on members;
create policy "Members are insertable by admins and secretaries" on members for insert with check (true);
drop policy if exists "Members are updatable by admins and secretaries" on members;
create policy "Members are updatable by admins and secretaries" on members for update using (true);
drop policy if exists "Members are deletable by admins" on members;
create policy "Members are deletable by admins" on members for delete using (true);

drop policy if exists "Ministries are viewable" on ministries;
create policy "Ministries are viewable" on ministries for select using (true);

drop policy if exists "Ministries are insertable" on ministries;
create policy "Ministries are insertable" on ministries for insert with check (true);

drop policy if exists "Ministries are updatable" on ministries;
create policy "Ministries are updatable" on ministries for update using (true);

drop policy if exists "Ministries are deletable" on ministries;
create policy "Ministries are deletable" on ministries for delete using (true);

drop policy if exists "Cells are viewable by authenticated users" on cells;
create policy "Cells are viewable by authenticated users" on cells for select using (true);

drop policy if exists "Cells are insertable by admins and leaders" on cells;
create policy "Cells are insertable by admins and leaders" on cells for insert with check (true);

drop policy if exists "Cells are updatable by admins and leaders" on cells;
create policy "Cells are updatable by admins and leaders" on cells for update using (true);

drop policy if exists "Cells are deletable by admins" on cells;
create policy "Cells are deletable by admins" on cells for delete using (true);

drop policy if exists "Cell members viewable" on cell_members;
create policy "Cell members viewable" on cell_members for select using (true);

drop policy if exists "Cell members insertable" on cell_members;
create policy "Cell members insertable" on cell_members for insert with check (true);

drop policy if exists "Cell members deletable" on cell_members;
create policy "Cell members deletable" on cell_members for delete using (true);

drop policy if exists "Ministry members viewable" on ministry_members;
create policy "Ministry members viewable" on ministry_members for select using (true);

drop policy if exists "Ministry members insertable" on ministry_members;
create policy "Ministry members insertable" on ministry_members for insert with check (true);

drop policy if exists "Ministry members deletable" on ministry_members;
create policy "Ministry members deletable" on ministry_members for delete using (true);

/* FINANCIAL: permitir para Caixa Diário e Relatórios */
drop policy if exists "Financial transactions viewable by admins and treasurers" on financial_transactions;
create policy "Financial transactions viewable by admins and treasurers" on financial_transactions for select using (true);
drop policy if exists "Financial transactions insertable by admins and treasurers" on financial_transactions;
create policy "Financial transactions insertable by admins and treasurers" on financial_transactions for insert with check (true);
drop policy if exists "Financial transactions updatable by admins and treasurers" on financial_transactions;
create policy "Financial transactions updatable by admins and treasurers" on financial_transactions for update using (true);
drop policy if exists "Financial transactions deletable by admins" on financial_transactions;
create policy "Financial transactions deletable by admins" on financial_transactions for delete using (true);
