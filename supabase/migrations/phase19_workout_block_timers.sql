-- Add timer columns to workout_blocks
ALTER TABLE workout_blocks ADD COLUMN IF NOT EXISTS timer_type TEXT;
ALTER TABLE workout_blocks ADD COLUMN IF NOT EXISTS timer_config JSONB DEFAULT '{}'::jsonb;
