-- Migration: Add is_published to workout_days to support Draft Weeks
ALTER TABLE workout_days ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true;

-- Update existing days to be published by default
UPDATE workout_days SET is_published = true WHERE is_published IS NULL;
