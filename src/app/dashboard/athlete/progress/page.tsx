import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Medal, Trophy } from 'lucide-react'

export default async function AthleteProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // For MVP, we will query the personal_records table we just created in the DB
  const { data: records } = await supabase
    .from('personal_records')
    .select('*, exercises(name)')
    .eq('athlete_id', user?.id)
    .order('achieved_at', { ascending: false })

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-md md:max-w-4xl mx-auto mt-4">
      <header className="flex items-center gap-3">
        <Medal className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tu Progreso</h1>
          <p className="text-muted-foreground text-sm">Récords Personales (PRs)</p>
        </div>
      </header>

      {records && records.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {records.map((pr: any) => (
            <Card key={pr.id} className="glass border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader className="py-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{pr.exercises?.name}</CardTitle>
                <Trophy className="w-5 h-5 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-black text-primary">
                  {pr.max_weight} <span className="text-sm font-normal text-muted-foreground">kg</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Logrado el: {new Date(pr.achieved_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            Aún no tienes Récords Personales registrados. ¡Sigue entrenando duro!
          </CardContent>
        </Card>
      )}
    </div>
  )
}
