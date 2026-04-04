-- ============================================================
-- SEED DATA FOR LOCAL DEVELOPMENT
-- ============================================================
-- Creates 2 test users with categories, habits, logs, and goals.
-- Run via: supabase db reset
--
-- Test users (password for both: "password123"):
--   user_a@test.com (free plan) — Alice
--   user_b@test.com (premium plan) — Bob
-- ============================================================

-- User A (free plan)
insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
) values (
  'a1111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'user_a@test.com',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Alice"}',
  'authenticated',
  'authenticated',
  now(), now()
);

insert into auth.identities (
  id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) values (
  gen_random_uuid(),
  'a1111111-1111-1111-1111-111111111111',
  'a1111111-1111-1111-1111-111111111111',
  jsonb_build_object('sub', 'a1111111-1111-1111-1111-111111111111', 'email', 'user_a@test.com'),
  'email',
  now(), now(), now()
);

-- User B (premium plan)
insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
) values (
  'b2222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'user_b@test.com',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Bob"}',
  'authenticated',
  'authenticated',
  now(), now()
);

insert into auth.identities (
  id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) values (
  gen_random_uuid(),
  'b2222222-2222-2222-2222-222222222222',
  'b2222222-2222-2222-2222-222222222222',
  jsonb_build_object('sub', 'b2222222-2222-2222-2222-222222222222', 'email', 'user_b@test.com'),
  'email',
  now(), now(), now()
);

-- The auth trigger auto-creates profiles. Update User B to premium.
update public.profiles set plan = 'premium' where id = 'b2222222-2222-2222-2222-222222222222';

-- ============================================================
-- USER A: Categories, Habits, Logs, Goals
-- ============================================================

-- Categories
insert into public.categories (id, user_id, title, color, icon, sort_order) values
  ('ca000001-0000-0000-0000-000000000001', 'a1111111-1111-1111-1111-111111111111', 'Health', '#ef4444', 'heart', 0),
  ('ca000001-0000-0000-0000-000000000002', 'a1111111-1111-1111-1111-111111111111', 'Learning', '#3b82f6', 'book', 1);

-- Habits (4 = free plan max)
insert into public.habits (id, user_id, category_id, title, log_type, frequency, unit, color, icon) values
  ('a0000001-0000-0000-0000-000000000001', 'a1111111-1111-1111-1111-111111111111', 'ca000001-0000-0000-0000-000000000001', 'Morning Run', 'value', 'daily', 'miles', '#ef4444', 'running'),
  ('a0000001-0000-0000-0000-000000000002', 'a1111111-1111-1111-1111-111111111111', 'ca000001-0000-0000-0000-000000000001', 'Drink Water', 'boolean', 'daily', null, '#06b6d4', 'droplet'),
  ('a0000001-0000-0000-0000-000000000003', 'a1111111-1111-1111-1111-111111111111', 'ca000001-0000-0000-0000-000000000002', 'Read 30 min', 'boolean', 'daily', null, '#3b82f6', 'book'),
  ('a0000001-0000-0000-0000-000000000004', 'a1111111-1111-1111-1111-111111111111', 'ca000001-0000-0000-0000-000000000002', 'Practice Spanish', 'value', 'daily', 'minutes', '#8b5cf6', 'globe');

-- Habit Logs (last 7 days)
insert into public.habit_logs (user_id, habit_id, logged_at, value) values
  -- Morning Run (value-based)
  ('a1111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000001', current_date - 6, 3.1),
  ('a1111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000001', current_date - 5, 2.5),
  ('a1111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000001', current_date - 4, 4.0),
  ('a1111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000001', current_date - 2, 3.0),
  ('a1111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000001', current_date - 1, 5.2),
  ('a1111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000001', current_date, 2.8),
  -- Drink Water (boolean — presence = done)
  ('a1111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000002', current_date - 6, null),
  ('a1111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000002', current_date - 5, null),
  ('a1111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000002', current_date - 4, null),
  ('a1111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000002', current_date - 3, null),
  ('a1111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000002', current_date - 2, null),
  ('a1111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000002', current_date - 1, null),
  ('a1111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000002', current_date, null),
  -- Read 30 min (boolean, gap on day -4 for streak testing)
  ('a1111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000003', current_date - 6, null),
  ('a1111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000003', current_date - 5, null),
  ('a1111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000003', current_date - 3, null),
  ('a1111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000003', current_date - 2, null),
  ('a1111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000003', current_date - 1, null),
  ('a1111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000003', current_date, null),
  -- Practice Spanish (value)
  ('a1111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000004', current_date - 5, 15),
  ('a1111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000004', current_date - 3, 20),
  ('a1111111-1111-1111-1111-111111111111', 'a0000001-0000-0000-0000-000000000004', current_date - 1, 25);

-- Goals (some with category, one without)
insert into public.goals (id, user_id, category_id, title, target_value, unit, start_date, end_date) values
  ('d0000001-0000-0000-0000-000000000001', 'a1111111-1111-1111-1111-111111111111', 'ca000001-0000-0000-0000-000000000001', 'Run 50 miles this month', 50, 'miles', date_trunc('month', current_date)::date, (date_trunc('month', current_date) + interval '1 month' - interval '1 day')::date),
  ('d0000001-0000-0000-0000-000000000002', 'a1111111-1111-1111-1111-111111111111', 'ca000001-0000-0000-0000-000000000002', 'Read every day for 30 days', 30, 'days', current_date - 30, current_date),
  ('d0000001-0000-0000-0000-000000000003', 'a1111111-1111-1111-1111-111111111111', null, 'Study 100 minutes of Spanish', 100, 'minutes', date_trunc('month', current_date)::date, null);

-- Goal-Habit links
insert into public.goal_habits (goal_id, habit_id, contribution_mode, weight) values
  ('d0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'value_sum', 1.0),
  ('d0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000003', 'streak', 1.0),
  ('d0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000004', 'value_sum', 1.0);

-- ============================================================
-- USER B: Separate data (for RLS testing)
-- ============================================================

insert into public.categories (id, user_id, title, color, icon) values
  ('cb000001-0000-0000-0000-000000000001', 'b2222222-2222-2222-2222-222222222222', 'Fitness', '#10b981', 'dumbbell');

insert into public.habits (id, user_id, category_id, title, log_type, frequency) values
  ('b0000001-0000-0000-0000-000000000001', 'b2222222-2222-2222-2222-222222222222', 'cb000001-0000-0000-0000-000000000001', 'Push-ups', 'value', 'daily');

insert into public.habit_logs (user_id, habit_id, logged_at, value) values
  ('b2222222-2222-2222-2222-222222222222', 'b0000001-0000-0000-0000-000000000001', current_date, 50);
