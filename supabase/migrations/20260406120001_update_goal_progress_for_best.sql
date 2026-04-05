-- Migration: Update calculate_goal_progress to support performance target goals
-- Uses goal.goal_type to determine aggregation strategy

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

  -- Performance target goals: find the best value across all linked habits
  if v_goal.goal_type in ('best_min', 'best_max') then
    for v_goal_habit in
      select gh.habit_id, gh.weight
      from public.goal_habits gh
      where gh.goal_id = p_goal_id
    loop
      if v_goal.goal_type = 'best_min' then
        select min(hl.value) into v_raw_value
        from public.habit_logs hl
        where hl.habit_id = v_goal_habit.habit_id
          and hl.logged_at >= v_goal.start_date
          and (v_goal.end_date is null or hl.logged_at <= v_goal.end_date)
          and hl.value is not null;
      else
        select max(hl.value) into v_raw_value
        from public.habit_logs hl
        where hl.habit_id = v_goal_habit.habit_id
          and hl.logged_at >= v_goal.start_date
          and (v_goal.end_date is null or hl.logged_at <= v_goal.end_date)
          and hl.value is not null;
      end if;

      -- Track the overall best across all linked habits
      if v_raw_value is not null then
        if v_best_value is null then
          v_best_value := v_raw_value;
        elsif v_goal.goal_type = 'best_min' and v_raw_value < v_best_value then
          v_best_value := v_raw_value;
        elsif v_goal.goal_type = 'best_max' and v_raw_value > v_best_value then
          v_best_value := v_raw_value;
        end if;
      end if;
    end loop;

    -- Calculate percentage for performance targets
    if v_best_value is null or v_goal.target_value <= 0 then
      v_percentage := 0;
      v_current_value := 0;
    elsif v_goal.goal_type = 'best_min' then
      v_current_value := v_best_value;
      if v_best_value <= v_goal.target_value then
        v_percentage := 100;
      else
        -- Linear: at target = 100%, at 2x target = 0%
        v_percentage := greatest(0, round((1 - (v_best_value - v_goal.target_value) / v_goal.target_value) * 100, 2));
      end if;
    else -- best_max
      v_current_value := v_best_value;
      v_percentage := round(least(v_best_value / v_goal.target_value, 1) * 100, 2);
    end if;

    return jsonb_build_object(
      'current_value', v_current_value,
      'target_value', v_goal.target_value,
      'percentage', least(v_percentage, 100),
      'best_value', v_best_value
    );
  end if;

  -- Accumulation goals: original weighted-average logic
  for v_goal_habit in
    select gh.habit_id, gh.contribution_mode, gh.weight
    from public.goal_habits gh
    where gh.goal_id = p_goal_id
  loop
    v_total_weight := v_total_weight + v_goal_habit.weight;

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
          having max(d) = coalesce(v_goal.end_date, current_date)
        ) streaks;

      else
        v_raw_value := 0;
    end case;

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
    'best_value', null
  );
end;
$$;
