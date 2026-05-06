import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Video, Archive, Edit } from 'lucide-react'
import Link from 'next/link'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { archiveExercise } from './actions'
import { VideoPopupButton } from './video-popup-button'

export default async function LibraryPage() {
  const supabase = await createClient()

  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .is('is_archived', false)
    .order('name', { ascending: true })

  return (
    <div className="p-4 md:p-8 xl:p-10 space-y-8 max-w-7xl mx-auto">
      <header className="ios-panel p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="section-title text-[var(--gymnastics)] mb-2">Técnica y videos</div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase">Biblioteca de ejercicios</h1>
          <p className="text-muted-foreground mt-2 text-sm">Gestiona movimientos, instrucciones y videos que luego aparecen en los WODs.</p>
        </div>
        <Link href="/dashboard/coach/library/new">
          <Button className="gap-2 h-12 rounded-2xl px-6 font-black uppercase tracking-widest text-xs">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo ejercicio</span>
          </Button>
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <TooltipProvider>
          {exercises && exercises.length > 0 ? (
            exercises.map(ex => (
              <Card key={ex.id} className="overflow-hidden flex flex-col ios-panel hover:-translate-y-0.5 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg font-black uppercase tracking-tight leading-tight">{ex.name}</CardTitle>
                    {ex.difficulty_level && (
                      <span className="metric-chip bg-[var(--gymnastics)]/10 border-[var(--gymnastics)]/20 text-[var(--gymnastics)] shrink-0">
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
                    <VideoPopupButton videoUrl={ex.video_url} exerciseName={ex.name} />
                  ) : (
                    <Button variant="secondary" className="flex-1 opacity-60 cursor-not-allowed rounded-xl" size="sm" disabled>
                      <Video className="w-4 h-4 mr-2" /> Sin video
                    </Button>
                  )}
                  <Link href={`/dashboard/coach/library/${ex.id}/edit`}>
                    <Button variant="outline" size="icon" className="shrink-0 rounded-xl">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  <form action={async () => {
                    'use server'
                    await archiveExercise(ex.id)
                  }}>
                    <Tooltip>
                      <TooltipTrigger type="submit" className="inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors h-9 w-9 text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10 shrink-0">
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
            <div className="col-span-full py-12 text-center border-2 border-dashed border-border rounded-[28px]">
              <h3 className="text-lg font-black uppercase tracking-tight mb-1">Tu biblioteca está vacía</h3>
              <p className="text-muted-foreground text-sm mb-4">Agrega tu primer ejercicio con video explicativo para usarlo en planificaciones.</p>
              <Link href="/dashboard/coach/library/new">
                <Button variant="outline">Crear ejercicio</Button>
              </Link>
            </div>
          )}
        </TooltipProvider>
      </div>
    </div>
  )
}
