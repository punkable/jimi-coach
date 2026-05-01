-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Extended user data)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  role text check (role in ('admin', 'coach', 'athlete')) default 'athlete',
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for profiles
alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- EXERCISES (Library)
create table exercises (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  category text, -- weightlifting, gymnastics, monostructural, etc.
  primary_muscles text[],
  equipment text[],
  instructions text,
  common_errors text,
  video_url text,
  image_url text,
  difficulty_level text, -- beginner, intermediate, advanced
  tags text[],
  created_by uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table exercises enable row level security;
create policy "Exercises are viewable by everyone" on exercises for select using (true);
create policy "Coaches can insert exercises" on exercises for insert with check (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coach')));
create policy "Coaches can update their exercises" on exercises for update using (auth.uid() = created_by);

-- WORKOUT PLANS
create table workout_plans (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  objective text,
  level text,
  created_by uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table workout_plans enable row level security;
create policy "Workout plans are viewable by assigned athletes or creator" on workout_plans for select using (true);
create policy "Coaches can insert workout plans" on workout_plans for insert with check (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coach')));
create policy "Coaches can update their plans" on workout_plans for update using (auth.uid() = created_by);

-- WORKOUT DAYS
create table workout_days (
  id uuid default uuid_generate_v4() primary key,
  plan_id uuid references workout_plans(id) on delete cascade,
  day_of_week int, -- 1=Monday, 7=Sunday
  title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table workout_days enable row level security;
create policy "Days are viewable by everyone" on workout_days for select using (true);
create policy "Coaches can insert days" on workout_days for insert with check (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coach')));

-- ASSIGNED PLANS
create table assigned_plans (
  id uuid default uuid_generate_v4() primary key,
  plan_id uuid references workout_plans(id) on delete cascade,
  athlete_id uuid references profiles(id) on delete cascade,
  start_date date not null,
  assigned_by uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table assigned_plans enable row level security;
create policy "Athletes can view their own assigned plans" on assigned_plans for select using (auth.uid() = athlete_id or auth.uid() = assigned_by);
create policy "Coaches can assign plans" on assigned_plans for insert with check (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coach')));

-- RESULTS
create table workout_results (
  id uuid default uuid_generate_v4() primary key,
  athlete_id uuid references profiles(id) on delete cascade,
  workout_day_id uuid references workout_days(id) on delete cascade,
  completed boolean default false,
  score text,
  rpe int check (rpe >= 1 and rpe <= 10),
  notes text,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table workout_results enable row level security;
create policy "Athletes can view own results" on workout_results for select using (auth.uid() = athlete_id);
create policy "Athletes can insert own results" on workout_results for insert with check (auth.uid() = athlete_id);
create policy "Athletes can update own results" on workout_results for update using (auth.uid() = athlete_id);
create policy "Coaches can view athlete results" on workout_results for select using (exists (select 1 from assigned_plans where athlete_id = workout_results.athlete_id and assigned_by = auth.uid()));

-- Automatically create profile on user signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
