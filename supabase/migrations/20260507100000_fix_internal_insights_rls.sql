-- Athletes must never see internal insights regardless of athlete_id.
-- Drop the existing athlete SELECT policy and recreate it with the type guard.
DROP POLICY IF EXISTS "Athletes can view their insights" ON coach_insights;

CREATE POLICY "Athletes can view their insights"
  ON coach_insights FOR SELECT
  USING (
    type <> 'internal'
    AND (athlete_id = auth.uid() OR athlete_id IS NULL)
  );
