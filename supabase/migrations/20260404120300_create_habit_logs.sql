-- Migration 004: habit_logs table + RLS

create type public.log_source as enum ('web', 'ios', 'watch');

create table public.habit_logs (
  id        uuid primary key default gen_random_uuid(),
  habit_id  uuid not null references public.habits(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  logged_at date not null default current_date,
  value     numeric,
  source    public.log_source not null default 'web',
  created_at timestamptz not null default now(),

  unique (habit_id, logged_at)
);

create index habit_logs_user_id_idx on public.habit_logs(user_id);
create index habit_logs_habit_id_idx on public.habit_logs(habit_id);
create index habit_logs_logged_at_idx on public.habit_logs(logged_at);
create index habit_logs_habit_date_idx on public.habit_logs(habit_id, logged_at);

-- RLS
alter table public.habit_logs enable row level security;

create policy "Users can view their own logs"
  on public.habit_logs for select
  using (auth.uid() = user_id);

create policy "Users can create their own logs"
  on public.habit_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own logs"
  on public.habit_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own logs"
  on public.habit_logs for delete
  using (auth.uid() = user_id);
