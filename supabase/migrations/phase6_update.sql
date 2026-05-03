-- Phase 6 Update: Birth Date and Trash Auto-Purge

-- 1. Add birth_date to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;

-- 2. Create a function to permanently delete soft-deleted records older than 30 days
CREATE OR REPLACE FUNCTION purge_old_trash()
RETURNS void AS $$
BEGIN
    -- Delete from profiles (athletes)
    DELETE FROM public.profiles 
    WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days';
    
    -- Delete from workout_plans
    DELETE FROM public.workout_plans 
    WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days';
    
    -- Delete from exercises
    DELETE FROM public.exercises 
    WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days';
    
    -- Delete from memberships
    DELETE FROM public.memberships 
    WHERE deleted_at IS NOT NULL AND deleted_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: To automate this, you would enable pg_cron in Supabase and run:
-- SELECT cron.schedule('purge-trash-daily', '0 3 * * *', 'SELECT purge_old_trash()');
-- Since pg_cron is not always enabled by default on all plans, we will also 
-- call this function from the UI or periodically from the server actions as a fallback.
