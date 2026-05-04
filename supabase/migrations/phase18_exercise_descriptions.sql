-- Add description column to exercises table
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS description TEXT;
