-- 1. Añadir Semanas a los días de entrenamiento
alter table workout_days add column week_number int default 1;

-- 2. Modificar la tabla de Resultados (que ya existía) para agregar el link de video
-- Si no existía video_link, lo añadimos
alter table workout_results add column video_link text;

-- 3. Crear tabla de Feedback (Revisiones del Coach)
create table workout_feedback (
  id uuid default uuid_generate_v4() primary key,
  workout_result_id uuid references workout_results(id) on delete cascade,
  athlete_id uuid references profiles(id) on delete cascade,
  coach_id uuid references profiles(id) on delete set null,
  coach_notes text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table workout_feedback enable row level security;
create policy "Athletes see own feedback" on workout_feedback for select using (auth.uid() = athlete_id);
create policy "Coaches can insert feedback" on workout_feedback for insert with check (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coach')));
create policy "Coaches view athlete feedback" on workout_feedback for select using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coach')));
