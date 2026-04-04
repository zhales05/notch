-- Validate frequency_config shape per frequency type
-- Separate migration because PG can't reference new enum values in the same transaction
ALTER TABLE public.habits
  ADD CONSTRAINT habits_frequency_config_check CHECK (
    CASE frequency
      WHEN 'daily' THEN frequency_config IS NULL
      WHEN 'weekly' THEN frequency_config IS NULL
      WHEN 'monthly' THEN frequency_config IS NULL
      WHEN 'every_n_weeks' THEN
        frequency_config IS NOT NULL
        AND (frequency_config->>'interval_weeks')::int > 0
        AND frequency_config ? 'anchor_date'
      WHEN 'x_per_period' THEN
        frequency_config IS NOT NULL
        AND (frequency_config->>'times')::int > 0
        AND frequency_config->>'period' IN ('week', 'month')
      WHEN 'specific_days' THEN
        frequency_config IS NOT NULL
        AND jsonb_array_length(frequency_config->'days') > 0
      ELSE false
    END
  );
