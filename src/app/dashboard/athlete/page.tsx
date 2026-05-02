import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  Flame, Dumbbell, PlayCircle, AlertCircle,
  MessageSquare, TrendingUp, Zap, Calendar, Clock, Trophy
} from 'lucide-react'
import Link from 'next/link'
import { StreakMascot } from '@/components/streak-mascot'
import { AthleteStats } from './athlete-stats'

export default async function AthleteDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  const { data: assignments } = await supabase
    .from('assigned_plans')
    .select('*, workout_plans(*)')
    .eq('athlete_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const activeAssignment = assignments?.[0]
  const plan = activeAssignment?.workout_plans

  const hasActivePlan = profile?.subscription_plan && profile.subscription_plan !== "Sin Plan Activo"
  const hasClassesLeft = profile?.total_classes === 0 || (profile?.classes_used < profile?.total_classes)
  const canTrain = hasActivePlan && hasClassesLeft

  const { data: results } = await supabase
    .from('workout_results')
    .select('created_at, rpe')
    .eq('athlete_id', user?.id)
    .eq('completed', true)
    .order('created_at', { ascending: false })

  // Streak calculation
  let currentStreak = 0
  if (results && results.length > 0) {
    const uniqueDates = Array.from(new Set(results.map(r => r.created_at.split('T')[0])))
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
      let checkDate = new Date(uniqueDates[0])
      currentStreak = 1
      for (let i = 1; i < uniqueDates.length; i++) {
        checkDate.setDate(checkDate.getDate() - 1)
        if (uniqueDates[i] === checkDate.toISOString().split('T')[0]) {
          currentStreak++
        } else break
      }
    }
  }

  // Today check
  const todayStr2 = new Date().toISOString().split('T')[0]
  const trainedToday = results?.some(r => r.created_at.startsWith(todayStr2))

  // Avg RPE of last 5
  const last5 = results?.slice(0, 5) ?? []
  const avgRpe = last5.length > 0
    ? Math.round(last5.reduce((a, r) => a + (r.rpe || 0), 0) / last5.length)
    : null

  const firstName = profile?.full_name?.split(' ')[0] || 'Atleta'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? '¡Buenos días' : hour < 19 ? '¡Buenas tardes' : '¡Buenas noches'

  if (!canTrain) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center gap-6">
        <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-12 h-12 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase">Entrenamiento Pausado</h1>
          <p className="text-muted-foreground mt-2 max-w-xs">
            {!hasActivePlan
              ? "Tu coach aún no ha configurado tu plan activo o mensualidad."
              : "Te has quedado sin clases disponibles. Es momento de renovar."}
          </p>
        </div>
        <a href="http://wa.me/56972878295" target="_blank" rel="noopener noreferrer">
          <Button className="bg-[#25D366] hover:bg-[#20b858] text-white font-bold gap-2 h-12 px-6 rounded-full">
            <MessageSquare className="w-4 h-4" />
            Contactar al Coach
          </Button>
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-4">
      {/* ── Hero Header ── */}
      <div className="relative px-4 pt-10 pb-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium">{greeting},</p>
            <h1 className="text-3xl font-black tracking-tight mt-0.5">
              {firstName}<span className="text-primary">.</span>
            </h1>
            {trainedToday ? (
              <p className="text-xs text-primary/80 font-semibold mt-1.5 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Ya entrenaste hoy — ¡excelente!
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1.5">
                {currentStreak > 0 ? `🔥 ${currentStreak} días seguidos` : 'El WOD de hoy te espera.'}
              </p>
            )}
          </div>

          {/* Streak badge */}
          {currentStreak > 0 && (
            <div className="flex flex-col items-center bg-primary/10 border border-primary/20 rounded-2xl px-3 py-2">
              <Flame className="w-5 h-5 text-primary" />
              <span className="text-xl font-black text-primary leading-none">{currentStreak}</span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider">racha</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* ── Quick Stats Row ── */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="glass rounded-2xl p-3 text-center">
            <Trophy className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-lg font-black leading-none">{results?.length ?? 0}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Entrenos</p>
          </div>
          <div className="glass rounded-2xl p-3 text-center">
            <Flame className="w-4 h-4 text-orange-500 mx-auto mb-1" />
            <p className="text-lg font-black leading-none">{currentStreak}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Días racha</p>
          </div>
          <div className="glass rounded-2xl p-3 text-center">
            <TrendingUp className="w-4 h-4 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-black leading-none">{avgRpe ?? '—'}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">RPE medio</p>
          </div>
        </div>

        {/* ── WOD Card ── */}
        {plan ? (
          <div className="glass rounded-2xl overflow-hidden">
            {/* Colored top bar */}
            <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-transparent" />
            <div className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Plan Activo</span>
                  </div>
                  <h2 className="text-xl font-black tracking-tight">{plan.title}</h2>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{plan.description}</p>
                  )}
                </div>
                <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Dumbbell className="w-6 h-6 text-primary" />
                </div>
              </div>

              {plan.level && (
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-primary/10 text-primary mb-4">
                  {plan.level}
                </span>
              )}

              <Link href="/dashboard/athlete/workout">
                <Button
                  className="w-full h-13 text-base font-black uppercase tracking-widest rounded-xl gap-2.5 shadow-[0_4px_24px_rgba(var(--primary),0.4)] active:scale-95 transition-transform"
                  disabled={trainedToday}
                >
                  <PlayCircle className="w-5 h-5" />
                  {trainedToday ? 'Entrenamiento Completado ✓' : 'Iniciar WOD'}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="glass rounded-2xl p-8 flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Dumbbell className="w-8 h-8 text-muted-foreground opacity-40" />
            </div>
            <div>
              <h3 className="font-bold">Sin plan asignado</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-[220px]">
                Tu coach aún no ha configurado tu planificación.
              </p>
            </div>
            <a href="http://wa.me/56972878295" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2 rounded-full">
                <MessageSquare className="w-3.5 h-3.5" /> Escribir al Coach
              </Button>
            </a>
          </div>
        )}

        {/* ── Streak Mascot ── */}
        {currentStreak > 0 && (
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-sm">Tu Racha</h3>
            </div>
            <StreakMascot streak={currentStreak} />
          </div>
        )}

        {/* ── Stats ── */}
        <AthleteStats totalWorkouts={results?.length || 0} currentStreak={currentStreak} />

        {/* ── Coach Support ── */}
        <div className="glass rounded-2xl p-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm">¿Dudas con el WOD?</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Escríbele directamente al coach.</p>
          </div>
          <a href="http://wa.me/56972878295" target="_blank" rel="noopener noreferrer">
            <Button className="bg-[#25D366] hover:bg-[#20b858] text-white gap-1.5 rounded-full text-xs px-4 h-9 shadow-[0_4px_12px_rgba(37,211,102,0.35)]">
              <MessageSquare className="w-3.5 h-3.5" />
              WhatsApp
            </Button>
          </a>
        </div>
      </div>
    </div>
  )
}
