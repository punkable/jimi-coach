-- Replace overly permissive coach policy with one scoped to the coach's own rows.
-- Previously any coach could see/edit ANY other coach's insights (incl. internal notes).
DROP POLICY IF EXISTS "Coaches can manage their insights" ON coach_insights;

CREATE POLICY "Coach manages own insights, admin manages all"
  ON coach_insights FOR ALL
  USING (
    coach_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    coach_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Indexes for query performance at scale
CREATE INDEX IF NOT EXISTS idx_coach_insights_athlete_active
  ON coach_insights (athlete_id, is_archived) WHERE is_archived = false;

CREATE INDEX IF NOT EXISTS idx_coach_insights_coach_active
  ON coach_insights (coach_id, is_archived, created_at DESC);
