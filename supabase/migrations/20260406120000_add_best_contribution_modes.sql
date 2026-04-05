-- Migration: Add best_min and best_max contribution modes for performance target goals

ALTER TYPE public.contribution_mode ADD VALUE 'best_min';
ALTER TYPE public.contribution_mode ADD VALUE 'best_max';
