import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from 'lucide-react'

export default async function AthleteWeekPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: assignments } = await supabase
    .from('assigned_plans')
    .select('*, workout_plans(*)')
    .eq('athlete_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const activeAssignment = assignments?.[0]

  let days = []
  if (activeAssignment) {
    const { data } = await supabase
      .from('workout_days')
      .select('*, workout_blocks(*)')
      .eq('plan_id', activeAssignment.plan_id)
      .order('day_of_week', { ascending: true })
    days = data || []
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-md md:max-w-4xl mx-auto mt-4">
      <header className="flex items-center gap-3">
        <Calendar className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tu Semana</h1>
          <p className="text-muted-foreground text-sm">Resumen de tu planificación actual</p>
        </div>
      </header>

      {days.length > 0 ? (
        <div className="space-y-4">
          {days.map((day) => (
            <Card key={day.id} className="glass border-border/50">
              <CardHeader className="py-4">
                <CardTitle className="text-lg">{day.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground">
                {day.workout_blocks && day.workout_blocks.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {day.workout_blocks.map((b: any) => (
                      <li key={b.id}>{b.name} <span className="text-[10px] uppercase bg-secondary px-1 py-0.5 rounded ml-2">{b.type}</span></li>
                    ))}
                  </ul>
                ) : (
                  <p>Día de descanso activo o sin bloques definidos.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            No tienes planes asignados para esta semana.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
