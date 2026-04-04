-- Add new frequency types to the enum
-- These must be committed before being referenced in CHECK constraints,
-- so the constraint lives in the next migration file.
ALTER TYPE public.frequency_type ADD VALUE 'every_n_weeks';
ALTER TYPE public.frequency_type ADD VALUE 'x_per_period';
ALTER TYPE public.frequency_type ADD VALUE 'specific_days';

-- Add JSONB config column (nullable -- null means no extra config needed)
ALTER TABLE public.habits
  ADD COLUMN frequency_config jsonb;

COMMENT ON COLUMN public.habits.frequency_config IS
  'JSONB config for flexible frequencies. Shape depends on frequency type:
   every_n_weeks: {"interval_weeks": 2, "anchor_date": "2026-04-07"}
   x_per_period:  {"times": 3, "period": "week"} or {"times": 5, "period": "month"}
   specific_days: {"days": [1, 3, 5]}  -- 0=Sun, 1=Mon, ..., 6=Sat';
