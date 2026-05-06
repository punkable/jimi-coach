import { createClient } from '@/lib/supabase/server'
import { Medal, Trophy, Calendar, TrendingUp, Activity, Flame, Dumbbell } from 'lucide-react'
import { ProgressChart } from './progress-chart'

export const revalidate = 0

export default async function AthleteProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: records } = await supabase
    .from('personal_records')
    .select('id, achieved_at, max_weight, exercises(id, name)')
    .eq('athlete_id', user?.id)
    .order('achieved_at', { ascending: false })

  const { data: results } = await supabase
    .from('workout_results')
    .select(`
      id,
      completed_at,
      rpe,
      notes,
      workout_days (
        title,
        workout_plans ( title )
      )
    `)
    .eq('athlete_id', user?.id)
    .eq('completed', true)
    .order('completed_at', { ascending: false })
    .limit(20)

  const totalWorkouts = results?.length ?? 0
  const avgRpe = results && results.length > 0
    ? Math.round(results.reduce((acc, r) => acc + (r.rpe || 0), 0) / results.length)
    : null

  // Streak calculation
  let streak = 0
  if (results && results.length > 0) {
    const dates = Array.from(new Set(results.map(r => r.completed_at.split('T')[0]))).sort().reverse()
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    if (dates[0] === today || dates[0] === yesterday) {
      streak = 1
      let cursor = new Date(dates[0])
      for (let i = 1; i < dates.length; i++) {
        cursor.setDate(cursor.getDate() - 1)
        if (dates[i] === cursor.toISOString().split('T')[0]) streak++
        else break
      }
    }
  }

  return (
    <div
      className="pb-24 px-4 md:px-6 lg:px-8 max-w-6xl mx-auto"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}
    >
      <div className="pt-6 space-y-6">

        {/* Header */}
        <div>
          <p className="section-title text-primary mb-1">Tu evolución</p>
          <h1 className="page-title">Progreso</h1>
        </div>

        {/* Quick stats grid (Duolingo-style) */}
        <div className="grid grid-cols-3 gap-3">
          <div className="ios-panel p-4 text-center">
            <Dumbbell className="w-4 h-4 text-primary mx-auto mb-1.5" />
            <p className="text-2xl font-black tabular-nums">{totalWorkouts}</p>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider mt-1">WODs</p>
          </div>
          <div className="ios-panel p-4 text-center">
            <Flame className={`w-4 h-4 mx-auto mb-1.5 ${streak > 0 ? 'text-orange-400' : 'text-muted-foreground'}`} />
            <p className={`text-2xl font-black tabular-nums ${streak > 0 ? 'text-orange-400' : ''}`}>{streak}</p>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider mt-1">Racha</p>
          </div>
          <div className="ios-panel p-4 text-center">
            <TrendingUp className="w-4 h-4 text-[var(--gymnastics)] mx-auto mb-1.5" />
            <p className="text-2xl font-black tabular-nums">{avgRpe ?? '—'}</p>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider mt-1">RPE Prom</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* Left: Chart + history */}
          <div className="lg:col-span-2 space-y-6">

            {/* Chart */}
            <div className="ios-panel p-5">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-black uppercase tracking-tight">Tendencia RPE</h2>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest bg-primary/15 text-primary px-2.5 py-1 rounded-full">
                  Últimos {Math.min(totalWorkouts, 10)}
                </span>
              </div>
              {results && results.length > 1 ? (
                <ProgressChart data={results.slice(0, 10)} />
              ) : (
                <div className="h-[180px] flex flex-col items-center justify-center text-center text-muted-foreground">
                  <Activity className="w-8 h-8 opacity-25 mb-2" />
                  <p className="text-xs">Necesitas al menos 2 entrenos para ver tendencias.</p>
                </div>
              )}
            </div>

            {/* History (cards on mobile, list on desktop) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Calendar className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-black uppercase tracking-tight">Historial</h2>
              </div>

              {results && results.length > 0 ? (
                <div className="space-y-2">
                  {results.map((res: any) => {
                    const date = new Date(res.completed_at)
                    const day = date.toLocaleDateString('es-ES', { day: '2-digit' })
                    const month = date.toLocaleDateString('es-ES', { month: 'short' })
                    const planTitle = res.workout_days?.workout_plans?.title || res.workout_days?.title || 'WOD'
                    const rpeColor =
                      res.rpe >= 9 ? 'bg-red-500/15 text-red-400 border-red-500/25' :
                      res.rpe >= 7 ? 'bg-amber-500/15 text-amber-400 border-amber-500/25' :
                      'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
                    return (
                      <div key={res.id} className="ios-panel p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-secondary border border-border flex flex-col items-center justify-center shrink-0">
                          <span className="text-base font-black leading-none">{day}</span>
                          <span className="text-[8px] font-black uppercase text-muted-foreground tracking-wider mt-0.5">{month}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black uppercase tracking-tight truncate">{planTitle}</p>
                          {res.notes && (
                            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{res.notes}</p>
                          )}
                        </div>
                        <span className={`shrink-0 inline-flex items-center justify-center min-w-[44px] h-8 rounded-lg text-xs font-black border ${rpeColor}`}>
                          {res.rpe ? `${res.rpe}/10` : '—'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="ios-panel p-10 text-center border-2 border-dashed">
                  <Activity className="w-8 h-8 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Empieza a entrenar para ver tu historial.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: PRs */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-black uppercase tracking-tight">Récords (PRs)</h2>
            </div>

            {records && records.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                {records.map((pr: any) => (
                  <div key={pr.id} className="ios-panel p-4 flex items-center gap-3 group hover:border-amber-400/30 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <Trophy className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider truncate">
                        {pr.exercises?.name}
                      </p>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-xl font-black text-primary tabular-nums">{pr.max_weight}</span>
                        <span className="text-[10px] font-black text-muted-foreground">kg</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-muted-foreground/70 shrink-0">
                      {new Date(pr.achieved_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ios-panel p-8 text-center border-2 border-dashed">
                <Medal className="w-7 h-7 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-xs text-muted-foreground">Aún no hay PRs registrados.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
