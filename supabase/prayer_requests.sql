-- Solicitações de oração em tempo real
-- Importante: use Ctrl+A no arquivo e Ctrl+C para copiar TUDO, depois cole no Supabase

create table if not exists prayer_requests (
  id uuid default uuid_generate_v4() primary key,
  church_id uuid references churches(id) on delete cascade not null,
  content text not null,
  is_anonymous boolean default false,
  requester_id uuid references auth.users(id) on delete set null,
  requester_name text,
  prayed_count integer default 0,
  created_at timestamptz default now()
);

alter table prayer_requests enable row level security;

create policy "Prayer requests viewable by church"
  on prayer_requests for select
  using (
    church_id = (select church_id from profiles where id = auth.uid())
    or (select role from profiles where id = auth.uid()) = 'superadmin'
  );

create policy "Prayer requests insert by authenticated"
  on prayer_requests for insert
  with check (
    auth.uid() is not null
    and (church_id = (select church_id from profiles where id = auth.uid()) or (select role from profiles where id = auth.uid()) = 'superadmin')
  );

create policy "Prayer requests update prayed_count"
  on prayer_requests for update
  using (
    church_id = (select church_id from profiles where id = auth.uid())
    or (select role from profiles where id = auth.uid()) = 'superadmin'
  );

create policy "Prayer requests delete own or admin"
  on prayer_requests for delete
  using (
    requester_id = auth.uid()
    or (select role from profiles where id = auth.uid()) in ('admin', 'pastor', 'secretario', 'superadmin')
  );

create index if not exists idx_prayer_requests_church_id on prayer_requests(church_id);
create index if not exists idx_prayer_requests_created_at on prayer_requests(created_at desc);

-- Para Realtime: Supabase Dashboard → Database → Replication → adicione prayer_requests
