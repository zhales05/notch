-- Migration 003: habits table + RLS

create type public.log_type as enum ('boolean', 'value');
create type public.frequency_type as enum ('daily', 'weekly', 'monthly');

create table public.habits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title       text not null,
  description text,
  log_type    public.log_type not null default 'boolean',
  frequency   public.frequency_type not null default 'daily',
  unit        text,
  color       text not null default '#6366f1',
  icon        text not null default 'check',
  sort_order  int not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index habits_user_id_idx on public.habits(user_id);
create index habits_category_id_idx on public.habits(category_id);
create index habits_user_active_idx on public.habits(user_id) where archived_at is null;

-- RLS
alter table public.habits enable row level security;

create policy "Users can view their own habits"
  on public.habits for select
  using (auth.uid() = user_id);

create policy "Users can create their own habits"
  on public.habits for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own habits"
  on public.habits for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own habits"
  on public.habits for delete
  using (auth.uid() = user_id);

create trigger habits_updated_at
  before update on public.habits
  for each row
  execute function public.set_updated_at();
