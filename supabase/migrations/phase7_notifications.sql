-- PHASE 7: In-App Notifications System

create table notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade, -- The recipient
  type text not null, -- 'workout_completed', 'pr_broken', 'general'
  title text not null,
  message text not null,
  is_read boolean default false,
  link text, -- Optional URL to click when opening notification
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table notifications enable row level security;
create policy "Users see own notifications" on notifications for select using (auth.uid() = user_id);
create policy "Users can update own notifications" on notifications for update using (auth.uid() = user_id);
create policy "System can insert notifications" on notifications for insert with check (true); -- Allow triggers to insert

-- Trigger function to notify coach when an athlete completes a workout
create or replace function public.notify_coach_on_workout()
returns trigger as $$
declare
  coach_id uuid;
  athlete_name text;
begin
  if new.completed = true then
    -- Get the coach who assigned a plan to this athlete (most recent)
    select assigned_by into coach_id
    from assigned_plans
    where athlete_id = new.athlete_id
    order by created_at desc limit 1;

    -- Get athlete name
    select full_name into athlete_name from profiles where id = new.athlete_id;

    if coach_id is not null then
      insert into notifications (user_id, type, title, message, link)
      values (
        coach_id, 
        'workout_completed', 
        'Entrenamiento Completado', 
        coalesce(athlete_name, 'Un atleta') || ' ha registrado sus resultados hoy.',
        '/dashboard/coach/athletes/' || new.athlete_id
      );
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_workout_completed
  after insert or update on workout_results
  for each row 
  when (new.completed = true and (tg_op = 'INSERT' or old.completed = false))
  execute procedure public.notify_coach_on_workout();
