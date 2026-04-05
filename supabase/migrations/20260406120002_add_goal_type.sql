-- Migration: Add goal_type to goals table

-- Create the goal_type enum
CREATE TYPE public.goal_type AS ENUM ('accumulate', 'best_min', 'best_max');

-- Add goal_type column with default 'accumulate' for existing rows
ALTER TABLE public.goals
  ADD COLUMN goal_type public.goal_type NOT NULL DEFAULT 'accumulate';
