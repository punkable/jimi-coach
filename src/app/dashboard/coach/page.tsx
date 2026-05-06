import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { Users, Plus, Dumbbell, Calendar, ChevronRight, Video, Target, Flame, BarChart2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { DashboardCharts } from './dashboard-charts'
import { PostFeedForm } from './post-feed-form'

export default async function CoachDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // Layout already gates access — use admin client for stats so RLS never breaks the dashboard
  const admin = getSupabaseAdmin()

  const { data: profile } = await admin
    .from('profiles').select('*').eq('id', user?.id).single()

  const { data: athletes } = await admin
    .from('profiles').select('id').eq('role', 'athlete').is('deleted_at', null)

  const { count: plansCount } = await admin
    .from('workout_plans').select('*', { count: 'exact', head: true }).eq('is_archived', false)

  const { count: exercisesCount } = await admin
    .from('exercises').select('*', { count: 'exact', head: true })

  const { data: allAthletes } = await admin
    .from('profiles').select('id, created_at').eq('role', 'athlete').is('deleted_at', null).order('created_at', { ascending: true })

  const athleteGrowthMap = new Map<string, number>()
  allAthletes?.forEach((a) => {
    const monthStr = new Date(a.created_at).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
    athleteGrowthMap.set(monthStr, (athleteGrowthMap.get(monthStr) || 0) + 1)
  })
  let cum = 0
  const athleteGrowth = Array.from(athleteGrowthMap.entries()).map(([month, count]) => {
    cum += count
    return { month, athletes: cum }
  })

  const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const { data: recentResults } = await supabase
    .from('workout_results')
    .select('id, completed_at, rpe, profiles:athlete_id(full_name, avatar_url, emoji), workout_days(title, workout_plans(title))')
    .gte('completed_at', sevenDaysAgo.toISOString())
    .eq('completed', true)
    .order('completed_at', { ascending: false })
    .limit(8)

  const complianceMap = new Map<string, number>()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    complianceMap.set(d.toLocaleDateString('es-ES', { weekday: 'short' }), 0)
  }
  recentResults?.forEach((r) => {
    const dayStr = new Date(r.completed_at).toLocaleDateString('es-ES', { weekday: 'short' })
    if (complianceMap.has(dayStr)) complianceMap.set(dayStr, complianceMap.get(dayStr)! + 1)
  })
  const complianceData = Array.from(complianceMap.entries()).map(([day, completed]) => ({ day, completed }))

  const firstName = profile?.full_name?.split(' ')[0] || 'Coach'

  return (
    <div className="p-4 md:p-6 xl:p-8 space-y-6 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="section-title text-primary mb-1.5">Centro de coaching</p>
          <h1 className="page-title">Hola, {firstName} 👋</h1>
          <p className="text-sm text-muted-foreground mt-1.5 font-medium">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/dashboard/coach/plans/new">
            <Button className="h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest gap-2">
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Nuevo Plan
            </Button>
          </Link>
          <Link href="/dashboard/coach/athletes/new">
            <Button variant="outline" className="h-10 px-4 rounded-xl text-xs font-black uppercase tracking-widest gap-2">
              <Users className="w-4 h-4" />
              Añadir Alumno
            </Button>
          </Link>
        </div>
      </header>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard value={athletes?.length ?? 0}  label="Atletas activos" icon={Users}     color="athlete"   trend="+2 este mes" />
        <StatCard value={plansCount ?? 0}         label="Planes activos"  icon={Calendar}  color="coach"     trend="En progreso" />
        <StatCard value={exercisesCount ?? 0}     label="Ejercicios"      icon={Dumbbell}  color="gymnastics" trend="Biblioteca" />
        <StatCard value={recentResults?.length ?? 0} label="WODs / 7 días" icon={Flame}   color="strength"  trend="Esta semana" />
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Charts (2/3) */}
        <section className="lg:col-span-2 ios-panel p-5 md:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="section-title mb-1">Actividad semanal</p>
              <h2 className="text-lg font-black uppercase tracking-tight">Rendimiento del box</h2>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-wider">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Live
            </div>
          </div>
          <DashboardCharts athleteGrowth={athleteGrowth} complianceData={complianceData} />
        </section>

        {/* Quick actions (1/3) */}
        <section className="ios-panel p-5 flex flex-col gap-4">
          <div>
            <p className="section-title mb-1">Accesos rápidos</p>
            <h2 className="text-lg font-black uppercase tracking-tight">Gestión</h2>
          </div>
          <div className="space-y-1.5">
            <QuickLink href="/dashboard/coach/athletes"  icon={Users}    label="Alumnos"          sub="Ver y gestionar" color="athlete"    />
            <QuickLink href="/dashboard/coach/plans"     icon={Calendar} label="Planificaciones"  sub="Ciclos y WODs"  color="coach"      />
            <QuickLink href="/dashboard/coach/library"   icon={Dumbbell} label="Biblioteca"       sub="Técnica y video" color="gymnastics" />
            <QuickLink href="/dashboard/coach/insights"  icon={Target}   label="Metas"            sub="Objetivos"      color="metcon"     />
            <QuickLink href="/dashboard/coach/reviews"   icon={Video}    label="Video reviews"    sub="Pendientes"     color="review"     />
          </div>
          <div className="mt-auto pt-2">
            <PostFeedForm />
          </div>
        </section>
      </div>

      {/* ── Recent activity ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="section-title mb-1">Últimas 7 días</p>
            <h2 className="text-xl font-black uppercase tracking-tight">Actividad reciente</h2>
          </div>
          <Link href="/dashboard/coach/athletes">
            <Button variant="ghost" size="sm" className="gap-1 text-xs font-bold text-muted-foreground hover:text-primary">
              Ver todo <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {recentResults && recentResults.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {recentResults.map((result: any) => (
              <div
                key={result.id}
                className="ios-panel p-4 flex items-center gap-3 hover:border-primary/30 transition-all group"
              >
                <div className="w-11 h-11 rounded-2xl bg-secondary flex items-center justify-center shrink-0 text-lg">
                  {result.profiles?.emoji || '💪'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm truncate">{result.profiles?.full_name || '—'}</p>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">{result.workout_days?.title || 'WOD'}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {result.rpe && (
                      <span className="badge-ldrfit">RPE {result.rpe}</span>
                    )}
                    <span className="text-[9px] text-muted-foreground">
                      {new Date(result.completed_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="ios-panel p-12 text-center">
            <BarChart2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-bold text-muted-foreground">Sin actividad en los últimos 7 días</p>
          </div>
        )}
      </section>
    </div>
  )
}

/* ── Sub-components ── */

function StatCard({
  value, label, icon: Icon, color, trend,
}: {
  value: number | string; label: string; icon: any; color: string; trend: string
}) {
  const colorMap: Record<string, string> = {
    athlete:    'text-[var(--athlete)] bg-[var(--athlete)]/10 border-[var(--athlete)]/20',
    coach:      'text-[var(--coach)] bg-[var(--coach)]/10 border-[var(--coach)]/20',
    gymnastics: 'text-[var(--gymnastics)] bg-[var(--gymnastics)]/10 border-[var(--gymnastics)]/20',
    strength:   'text-[var(--strength)] bg-[var(--strength)]/10 border-[var(--strength)]/20',
    metcon:     'text-[var(--metcon)] bg-[var(--metcon)]/10 border-[var(--metcon)]/20',
  }
  return (
    <div className="ios-panel p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${colorMap[color]}`}>
          <Icon className="w-4 h-4 stroke-[2]" />
        </div>
        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider text-right">{trend}</span>
      </div>
      <div>
        <p className="text-3xl font-black tracking-tight">{value}</p>
        <p className="text-[10px] font-semibold text-muted-foreground mt-0.5 uppercase tracking-wide">{label}</p>
      </div>
    </div>
  )
}

function QuickLink({
  href, icon: Icon, label, sub, color,
}: {
  href: string; icon: any; label: string; sub: string; color: string
}) {
  const colorMap: Record<string, string> = {
    athlete:    'text-[var(--athlete)] bg-[var(--athlete)]/10',
    coach:      'text-[var(--coach)] bg-[var(--coach)]/10',
    gymnastics: 'text-[var(--gymnastics)] bg-[var(--gymnastics)]/10',
    metcon:     'text-[var(--metcon)] bg-[var(--metcon)]/10',
    review:     'text-[var(--review)] bg-[var(--review)]/10',
  }
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-all group"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color]}`}>
        <Icon className="w-4 h-4 stroke-[2]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold leading-none">{label}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
    </Link>
  )
}
