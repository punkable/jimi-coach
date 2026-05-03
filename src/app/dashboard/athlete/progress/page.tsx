import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Medal, Trophy, Calendar, TrendingUp, Activity } from 'lucide-react'
import { ProgressChart } from './progress-chart'

export default async function AthleteProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: records } = await supabase
    .from('personal_records')
    .select('id, achieved_at, max_weight, exercises(id, name)')
    .eq('athlete_id', user?.id)
    .order('achieved_at', { ascending: false })

  const { data: results, error: resultsError } = await supabase
    .from('workout_results')
    .select(`
      id, 
      completed_at, 
      rpe, 
      workout_days (
        title,
        workout_plans (
          title
        )
      )
    `)
    .eq('athlete_id', user?.id)
    .eq('completed', true)
    .order('completed_at', { ascending: false })
    .limit(10)

  if (resultsError) {
    console.error('Error fetching workout results:', resultsError)
  }

  return (
    <div className="min-h-[100dvh] pb-10 px-4 md:px-8 lg:px-10 max-w-7xl mx-auto" style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}>
      <header className="flex items-center gap-4 mb-10">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Medal className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Tu Evolución</h1>
          <p className="text-muted-foreground text-sm font-medium">Análisis de rendimiento y récords</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Stats & Charts */}
        <div className="lg:col-span-7 space-y-8">
          <section className="glass rounded-[32px] p-8 border-primary/10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-black uppercase tracking-tight">Tendencia de Intensidad (RPE)</h2>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-primary/20 text-primary px-3 py-1 rounded-full">Últimos 10 Entrenos</span>
            </div>
            {results && results.length > 1 ? (
              <ProgressChart data={results} />
            ) : (
              <div className="h-[200px] flex flex-col items-center justify-center text-center text-muted-foreground">
                <Activity className="w-10 h-10 opacity-20 mb-3" />
                <p className="text-sm">Necesitas al menos 2 entrenos para ver tendencias.</p>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Calendar className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-black uppercase tracking-tight">Resumen de Entrenos</h2>
            </div>

            {results && results.length > 0 ? (
              <div className="glass rounded-[32px] border-border/40 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border/30 bg-white/5">
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fecha</th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Entrenamiento</th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Intensidad</th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/10">
                      {results.map((res: any) => (
                        <tr key={res.id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-6 py-5 text-xs font-bold whitespace-nowrap">
                            {new Date(res.completed_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                          </td>
                          <td className="px-6 py-5">
                            <p className="text-sm font-bold truncate max-w-[200px]">
                              {res.workout_days?.workout_plans?.title || res.workout_days?.title || 'WOD'}
                            </p>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-xs font-black ${
                              res.rpe >= 9 ? 'bg-red-500/20 text-red-400' : 
                              res.rpe >= 7 ? 'bg-amber-500/20 text-amber-400' : 
                              'bg-green-500/20 text-green-400'
                            }`}>
                              {res.rpe || '—'}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                             <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Activity className="w-3.5 h-3.5" />
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <Card className="glass border-dashed border-border/40 p-12 text-center rounded-[32px]">
                <p className="text-sm text-muted-foreground font-medium italic">Empieza a entrenar para ver tu historial.</p>
              </Card>
            )}
          </section>
        </div>

        {/* Right: PRs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="flex items-center gap-2 px-1">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h2 className="text-lg font-black uppercase tracking-tight">Récords (PRs)</h2>
          </div>
          
          {records && records.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {records.map((pr: any) => (
                <Card key={pr.id} className="glass border-primary/10 overflow-hidden group hover:border-primary/30 transition-all shadow-lg rounded-2xl">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{pr.exercises?.name}</p>
                        <div className="text-3xl font-black text-primary">
                          {pr.max_weight} <span className="text-sm font-normal opacity-60">kg</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-1 ml-auto">
                          <Trophy className="w-5 h-5 text-amber-500" />
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(pr.achieved_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="glass border-dashed border-border/40 p-12 text-center rounded-[32px]">
              <p className="text-sm text-muted-foreground font-medium italic">Registra tus pesos máximos para ver tus PRs aquí.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
