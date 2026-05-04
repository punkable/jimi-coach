-- PHASE 20: User ownership and coach/athlete isolation
-- One shared exercise library, isolated coaching relationships, admin overview.

alter table public.profiles
  add column if not exists managed_by uuid references public.profiles(id) on delete set null;

create schema if not exists private;

create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

create table if not exists public.coach_athletes (
  coach_id uuid not null references public.profiles(id) on delete cascade,
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (coach_id, athlete_id),
  constraint coach_athletes_distinct_users check (coach_id <> athlete_id)
);

create index if not exists coach_athletes_coach_id_idx on public.coach_athletes(coach_id);
create index if not exists coach_athletes_athlete_id_idx on public.coach_athletes(athlete_id);
create index if not exists profiles_managed_by_idx on public.profiles(managed_by);
create index if not exists workout_plans_created_by_idx on public.workout_plans(created_by);

create or replace function private.is_assigned_coach(target_athlete_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.coach_athletes
    where coach_id = auth.uid() and athlete_id = target_athlete_id
  );
$$;

grant execute on function private.is_assigned_coach(uuid) to authenticated;

alter table public.coach_athletes enable row level security;

drop policy if exists "Coach athlete links are visible to involved users" on public.coach_athletes;
create policy "Coach athlete links are visible to involved users"
  on public.coach_athletes for select
  using (
    auth.uid() = coach_id
    or auth.uid() = athlete_id
    or private.is_admin()
  );

drop policy if exists "Admins manage coach athlete links" on public.coach_athletes;
create policy "Admins manage coach athlete links"
  on public.coach_athletes for all
  using (
    private.is_admin()
  )
  with check (
    private.is_admin()
  );

-- Backfill current relationships from plan assignments so no existing data is lost.
insert into public.coach_athletes (coach_id, athlete_id, assigned_by)
select distinct assigned_by, athlete_id, assigned_by
from public.assigned_plans
where assigned_by is not null
  and assigned_by <> athlete_id
on conflict (coach_id, athlete_id) do nothing;

update public.profiles p
set managed_by = ca.coach_id
from public.coach_athletes ca
where p.id = ca.athlete_id
  and p.managed_by is null;

-- Tighten broad profile visibility while keeping admins global and coaches scoped.
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Profiles are visible by owner admin or assigned coach" on public.profiles;
create policy "Profiles are visible by owner admin or assigned coach"
  on public.profiles for select
  using (
    auth.uid() = id
    or private.is_admin()
    or managed_by = auth.uid()
    or private.is_assigned_coach(profiles.id)
  );

-- Workout plans are visible to owners, admins, and athletes assigned to them.
drop policy if exists "Workout plans are viewable by assigned athletes or creator" on public.workout_plans;
drop policy if exists "Workout plans are visible by owner admin or assigned athlete" on public.workout_plans;
create policy "Workout plans are visible by owner admin or assigned athlete"
  on public.workout_plans for select
  using (
    created_by = auth.uid()
    or private.is_admin()
    or exists (
      select 1 from public.assigned_plans ap
      where ap.plan_id = workout_plans.id and ap.athlete_id = auth.uid()
    )
  );

-- Days stay reachable through visible plans.
drop policy if exists "Days are viewable by everyone" on public.workout_days;
drop policy if exists "Workout days are visible through visible plans" on public.workout_days;
create policy "Workout days are visible through visible plans"
  on public.workout_days for select
  using (
    exists (
      select 1 from public.workout_plans wp
      where wp.id = workout_days.plan_id
        and (
          wp.created_by = auth.uid()
          or private.is_admin()
          or exists (
            select 1 from public.assigned_plans ap
            where ap.plan_id = wp.id and ap.athlete_id = auth.uid()
          )
        )
    )
  );

comment on table public.coach_athletes is 'Explicit relationship between coaches and athletes. Admins manage assignments; coaches only see their assigned athletes.';
comment on column public.profiles.managed_by is 'Primary coach owner for athlete accounts. Admin-managed accounts can leave this null.';
