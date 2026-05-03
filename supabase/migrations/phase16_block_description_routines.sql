-- Add description to workout_blocks for free-text routines
alter table workout_blocks add column description text;

comment on column workout_blocks.description is 'Allows coaches to write free-text routines and link exercises via special tags.';
