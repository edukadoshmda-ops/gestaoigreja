-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Profiles table (users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text not null,
  role text not null check (role in ('admin', 'secretario', 'tesoureiro', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado')),
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
