import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Plus, Settings, PauseCircle, UserX, Users } from 'lucide-react'
import Link from 'next/link'
import { deleteAthlete, hardDeleteAthlete, toggleAthleteAccess } from './actions'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'

export default async function AthletesPage() {
  const supabase = await createClient()

  const { data: athletes } = await supabase
    .from('profiles')
    .select('*, assigned_plans!assigned_plans_athlete_id_fkey(created_at, workout_plans(title))')
    .eq('role', 'athlete')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const activeCount   = athletes?.filter(a => !a.is_archived).length ?? 0
  const suspendedCount = athletes?.filter(a => a.is_archived).length ?? 0

  return (
    <div className="p-4 md:p-6 xl:p-8 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="section-title text-primary mb-1.5">Gestión de atletas</p>
          <h1 className="page-title">Alumnos</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm text-muted-foreground font-medium">
              <span className="text-foreground font-bold">{activeCount}</span> activos
            </span>
            {suspendedCount > 0 && (
              <span className="text-sm text-orange-400 font-medium">
                · <span className="font-bold">{suspendedCount}</span> suspendidos
              </span>
            )}
          </div>
        </div>
        <Link href="/dashboard/coach/athletes/new">
          <Button className="h-10 px-5 rounded-xl text-xs font-black uppercase tracking-widest gap-2 shrink-0">
            <Plus className="w-4 h-4 stroke-[2.5]" /> Añadir alumno
          </Button>
        </Link>
      </header>

      {/* Athletes grid */}
      {athletes && athletes.length > 0 ? (
        <TooltipProvider>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {athletes.map((athlete) => {
              const plans = (athlete.assigned_plans as any[]) ?? []
              const latestPlan = plans.sort(
                (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )[0]
              const planTitle = latestPlan?.workout_plans?.title
              const isSuspended = athlete.is_archived

              return (
                <div
                  key={athlete.id}
                  className={`ios-panel p-5 flex flex-col gap-4 transition-all group ${
                    isSuspended
                      ? 'opacity-60 border-orange-500/20 bg-orange-500/3'
                      : 'hover:border-primary/25'
                  }`}
                >
                  {/* Athlete identity */}
                  <div className="flex items-center gap-3.5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border ${
                      isSuspended ? 'bg-orange-500/10 border-orange-500/20' : 'bg-secondary border-border'
                    }`}>
                      {athlete.emoji || '💪'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-black text-base leading-tight truncate">{athlete.full_name || 'Sin nombre'}</p>
                        {isSuspended && (
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20 shrink-0">
                            Suspendido
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{athlete.email}</p>
                    </div>
                  </div>

                  {/* Plan info */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="section-title mb-1">Plan asignado</p>
                      {planTitle ? (
                        <span className="badge-ldrfit">{planTitle}</span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">Sin plan</span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(athlete.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    <Link href={`/dashboard/coach/athletes/${athlete.id}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full gap-2 rounded-xl text-xs font-bold hover:border-primary/40 hover:text-primary">
                        <Settings className="w-3.5 h-3.5" /> Gestionar
                      </Button>
                    </Link>

                    {/* Suspend / Activate toggle */}
                    <form action={async () => {
                      'use server'
                      await toggleAthleteAccess(athlete.id, !isSuspended)
                    }}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost" size="icon" type="submit"
                            className={`w-9 h-9 rounded-xl transition-all ${
                              isSuspended
                                ? 'text-primary hover:bg-primary/10'
                                : 'text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10'
                            }`}
                          >
                            <PauseCircle className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">{isSuspended ? 'Reactivar acceso' : 'Suspender acceso'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </form>

                    {/* Permanently delete */}
                    <form action={async () => { 'use server'; await hardDeleteAthlete(athlete.id) }}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" type="submit"
                            className="w-9 h-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                            <UserX className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs text-destructive font-bold">Eliminar permanentemente</p>
                        </TooltipContent>
                      </Tooltip>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        </TooltipProvider>
      ) : (
        <div className="ios-panel p-16 text-center">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-black uppercase tracking-tight mb-2">Sin alumnos registrados</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
            Agrega tu primer atleta para comenzar a asignarle planes.
          </p>
          <Link href="/dashboard/coach/athletes/new">
            <Button>Añadir primer alumno</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
