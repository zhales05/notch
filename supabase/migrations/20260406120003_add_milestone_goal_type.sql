-- Migration: Add milestone goal type and make target_value nullable
-- Milestone goals are non-numeric goals like "become a senior developer"

-- Add 'milestone' to the goal_type enum
ALTER TYPE public.goal_type ADD VALUE 'milestone';

-- Make target_value nullable for milestone goals that don't have a numeric target
ALTER TABLE public.goals
  ALTER COLUMN target_value DROP NOT NULL;
