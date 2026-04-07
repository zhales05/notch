-- Migration: measures & measure_logs tables + RLS
-- Measures are passive numeric indicators (sleep, steps, screen time)
-- that users track over time without frequency/streak semantics.

create table public.measures (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title       text not null,
  unit        text,
  color       text not null default '#6366f1',
  icon        text not null default 'gauge',
  sort_order  int not null default 0,
  archived_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index measures_user_id_idx on public.measures(user_id);
create index measures_user_active_idx on public.measures(user_id) where archived_at is null;

-- RLS
alter table public.measures enable row level security;

create policy "Users can view their own measures"
  on public.measures for select
  using (auth.uid() = user_id);

create policy "Users can create their own measures"
  on public.measures for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own measures"
  on public.measures for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own measures"
  on public.measures for delete
  using (auth.uid() = user_id);

create trigger measures_updated_at
  before update on public.measures
  for each row
  execute function public.set_updated_at();

-- Measure logs
create table public.measure_logs (
  id          uuid primary key default gen_random_uuid(),
  measure_id  uuid not null references public.measures(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  logged_at   date not null default current_date,
  value       numeric not null,
  source      public.log_source not null default 'web',
  created_at  timestamptz not null default now(),

  unique (measure_id, logged_at)
);

create index measure_logs_user_id_idx on public.measure_logs(user_id);
create index measure_logs_measure_id_idx on public.measure_logs(measure_id);
create index measure_logs_logged_at_idx on public.measure_logs(logged_at);
create index measure_logs_measure_date_idx on public.measure_logs(measure_id, logged_at);

-- RLS
alter table public.measure_logs enable row level security;

create policy "Users can view their own measure logs"
  on public.measure_logs for select
  using (auth.uid() = user_id);

create policy "Users can create their own measure logs"
  on public.measure_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own measure logs"
  on public.measure_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own measure logs"
  on public.measure_logs for delete
  using (auth.uid() = user_id);
