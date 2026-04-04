-- Freemium category limit enforcement (mirrors habit limit trigger)

-- Block free users from creating more than 2 active categories
create or replace function public.check_category_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan        public.plan_type;
  v_cat_count   int;
  v_max_cats    int := 2;
begin
  select plan into v_plan
  from public.profiles
  where id = new.user_id;

  if v_plan = 'free' then
    select count(*) into v_cat_count
    from public.categories
    where user_id = new.user_id
      and archived_at is null;

    if v_cat_count >= v_max_cats then
      raise exception 'Free plan is limited to % active categories. Upgrade to premium for unlimited categories.', v_max_cats;
    end if;
  end if;

  return new;
end;
$$;

create trigger enforce_category_limit
  before insert on public.categories
  for each row
  execute function public.check_category_limit();

-- Also block unarchiving when at the limit
create or replace function public.check_category_unarchive_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan        public.plan_type;
  v_cat_count   int;
  v_max_cats    int := 2;
begin
  if old.archived_at is not null and new.archived_at is null then
    select plan into v_plan
    from public.profiles
    where id = new.user_id;

    if v_plan = 'free' then
      select count(*) into v_cat_count
      from public.categories
      where user_id = new.user_id
        and archived_at is null;

      if v_cat_count >= v_max_cats then
        raise exception 'Free plan is limited to % active categories. Upgrade to premium for unlimited categories.', v_max_cats;
      end if;
    end if;
  end if;

  return new;
end;
$$;

create trigger enforce_category_unarchive_limit
  before update on public.categories
  for each row
  execute function public.check_category_unarchive_limit();
