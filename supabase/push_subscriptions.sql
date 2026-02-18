-- Tabela para armazenar subscriptions de push (Web Push API)
-- Necessária para envio de notificações em segundo plano

create table if not exists push_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, endpoint)
);

alter table push_subscriptions enable row level security;

-- Usuário só pode inserir/atualizar/ler suas próprias subscriptions
drop policy if exists "Users can manage own push subscriptions" on push_subscriptions;
create policy "Users can manage own push subscriptions"
  on push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
