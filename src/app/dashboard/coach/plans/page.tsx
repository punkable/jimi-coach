import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Edit } from 'lucide-react'
import Link from 'next/link'
import { AssignDialog } from './assign-dialog'

export default async function PlansPage() {
  const supabase = await createClient()

  const { data: plans } = await supabase
    .from('workout_plans')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: athletes } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'athlete')

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planificaciones</h1>
          <p className="text-muted-foreground mt-1">Crea y asigna rutinas a tus alumnos.</p>
        </div>
        <Link href="/dashboard/coach/plans/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva Planificación</span>
          </Button>
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans && plans.length > 0 ? (
          plans.map((plan) => (
            <Card key={plan.id} className="flex flex-col glass border-border/40 hover:border-border/80 transition-all shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl font-bold">{plan.title}</CardTitle>
                  <span className="text-[10px] uppercase bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold shadow-[0_0_10px_rgba(var(--primary),0.2)]">
                    {plan.level || 'General'}
                  </span>
                </div>
                <CardDescription className="line-clamp-2 mt-2">
                  {plan.description || 'Sin descripción'}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-4 flex gap-3">
                <Link href={`/dashboard/coach/plans/${plan.id}/edit`} className="flex-1">
                  <Button variant="default" className="w-full gap-2" size="sm">
                    <Edit className="w-4 h-4" />
                    Editar
                  </Button>
                </Link>
                <AssignDialog planId={plan.id} athletes={athletes || []} />
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
      </div>
    </div>
  )
}
