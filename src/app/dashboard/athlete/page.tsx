import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Flame, Dumbbell, PlayCircle, AlertCircle,
  MessageSquare, TrendingUp, Zap, Calendar, Trophy,
  Target, Star, StickyNote, LogOut
} from 'lucide-react'
import { signout } from '@/app/login/actions'
import Link from 'next/link'
import { StreakMascot } from '@/components/streak-mascot'
import { AthleteGreeting } from './athlete-greeting'
import { AthleteStats } from './athlete-stats'
import { StartWorkoutCard } from './start-workout-card'

const insightIconMap: Record<string, any> = {
  goal: Target,
  benchmark: Zap,
  achievement: Trophy,
  note: StickyNote,
}
const insightColorMap: Record<string, string> = {
  goal: 'from-[var(--metcon)]/20 to-[var(--metcon)]/5 border-[var(--metcon)]/20 text-[var(--metcon)]',
  benchmark: 'from-[var(--strength)]/20 to-[var(--strength)]/5 border-[var(--strength)]/20 text-[var(--strength)]',
  achievement: 'from-[var(--warmup)]/20 to-[var(--warmup)]/5 border-[var(--warmup)]/20 text-[var(--warmup)]',
  note: 'from-[var(--gymnastics)]/20 to-[var(--gymnastics)]/5 border-[var(--gymnastics)]/20 text-[var(--gymnastics)]',
}

