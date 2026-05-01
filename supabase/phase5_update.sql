-- PHASE 5: Memberships and Soft Delete (Trash)

-- 1. Create Memberships Table
CREATE TABLE IF NOT EXISTS memberships (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  description text,
  benefits text[], -- Array of strings (e.g. 'Acceso a App', 'Corrección de videos')
  default_classes integer DEFAULT 12,
  price numeric(10,2),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  deleted_at timestamp with time zone -- For soft delete
);

-- RLS for memberships
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
-- Everyone can view active memberships (athletes need to see the name of their assigned membership)
CREATE POLICY "Memberships are viewable by everyone" ON memberships FOR SELECT USING (true);
-- Only admins/coaches can manage memberships
CREATE POLICY "Coaches can insert memberships" ON memberships FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coach')));
CREATE POLICY "Coaches can update memberships" ON memberships FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'coach')));

-- 2. Modify Profiles to link to Memberships instead of raw text
-- Since we previously used a text field for `subscription_plan`, we will keep it as text to avoid complex migrations for existing data,
-- BUT we will treat it as a string that matches the membership name, or we can add a foreign key. Let's add a foreign key for best practices.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS membership_id uuid REFERENCES memberships(id) ON DELETE SET NULL;
-- And we add soft delete to profiles (Archiving athletes)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- 3. Add Soft Delete to Exercises
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- 4. Add Soft Delete to Workout Plans
ALTER TABLE workout_plans ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- Done.
