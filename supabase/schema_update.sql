-- Add blocks and movements to complete the Plan Builder structure

create table workout_blocks (
  id uuid default uuid_generate_v4() primary key,
  workout_day_id uuid references workout_days(id) on delete cascade,
  name text not null, -- e.g. "A. Fuerza", "B. Metcon", "C. Accesorios"
  type text check (type in ('warmup', 'strength', 'gymnastics', 'metcon', 'cooldown')),
  order_index int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table workout_blocks enable row level security;
create policy "Blocks are viewable by everyone" on workout_blocks for select using (true);
create policy "Coaches can insert blocks" on workout_blocks for insert with check (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coach')));
create policy "Coaches can update blocks" on workout_blocks for update using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coach')));
create policy "Coaches can delete blocks" on workout_blocks for delete using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coach')));

create table workout_movements (
  id uuid default uuid_generate_v4() primary key,
  block_id uuid references workout_blocks(id) on delete cascade,
  exercise_id uuid references exercises(id) on delete restrict,
  sets int,
  reps text, -- e.g. "5", "5-5-5", "AMRAP"
  weight_percentage text, -- e.g. "80% 1RM"
  rest text, -- e.g. "90s"
  notes text,
  order_index int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table workout_movements enable row level security;
create policy "Movements are viewable by everyone" on workout_movements for select using (true);
create policy "Coaches can insert movements" on workout_movements for insert with check (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coach')));
create policy "Coaches can update movements" on workout_movements for update using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coach')));
create policy "Coaches can delete movements" on workout_movements for delete using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coach')));

-- Notify Supabase real-time if needed
-- alter publication supabase_realtime add table workout_blocks;
-- alter publication supabase_realtime add table workout_movements;
