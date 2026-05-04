import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Users, Activity, Plus, Dumbbell, TrendingUp, Calendar, ChevronRight, Video, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { DashboardCharts } from './dashboard-charts'
import { PostFeedForm } from './post-feed-form'

export default async function CoachDashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  // Fetch athletes
  const { data: athletes } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'athlete')

  // Fetch plans count
  const { count: plansCount } = await supabase
    .from('workout_plans')
    .select('*', { count: 'exact', head: true })

  // Fetch exercises count
  const { count: exercisesCount } = await supabase
    .from('exercises')
    .select('*', { count: 'exact', head: true })

  // Fetch all active athletes with created_at for growth chart
  const { data: allAthletes } = await supabase
    .from('profiles')
    .select('id, created_at')
    .eq('role', 'athlete')
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  // Process Athlete Growth Data
  const athleteGrowthMap = new Map<string, number>()
  if (allAthletes) {
    allAthletes.forEach((a) => {
      const date = new Date(a.created_at)
      const monthStr = date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
      athleteGrowthMap.set(monthStr, (athleteGrowthMap.get(monthStr) || 0) + 1)
    })
  }
  
  let cumulativeAthletes = 0
  const athleteGrowth = Array.from(athleteGrowthMap.entries()).map(([month, count]) => {
    cumulativeAthletes += count
    return { month, athletes: cumulativeAthletes }
  })

  // Fetch recent workout results (Last 7 days) with athlete and workout info
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const { data: recentResults } = await supabase
    .from('workout_results')
    .select(`
      id, 
      completed_at, 
      rpe,
      profiles:athlete_id(full_name, avatar_url, emoji),
      workout_days(title, workout_plans(title))
    `)
    .gte('completed_at', sevenDaysAgo.toISOString())
    .eq('completed', true)
    .order('completed_at', { ascending: false })
    .limit(10)

  // Process Compliance Data
  const complianceMap = new Map<string, number>()
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    complianceMap.set(d.toLocaleDateString('es-ES', { weekday: 'short' }), 0)
  }

  if (recentResults) {
    recentResults.forEach((r) => {
      const date = new Date(r.completed_at)
      const dayStr = date.toLocaleDateString('es-ES', { weekday: 'short' })
      if (complianceMap.has(dayStr)) {
        complianceMap.set(dayStr, complianceMap.get(dayStr)! + 1)
      }
    })
  }

  const complianceData = Array.from(complianceMap.entries()).map(([day, completed]) => ({
    day,
    completed
  }))

  return (
    <div className="p-4 md:p-8 xl:p-10 space-y-8 max-w-7xl mx-auto relative">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
        <div className="flex items-center gap-8">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
            <Image src="/images/ready.png" alt="Rex Ready" width={110} height={110} className="rex-art hidden md:block relative z-10" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-primary mb-3">
              <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <span className="text-[11px] font-black uppercase tracking-[0.3em]">Centro de coaching</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase leading-none">Coach {profile?.full_name?.split(' ')[0] || ''}</h1>
            <p className="text-muted-foreground text-sm font-semibold mt-3">Planifica, revisa y acompaña a tus atletas desde un solo lugar.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <Link href="/dashboard/coach/plans/new" className="flex-1 md:flex-none">
            <Button className="w-full md:w-auto h-14 px-10 rounded-[20px] font-black uppercase tracking-widest text-xs gap-3 bg-primary text-black hover:bg-primary/90 shadow-[0_10px_30px_rgba(204,255,0,0.2)] border-none active:scale-95 transition-all">
              <Plus className="w-5 h-5 stroke-[3]" />
              Nuevo Plan
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        <StatCard 
          title="Atletas Activos" 
          value={athletes?.length || 0} 
          icon={Users} 
          trend="+12% mensual" 
          color="strength"
        />
        <StatCard 
          title="Semanas Planificadas" 
          value={plansCount || 0} 
          icon={Activity} 
          trend="En progreso" 
          color="metcon"
        />
        <StatCard 
          title="Ejercicios Rex" 
          value={exercisesCount || 0} 
          icon={Dumbbell} 
          trend="Nuevos videos" 
          color="gymnastics"
        />
        <StatCard 
          title="Revisiones Video" 
          value="4" 
          icon={Video} 
          trend="Pendientes" 
          color="warmup"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        <div className="lg:col-span-2 space-y-8">
          <section className="ios-panel p-6 md:p-8">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-black uppercase tracking-tight">Actividad de Atletas</h2>
              <div className="flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Sesiones Live</span>
              </div>
            </div>
            <DashboardCharts athleteGrowth={athleteGrowth} complianceData={complianceData} />
          </section>
        </div>

        <div className="space-y-8">
          <section className="ios-panel p-6 md:p-8 flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tight">Registro de Actividad</h2>
            </div>
            <div className="space-y-5 flex-1">
              <PostFeedForm />
              <div className="space-y-3">
                <QuickActionLink href="/dashboard/coach/athletes" label="Alumnos" icon={Users} color="athlete" />
                <QuickActionLink href="/dashboard/coach/plans" label="Planificaciones" icon={Calendar} color="coach" />
                <QuickActionLink href="/dashboard/coach/library" label="Biblioteca técnica" icon={Dumbbell} color="gymnastics" />
                <QuickActionLink href="/dashboard/coach/insights" label="Metas y feedback" icon={Target} color="metcon" />
                <QuickActionLink href="/dashboard/coach/reviews" label="Revisión de videos" icon={Video} color="review" />
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-white/5">
              <div className="bg-primary/5 rounded-[24px] p-6 border border-primary/10 group hover:border-primary/30 transition-all">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Coach Insight</p>
                <p className="text-xs text-white/40 leading-relaxed font-medium">Prioriza el feedback en video hoy. Los atletas que reciben corrección técnica tienen un 40% más de retención.</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <section className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h2 className="text-3xl font-black uppercase tracking-tighter">Últimas Marcas</h2>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Sincronización en tiempo real</p>
          </div>
          <Link href="/dashboard/coach/athletes">
            <Button variant="ghost" className="text-[11px] font-black uppercase tracking-widest gap-2 hover:bg-white/5 px-6 h-12 rounded-2xl">
              Ver Todo <ChevronRight className="w-4 h-4 text-primary" />
            </Button>
          </Link>
        </div>
        
        {recentResults && recentResults.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recentResults.map((result: any) => (
              <div key={result.id} className="bg-white/[0.02] rounded-[32px] p-6 border border-white/5 flex items-center gap-6 hover:border-primary/30 hover:bg-white/[0.04] transition-all group shadow-xl">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden group-hover:border-primary/40 transition-all">
                    {result.profiles?.avatar_url ? (
                      <img src={result.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-black text-white/20">
                        {result.profiles?.full_name?.[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 text-xl filter drop-shadow-lg">{result.profiles?.emoji || '💪'}</div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-black text-lg uppercase tracking-tight truncate text-white">{result.profiles?.full_name}</p>
                  <p className="text-[10px] text-white/40 font-black truncate uppercase tracking-[0.15em] mt-0.5">
                    {result.workout_days?.workout_plans?.title || 'WOD'} <span className="text-primary/40">/</span> {result.workout_days?.title}
                  </p>
                  <div className="flex items-center gap-3 mt-4">
                    <span className="text-[10px] font-black px-4 py-1.5 bg-primary/10 text-primary rounded-full uppercase tracking-widest border border-primary/20 shadow-[0_0_15px_rgba(204,255,0,0.1)]">
                      RPE {result.rpe || 'N/A'}
                    </span>
                    <div className="h-1 w-1 rounded-full bg-white/10" />
                    <span className="text-[9px] text-white/40 font-black uppercase tracking-widest">
                      {new Date(result.completed_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </div>
                
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:bg-primary group-hover:text-black">
                  <ChevronRight className="w-5 h-5 stroke-[3]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/[0.02] border-2 border-dashed border-white/5 rounded-[40px] p-20 text-center backdrop-blur-xl">
            <div className="w-20 h-20 rounded-[28px] bg-white/5 flex items-center justify-center mx-auto mb-6">
              <Activity className="w-10 h-10 text-white/10" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-white/60">No hay marcas recientes</h3>
            <p className="text-sm text-white/30 mt-3 max-w-sm mx-auto font-medium">Tus alumnos aún están en el calentamiento. Los resultados aparecerán aquí automáticamente.</p>
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, trend, color }: { title: string, value: string | number, icon: any, trend: string, color: string }) {
  const colorMap: any = {
    primary: 'text-primary bg-primary/10 border-primary/20',
    strength: 'text-[var(--strength)] bg-[var(--strength)]/10 border-[var(--strength)]/20',
    metcon: 'text-[var(--metcon)] bg-[var(--metcon)]/10 border-[var(--metcon)]/20',
    gymnastics: 'text-[var(--gymnastics)] bg-[var(--gymnastics)]/10 border-[var(--gymnastics)]/20',
    warmup: 'text-[var(--warmup)] bg-[var(--warmup)]/10 border-[var(--warmup)]/20',
  }

  return (
    <div className="ios-panel p-6 group hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className={`p-3.5 rounded-[18px] border ${colorMap[color]} transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(var(--primary),0.2)]`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary drop-shadow-[0_0_8px_rgba(204,255,0,0.3)]">{trend}</span>
          <div className="h-0.5 w-8 bg-primary/20 rounded-full mt-1" />
        </div>
      </div>
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">{title}</p>
      <p className="text-4xl font-black tracking-tight text-foreground">{value}</p>
    </div>
  )
}

function QuickActionLink({ href, label, icon: Icon, color = 'coach' }: { href: string, label: string, icon: any, color?: string }) {
  const colorMap: Record<string, string> = {
    coach: 'text-[var(--coach)] bg-[var(--coach)]/10 border-[var(--coach)]/20',
    athlete: 'text-[var(--athlete)] bg-[var(--athlete)]/10 border-[var(--athlete)]/20',
    gymnastics: 'text-[var(--gymnastics)] bg-[var(--gymnastics)]/10 border-[var(--gymnastics)]/20',
    metcon: 'text-[var(--metcon)] bg-[var(--metcon)]/10 border-[var(--metcon)]/20',
    review: 'text-[var(--review)] bg-[var(--review)]/10 border-[var(--review)]/20',
  }
  return (
    <Link href={href} className="flex items-center justify-between p-4 rounded-2xl bg-secondary/45 hover:bg-secondary border border-border/40 transition-all group">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${colorMap[color] || colorMap.coach}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        <span className="text-sm font-bold text-foreground/80 group-hover:text-foreground transition-colors">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
    </Link>
  )
}
