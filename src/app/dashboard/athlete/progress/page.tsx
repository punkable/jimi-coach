import { createClient } from '@/lib/supabase/server'
import { Medal, Trophy, Calendar, TrendingUp, Activity, Flame, Dumbbell } from 'lucide-react'
import { ProgressChart } from './progress-chart'
import { AddPrForm } from './add-pr-form'

export const revalidate = 0

export default async function AthleteProgressPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: records } = await supabase
    .from('personal_records')
    .select('id, achieved_at, max_weight, reps, notes, exercises(id, name)')
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

  // Library for PR picker (weight-trackable exercises)
  const { data: exerciseLibrary } = await supabase
    .from('exercises')
    .select('id, name, tracking_type')
    .eq('is_archived', false)
    .order('name', { ascending: true })

  const totalWorkouts = results?.length ?? 0

  // RPE-only data (filter null) for honest avg
  const rpeResults = (results ?? []).filter(r => r.rpe != null)
  const avgRpe = rpeResults.length > 0
    ? Math.round(rpeResults.reduce((acc, r) => acc + (r.rpe || 0), 0) / rpeResults.length)
    : null

  // Streak (local-date)
  const localDateStr = (d: string | Date) => {
    const date = typeof d === 'string' ? new Date(d) : d
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }
  let streak = 0
  if (results && results.length > 0) {
    const dates = Array.from(new Set(results.map(r => localDateStr(r.completed_at)))).sort().reverse()
    const today = localDateStr(new Date())
    const yesterday = localDateStr(new Date(Date.now() - 86400000))
    if (dates[0] === today || dates[0] === yesterday) {
      streak = 1
      const cursor = new Date(dates[0])
      for (let i = 1; i < dates.length; i++) {
        cursor.setDate(cursor.getDate() - 1)
        if (dates[i] === localDateStr(cursor)) streak++
        else break
      }
    }
  }

  return (
    <div className="pb-24 px-4 md:px-6 lg:px-8 max-w-6xl mx-auto" style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}>
      <div className="pt-6 space-y-6">

        {/* Header */}
        <div>
          <p className="section-title text-primary mb-1">Tu evolución</p>
          <h1 className="page-title">Progreso</h1>
        </div>

        {/* Quick stats */}
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
          <div className="lg:col-span-2 space-y-6 min-w-0">

            {/* Chart */}
            <div className="ios-panel p-5">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-black uppercase tracking-tight">Tendencia RPE</h2>
                </div>
                {rpeResults.length > 0 && (
                  <span className="text-[9px] font-black uppercase tracking-widest bg-primary/15 text-primary px-2.5 py-1 rounded-full">
                    Últimos {Math.min(rpeResults.length, 10)}
                  </span>
                )}
              </div>
              {rpeResults.length === 0 ? (
                <div className="h-[180px] flex flex-col items-center justify-center text-center text-muted-foreground gap-2">
                  <Activity className="w-8 h-8 opacity-25" />
                  <p className="text-xs max-w-xs">
                    {totalWorkouts === 0
                      ? 'Aún no tienes entrenamientos completados.'
                      : 'Tus entrenamientos no tienen RPE registrado todavía.'}
                  </p>
                </div>
              ) : (
                <ProgressChart data={rpeResults.slice(0, 10)} />
              )}
              <p className="text-[9px] text-muted-foreground/60 mt-3 italic text-center">
                RPE = Rate of Perceived Exertion. Tu esfuerzo subjetivo del 1 al 10.
              </p>
            </div>

            {/* History */}
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
                    const rpeColor = res.rpe == null
                      ? 'bg-secondary text-muted-foreground border-border'
                      : res.rpe >= 9 ? 'bg-red-500/15 text-red-400 border-red-500/25'
                      : res.rpe >= 7 ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
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
                  <p className="text-sm text-muted-foreground">Aún no tienes entrenamientos completados. Empieza tu primera sesión para ver historial aquí.</p>
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

            <AddPrForm exercises={(exerciseLibrary ?? []) as any} />

            {records && records.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                {records.map((pr: any) => (
                  <div key={pr.id} className="ios-panel p-4 flex items-center gap-3 group hover:border-amber-400/30 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <Trophy className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider truncate">
                        {pr.exercises?.name || 'Ejercicio'}
                      </p>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-xl font-black text-primary tabular-nums">{pr.max_weight}</span>
                        <span className="text-[10px] font-black text-muted-foreground">kg</span>
                        {pr.reps && (
                          <span className="text-[10px] font-black text-muted-foreground ml-1">× {pr.reps}</span>
                        )}
                      </div>
                      {pr.notes && (
                        <p className="text-[9px] text-muted-foreground/70 mt-1 line-clamp-1">{pr.notes}</p>
                      )}
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
                <p className="text-xs text-muted-foreground">Aún no tienes PRs registrados. Marca tu primer récord arriba.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
