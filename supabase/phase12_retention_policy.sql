-- ═══════════════════════════════════════════════════
-- Data Retention Policy for workout_set_results
-- Run this in Supabase SQL Editor.
-- Schedule via pg_cron or run manually periodically.
-- ═══════════════════════════════════════════════════

-- 1. Archive table (stores data older than 12 months)
create table if not exists workout_set_results_archive (
  like workout_set_results including all
);

-- 2. Function: move old records to archive, delete from live table
create or replace function archive_old_set_results()
returns void language plpgsql as $$
begin
  -- Move records older than 12 months into archive
  insert into workout_set_results_archive
    select * from workout_set_results
    where created_at < now() - interval '12 months'
    on conflict (id) do nothing;

  -- Delete those records from the live table
  delete from workout_set_results
    where created_at < now() - interval '12 months';
end;
$$;

-- 3. (Optional) Schedule with pg_cron — enable extension first:
-- create extension if not exists pg_cron;
-- select cron.schedule('archive-sets', '0 3 1 * *', 'select archive_old_set_results()');

-- To run manually right now:
-- select archive_old_set_results();
