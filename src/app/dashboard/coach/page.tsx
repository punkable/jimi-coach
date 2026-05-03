import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Activity, Plus, Dumbbell, TrendingUp, Calendar, ChevronRight, Video } from 'lucide-react'
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

  // Fetch recent workout results (Last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const { data: recentResults } = await supabase
    .from('workout_results')
    .select('id, completed_at, completed')
    .gte('completed_at', sevenDaysAgo.toISOString())
    .eq('completed', true)
    .order('completed_at', { ascending: true })

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
    <div className="p-6 md:p-10 space-y-10 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Resumen de Rendimiento</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight uppercase">Coach {profile?.full_name?.split(' ')[0] || ''}</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Gestiona tu academia y monitorea el progreso de tus atletas.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/coach/plans/new" className="flex-1 md:flex-none">
            <Button className="w-full md:w-auto h-12 px-6 rounded-2xl font-bold uppercase tracking-widest text-[11px] gap-2 shadow-[0_8px_20px_rgba(var(--primary),0.25)]">
              <Plus className="w-4 h-4" />
              Nueva Planificación
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Alumnos Activos" 
          value={athletes?.length || 0} 
          icon={Users} 
          trend="+12% este mes" 
          color="primary"
        />
        <StatCard 
          title="Planes de WOD" 
          value={plansCount || 0} 
          icon={Activity} 
          trend="8 activos hoy" 
          color="blue"
        />
        <StatCard 
          title="Biblioteca" 
          value={exercisesCount || 0} 
          icon={Dumbbell} 
          trend="15 videos técnicos" 
          color="purple"
        />
        <StatCard 
          title="Revisiones" 
          value="4" 
          icon={Calendar} 
          trend="Pendientes hoy" 
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="glass rounded-3xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black uppercase tracking-tight">Actividad de Atletas</h2>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sesiones Completadas</span>
              </div>
            </div>
            <DashboardCharts athleteGrowth={athleteGrowth} complianceData={complianceData} />
          </section>
        </div>

        <div className="space-y-8">
          <section className="glass rounded-3xl p-6 md:p-8 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black uppercase tracking-tight">Acciones Rápidas</h2>
            </div>
            <div className="space-y-4 flex-1">
              <PostFeedForm />
              <div className="space-y-3">
                <QuickActionLink href="/dashboard/coach/athletes" label="Gestionar Alumnos" icon={Users} />
                <QuickActionLink href="/dashboard/coach/plans" label="Ver Calendario" icon={Calendar} />
                <QuickActionLink href="/dashboard/coach/library" label="Añadir Ejercicio" icon={Plus} />
                <QuickActionLink href="/dashboard/coach/reviews" label="Revisar Videos" icon={Video} />
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-border/30">
              <div className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Tip del Coach</p>
                <p className="text-xs text-muted-foreground leading-relaxed">Recuerda revisar los videos de técnica pendientes para mantener el engagement de tus atletas.</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black uppercase tracking-tight">Últimos Resultados</h2>
          <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest gap-2">
            Ver Todos <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
        <Card className="glass rounded-3xl border-dashed border-2 border-border/40">
          <CardContent className="p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Esperando resultados</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">Cuando tus alumnos completen sus entrenamientos de hoy, verás sus marcas y RPE aquí mismo.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, trend, color }: { title: string, value: string | number, icon: any, trend: string, color: string }) {
  const colors: any = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    orange: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  }

  return (
    <div className="glass rounded-3xl p-6 border-border/30 group hover:border-primary/40 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${colors[color]} transition-transform group-hover:scale-110`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{trend}</span>
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">{title}</p>
      <p className="text-3xl font-black text-foreground">{value}</p>
    </div>
  )
}

function QuickActionLink({ href, label, icon: Icon }: { href: string, label: string, icon: any }) {
  return (
    <Link href={href} className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 hover:bg-secondary/50 border border-transparent hover:border-border/50 transition-all group">
      <div className="flex items-center gap-3">
        <Icon className="w-4.5 h-4.5 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="text-sm font-bold text-foreground/80 group-hover:text-foreground transition-colors">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
    </Link>
  )
}
