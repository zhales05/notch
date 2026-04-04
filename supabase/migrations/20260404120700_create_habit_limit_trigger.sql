-- Migration 008: freemium habit limit enforcement

-- Block free users from creating more than 4 active habits
create or replace function public.check_habit_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan        public.plan_type;
  v_habit_count int;
  v_max_habits  int := 4;
begin
  select plan into v_plan
  from public.profiles
  where id = new.user_id;

  if v_plan = 'free' then
    select count(*) into v_habit_count
    from public.habits
    where user_id = new.user_id
      and archived_at is null;

    if v_habit_count >= v_max_habits then
      raise exception 'Free plan is limited to % active habits. Upgrade to premium for unlimited habits.', v_max_habits;
    end if;
  end if;

  return new;
end;
$$;

create trigger enforce_habit_limit
  before insert on public.habits
  for each row
  execute function public.check_habit_limit();

-- Also block unarchiving when at the limit
create or replace function public.check_habit_unarchive_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan        public.plan_type;
  v_habit_count int;
  v_max_habits  int := 4;
begin
  if old.archived_at is not null and new.archived_at is null then
    select plan into v_plan
    from public.profiles
    where id = new.user_id;

    if v_plan = 'free' then
      select count(*) into v_habit_count
      from public.habits
      where user_id = new.user_id
        and archived_at is null;

      if v_habit_count >= v_max_habits then
        raise exception 'Free plan is limited to % active habits. Upgrade to premium for unlimited habits.', v_max_habits;
      end if;
    end if;
  end if;

  return new;
end;
$$;

create trigger enforce_habit_unarchive_limit
  before update on public.habits
  for each row
  execute function public.check_habit_unarchive_limit();
