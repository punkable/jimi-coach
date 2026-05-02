-- Add is_archived column to workout_plans
ALTER TABLE public.workout_plans 
ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT false;

-- Add is_archived column to exercises
ALTER TABLE public.exercises 
ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT false;
