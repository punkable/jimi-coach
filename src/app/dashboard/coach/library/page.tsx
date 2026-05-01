import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Video, PlaySquare } from 'lucide-react'
import Link from 'next/link'

export default async function LibraryPage() {
  const supabase = await createClient()

  // Fetch exercises
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .order('name', { ascending: true })

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Biblioteca de Ejercicios</h1>
          <p className="text-muted-foreground mt-1">Gestiona tus movimientos y videos técnicos.</p>
        </div>
        <Link href="/dashboard/coach/library/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo Ejercicio</span>
          </Button>
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exercises && exercises.length > 0 ? (
          exercises.map((ex) => (
            <Card key={ex.id} className="overflow-hidden flex flex-col">
              <div className="relative aspect-video w-full overflow-hidden bg-secondary/30 flex items-center justify-center">
                {ex.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ex.image_url} alt={ex.name} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <Video className="w-8 h-8 text-muted-foreground/50 z-10" />
                )}
                {ex.video_url && (
                  <div className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full">
                    <PlaySquare className="w-4 h-4" />
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{ex.name}</CardTitle>
                  {ex.difficulty_level && (
                    <span className="text-[10px] uppercase bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                      {ex.difficulty_level}
                    </span>
                  )}
                </div>
                <CardDescription className="line-clamp-2">
                  {ex.instructions || 'Sin instrucciones detalladas.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-2">
                <Button variant="outline" className="w-full" size="sm">Editar Ejercicio</Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-lg">
            <h3 className="text-lg font-medium mb-1">Tu biblioteca está vacía</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Agrega tu primer ejercicio con su video explicativo para usarlo en tus planificaciones.
            </p>
            <Link href="/dashboard/coach/library/new">
              <Button variant="outline">Crear Ejercicio</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
