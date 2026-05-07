-- Add description_footer column to workout_blocks so coaches can write
-- additional free-text notes that should appear AFTER structured movements.
-- The existing description column keeps acting as the leading free-text section.
ALTER TABLE public.workout_blocks
  ADD COLUMN IF NOT EXISTS description_footer text;
