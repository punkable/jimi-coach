import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, Edit, CalendarDays, Users, Layers3, Archive, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { AssignDialog } from './assign-dialog'
import { archivePlan } from './actions'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'

const levelLabel: Record<string, { label: string; class: string }> = {
  beginner:     { label: 'Principiante', class: 'level-beginner' },
  intermediate: { label: 'Intermedio',   class: 'level-intermediate' },
  advanced:     { label: 'Avanzado',     class: 'level-advanced' },
}
const objectiveLabel: Record<string, string> = {
  fuerza: 'Fuerza', hipertrofia: 'Hipertrofia', acondicionamiento: 'Acondic.', tecnica: 'Técnica', competencia: 'Competencia',
}

export default async function PlansPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use admin client for all queries — this is a coach-only page
  const admin = getSupabaseAdmin()

  const { data: plans } = await admin
    .from('workout_plans')
    .select('*, workout_days(id)')
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  const { data: athletes } = await admin
    .from('profiles')
    .select('id, full_name, email, emoji')
    .eq('role', 'athlete')
    .is('deleted_at', null)

  return (
    <div className="p-4 md:p-6 xl:p-8 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="section-title text-primary mb-1.5">Programación CrossFit</p>
          <h1 className="page-title">Planificaciones</h1>
          <p className="text-sm text-muted-foreground mt-1.5 font-medium">
            {plans?.length ?? 0} {plans?.length === 1 ? 'plan activo' : 'planes activos'}
          </p>
        </div>
        <Link href="/dashboard/coach/plans/new">
          <Button className="h-10 px-5 rounded-xl text-xs font-black uppercase tracking-widest gap-2 shrink-0">
            <Plus className="w-4 h-4 stroke-[2.5]" /> Nueva planificación
          </Button>
        </Link>
      </header>

      {/* How it works */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: CalendarDays, title: '1. Diseña semanas',   text: 'Divide el ciclo por días y bloques.',        color: 'coach'      },
          { icon: Layers3,      title: '2. Escribe el WOD',   text: 'Usa texto libre y etiquetas con video.',      color: 'gymnastics' },
          { icon: Users,        title: '3. Asigna atletas',   text: 'Publica solo lo que esté listo.',             color: 'athlete'    },
        ].map(({ icon: Icon, title, text, color }) => {
          const c: Record<string, string> = {
            coach:      'text-[var(--coach)] bg-[var(--coach)]/10 border-[var(--coach)]/20',
            gymnastics: 'text-[var(--gymnastics)] bg-[var(--gymnastics)]/10 border-[var(--gymnastics)]/20',
            athlete:    'text-[var(--athlete)] bg-[var(--athlete)]/10 border-[var(--athlete)]/20',
          }
          return (
            <div key={title} className="ios-panel p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${c[color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-tight">{title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{text}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Plans grid */}
      {plans && plans.length > 0 ? (
        <TooltipProvider>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const lvl = levelLabel[plan.level ?? ''] ?? { label: plan.level ?? 'General', class: '' }
              return (
                <div key={plan.id} className="ios-panel flex flex-col overflow-hidden group hover:border-primary/30">
                  {/* Card header stripe */}
                  <div className="h-1 bg-gradient-to-r from-primary/60 to-primary/20 rounded-t-[inherit]" />

                  <div className="p-5 flex flex-col flex-1 gap-4">
                    {/* Title + level */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-black uppercase tracking-tight leading-snug flex-1">{plan.title}</h3>
                      <span className={`metric-chip border shrink-0 ${lvl.class}`}>{lvl.label}</span>
                    </div>

                    {/* Description */}
                    <p className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {plan.description || 'Sin descripción'}
                    </p>

                    {/* Meta chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {plan.objective && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">
                          {objectiveLabel[plan.objective] ?? plan.objective}
                        </span>
                      )}
                      <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">
                        {(plan.workout_days as any[])?.length ?? 0} días
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="mt-auto flex items-center gap-2 pt-2 border-t border-border/50">
                      <Link href={`/dashboard/coach/plans/${plan.id}/edit`} className="flex-1">
                        <Button size="sm" className="w-full gap-2 rounded-xl text-xs font-bold">
                          <Edit className="w-3.5 h-3.5" /> Editar
                        </Button>
                      </Link>
                      <AssignDialog planId={plan.id} athletes={athletes || []} />
                      <form action={async () => { 'use server'; await archivePlan(plan.id) }}>
                        <Tooltip>
                          <TooltipTrigger
                            type="submit"
                            className="w-9 h-9 rounded-xl inline-flex items-center justify-center text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10 transition-all"
                          >
                            <Archive className="w-4 h-4" />
                          </TooltipTrigger>
                          <TooltipContent><p className="text-xs">Archivar</p></TooltipContent>
                        </Tooltip>
                      </form>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </TooltipProvider>
      ) : (
        <div className="ios-panel p-16 text-center">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <CalendarDays className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-black uppercase tracking-tight mb-2">Sin planificaciones activas</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">Crea tu primer ciclo de entrenamiento para tus atletas.</p>
          <Link href="/dashboard/coach/plans/new">
            <Button>Crear primer plan</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
