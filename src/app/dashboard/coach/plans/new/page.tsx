import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createPlan } from '../actions'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewPlanPage() {
  return (
    <div className="p-4 md:p-8 space-y-6 max-w-3xl mx-auto">
      <header className="flex items-center gap-4">
        <Link href="/dashboard/coach/plans" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nueva Planificación</h1>
          <p className="text-muted-foreground mt-1">Crea la estructura de un nuevo plan.</p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Detalles de la Planificación</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createPlan} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título del Plan</Label>
              <Input id="title" name="title" placeholder="Ej: Programa de Fuerza 8 Semanas" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción general</Label>
              <textarea 
                id="description" 
                name="description" 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Este plan está enfocado en mejorar las marcas personales de..."
              ></textarea>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="objective">Objetivo principal</Label>
                <select id="objective" name="objective" className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                  <option className="bg-background text-foreground" value="fuerza">Fuerza</option>
                  <option className="bg-background text-foreground" value="hipertrofia">Hipertrofia</option>
                  <option className="bg-background text-foreground" value="acondicionamiento">Acondicionamiento</option>
                  <option className="bg-background text-foreground" value="tecnica">Técnica</option>
                  <option className="bg-background text-foreground" value="competencia">Competencia</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Nivel</Label>
                <select id="level" name="level" className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                  <option className="bg-background text-foreground" value="beginner">Principiante</option>
                  <option className="bg-background text-foreground" value="intermediate">Intermedio</option>
                  <option className="bg-background text-foreground" value="advanced">Avanzado</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-4">
              <Link href="/dashboard/coach/plans">
                <Button variant="outline" type="button">Cancelar</Button>
              </Link>
              <Button type="submit">Crear Plan</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
