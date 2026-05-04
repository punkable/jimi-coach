import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Plus, Settings, Trash2, Archive, UserX } from 'lucide-react'
import Link from 'next/link'
import { deleteAthlete, hardDeleteAthlete } from './actions'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export default async function AthletesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  let athleteQuery = supabase
    .from('profiles')
    .select('*, assigned_plans!assigned_plans_athlete_id_fkey(created_at, workout_plans(title))')
    .eq('role', 'athlete')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (profile?.role === 'coach') {
    const { data: relationships } = await supabase
      .from('coach_athletes')
      .select('athlete_id')
      .eq('coach_id', user?.id)

    const athleteIds = relationships?.map((relationship) => relationship.athlete_id) || []
    athleteQuery = athleteIds.length > 0
      ? athleteQuery.in('id', athleteIds)
      : athleteQuery.eq('id', '00000000-0000-0000-0000-000000000000')
  }

  const { data: athletes } = await athleteQuery

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{profile?.role === 'admin' ? 'Usuarios' : 'Alumnos'}</h1>
          <p className="text-muted-foreground mt-1">
            {profile?.role === 'admin' ? 'Gestiona usuarios y relaciones de coaches.' : 'Gestiona los atletas de tu academia.'}
          </p>
        </div>
        <Link href="/dashboard/coach/athletes/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Añadir Alumno</span>
          </Button>
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Alumnos</CardTitle>
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
