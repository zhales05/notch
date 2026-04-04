-- Migration: add 'time' log_type + daily_target column on habits

-- Add 'time' to the log_type enum
alter type public.log_type add value 'time';

-- Add daily_target column (nullable, for value/time habits)
alter table public.habits
  add column daily_target numeric;
