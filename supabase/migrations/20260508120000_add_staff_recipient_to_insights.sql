-- Add staff_recipient_id to coach_insights so internal notes can target
-- coaches/staff (not just athletes). Non-destructive: existing rows get NULL.
ALTER TABLE public.coach_insights
  ADD COLUMN IF NOT EXISTS staff_recipient_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Allow coaches/staff to read internal notes directed specifically at them.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'coach_insights'
      AND policyname = 'Staff can view internal notes directed at them'
  ) THEN
    CREATE POLICY "Staff can view internal notes directed at them"
      ON public.coach_insights
      FOR SELECT
      USING (
        type = 'internal'
        AND staff_recipient_id = auth.uid()
        AND EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role IN ('coach', 'admin')
        )
      );
  END IF;
END;
$$;
