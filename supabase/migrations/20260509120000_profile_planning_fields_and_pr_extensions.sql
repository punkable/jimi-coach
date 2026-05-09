-- Profile fields useful for coach planning + coach self-presentation
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS goal text,
  ADD COLUMN IF NOT EXISTS experience_level text,
  ADD COLUMN IF NOT EXISTS injuries text,
  ADD COLUMN IF NOT EXISTS availability text,
  ADD COLUMN IF NOT EXISTS athlete_notes text,
  ADD COLUMN IF NOT EXISTS specialty text,
  ADD COLUMN IF NOT EXISTS certifications text;

-- Extend personal_records with reps + notes + link to workout_result
ALTER TABLE public.personal_records
  ADD COLUMN IF NOT EXISTS reps integer,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS workout_result_id uuid REFERENCES public.workout_results(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Athletes can manage their own PRs; coaches can read PRs of managed athletes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'personal_records' AND policyname = 'Athletes insert own PRs') THEN
    CREATE POLICY "Athletes insert own PRs" ON public.personal_records FOR INSERT WITH CHECK (auth.uid() = athlete_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'personal_records' AND policyname = 'Athletes update own PRs') THEN
    CREATE POLICY "Athletes update own PRs" ON public.personal_records FOR UPDATE
      USING (auth.uid() = athlete_id) WITH CHECK (auth.uid() = athlete_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'personal_records' AND policyname = 'Athletes delete own PRs') THEN
    CREATE POLICY "Athletes delete own PRs" ON public.personal_records FOR DELETE USING (auth.uid() = athlete_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'personal_records' AND policyname = 'Coaches see managed athletes PRs') THEN
    CREATE POLICY "Coaches see managed athletes PRs" ON public.personal_records FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = personal_records.athlete_id AND p.managed_by = auth.uid()
      )
    );
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_personal_records_athlete_exercise
  ON public.personal_records (athlete_id, exercise_id, achieved_at DESC);
