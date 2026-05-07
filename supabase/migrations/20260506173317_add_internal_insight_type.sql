-- Add 'internal' to allowed insight types (coach-only notes)
ALTER TABLE coach_insights DROP CONSTRAINT IF EXISTS coach_insights_type_check;
ALTER TABLE coach_insights ADD CONSTRAINT coach_insights_type_check
  CHECK (type IN ('goal', 'benchmark', 'note', 'achievement', 'internal'));

-- Update athlete SELECT policy to exclude internal notes
DROP POLICY IF EXISTS "Athletes can view their own insights or global ones" ON coach_insights;
CREATE POLICY "Athletes can view their own insights or global ones"
  ON coach_insights FOR SELECT
  USING (
    type != 'internal'
    AND (athlete_id = auth.uid() OR athlete_id IS NULL)
  );
