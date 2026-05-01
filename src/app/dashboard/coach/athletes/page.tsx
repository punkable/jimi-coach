import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Plus, Settings, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { deleteAthlete } from './actions'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export default async function AthletesPage() {
  const supabase = await createClient()

  // Fetch athletes
  const { data: athletes } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'athlete')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alumnos</h1>
          <p className="text-muted-foreground mt-1">Gestiona los atletas de tu academia.</p>
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
                <TableHead>Fecha de Registro</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {athletes && athletes.length > 0 ? (
                athletes.map((athlete) => (
                  <TableRow key={athlete.id}>
                    <TableCell className="font-medium">{athlete.full_name || 'Sin nombre'}</TableCell>
                    <TableCell>{athlete.email}</TableCell>
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
                            <Button variant="ghost" size="icon" type="submit" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Archivar alumno</p>
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
