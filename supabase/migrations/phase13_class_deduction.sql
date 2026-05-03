-- ═══════════════════════════════════════════════════
-- Automatic Class Deduction Policy
-- Automatically increments 'classes_used' in profile
-- when a workout is marked as completed.
-- ═══════════════════════════════════════════════════

-- 1. Create the function that detects completion
CREATE OR REPLACE FUNCTION public.handle_workout_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the workout was changed to 'completed = true'
    -- (Handles both new results and updates from false to true)
    IF (NEW.completed = true AND (TG_OP = 'INSERT' OR OLD.completed = false)) THEN
        UPDATE public.profiles
        SET classes_used = COALESCE(classes_used, 0) + 1
        WHERE id = NEW.athlete_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger that fires the function automatically
DROP TRIGGER IF EXISTS tr_workout_completion ON public.workout_results;
CREATE TRIGGER tr_workout_completion
    AFTER INSERT OR UPDATE ON public.workout_results
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_workout_completion();
