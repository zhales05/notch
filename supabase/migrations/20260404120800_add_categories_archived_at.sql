-- Add soft delete support to categories (mirrors habits.archived_at pattern)
alter table public.categories
  add column archived_at timestamptz;
