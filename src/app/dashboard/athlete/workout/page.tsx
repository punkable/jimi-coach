import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { WorkoutClient } from './workout-client'

export default async function WorkoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get active assignment
  const { data: assignments } = await supabase
    .from('assigned_plans')
    .select('*, workout_plans(*)')
    .eq('athlete_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const activeAssignment = assignments?.[0]
  if (!activeAssignment) return notFound()

  // For the MVP, we just fetch the days and blocks for this plan
  // In a real scenario, we'd filter by "Today's" date, but we'll just pull the first day with content
  const { data: days } = await supabase
    .from('workout_days')
    .select('*, workout_blocks(*, workout_movements(*, exercises(*)))')
    .eq('plan_id', activeAssignment.plan_id)
    .order('day_of_week', { ascending: true })

  const todayData = days?.[0] // MVP: just take Day 1

  return (
    <div className="h-screen flex flex-col bg-background relative overflow-hidden">
      <WorkoutClient day={todayData} />
    </div>
  )
}
