import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Edit, CalendarDays, Users, Layers3 } from 'lucide-react'
import Link from 'next/link'
import { AssignDialog } from './assign-dialog'
import { archivePlan } from './actions'
import { Archive } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'

export default async function PlansPage() {
  const supabase = await createClient()

  const { data: plans } = await supabase
    .from('workout_plans')
    .select('*')
    .is('is_archived', false)
    .order('created_at', { ascending: false })

  const { data: athletes } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'athlete')

  return (
    <div className="p-4 md:p-8 xl:p-10 space-y-8 max-w-7xl mx-auto">
      <header className="ios-panel p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="section-title text-primary mb-2">Programación CrossFit</div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase">Planificaciones</h1>
          <p className="text-muted-foreground mt-2 text-sm">Crea ciclos, organiza semanas y asigna rutinas a tus alumnos.</p>
        </div>
        <Link href="/dashboard/coach/plans/new">
          <Button className="gap-2 h-12 rounded-2xl px-6 font-black uppercase tracking-widest text-xs">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva Planificación</span>
          </Button>
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MiniGuide icon={CalendarDays} title="1. Diseña semanas" text="Divide el ciclo por días y bloques." color="coach" />
        <MiniGuide icon={Layers3} title="2. Escribe el WOD" text="Usa texto libre y etiquetas con video." color="gymnastics" />
        <MiniGuide icon={Users} title="3. Asigna atletas" text="Publica solo lo que esté listo." color="athlete" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <TooltipProvider>
        {plans && plans.length > 0 ? (
          plans.map((plan) => (
            <Card key={plan.id} className="flex flex-col ios-panel overflow-hidden hover:-translate-y-0.5 transition-all">
              <CardHeader>
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-xl font-black leading-tight uppercase tracking-tight">{plan.title}</CardTitle>
                  <span className="metric-chip bg-primary/10 border-primary/20 text-primary">
                    {plan.level || 'General'}
                  </span>
                </div>
                <CardDescription className="line-clamp-2 mt-2">
                  {plan.description || 'Sin descripción'}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-4 flex gap-3">
                <Link href={`/dashboard/coach/plans/${plan.id}/edit`} className="flex-1">
                  <Button variant="default" className="w-full gap-2 rounded-xl font-bold" size="sm">
                    <Edit className="w-4 h-4" />
                    Editar
                  </Button>
                </Link>
                <AssignDialog planId={plan.id} athletes={athletes || []} />
                <form action={async () => {
                  'use server'
                  await archivePlan(plan.id)
                }}>
                  <Tooltip>
                    <TooltipTrigger type="submit" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 w-9 text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10 shrink-0">
                      <Archive className="w-4 h-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Archivar plan</p>
                    </TooltipContent>
                  </Tooltip>
                </form>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <h3 className="text-lg font-medium text-foreground mb-1">Sin planificaciones activas</h3>
                <p className="text-sm mb-4">Empieza a diseñar entrenamientos para tus atletas.</p>
                <Link href="/dashboard/coach/plans/new">
                  <Button variant="outline">Crear Plan</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}
        </TooltipProvider>
      </div>
    </div>
  )
}

function MiniGuide({ icon: Icon, title, text, color }: { icon: any, title: string, text: string, color: string }) {
  const colorMap: Record<string, string> = {
    coach: 'text-[var(--coach)] bg-[var(--coach)]/10 border-[var(--coach)]/20',
    gymnastics: 'text-[var(--gymnastics)] bg-[var(--gymnastics)]/10 border-[var(--gymnastics)]/20',
    athlete: 'text-[var(--athlete)] bg-[var(--athlete)]/10 border-[var(--athlete)]/20',
  }

  return (
    <div className="ios-panel p-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h3 className="text-sm font-black uppercase tracking-tight">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1">{text}</p>
      </div>
    </div>
  )
}
