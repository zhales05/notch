-- Migration 005: goals table + RLS

create type public.goal_status as enum ('active', 'completed', 'paused', 'abandoned');

create table public.goals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  category_id  uuid references public.categories(id) on delete set null,
  title        text not null,
  description  text,
  status       public.goal_status not null default 'active',
  target_value numeric not null,
  unit         text,
  start_date   date not null default current_date,
  end_date     date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index goals_user_id_idx on public.goals(user_id);
create index goals_category_id_idx on public.goals(category_id);
create index goals_user_status_idx on public.goals(user_id, status);

-- RLS
alter table public.goals enable row level security;

create policy "Users can view their own goals"
  on public.goals for select
  using (auth.uid() = user_id);

create policy "Users can create their own goals"
  on public.goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own goals"
  on public.goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own goals"
  on public.goals for delete
  using (auth.uid() = user_id);

create trigger goals_updated_at
  before update on public.goals
  for each row
  execute function public.set_updated_at();
