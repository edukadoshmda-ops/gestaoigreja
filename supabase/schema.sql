-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Profiles table (users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text not null,
  role text not null check (role in ('admin', 'secretario', 'tesoureiro', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'superadmin')),
  phone text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Members table
create table if not exists members (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text,
  phone text,
  birth_date date,
  address text,
  city text,
  state text,
  zip_code text,
  marital_status text check (marital_status in ('solteiro', 'casado', 'divorciado', 'viuvo')),
  gender text check (gender in ('masculino', 'feminino')),
  baptized boolean default false,
  baptism_date date,
  member_since date,
  status text check (status in ('ativo', 'inativo', 'visitante')) default 'ativo',
  photo_url text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ministries table
create table if not exists ministries (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  leader_id uuid references members(id) on delete set null,
  color text,
  icon text,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Events table
create table if not exists events (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  type text check (type in ('culto', 'evento', 'reuniao', 'especial')),
  date date not null,
  time time not null,
  location text,
  responsible_id uuid references members(id) on delete set null,
  status text check (status in ('planejado', 'confirmado', 'realizado', 'cancelado')) default 'planejado',
  estimated_attendees integer,
  actual_attendees integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Cells table
create table if not exists cells (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  leader_id uuid references members(id) on delete set null,
  host_id uuid references members(id) on delete set null,
  meeting_day text,
  meeting_time time,
  address text,
  city text,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Financial Transactions table
create table if not exists financial_transactions (
  id uuid default uuid_generate_v4() primary key,
  type text check (type in ('entrada', 'saida')) not null,
  category text not null,
  subcategory text,
  amount numeric(10, 2) not null,
  date date not null,
  description text,
  payment_method text,
  member_id uuid references members(id) on delete set null,
  event_id uuid references events(id) on delete set null,
  receipt_url text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Cell Members (Many-to-Many)
create table if not exists cell_members (
  cell_id uuid references cells(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (cell_id, member_id)
);

-- Cell Reports
create table if not exists cell_reports (
  id uuid default uuid_generate_v4() primary key,
  cell_id uuid references cells(id) on delete cascade,
  date date not null,
  members_present integer default 0,
  visitors integer default 0,
  study_topic text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Discipleships
create table if not exists discipleships (
  id uuid default uuid_generate_v4() primary key,
  disciple_id uuid references members(id) on delete cascade,
  mentor_id uuid references members(id) on delete cascade,
  start_date date not null,
  end_date date,
  status text check (status in ('em_andamento', 'concluido', 'cancelado')) default 'em_andamento',
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Notifications
create table if not exists notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text check (type in ('info', 'warning', 'success', 'error')),
  read boolean default false,
  link text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ministry Members (Many-to-Many)
create table if not exists ministry_members (
  member_id uuid references members(id) on delete cascade,
  ministry_id uuid references ministries(id) on delete cascade,
  role text,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (member_id, ministry_id)
);

-- Enable Row Level Security (RLS) on all tables
alter table profiles enable row level security;
alter table members enable row level security;
alter table ministries enable row level security;
alter table events enable row level security;
alter table cells enable row level security;
alter table financial_transactions enable row level security;
alter table cell_members enable row level security;
alter table cell_reports enable row level security;
alter table discipleships enable row level security;
alter table notifications enable row level security;
alter table ministry_members enable row level security;

-- Create policies (dropping existing ones first to avoid errors)

-- Profiles
drop policy if exists "Public profiles are viewable by everyone" on profiles;
create policy "Public profiles are viewable by everyone" on profiles for select using (true);

drop policy if exists "Users can insert their own profile" on profiles;
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Members (permissivo para app com login simulado; em produção use Supabase Auth)
drop policy if exists "Members are viewable by authenticated users" on members;
create policy "Members are viewable by authenticated users" on members for select using (true);
drop policy if exists "Members are insertable by admins and secretaries" on members;
create policy "Members are insertable by admins and secretaries" on members for insert with check (true);
drop policy if exists "Members are updatable by admins and secretaries" on members;
create policy "Members are updatable by admins and secretaries" on members for update using (true);
drop policy if exists "Members are deletable by admins" on members;
create policy "Members are deletable by admins" on members for delete using (true);

-- Cells (permissivo para funcionar com login simulado; em produção use Supabase Auth)
drop policy if exists "Cells are viewable by authenticated users" on cells;
create policy "Cells are viewable by authenticated users" on cells for select using (true);

drop policy if exists "Cells are insertable by admins and leaders" on cells;
create policy "Cells are insertable by admins and leaders" on cells for insert with check (true);

drop policy if exists "Cells are updatable by admins and leaders" on cells;
create policy "Cells are updatable by admins and leaders" on cells for update using (true);

drop policy if exists "Cells are deletable by admins" on cells;
create policy "Cells are deletable by admins" on cells for delete using (true);

-- Ministries (políticas que faltavam; permissivo para login simulado)
drop policy if exists "Ministries are viewable" on ministries;
create policy "Ministries are viewable" on ministries for select using (true);

drop policy if exists "Ministries are insertable" on ministries;
create policy "Ministries are insertable" on ministries for insert with check (true);

drop policy if exists "Ministries are updatable" on ministries;
create policy "Ministries are updatable" on ministries for update using (true);

drop policy if exists "Ministries are deletable" on ministries;
create policy "Ministries are deletable" on ministries for delete using (true);

-- Cell members
drop policy if exists "Cell members viewable" on cell_members;
create policy "Cell members viewable" on cell_members for select using (true);

drop policy if exists "Cell members insertable" on cell_members;
create policy "Cell members insertable" on cell_members for insert with check (true);

drop policy if exists "Cell members deletable" on cell_members;
create policy "Cell members deletable" on cell_members for delete using (true);

-- Ministry members
drop policy if exists "Ministry members viewable" on ministry_members;
create policy "Ministry members viewable" on ministry_members for select using (true);

drop policy if exists "Ministry members insertable" on ministry_members;
create policy "Ministry members insertable" on ministry_members for insert with check (true);

drop policy if exists "Ministry members deletable" on ministry_members;
create policy "Ministry members deletable" on ministry_members for delete using (true);

-- Financial Transactions (permissivo para app com login simulado)
drop policy if exists "Financial transactions viewable by admins and treasurers" on financial_transactions;
create policy "Financial transactions viewable by admins and treasurers" on financial_transactions for select using (true);
drop policy if exists "Financial transactions insertable by admins and treasurers" on financial_transactions;
create policy "Financial transactions insertable by admins and treasurers" on financial_transactions for insert with check (true);
drop policy if exists "Financial transactions updatable by admins and treasurers" on financial_transactions;
create policy "Financial transactions updatable by admins and treasurers" on financial_transactions for update using (true);
drop policy if exists "Financial transactions deletable by admins" on financial_transactions;
create policy "Financial transactions deletable by admins" on financial_transactions for delete using (true);

-- Create views
create or replace view member_statistics as
select
  count(*) as total_members,
  count(*) filter (where status = 'ativo') as active_members,
  count(*) filter (where baptized = true) as baptized_members,
  count(*) filter (where gender = 'masculino') as male_members,
  count(*) filter (where gender = 'feminino') as female_members,
  count(*) filter (where date_part('year', age(birth_date)) < 12) as children,
  count(*) filter (where date_part('year', age(birth_date)) between 12 and 18) as youth,
  count(*) filter (where date_part('year', age(birth_date)) > 18) as adults
from members;

create or replace view financial_summary as
select
  to_char(date, 'YYYY-MM') as month,
  sum(amount) filter (where type = 'entrada') as total_income,
  sum(amount) filter (where type = 'saida') as total_expenses,
  (sum(amount) filter (where type = 'entrada') - sum(amount) filter (where type = 'saida')) as balance
from financial_transactions
group by to_char(date, 'YYYY-MM');

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'membro')
  );
  return new;
end;
$$;

-- Trigger for new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Fix for existing users without profile (Run this manually if needed, but safe to keep here)
insert into public.profiles (id, email, name, role)
select id, email, coalesce(raw_user_meta_data->>'name', email), coalesce(raw_user_meta_data->>'role', 'admin')
from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing;
