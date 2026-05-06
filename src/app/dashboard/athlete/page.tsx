import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import {
  Flame, Dumbbell, Ban, MessageSquare, Zap, Calendar,
  Trophy, Target, Star, StickyNote, LogOut, CheckCircle2,
  TrendingUp, ClipboardList,
} from 'lucide-react'
import { signout } from '@/app/login/actions'
import Link from 'next/link'
import { AthleteGreeting } from './athlete-greeting'
import { StartWorkoutCard } from './start-workout-card'
import { PendingWorkoutBanner } from './pending-workout-banner'

const insightIconMap: Record<string, any> = { goal: Target, benchmark: Zap, achievement: Trophy, note: StickyNote }
const insightColor: Record<string, { bg: string; text: string; border: string }> = {
  goal:        { bg: 'bg-[var(--metcon)]/10',     text: 'text-[var(--metcon)]',     border: 'border-[var(--metcon)]/20'     },
  benchmark:   { bg: 'bg-[var(--strength)]/10',   text: 'text-[var(--strength)]',   border: 'border-[var(--strength)]/20'   },
  achievement: { bg: 'bg-[var(--warmup)]/10',     text: 'text-[var(--warmup)]',     border: 'border-[var(--warmup)]/20'     },
  note:        { bg: 'bg-[var(--gymnastics)]/10', text: 'text-[var(--gymnastics)]', border: 'border-[var(--gymnastics)]/20' },
}

