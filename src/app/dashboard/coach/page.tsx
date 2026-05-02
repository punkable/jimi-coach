import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Activity, Plus, Dumbbell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { DashboardCharts } from './dashboard-charts'

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

  // Process Athlete Growth Data (Group by Month)
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

  // Fetch recent workout results for Compliance Chart (Last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const { data: recentResults } = await supabase
    .from('workout_results')
    .select('id, completed_at, completed')
    .gte('completed_at', sevenDaysAgo.toISOString())
    .eq('completed', true)
    .order('completed_at', { ascending: true })

  // Process Compliance Data (Group by Day)
  const complianceMap = new Map<string, number>()
  // Initialize last 7 days with 0
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
    <div className="p-4 md:p-8 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bienvenido, Coach {profile?.full_name?.split(' ')[0] || ''}</h1>
          <p className="text-muted-foreground mt-1">Resumen de tu academia</p>
        </div>
        <Link href="/dashboard/coach/plans/new">
          <Button className="hidden md:flex gap-2">
            <Plus className="w-4 h-4" />
            Nueva Planificación
          </Button>
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-border/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alumnos Activos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{athletes?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Atletas en tu app</p>
          </CardContent>
        </Card>
        <Card className="glass border-border/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planes Creados</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{plansCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Rutinas en el sistema</p>
          </CardContent>
        </Card>
        <Card className="glass border-border/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ejercicios</CardTitle>
            <Dumbbell className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exercisesCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Movimientos en librería</p>
          </CardContent>
        </Card>
      </div>

      <DashboardCharts athleteGrowth={athleteGrowth} complianceData={complianceData} />

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Resultados Recientes</h2>
          <Button variant="link" className="text-primary">Ver todos</Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Aún no hay resultados recientes. Cuando tus alumnos completen entrenamientos, aparecerán aquí.
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
