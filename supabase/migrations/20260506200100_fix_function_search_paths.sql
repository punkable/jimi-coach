-- Set immutable search_path on all public functions flagged by Supabase advisor.
-- Prevents schema-hijacking attacks without altering function logic.
ALTER FUNCTION public.archive_old_set_results()   SET search_path = public, pg_catalog;
ALTER FUNCTION public.handle_new_user()           SET search_path = public, pg_catalog;
ALTER FUNCTION public.handle_workout_completion() SET search_path = public, pg_catalog;
ALTER FUNCTION public.handle_workout_feed()       SET search_path = public, pg_catalog;
ALTER FUNCTION public.purge_old_trash()           SET search_path = public, pg_catalog;
