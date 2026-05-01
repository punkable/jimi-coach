import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { updateExercise } from '../../actions'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function EditExercisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: exercise } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', id)
    .single()

  if (!exercise) {
    return <div className="p-8 text-center text-destructive font-bold">Ejercicio no encontrado.</div>
  }

  // We bind the ID to the server action so it knows what to update
  const updateAction = updateExercise.bind(null, id)

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-3xl mx-auto">
      <header className="flex items-center gap-4">
        <Link href="/dashboard/coach/library" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Ejercicio</h1>
          <p className="text-muted-foreground mt-1">Actualiza los detalles técnicos.</p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Detalles del Ejercicio</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Ejercicio</Label>
              <Input id="name" name="name" defaultValue={exercise.name} required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <select id="category" name="category" defaultValue={exercise.category} className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring">
                  <option className="bg-background text-foreground" value="weightlifting">Weightlifting</option>
                  <option className="bg-background text-foreground" value="gymnastics">Gymnastics</option>
                  <option className="bg-background text-foreground" value="monostructural">Monostructural</option>
                  <option className="bg-background text-foreground" value="strength">Fuerza</option>
                  <option className="bg-background text-foreground" value="mobility">Movilidad</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty_level">Dificultad</Label>
                <select id="difficulty_level" name="difficulty_level" defaultValue={exercise.difficulty_level || 'intermediate'} className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring">
                  <option className="bg-background text-foreground" value="beginner">Principiante</option>
                  <option className="bg-background text-foreground" value="intermediate">Intermedio</option>
                  <option className="bg-background text-foreground" value="advanced">Avanzado</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="video_url">URL del Video (YouTube / Vimeo) - Opcional</Label>
              <Input id="video_url" name="video_url" type="url" defaultValue={exercise.video_url || ''} placeholder="https://youtube.com/watch?v=..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instrucciones / Notas Técnicas</Label>
              <textarea 
                id="instructions" 
                name="instructions" 
                defaultValue={exercise.instructions || ''}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              ></textarea>
            </div>

            <div className="pt-4 flex justify-end gap-4">
              <Link href="/dashboard/coach/library">
                <Button variant="outline" type="button">Cancelar</Button>
              </Link>
              <Button type="submit">Actualizar Ejercicio</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
