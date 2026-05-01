-- PHASE 4: Database Expansion for Athlete Profiles and Subscription Management

-- 1. Expanded Profile Fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weight_kg numeric(5,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS height_cm integer;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS snatch_rm numeric(5,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS shirt_size text;

-- 2. Subscription and Class Management Fields
-- We will store the subscription details directly on the profile for simplicity.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_plan text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_classes integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS classes_used integer DEFAULT 0;

-- Ensure constraints (e.g., classes_used shouldn't be negative)
-- If constraint already exists, this might fail, so we skip it for raw SQL safety,
-- but the logic will be enforced in the application layer.

-- Done.
