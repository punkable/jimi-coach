-- 1. PERSONAL RECORDS (PRs) AUTOMATIZADOS
-- Esta tabla guardará los récords personales (1RM, mejor tiempo, etc) de cada atleta
create table personal_records (
  id uuid default uuid_generate_v4() primary key,
  athlete_id uuid references profiles(id) on delete cascade,
  exercise_id uuid references exercises(id) on delete cascade,
  max_weight numeric, -- RM en Kg o Lb
  best_time interval, -- Para WODs por tiempo (Fran, etc)
  max_reps int, -- Para max repeticiones (Pullups)
  achieved_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(athlete_id, exercise_id) -- Solo un récord actual por ejercicio
);

alter table personal_records enable row level security;
create policy "Athletes see own PRs" on personal_records for select using (auth.uid() = athlete_id);
create policy "Coaches see athlete PRs" on personal_records for select using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coach')));

-- Función (Trigger) para actualizar PRs automáticamente cuando se loguea un resultado
create or replace function public.check_and_update_pr()
returns trigger as $$
declare
  current_pr numeric;
begin
  -- Solo evaluar si hay un peso registrado en el resultado
  if new.score is not null then
    -- Buscamos si ya existe un PR para este atleta y este movimiento (asumiendo que new.score es numerico / peso)
    -- NOTA: Esto asume que el score es un numero. Puedes adaptarlo si el score es texto.
    -- (Para este MVP, dejaremos la estructura lista).
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- 2. LEADERBOARD (RANKING DEL BOX)
-- Una 'View' (Vista) que calcula automáticamente quién levanta más peso en cada ejercicio.
-- De esta forma el frontend no tiene que hacer cálculos, solo pide datos a 'box_leaderboard'.
create or replace view box_leaderboard as
select 
  p.full_name as athlete_name,
  e.name as exercise_name,
  pr.max_weight as record,
  pr.achieved_at as date
from personal_records pr
join profiles p on p.id = pr.athlete_id
join exercises e on e.id = pr.exercise_id
order by e.name asc, pr.max_weight desc;

-- 3. DAILY READINESS (LIFESTYLE)
-- Preparación del atleta antes de entrenar (CoachRx style)
create table daily_readiness (
  id uuid default uuid_generate_v4() primary key,
  athlete_id uuid references profiles(id) on delete cascade,
  date date not null default current_date,
  sleep_quality int check (sleep_quality between 1 and 5),
  stress_level int check (stress_level between 1 and 5),
  soreness int check (soreness between 1 and 5),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(athlete_id, date) -- Solo un registro por día
);

alter table daily_readiness enable row level security;
create policy "Athletes manage own readiness" on daily_readiness for all using (auth.uid() = athlete_id);
create policy "Coaches view readiness" on daily_readiness for select using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coach')));
