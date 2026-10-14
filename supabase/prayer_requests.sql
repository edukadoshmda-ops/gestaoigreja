-- ==============================================================================
-- SOLICITAÇÕES DE ORAÇÃO & TESTEMUNHOS DE RESPOSTA (TEMPO REAL)
-- Copie todo o conteúdo abaixo e cole no SQL Editor do seu painel Supabase
-- ==============================================================================

-- 1. Cria a tabela (caso ainda não exista)
create table if not exists prayer_requests (
  id uuid default uuid_generate_v4() primary key,
  church_id uuid references churches(id) on delete cascade not null,
  content text not null,
  is_anonymous boolean default false,
  requester_id uuid references auth.users(id) on delete set null,
  requester_name text,
  contact text,
  category text default 'outros',
  status text default 'pendente',
  assigned_to uuid,
  assigned_to_name text,
  return_date date,
  testimony text,
  answered_at timestamptz,
  prayed_count integer default 0,
  created_at timestamptz default now()
);

-- 2. Migrações seguras (adiciona as colunas caso a tabela já tenha sido criada anteriormente)
alter table prayer_requests add column if not exists contact text;
alter table prayer_requests add column if not exists category text default 'outros';
alter table prayer_requests add column if not exists status text default 'pendente';
alter table prayer_requests add column if not exists assigned_to uuid;
alter table prayer_requests add column if not exists assigned_to_name text;
alter table prayer_requests add column if not exists return_date date;
alter table prayer_requests add column if not exists testimony text;
alter table prayer_requests add column if not exists answered_at timestamptz;

-- 3. Habilita RLS (Row Level Security)
alter table prayer_requests enable row level security;

-- 4. Políticas de acesso seguras (re-cria sem erros caso já existam)
drop policy if exists "Prayer requests viewable by church" on prayer_requests;
create policy "Prayer requests viewable by church"
  on prayer_requests for select
  using (
    church_id = (select church_id from profiles where id = auth.uid())
    or (select role from profiles where id = auth.uid()) = 'superadmin'
  );

drop policy if exists "Prayer requests insert by authenticated" on prayer_requests;
create policy "Prayer requests insert by authenticated"
  on prayer_requests for insert
  with check (
    auth.uid() is not null
    and (church_id = (select church_id from profiles where id = auth.uid()) or (select role from profiles where id = auth.uid()) = 'superadmin')
  );

drop policy if exists "Prayer requests update prayed_count" on prayer_requests;
drop policy if exists "Prayer requests update by church members" on prayer_requests;
create policy "Prayer requests update by church members"
  on prayer_requests for update
  using (
    church_id = (select church_id from profiles where id = auth.uid())
    or (select role from profiles where id = auth.uid()) = 'superadmin'
  );

drop policy if exists "Prayer requests delete own or admin" on prayer_requests;
create policy "Prayer requests delete own or admin"
  on prayer_requests for delete
  using (
    requester_id = auth.uid()
    or (select role from profiles where id = auth.uid()) in ('admin', 'pastor', 'secretario', 'superadmin')
  );

-- 5. Índices de alta performance
create index if not exists idx_prayer_requests_church_id on prayer_requests(church_id);
create index if not exists idx_prayer_requests_created_at on prayer_requests(created_at desc);
create index if not exists idx_prayer_requests_status on prayer_requests(status);

-- 6. Adiciona à publicação do Realtime do Supabase (ignora se já adicionado)
do $$
begin
  alter publication supabase_realtime add table prayer_requests;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
