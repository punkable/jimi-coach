-- Add social toggle to workout_plans
alter table workout_plans add column is_community_enabled boolean default true;

-- Update RLS policies if needed (though current logic is handled in the application layer)
comment on column workout_plans.is_community_enabled is 'Toggles whether athletes assigned to this plan can see each other in the activity feed.';
