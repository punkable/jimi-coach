-- ═══════════════════════════════════════════════════════
-- PHASE 14: Social Feed, Coach Insights & Review Management
-- ═══════════════════════════════════════════════════════

-- 1. Coach Insights Table
-- Allows the coach to publish goals, benchmarks, notes, or achievements
-- targeted at a specific athlete (athlete_id) or all athletes (athlete_id = NULL)
CREATE TABLE IF NOT EXISTS coach_insights (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  coach_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  athlete_id uuid REFERENCES profiles(id) ON DELETE CASCADE, -- NULL = visible to all athletes
  type text CHECK (type IN ('goal', 'benchmark', 'note', 'achievement')) NOT NULL DEFAULT 'note',
  title text NOT NULL,
  body text,
  target_value numeric, -- e.g. 100 (kg for a benchmark)
  is_pinned boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE coach_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Athletes can view their own insights or global ones"
  ON coach_insights FOR SELECT
  USING (athlete_id = auth.uid() OR athlete_id IS NULL);
CREATE POLICY "Coaches can manage their insights"
  ON coach_insights FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coach')));

-- 2. Activity Feed Table
-- Auto-populated by triggers; represents public activity of athletes
CREATE TABLE IF NOT EXISTS activity_feed (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  athlete_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text CHECK (type IN ('workout_done', 'pr_set', 'streak', 'feedback_received')) NOT NULL,
  content text, -- Human readable summary e.g. "Completó 5 rondas de Cindy · RPE 8"
  workout_result_id uuid REFERENCES workout_results(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All athletes can view the feed"
  ON activity_feed FOR SELECT USING (true);
CREATE POLICY "System can insert feed entries"
  ON activity_feed FOR INSERT WITH CHECK (true);

-- 3. Fist Bumps Table
CREATE TABLE IF NOT EXISTS fist_bumps (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_athlete_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  feed_entry_id uuid REFERENCES activity_feed(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(from_athlete_id, feed_entry_id)
);

ALTER TABLE fist_bumps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Athletes can view all bumps" ON fist_bumps FOR SELECT USING (true);
CREATE POLICY "Athletes can give bumps" ON fist_bumps FOR INSERT
  WITH CHECK (auth.uid() = from_athlete_id);
CREATE POLICY "Athletes can remove their own bumps" ON fist_bumps FOR DELETE
  USING (auth.uid() = from_athlete_id);

-- 4. Enhance workout_feedback with review management columns
ALTER TABLE workout_feedback ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending'
  CHECK (status IN ('pending', 'done', 'archived'));
ALTER TABLE workout_feedback ADD COLUMN IF NOT EXISTS private_notes text;
ALTER TABLE workout_feedback ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone;

-- 5. Trigger: Auto-create activity_feed entry when a workout is completed
CREATE OR REPLACE FUNCTION public.handle_workout_feed()
RETURNS TRIGGER AS $$
DECLARE
  v_rpe int;
  v_athlete_name text;
  v_day_title text;
  v_content text;
BEGIN
  IF (NEW.completed = true AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.completed = false))) THEN
    -- Get athlete name
    SELECT full_name INTO v_athlete_name FROM profiles WHERE id = NEW.athlete_id;
    -- Get day title
    SELECT title INTO v_day_title FROM workout_days WHERE id = NEW.workout_day_id;
    -- Build content string
    v_content := COALESCE(v_day_title, 'WOD');
    IF NEW.rpe IS NOT NULL THEN
      v_content := v_content || ' · RPE ' || NEW.rpe;
    END IF;
    IF NEW.notes IS NOT NULL AND NEW.notes != '' THEN
      v_content := v_content || ' · "' || LEFT(NEW.notes, 60) || '"';
    END IF;

    INSERT INTO activity_feed (athlete_id, type, content, workout_result_id)
    VALUES (NEW.athlete_id, 'workout_done', v_content, NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_workout_feed ON public.workout_results;
CREATE TRIGGER tr_workout_feed
  AFTER INSERT OR UPDATE ON public.workout_results
  FOR EACH ROW EXECUTE FUNCTION public.handle_workout_feed();
