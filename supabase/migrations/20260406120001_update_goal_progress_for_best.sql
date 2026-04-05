-- Migration: Update calculate_goal_progress to support best_min and best_max modes

create or replace function public.calculate_goal_progress(p_goal_id uuid)
returns jsonb
language plpgsql
stable
security invoker
as $$
declare
  v_goal         record;
  v_goal_habit   record;
  v_raw_value    numeric;
  v_weighted_sum numeric := 0;
  v_total_weight numeric := 0;
  v_current_value numeric;
  v_percentage    numeric;
  v_best_value   numeric := null;
begin
  -- Fetch the goal (RLS filters based on calling user)
  select * into v_goal
  from public.goals
  where id = p_goal_id;

  if not found then
    return jsonb_build_object('error', 'Goal not found or access denied');
  end if;

  -- Iterate over each linked habit
  for v_goal_habit in
    select gh.habit_id, gh.contribution_mode, gh.weight
    from public.goal_habits gh
    where gh.goal_id = p_goal_id
  loop

    case v_goal_habit.contribution_mode
      -- COUNT: number of log entries in the goal's date range
      when 'count' then
        select count(*)::numeric into v_raw_value
        from public.habit_logs hl
        where hl.habit_id = v_goal_habit.habit_id
          and hl.logged_at >= v_goal.start_date
          and (v_goal.end_date is null or hl.logged_at <= v_goal.end_date);

      -- VALUE_SUM: sum of log values in the goal's date range
      when 'value_sum' then
        select coalesce(sum(hl.value), 0) into v_raw_value
        from public.habit_logs hl
        where hl.habit_id = v_goal_habit.habit_id
          and hl.logged_at >= v_goal.start_date
          and (v_goal.end_date is null or hl.logged_at <= v_goal.end_date);

      -- STREAK: current consecutive days streak ending at today (or end_date)
      when 'streak' then
        with date_series as (
          select generate_series(
            v_goal.start_date,
            coalesce(v_goal.end_date, current_date),
            '1 day'::interval
          )::date as d
        ),
        logged_dates as (
          select hl.logged_at
          from public.habit_logs hl
          where hl.habit_id = v_goal_habit.habit_id
            and hl.logged_at >= v_goal.start_date
            and hl.logged_at <= coalesce(v_goal.end_date, current_date)
        ),
        streak_calc as (
          select
            ds.d,
            ds.d - (row_number() over (order by ds.d))::int as grp
          from date_series ds
          inner join logged_dates ld on ld.logged_at = ds.d
        )
        select coalesce(max(streak_len), 0) into v_raw_value
        from (
          select grp, count(*) as streak_len
          from streak_calc
          group by grp
          -- Only count the streak that reaches today/end_date
          having max(d) = coalesce(v_goal.end_date, current_date)
        ) streaks;

      -- BEST_MIN: lowest value (lower is better, e.g. race time)
      when 'best_min' then
        select min(hl.value) into v_raw_value
        from public.habit_logs hl
        where hl.habit_id = v_goal_habit.habit_id
          and hl.logged_at >= v_goal.start_date
          and (v_goal.end_date is null or hl.logged_at <= v_goal.end_date)
          and hl.value is not null;

        -- Store actual best for display
        v_best_value := v_raw_value;

        -- Skip this habit if no logs exist
        if v_raw_value is null then
          continue;
        end if;

        -- Transform so weighted-average math yields correct percentage:
        -- at target → 100%, at 2x target → 0%, below target → 100%
        if v_raw_value <= v_goal.target_value then
          v_raw_value := v_goal.target_value;
        else
          v_raw_value := greatest(0, v_goal.target_value * 2 - v_raw_value);
        end if;

      -- BEST_MAX: highest value (higher is better, e.g. weight lifted)
      when 'best_max' then
        select max(hl.value) into v_raw_value
        from public.habit_logs hl
        where hl.habit_id = v_goal_habit.habit_id
          and hl.logged_at >= v_goal.start_date
          and (v_goal.end_date is null or hl.logged_at <= v_goal.end_date)
          and hl.value is not null;

        -- Store actual best for display
        v_best_value := v_raw_value;

        -- Skip this habit if no logs exist
        if v_raw_value is null then
          continue;
        end if;

    end case;

    v_total_weight := v_total_weight + v_goal_habit.weight;
    v_weighted_sum := v_weighted_sum + (v_raw_value * v_goal_habit.weight);
  end loop;

  -- Normalize weighted average
  if v_total_weight > 0 then
    v_current_value := v_weighted_sum / v_total_weight;
  else
    v_current_value := 0;
  end if;

  if v_goal.target_value > 0 then
    v_percentage := round((v_current_value / v_goal.target_value) * 100, 2);
  else
    v_percentage := 0;
  end if;

  return jsonb_build_object(
    'current_value', v_current_value,
    'target_value', v_goal.target_value,
    'percentage', least(v_percentage, 100),
    'best_value', v_best_value
  );
end;
$$;
