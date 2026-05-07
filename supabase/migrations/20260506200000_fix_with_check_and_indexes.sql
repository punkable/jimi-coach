-- Remove old duplicate UPDATE policies that had WITH CHECK (true).
-- The newer "Coaches and admins can update X" policies already have proper
-- WITH CHECK expressions that mirror the USING clause.

DROP POLICY IF EXISTS "Coaches can update their workout days" ON workout_days;
DROP POLICY IF EXISTS "Coaches can update their blocks" ON workout_blocks;
DROP POLICY IF EXISTS "Coaches can update their movements" ON workout_movements;

-- workout_feedback: had its only UPDATE policy with WITH CHECK (true).
-- We dropped it and re-created it with a matching WITH CHECK below.
DROP POLICY IF EXISTS "Coaches can update their feedback" ON workout_feedback;

CREATE POLICY "Coaches can update their feedback"
  ON workout_feedback FOR UPDATE
  USING (
    coach_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    coach_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Performance indexes (only created if missing)
CREATE INDEX IF NOT EXISTS idx_workout_results_athlete_date
  ON workout_results (athlete_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_workout_days_plan_published
  ON workout_days (plan_id, is_published, week_number, day_of_week);

CREATE INDEX IF NOT EXISTS idx_workout_days_plan_id
  ON workout_days (plan_id);

CREATE INDEX IF NOT EXISTS idx_workout_blocks_day_id
  ON workout_blocks (workout_day_id);

CREATE INDEX IF NOT EXISTS idx_workout_movements_block_id
  ON workout_movements (block_id);

CREATE INDEX IF NOT EXISTS idx_workout_results_athlete_completed
  ON workout_results (athlete_id, completed) WHERE completed = true;

CREATE INDEX IF NOT EXISTS idx_assigned_plans_athlete
  ON assigned_plans (athlete_id, created_at DESC);
