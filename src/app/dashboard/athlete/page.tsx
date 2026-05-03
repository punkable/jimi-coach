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
import { AthleteStats } from './athlete-stats'
import { StartWorkoutCard } from './start-workout-card'

const insightIconMap: Record<string, any> = {
  goal: Target,
  benchmark: Zap,
  achievement: Trophy,
  note: StickyNote,
}
const insightColorMap: Record<string, string> = {
  goal: 'from-blue-500/20 to-blue-500/5 border-blue-500/20 text-blue-400',
  benchmark: 'from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-400',
  achievement: 'from-green-500/20 to-green-500/5 border-green-500/20 text-green-400',
  note: 'from-primary/20 to-primary/5 border-primary/20 text-primary',
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
  const plan = activeAssignment?.workout_plans

  // Fetch days for the active plan
  const { data: planDays } = await supabase
    .from('workout_days')
    .select('*')
    .eq('plan_id', plan?.id)
    .order('day_of_week', { ascending: true })

  const hasActivePlan = profile?.subscription_plan && profile.subscription_plan !== "Sin Plan Activo"
  // Default to true if total_classes is not set (null/0) or if classes_used < total_classes
  const hasClassesLeft = !profile?.total_classes || profile.total_classes === 0 || (profile?.classes_used < profile?.total_classes)
  const canTrain = hasActivePlan && hasClassesLeft

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
    .select('id, type, title, content, is_pinned, created_at')
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
  const last5 = results?.slice(0, 5) ?? []
  const avgRpe = last5.length > 0
    ? Math.round(last5.reduce((a, r) => a + (r.rpe || 0), 0) / last5.length)
    : null

  const firstName = profile?.full_name?.split(' ')[0] || 'Atleta'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? '¡Buenos días' : hour < 19 ? '¡Buenas tardes' : '¡Buenas noches'

  const curiosidades = [
    "¿Sabías que Fran (21-15-9 de Thrusters y Pull-Ups) fue uno de los primeros WODs diseñados por Greg Glassman?",
    "El récord mundial de Murph (con chaleco de 20lb) es de 34:38 minutos, por Hunter McIntyre.",
    "Levantar pesas pesadas mejora el reclutamiento de fibras musculares rápidas, haciéndote más explosivo.",
    "La gimnasia en CrossFit mejora drásticamente tu propiocepción (conciencia espacial).",
    "El RPE (Esfuerzo Percibido) es la mejor herramienta para autoregular tu intensidad diaria.",
    "La hidratación adecuada puede mejorar tu rendimiento en el WOD hasta en un 20%."
  ]
  const datoCurioso = curiosidades[Math.floor(Math.random() * curiosidades.length)]

  if (!canTrain) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] p-6 text-center gap-6"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}>
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
    <div className="min-h-[100dvh] pb-8 px-4 md:px-8 lg:px-10 max-w-7xl mx-auto" style={{ paddingTop: 'max(env(safe-area-inset-top), 40px)' }}>
      {/* ── Hero Header ── */}
      <div className="relative pt-10 pb-8 md:pt-14 md:pb-12 overflow-hidden rounded-3xl mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex-1">
            <p className="text-muted-foreground text-sm md:text-base font-medium">{greeting},</p>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mt-1 uppercase">
              {firstName}<span className="text-primary">.</span>
            </h1>
            <div className="mt-4 flex flex-wrap gap-2">
              {trainedToday ? (
                <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-1.5 border border-primary/30">
                  <Zap className="w-3 h-3 fill-primary" /> Entrenado
                </span>
              ) : (
                <span className="bg-secondary/50 text-muted-foreground px-3 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-1.5 border border-border/40">
                  <Calendar className="w-3 h-3" /> WOD Pendiente
                </span>
              )}
              {currentStreak > 0 && (
                <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-1.5 border border-orange-500/30">
                  <Flame className="w-3 h-3 fill-orange-400" /> {currentStreak} Días
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <form action={signout} className="md:hidden">
              <Button variant="ghost" size="icon" type="submit" className="text-destructive hover:bg-destructive/10 rounded-xl">
                <LogOut className="w-5 h-5" />
              </Button>
            </form>
            <div className="hidden md:block">
              <StreakMascot streak={currentStreak} />
            </div>
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
            trivia={datoCurioso}
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
          <section className="glass rounded-3xl p-6 md:p-8">
            <div className="flex items-center gap-2 mb-6">
              <Target className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-black uppercase tracking-tight">Coach Insights</h2>
            </div>
            
            {insights && insights.length > 0 ? (
              <div className="space-y-4">
                {insights.map((insight: any) => {
                  const Icon = insightIconMap[insight.type] || StickyNote
                  const colorClass = insightColorMap[insight.type] || insightColorMap.note
                  return (
                    <div 
                      key={insight.id}
                      className={`p-4 rounded-2xl border bg-gradient-to-br ${colorClass} flex gap-4`}
                    >
                      <div className="shrink-0 pt-1">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-sm leading-tight uppercase tracking-tight truncate">{insight.title}</h4>
                          {insight.target_value && (
                            <span className="text-[10px] font-black shrink-0 bg-background/20 px-2 py-0.5 rounded-lg">
                              {insight.target_value}
                            </span>
                          )}
                        </div>
                        <p className="text-xs opacity-80 mt-1 leading-relaxed">{insight.body}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 px-4 border-2 border-dashed border-border/30 rounded-3xl">
                <Star className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest leading-relaxed">
                  Tu coach te asignará<br />metas pronto
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
