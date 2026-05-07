-- Expand workout_blocks.type check constraint to include the 8 wizard types.
-- The new builder wizard generates: warmup, strength, metcon, core, skills,
-- tecnica, mobility, other. Legacy values (gymnastics, cooldown, wod) are
-- kept so existing rows on production stay valid.

ALTER TABLE public.workout_blocks
  DROP CONSTRAINT IF EXISTS workout_blocks_type_check;

ALTER TABLE public.workout_blocks
  ADD CONSTRAINT workout_blocks_type_check
  CHECK (type = ANY (ARRAY[
    'warmup'::text,
    'strength'::text,
    'metcon'::text,
    'core'::text,
    'skills'::text,
    'tecnica'::text,
    'mobility'::text,
    'other'::text,
    'gymnastics'::text,
    'cooldown'::text,
    'wod'::text
  ]));
