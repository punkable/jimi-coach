import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createExercise } from '../actions'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewExercisePage() {
  return (
    <div className="p-4 md:p-8 space-y-6 max-w-3xl mx-auto">
      <header className="flex items-center gap-4">
        <Link href="/dashboard/coach/library" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nuevo Ejercicio</h1>
          <p className="text-muted-foreground mt-1">Añade un ejercicio a tu biblioteca.</p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Detalles del Ejercicio</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createExercise} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Ejercicio</Label>
              <Input id="name" name="name" placeholder="Ej: Back Squat" required />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <select id="category" name="category" className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                  <option className="bg-background text-foreground" value="weightlifting">Weightlifting</option>
                  <option className="bg-background text-foreground" value="gymnastics">Gymnastics</option>
                  <option className="bg-background text-foreground" value="monostructural">Monostructural</option>
                  <option className="bg-background text-foreground" value="strength">Fuerza</option>
                  <option className="bg-background text-foreground" value="mobility">Movilidad</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty_level">Dificultad</Label>
                <select id="difficulty_level" name="difficulty_level" className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                  <option className="bg-background text-foreground" value="beginner">Principiante</option>
                  <option className="bg-background text-foreground" value="intermediate">Intermedio</option>
                  <option className="bg-background text-foreground" value="advanced">Avanzado</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tracking_type">Tipo de seguimiento</Label>
              <select id="tracking_type" name="tracking_type" defaultValue="weight_reps" className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                <option className="bg-background text-foreground" value="weight_reps">Peso + Reps (fuerza)</option>
                <option className="bg-background text-foreground" value="reps_only">Solo Reps (gimnasia / calistenia)</option>
                <option className="bg-background text-foreground" value="distance_time">Distancia + Tiempo (cardio)</option>
                <option className="bg-background text-foreground" value="time_only">Solo Tiempo (planchas, isométricos)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="video_url">URL del Video (YouTube / Vimeo) - Opcional</Label>
              <Input id="video_url" name="video_url" type="url" placeholder="https://youtube.com/watch?v=..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instrucciones / Notas Técnicas</Label>
              <textarea 
                id="instructions" 
                name="instructions" 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Pies a la anchura de los hombros, romper paralelo..."
              ></textarea>
            </div>

            <div className="pt-4 flex justify-end gap-4">
              <Link href="/dashboard/coach/library">
                <Button variant="outline" type="button">Cancelar</Button>
              </Link>
              <Button type="submit">Guardar Ejercicio</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
