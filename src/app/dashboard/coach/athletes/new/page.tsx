import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createAthlete } from '../actions'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewAthletePage() {
  return (
    <div className="p-4 md:p-8 space-y-6 max-w-2xl mx-auto">
      <header className="flex items-center gap-4">
        <Link href="/dashboard/coach/athletes" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Añadir Alumno</h1>
          <p className="text-muted-foreground mt-1">Crea una cuenta para tu nuevo atleta.</p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Datos del Atleta</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createAthlete} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre Completo</Label>
              <Input id="full_name" name="full_name" placeholder="Mat Fraser" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="mat@crossfit.com" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña Temporal</Label>
              <Input id="password" name="password" type="text" placeholder="JimiCoach2026!" defaultValue="JimiCoach2026!" required />
              <p className="text-xs text-muted-foreground">El atleta podrá cambiar esta contraseña más adelante.</p>
            </div>

            <div className="pt-4 flex justify-end gap-4">
              <Link href="/dashboard/coach/athletes">
                <Button variant="outline" type="button">Cancelar</Button>
              </Link>
              <Button type="submit">Crear Alumno</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
