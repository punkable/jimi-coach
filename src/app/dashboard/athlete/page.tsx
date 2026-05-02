import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Flame, Dumbbell, Calendar as CalendarIcon, PlayCircle, AlertCircle, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { StreakMascot } from '@/components/streak-mascot'

export default async function AthleteDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  // Fetch the latest assigned plan
  const { data: assignments } = await supabase
    .from('assigned_plans')
    .select('*, workout_plans(*)')
    .eq('athlete_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const activeAssignment = assignments?.[0]
  const plan = activeAssignment?.workout_plans

  // Plan verification logic
  const hasActivePlan = profile?.subscription_plan && profile.subscription_plan !== "Sin Plan Activo"
  const hasClassesLeft = profile?.total_classes === 0 || (profile?.classes_used < profile?.total_classes)
  const canTrain = hasActivePlan && hasClassesLeft

  // Fetch workout results for streak calculation
  const { data: results } = await supabase
    .from('workout_results')
    .select('completed_at')
    .eq('athlete_id', user?.id)
    .eq('completed', true)
    .order('completed_at', { ascending: false })

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
        } else {
          break
        }
      }
    }
  }

  if (!canTrain) {
    return (
      <div className="p-4 md:p-8 space-y-8 max-w-md md:max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[80vh] text-center">
        <Image src="/images/logo.png" alt="Jimi.coach Logo" width={140} height={40} className="object-contain mb-8 opacity-50" />
        
        <div className="relative w-48 h-48 mb-6 bg-primary/5 rounded-full flex items-center justify-center border-4 border-primary/20">
          <AlertCircle className="w-24 h-24 text-primary opacity-80" />
        </div>
        
        <h1 className="text-3xl font-black tracking-tight uppercase">Entrenamiento Pausado</h1>
        
        <p className="text-muted-foreground mt-2 max-w-sm">
          {!hasActivePlan 
            ? "El coach aún no te ha asignado un plan de entrenamiento activo o tu mensualidad no ha sido configurada."
            : "Te has quedado sin clases disponibles en tu plan actual. Es momento de renovar."}
        </p>

        <p className="text-sm font-bold mt-4 text-primary/80">
          Si crees que esto es un error, por favor comunícate con Jimi.
        </p>

        <a href="http://wa.me/56972878295" target="_blank" rel="noopener noreferrer" className="mt-8">
          <Button className="font-bold uppercase tracking-widest h-14 px-8 bg-[#25D366] hover:bg-[#20b858] text-white">
            <MessageSquare className="w-5 h-5 mr-2" />
            Contactar al Coach
          </Button>
        </a>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-md md:max-w-4xl mx-auto">
      <header className="flex flex-col gap-4 pt-4 mb-8">
        <Image src="/images/logo.png" alt="Jimi.coach Logo" width={120} height={35} className="object-contain" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hola, {profile?.full_name?.split(' ')[0] || 'Atleta'}!</h1>
          <p className="text-muted-foreground mt-1">¿Listo para destrozar el WOD hoy?</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
          Tu Plan Actual
        </h2>
        
        {plan ? (
          <Card className="glass border-primary/20 overflow-hidden relative">
            {/* Background decorative element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -z-10" />
            
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold">{plan.title}</CardTitle>
                <Dumbbell className="h-6 w-6 text-primary" />
              </div>
              <CardDescription className="text-base">{plan.description}</CardDescription>
              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary w-fit">
                Nivel: {plan.level}
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/athlete/workout">
                <Button className="w-full h-14 text-lg gap-3 mt-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.4)] transition-all hover:scale-[1.02]">
                  <PlayCircle className="w-6 h-6" />
                  INICIAR ENTRENAMIENTO
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass border-dashed border-2 border-border/50 bg-transparent">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Dumbbell className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="font-bold text-lg mb-2">No tienes planes activos</h3>
              <p className="text-muted-foreground text-sm max-w-[250px]">
                Tu entrenador aún no te ha asignado una planificación. ¡Escríbele para empezar!
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Soporte del Coach</h2>
        <Card className="glass border-border/50">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">¿Dudas con el WOD?</h3>
              <p className="text-sm text-muted-foreground mt-1">Escríbele directamente al Coach Jimiangel.</p>
            </div>
            <a href="http://wa.me/56972878295" target="_blank" rel="noopener noreferrer">
              <Button className="bg-[#25D366] hover:bg-[#128C7E] text-white shadow-[0_0_15px_rgba(37,211,102,0.4)] transition-all hover:scale-105 rounded-full px-6">
                WhatsApp
              </Button>
            </a>
          </CardContent>
        </Card>
      </section>
        </div>
        <div className="md:col-span-1">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            Tu Racha
          </h2>
          <StreakMascot streak={currentStreak} />
        </div>
      </div>
    </div>
  )
}