export default async function AthleteDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, is_archived, total_classes, classes_used, avatar_url, emoji')
    .eq('id', user?.id)
    .single()

  // ── Suspended check ──────────────────────────────────────────
  // Coach controls access via is_archived flag on the profile
  if (profile?.is_archived) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] p-6 text-center gap-6"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="w-20 h-20 rounded-3xl bg-orange-500/10 flex items-center justify-center">
          <Ban className="w-10 h-10 text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase">Acceso suspendido</h1>
          <p className="text-muted-foreground mt-2 max-w-xs text-sm leading-relaxed">
            Tu coach ha pausado temporalmente tu acceso a la plataforma. Contáctalo para más información.
          </p>
        </div>
        <a href="http://wa.me/56972878295" target="_blank" rel="noopener noreferrer">
          <Button className="bg-[#25D366] hover:bg-[#20b858] text-white font-bold gap-2 h-11 px-6 rounded-xl">
            <MessageSquare className="w-4 h-4" /> Contactar al Coach
          </Button>
        </a>
        <form action={signout}>
          <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground text-xs">
            <LogOut className="w-3.5 h-3.5 mr-1" /> Cerrar sesión
          </Button>
        </form>
      </div>
    )
  }

  // ── Fetch plan data ──────────────────────────────────────────
  const { data: assignments } = await supabase
    .from('assigned_plans')
    .select('id, start_date, workout_plans(id, title, description)')
    .eq('athlete_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const activeAssignment = assignments?.[0]
  const rawPlan = activeAssignment?.workout_plans
  const plan = Array.isArray(rawPlan) ? rawPlan[0] : rawPlan
  const planId = plan?.id

  let planDays: any[] = []
  if (planId) {
    const { data } = await supabase
      .from('workout_days')
      .select('*, workout_blocks(*, workout_movements(*, exercises(id, name, video_url, category)))')
      .eq('plan_id', planId)
      .eq('is_published', true)
      .order('week_number', { ascending: true })
      .order('day_of_week', { ascending: true })
    planDays = data || []
  }

  // ── Workout history ──────────────────────────────────────────
  const { data: results } = await supabase
    .from('workout_results')
    .select('completed_at, rpe')
    .eq('athlete_id', user?.id)
    .eq('completed', true)
    .order('completed_at', { ascending: false })
    .limit(100)

  // ── Coach insights ───────────────────────────────────────────
  const { data: insights } = await supabase
    .from('coach_insights')
    .select('id, type, title, body, is_pinned, created_at')
    .or(`athlete_id.eq.${user?.id},athlete_id.is.null`)
    .eq('is_archived', false)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(4)

  // Local-date helper: avoids UTC offset moving "today" to wrong day in late-night training
  const localDateStr = (d: Date | string) => {
    const date = typeof d === 'string' ? new Date(d) : d
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  // ── Streak calculation ───────────────────────────────────────
  let currentStreak = 0
  if (results && results.length > 0) {
    const uniqueDates = Array.from(new Set(results.map(r => localDateStr(r.completed_at))))
    const today = new Date()
    const todayStr = localDateStr(today)
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = localDateStr(yesterday)
    if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
      let checkDate = new Date(uniqueDates[0]); currentStreak = 1
      for (let i = 1; i < uniqueDates.length; i++) {
        checkDate.setDate(checkDate.getDate() - 1)
        if (uniqueDates[i] === localDateStr(checkDate)) currentStreak++
        else break
      }
    }
  }

  const todayStr = localDateStr(new Date())
  const trainedToday = results?.some(r => localDateStr(r.completed_at) === todayStr)
  const calendarDay = new Date().getDay()
  const trainingDayOfWeek = calendarDay === 0 ? 7 : calendarDay
  const todayPlanDay = planDays.find((day: any) => day.day_of_week === trainingDayOfWeek)
  const last5 = results?.slice(0, 5) ?? []
  const avgRpe = last5.length > 0
    ? Math.round(last5.reduce((a, r) => a + (r.rpe || 0), 0) / last5.length)
    : null
  const firstName = profile?.full_name?.split(' ')[0] || 'Atleta'

  // ── No plan assigned ─────────────────────────────────────────
  if (!plan) {
    return (
      <div className="min-h-[100dvh] pb-8 px-4 md:px-6 max-w-lg mx-auto flex flex-col justify-center"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="space-y-6">
          <div className="ios-panel p-8 text-center">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight mb-2">Sin plan asignado</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tu coach aún no te ha asignado una planificación. Será visible aquí en cuanto lo haga.
            </p>
          </div>

          <a href="http://wa.me/56972878295" target="_blank" rel="noopener noreferrer" className="block">
            <div className="ios-panel p-4 flex items-center gap-4 hover:border-[#25D366]/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-[#25D366]/15 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-[#25D366]" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">Hablar con el coach</p>
                <p className="text-[11px] text-muted-foreground">Coordina tu plan por WhatsApp</p>
              </div>
              <span className="text-muted-foreground/40 text-xs">→</span>
            </div>
          </a>

          <Link href="/dashboard/athlete/profile" className="block">
            <div className="ios-panel p-4 flex items-center gap-4 hover:border-primary/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-xl">
                {profile?.emoji || '💪'}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">{profile?.full_name || 'Mi perfil'}</p>
                <p className="text-[11px] text-muted-foreground">Ver y completar mi perfil</p>
              </div>
              <span className="text-muted-foreground/40 text-xs">→</span>
            </div>
          </Link>

          <form action={signout} className="flex justify-center">
            <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground text-xs">
              <LogOut className="w-3.5 h-3.5 mr-1" /> Cerrar sesión
            </Button>
          </form>
        </div>
      </div>
    )
  }

  // ── Full dashboard with plan ──────────────────────────────────
  return (
    <div className="min-h-[100dvh] pb-6 px-4 md:px-6 lg:px-8 max-w-4xl mx-auto"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 20px)' }}>

      {/* Top bar */}
      <div className="flex items-center justify-between pt-4 pb-5">
        <div>
          <p className="section-title text-primary mb-1">{plan.title}</p>
          <AthleteGreeting name={firstName} />
        </div>
        <div className="flex items-center gap-2">
          {currentStreak > 0 && (
            <div className="streak-fire">
              <Flame className="w-3.5 h-3.5 fill-orange-400" />
              {currentStreak}d
            </div>
          )}
          <form action={signout} className="md:hidden">
            <button type="submit" className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-all">
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Status strip */}
      <div className="flex flex-wrap gap-2 mb-5">
        {trainedToday ? (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 text-primary border border-primary/25 text-[10px] font-black uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" /> Entrenado hoy
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-muted-foreground border border-border text-[10px] font-black uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5" />
            {todayPlanDay ? `Hoy: ${todayPlanDay.title || 'Entrenamiento'}` : 'Elige un día para entrenar'}
          </span>
        )}
        {avgRpe != null && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-muted-foreground border border-border text-[10px] font-black uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5" /> RPE prom: {avgRpe}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Main: Workout card + stats */}
        <div className="lg:col-span-2 space-y-4">
          <PendingWorkoutBanner />
          <StartWorkoutCard plan={plan} planDays={planDays} trainedToday={!!trainedToday} startDate={activeAssignment?.start_date} />

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatPill label="Total WODs"    value={results?.length ?? 0}  icon={Dumbbell} />
            <StatPill label="Racha actual"  value={`${currentStreak}d`}   icon={Flame}    highlight={currentStreak > 0} />
            <StatPill label="RPE promedio"  value={avgRpe ?? '—'}         icon={TrendingUp} />
          </div>

          {/* WhatsApp */}
          <div className="ios-panel p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#25D366]/15 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 text-[#25D366]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">¿Dudas con el entrenamiento?</p>
              <p className="text-[11px] text-muted-foreground">Escríbele directamente a tu coach.</p>
            </div>
            <a href="http://wa.me/56972878295" target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="bg-[#25D366] hover:bg-[#20b858] text-white rounded-xl text-xs font-bold shrink-0">Chat</Button>
            </a>
          </div>
        </div>

        {/* Right: Insights + profile link */}
        <div className="space-y-4">
          <div>
            <p className="section-title mb-2.5">Mis objetivos</p>
            {insights && insights.length > 0 ? (
              <div className="space-y-2.5">
                {insights.map((insight: any) => {
                  const Icon = insightIconMap[insight.type] || StickyNote
                  const c = insightColor[insight.type] || insightColor.note
                  return (
                    <div key={insight.id} className={`ios-panel p-4 flex gap-3 border ${c.border} ${c.bg}`}>
                      <div className={`shrink-0 pt-0.5 ${c.text}`}><Icon className="w-4 h-4" /></div>
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`font-black text-[12px] uppercase tracking-tight ${c.text}`}>{insight.title}</p>
                          {insight.target_value && (
                            <span className="text-[9px] font-black shrink-0 bg-white/10 px-2 py-0.5 rounded-full">{insight.target_value}</span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{insight.body}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="ios-panel p-6 text-center">
                <Star className="w-7 h-7 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-[11px] font-black text-muted-foreground/50 uppercase tracking-wider">Tu coach enviará metas aquí</p>
              </div>
            )}
          </div>

          <Link href="/dashboard/athlete/profile">
            <div className="ios-panel p-4 flex items-center gap-3 hover:border-primary/30 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-xl">
                {profile?.emoji || '💪'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{profile?.full_name || 'Mi perfil'}</p>
                <p className="text-[10px] text-muted-foreground">Ver y editar perfil</p>
              </div>
              <span className="text-[10px] font-black text-muted-foreground/40 group-hover:text-primary transition-colors">→</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

function StatPill({ label, value, icon: Icon, highlight }: { label: string; value: number | string; icon: any; highlight?: boolean }) {
  return (
    <div className={`ios-panel p-3 flex flex-col items-center text-center gap-1.5 ${highlight ? 'border-orange-500/25 bg-orange-500/5' : ''}`}>
      <Icon className={`w-4 h-4 ${highlight ? 'text-orange-400' : 'text-muted-foreground'}`} />
      <p className={`text-xl font-black ${highlight ? 'text-orange-400' : ''}`}>{value}</p>
      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider leading-tight">{label}</p>
    </div>
  )
}