export default async function AthleteDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, subscription_plan, total_classes, classes_used, avatar_url, emoji')
    .eq('id', user?.id)
    .single()

  const { data: assignments } = await supabase
    .from('assigned_plans')
    .select('id, workout_plans(id, title, description)')
    .eq('athlete_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const activeAssignment = assignments?.[0]
  const rawPlan = activeAssignment?.workout_plans
  const plan = Array.isArray(rawPlan) ? rawPlan[0] : rawPlan
  const planId = plan?.id

  // Fetch days for the active plan
  let planDays = []
  if (planId) {
    const { data } = await supabase
      .from('workout_days')
      .select('*, workout_blocks(*, workout_movements(*, exercises(id, name, video_url, category)))')
      .eq('plan_id', planId)
      .eq('is_published', true)
      .order('day_of_week', { ascending: true })
    planDays = data || []
  }

  const canTrain = !!(profile?.subscription_plan && profile.subscription_plan !== "Sin Plan Activo")

  const { data: results } = await supabase
    .from('workout_results')
    .select('completed_at, rpe')
    .eq('athlete_id', user?.id)
    .eq('completed', true)
    .order('completed_at', { ascending: false })
    .limit(100)

  // Fetch coach insights visible to this athlete
  const { data: insights } = await supabase
    .from('coach_insights')
    .select('id, type, title, body, is_pinned, created_at')
    .or(`athlete_id.eq.${user?.id},athlete_id.is.null`)
    .eq('is_archived', false)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(5)

  // Streak calculation
  let currentStreak = 0
  if (results && results.length > 0) {
    const uniqueDates = Array.from(new Set(results.map(r => r.completed_at.split('T')[0])))
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

  const todayStr2 = new Date().toISOString().split('T')[0]
  const trainedToday = results?.some(r => r.completed_at.startsWith(todayStr2))
  const calendarDay = new Date().getDay()
  const trainingDayOfWeek = calendarDay === 0 ? 7 : calendarDay
  const todayPlanDay = planDays.find((day: any) => day.day_of_week === trainingDayOfWeek)
  const last5 = results?.slice(0, 5) ?? []
  const avgRpe = last5.length > 0
    ? Math.round(last5.reduce((a, r) => a + (r.rpe || 0), 0) / last5.length)
    : null

  const firstName = profile?.full_name?.split(' ')[0] || 'Atleta'

  if (!canTrain) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] p-6 text-center gap-6"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-12 h-12 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight uppercase">Membresía Inactiva</h1>
          <p className="text-muted-foreground mt-2 max-w-xs">
            Tu coach aún no ha configurado tu plan activo o tu mensualidad ha expirado.
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
    <div className="min-h-[100dvh] pb-8 px-4 md:px-8 lg:px-10 max-w-7xl mx-auto relative" style={{ paddingTop: 'max(env(safe-area-inset-top), 32px)' }}>
      {/* ── Hero Header ── */}
      <div className="relative pt-8 pb-8 md:pt-12 md:pb-12 px-6 md:px-10 overflow-hidden rounded-[32px] mb-8 surface">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-[var(--gymnastics)] to-[var(--metcon)]" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-primary mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Plan Actual: {plan?.title || 'Personalizado'}</span>
            </div>
            <AthleteGreeting name={firstName} />
            <div className="mt-6 flex flex-wrap gap-3">
              {trainedToday ? (
                <div className="bg-primary/20 text-primary px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-primary/30 shadow-[0_0_20px_rgba(204,255,0,0.1)]">
                  <Zap className="w-3.5 h-3.5 fill-primary" /> Hoy: Entrenado
                </div>
              ) : (
                <div className="bg-white/5 text-white/60 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-white/10">
                  <Calendar className="w-3.5 h-3.5" />
                  {todayPlanDay ? `Hoy toca: ${todayPlanDay.title || 'Entrenamiento del dia'}` : 'Elige un dia para entrenar'}
                </div>
              )}
              {currentStreak > 0 && (
                <div className="bg-orange-500/20 text-orange-400 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-orange-500/30">
                  <Flame className="w-3.5 h-3.5 fill-orange-400" /> {currentStreak} Días Racha
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative transform hover:scale-110 transition-transform duration-700">
                <Image src="/images/train.png" alt="Rex Training" width={140} height={140} className="rex-art hidden lg:block" />
                <Image src="/images/train.png" alt="Rex Training" width={80} height={80} className="rex-art lg:hidden" />
              </div>
            </div>
            <form action={signout} className="md:hidden">
              <Button variant="ghost" size="icon" type="submit" className="w-12 h-12 text-white/20 hover:text-destructive hover:bg-destructive/10 rounded-2xl border border-white/5 transition-all">
                <LogOut className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: WOD & Stats */}
        <div className="lg:col-span-8 space-y-8">
          <StartWorkoutCard plan={plan} planDays={planDays || []} trainedToday={!!trainedToday} />

          <AthleteStats 
            totalWorkouts={results?.length || 0} 
            currentStreak={currentStreak} 
          />
          
          {/* WhatsApp / Support Section on Desktop */}
          <div className="hidden lg:flex glass rounded-3xl p-8 items-center justify-between gap-6 border-green-500/10 bg-green-500/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">Soporte Directo</h3>
                <p className="text-muted-foreground text-sm">¿Dudas con el entrenamiento? Escríbele a tu coach.</p>
              </div>
            </div>
            <a href="http://wa.me/56972878295" target="_blank" rel="noopener noreferrer">
              <Button className="bg-[#25D366] hover:bg-[#20b858] text-white gap-2 h-12 px-6 rounded-xl font-bold uppercase tracking-widest text-xs">
                WhatsApp
              </Button>
            </a>
          </div>
        </div>

        {/* Right Column: Coach Insights & Streak Mascot on Mobile */}
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-white/[0.03] border border-white/5 rounded-[40px] p-8 backdrop-blur-3xl shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Mis Objetivos</h2>
            </div>
            
            {insights && insights.length > 0 ? (
              <div className="space-y-5">
                {insights.map((insight: any) => {
                  const Icon = insightIconMap[insight.type] || StickyNote
                  const colorClass = insightColorMap[insight.type] || insightColorMap.note
                  return (
                    <div 
                      key={insight.id}
                      className={`p-6 rounded-[28px] border bg-gradient-to-br transition-all hover:scale-[1.02] ${colorClass} flex gap-5`}
                    >
                      <div className="shrink-0 pt-1">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="font-black text-sm leading-tight uppercase tracking-tight">{insight.title}</h4>
                          {insight.target_value && (
                            <span className="text-[10px] font-black shrink-0 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
                              {insight.target_value}
                            </span>
                          )}
                        </div>
                        <p className="text-xs opacity-70 mt-2 leading-relaxed font-medium">{insight.body}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-16 px-6 border-2 border-dashed border-white/5 rounded-[32px]">
                <Star className="w-10 h-10 text-white/5 mx-auto mb-4" />
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.25em] leading-relaxed">
                  Pronto recibirás metas<br />de tu coach
                </p>
              </div>
            )}
          </section>

          {/* Mobile Streak Display */}
          <div className="lg:hidden">
            <StreakMascot streak={currentStreak} />
          </div>

          <section className="glass rounded-3xl p-6 md:p-8 bg-primary/5 border-primary/20">
            <h3 className="text-lg font-black uppercase tracking-tight mb-4">Ayuda Técnica</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-6">
              ¿Tienes dudas con un movimiento? Graba tu técnica y súbela en el WOD para que tu coach la revise.
            </p>
            <Link href="/dashboard/athlete/profile">
              <Button variant="outline" className="w-full h-12 rounded-xl text-xs font-bold uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/10">
                Ver Mi Perfil
              </Button>
            </Link>
          </section>
        </div>
      </div>
    </div>
  )
}
