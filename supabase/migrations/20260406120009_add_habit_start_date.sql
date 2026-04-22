-- Migration: add start_date column to habits
-- A habit only counts toward completion from this date forward.
-- Allows users to pick a future start date (e.g. "I'll begin next Monday").
-- Existing rows are backfilled from created_at so their history is preserved.

alter table public.habits
  add column start_date date;

update public.habits
  set start_date = (created_at at time zone 'utc')::date
  where start_date is null;

alter table public.habits
  alter column start_date set not null,
  alter column start_date set default current_date;

create index habits_user_start_date_idx
  on public.habits(user_id, start_date)
  where archived_at is null;
