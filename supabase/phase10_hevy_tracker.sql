create type tracking_type_enum as enum ('weight_reps', 'reps_only', 'distance_time', 'time_only');

alter table exercises add column tracking_type tracking_type_enum default 'weight_reps';

create table workout_set_results (
  id uuid default uuid_generate_v4() primary key,
  workout_result_id uuid references workout_results(id) on delete cascade,
  movement_id uuid references workout_movements(id) on delete cascade,
  set_number int not null,
  weight numeric,
  reps int,
  distance numeric,
  time_seconds int,
  is_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table workout_set_results enable row level security;
create policy "Athletes can view own sets" on workout_set_results for select using (exists (select 1 from workout_results where id = workout_result_id and athlete_id = auth.uid()));
create policy "Athletes can insert own sets" on workout_set_results for insert with check (exists (select 1 from workout_results where id = workout_result_id and athlete_id = auth.uid()));
create policy "Athletes can update own sets" on workout_set_results for update using (exists (select 1 from workout_results where id = workout_result_id and athlete_id = auth.uid()));
create policy "Coaches can view athlete sets" on workout_set_results for select using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coach')));

-- Notify Supabase real-time if needed
-- alter publication supabase_realtime add table workout_set_results;
