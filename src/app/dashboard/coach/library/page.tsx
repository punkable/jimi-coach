import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Video, PlaySquare, Archive, Edit } from 'lucide-react'
import Link from 'next/link'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { archiveExercise } from './actions'

export default async function LibraryPage() {
  const supabase = await createClient()

  // Fetch exercises
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .is('is_archived', false)
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
        <TooltipProvider>
        {exercises && exercises.length > 0 ? (
          exercises.map((ex) => (
            <Card key={ex.id} className="overflow-hidden flex flex-col glass border-border/50 hover:border-border transition-all shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg leading-tight">{ex.name}</CardTitle>
                  {ex.difficulty_level && (
                    <span className="text-[10px] uppercase bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold shrink-0">
                      {ex.difficulty_level}
                    </span>
                  )}
                </div>
                <CardDescription className="line-clamp-2 mt-1">
                  {ex.instructions || 'Sin instrucciones detalladas.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-4 flex gap-2">
                {ex.video_url ? (
                  <a href={ex.video_url} target="_blank" rel="noreferrer" className="flex-1">
                    <Button variant="default" className="w-full gap-2" size="sm">
                      <PlaySquare className="w-4 h-4" /> Video
                    </Button>
                  </a>
                ) : (
                  <Button variant="secondary" className="flex-1 opacity-50 cursor-not-allowed" size="sm" disabled>
                    <Video className="w-4 h-4 mr-2" /> Sin video
                  </Button>
                )}
                <Link href={`/dashboard/coach/library/${ex.id}/edit`}>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <Edit className="w-4 h-4" />
                  </Button>
                </Link>
                <form action={async () => {
                  'use server'
                  await archiveExercise(ex.id)
                }}>
                  <Tooltip>
                    <TooltipTrigger type="submit" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 w-9 text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10 shrink-0">
                      <Archive className="w-4 h-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Archivar ejercicio</p>
                    </TooltipContent>
                  </Tooltip>
                </form>
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
        </TooltipProvider>
      </div>
    </div>
  )
}
