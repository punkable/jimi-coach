import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { WorkoutClient } from './workout-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, PlayCircle } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 0

export default async function WorkoutPage(props: { searchParams: Promise<{ dayId?: string }> }) {
  const searchParams = await props.searchParams
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

  const rawPlan = activeAssignment?.workout_plans
  const plan = Array.isArray(rawPlan) ? rawPlan[0] : rawPlan

  // Fetch all days for this plan
  const { data: days } = await supabase
    .from('workout_days')
    .select('*, workout_blocks(*, workout_movements(*, exercises(*)))')
    .eq('plan_id', activeAssignment.plan_id)
    .eq('is_published', true)
    .order('day_of_week', { ascending: true })
    .order('order_index', { foreignTable: 'workout_blocks', ascending: true })
    .order('order_index', { foreignTable: 'workout_blocks.workout_movements', ascending: true })

  if (!days || days.length === 0) return notFound()

  const selectedDayId = searchParams.dayId
  const todayData = selectedDayId 
    ? days.find(d => d.id === selectedDayId)
    : null

  // If no day selected, show the selection UI
  if (!todayData) {
    return (
      <div className="flex-1 flex flex-col bg-background p-6 md:max-w-lg md:mx-auto md:w-full md:border-x md:border-border/40 min-h-screen">
        <header className="mb-8 pt-4">
          <Link href="/dashboard/athlete">
            <Button variant="ghost" size="icon" className="rounded-full mb-4">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-black uppercase tracking-tight">Elegir Día</h1>
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest mt-1">
            {plan?.title}
          </p>
        </header>

        <div className="space-y-3">
          {days.map((day) => {
            const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
            const defaultName = dayNames[(day.day_of_week - 1) % 7]
            
            return (
              <Link key={day.id} href={`/dashboard/athlete/workout?dayId=${day.id}`}>
                <Card className="glass hover:border-primary/50 transition-all active:scale-[0.97] group border-border/30 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center p-4 gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-secondary/50 flex flex-col items-center justify-center border border-border/30 group-hover:border-primary/30 transition-colors">
                        <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground leading-none">Día</span>
                        <span className="text-xl font-black leading-none mt-0.5">{day.day_of_week}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-base uppercase tracking-tight group-hover:text-primary transition-colors truncate">
                          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][(day.day_of_week - 1) % 7]}
                          {day.title && <span className="text-muted-foreground/60"> — {day.title}</span>}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">
                            {day.workout_blocks?.length || 0} Bloques de entrenamiento
                          </span>
                        </div>
                      </div>
                      
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground/30 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                        <PlayCircle className="w-6 h-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    )
  }

  // Fetch PRs for today's exercises
  const exerciseIds: string[] = []
  todayData.workout_blocks?.forEach((block: any) => {
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
