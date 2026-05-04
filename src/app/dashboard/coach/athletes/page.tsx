import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Plus, Settings, Archive, UserX, Users } from 'lucide-react'
import Link from 'next/link'
import { deleteAthlete, hardDeleteAthlete } from './actions'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export default async function AthletesPage() {
  const supabase = await createClient()

  // Fetch athletes and their plans
  const { data: athletes } = await supabase
    .from('profiles')
    .select('*, assigned_plans!assigned_plans_athlete_id_fkey(created_at, workout_plans(title))')
    .eq('role', 'athlete')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return (
    <div className="p-4 md:p-8 xl:p-10 space-y-8 max-w-7xl mx-auto">
      <header className="ios-panel p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="section-title text-[var(--athlete)] mb-2">Gestión de atletas</div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase">Alumnos</h1>
          <p className="text-muted-foreground mt-2 text-sm">Controla planes, contacto y estado de cada atleta.</p>
        </div>
        <Link href="/dashboard/coach/athletes/new">
          <Button className="gap-2 h-12 rounded-2xl px-6 font-black uppercase tracking-widest text-xs">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Añadir Alumno</span>
          </Button>
        </Link>
      </header>

      <Card className="ios-panel overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tight">
            <Users className="w-5 h-5 text-[var(--athlete)]" /> Listado de alumnos
          </CardTitle>
          <CardDescription>
            Tienes {athletes?.length || 0} alumnos registrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan Asignado</TableHead>
                <TableHead>Fecha de Registro</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {athletes && athletes.length > 0 ? (
                athletes.map((athlete) => (
                  <TableRow key={athlete.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{athlete.emoji || '💪'}</span>
                        <div className="flex flex-col">
                          <span>{athlete.full_name || 'Sin nombre'}</span>
                          <span className="text-xs text-muted-foreground">{athlete.phone || 'Sin teléfono'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{athlete.email}</TableCell>
                    <TableCell>
                      {athlete.assigned_plans && athlete.assigned_plans.length > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary uppercase">
                          {athlete.assigned_plans.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].workout_plans?.title || 'Plan'}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Sin asignar</span>
                      )}
                    </TableCell>
                    <TableCell>{new Date(athlete.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-2">
                      <Link href={`/dashboard/coach/athletes/${athlete.id}`}>
                        <Button variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground gap-2">
                          <Settings className="w-4 h-4" /> Gestionar
                        </Button>
                      </Link>
                      <form action={async () => {
                        'use server'
                        await deleteAthlete(athlete.id)
                      }}>
                        <Tooltip>
                          <TooltipTrigger>
                            <Button variant="ghost" size="icon" type="submit" className="text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10">
                              <Archive className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Suspender / Archivar</p>
                          </TooltipContent>
                        </Tooltip>
                      </form>
                      <form action={async () => {
                        'use server'
                        await hardDeleteAthlete(athlete.id)
                      }}>
                        <Tooltip>
                          <TooltipTrigger>
                            <Button variant="ghost" size="icon" type="submit" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                              <UserX className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs text-destructive font-bold">Eliminar permanentemente</p>
                          </TooltipContent>
                        </Tooltip>
                      </form>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                    Aún no hay alumnos registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
