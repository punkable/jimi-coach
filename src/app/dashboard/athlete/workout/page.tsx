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

  // Fetch PRs for today's exercises
  const exerciseIds: string[] = []
  todayData?.workout_blocks?.forEach((block: any) => {
    block.workout_movements?.forEach((mov: any) => {
      if (mov.exercises?.id) exerciseIds.push(mov.exercises.id)
    })
  })

  let prs: Record<string, { weight: number, reps: number }> = {}
  if (exerciseIds.length > 0) {
    const { data: pastSets } = await supabase
      .from('workout_set_results')
      .select('weight, reps, is_completed, workout_movements(exercise_id)')
      .eq('is_completed', true)
      .order('weight', { ascending: false })

    if (pastSets) {
      pastSets.forEach((s: any) => {
        const exId = s.workout_movements?.exercise_id
        if (exId && exerciseIds.includes(exId) && s.weight && (!prs[exId] || s.weight > prs[exId].weight)) {
          prs[exId] = { weight: s.weight, reps: s.reps || 1 }
        }
      })
    }
  }

  const todayDate = new Date().toISOString().split('T')[0]
  const { data: readiness } = await supabase
    .from('daily_readiness')
    .select('id')
    .eq('athlete_id', user.id)
    .eq('date', todayDate)
    .single()

  // Fetch full library for "Add Exercise" modal
  const { data: allExercises } = await supabase
    .from('exercises')
    .select('id, name, category, instructions, video_url, tracking_type')
    .eq('is_archived', false)
    .order('name', { ascending: true })

  return (
    <div className="h-[100dvh] flex flex-col bg-background relative overflow-hidden">
      <WorkoutClient day={todayData} hasReadiness={!!readiness} prs={prs} allExercises={allExercises ?? []} />
    </div>
  )
}
