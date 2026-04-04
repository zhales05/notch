-- Migration 006: goal_habits join table + RLS

create type public.contribution_mode as enum ('count', 'value_sum', 'streak');

create table public.goal_habits (
  id                uuid primary key default gen_random_uuid(),
  goal_id           uuid not null references public.goals(id) on delete cascade,
  habit_id          uuid not null references public.habits(id) on delete cascade,
  contribution_mode public.contribution_mode not null default 'count',
  weight            numeric not null default 1.0,

  unique (goal_id, habit_id)
);

create index goal_habits_goal_id_idx on public.goal_habits(goal_id);
create index goal_habits_habit_id_idx on public.goal_habits(habit_id);

-- RLS: ownership derived through the goal
alter table public.goal_habits enable row level security;

create policy "Users can view their own goal_habits"
  on public.goal_habits for select
  using (
    exists (
      select 1 from public.goals
      where goals.id = goal_habits.goal_id
        and goals.user_id = auth.uid()
    )
  );

create policy "Users can create their own goal_habits"
  on public.goal_habits for insert
  with check (
    exists (
      select 1 from public.goals
      where goals.id = goal_habits.goal_id
        and goals.user_id = auth.uid()
    )
  );

create policy "Users can update their own goal_habits"
  on public.goal_habits for update
  using (
    exists (
      select 1 from public.goals
      where goals.id = goal_habits.goal_id
        and goals.user_id = auth.uid()
    )
  );

create policy "Users can delete their own goal_habits"
  on public.goal_habits for delete
  using (
    exists (
      select 1 from public.goals
      where goals.id = goal_habits.goal_id
        and goals.user_id = auth.uid()
    )
  );
