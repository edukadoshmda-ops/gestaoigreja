-- Registro de conclusão: cada dia marcado como lido

create table if not exists reading_plan_completions (
  user_id uuid references auth.users(id) on delete cascade,
  plan_id uuid references reading_plans(id) on delete cascade,
  day_number integer not null check (day_number > 0),
  completed_at timestamptz default now(),
  primary key (user_id, plan_id, day_number)
);

alter table reading_plan_completions enable row level security;

create policy "Users manage own completions"
  on reading_plan_completions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_reading_plan_completions_plan_user on reading_plan_completions(plan_id, user_id);
