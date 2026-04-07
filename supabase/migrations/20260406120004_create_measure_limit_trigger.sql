-- Freemium measure limit: free users can have up to 4 active measures

create or replace function public.check_measure_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan          public.plan_type;
  v_measure_count int;
  v_max_measures  int := 4;
begin
  select plan into v_plan
  from public.profiles
  where id = new.user_id;

  if v_plan = 'free' then
    select count(*) into v_measure_count
    from public.measures
    where user_id = new.user_id
      and archived_at is null;

    if v_measure_count >= v_max_measures then
      raise exception 'Free plan is limited to % active measures. Upgrade to premium for unlimited measures.', v_max_measures;
    end if;
  end if;

  return new;
end;
$$;

create trigger enforce_measure_limit
  before insert on public.measures
  for each row
  execute function public.check_measure_limit();

-- Block unarchiving when at the limit
create or replace function public.check_measure_unarchive_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan          public.plan_type;
  v_measure_count int;
  v_max_measures  int := 4;
begin
  if old.archived_at is not null and new.archived_at is null then
    select plan into v_plan
    from public.profiles
    where id = new.user_id;

    if v_plan = 'free' then
      select count(*) into v_measure_count
      from public.measures
      where user_id = new.user_id
        and archived_at is null;

      if v_measure_count >= v_max_measures then
        raise exception 'Free plan is limited to % active measures. Upgrade to premium for unlimited measures.', v_max_measures;
      end if;
    end if;
  end if;

  return new;
end;
$$;

create trigger enforce_measure_unarchive_limit
  before update on public.measures
  for each row
  execute function public.check_measure_unarchive_limit();
