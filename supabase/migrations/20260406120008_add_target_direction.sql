-- Migration: add target_direction column to habits
-- Indicates whether the daily_target is a minimum ("at_least") or maximum ("at_most")
-- Defaults to "at_least" (e.g. read at least 30 pages)

create type public.target_direction as enum ('at_least', 'at_most');

alter table public.habits
  add column target_direction public.target_direction not null default 'at_least';
