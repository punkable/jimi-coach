import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Video, PlaySquare, LibraryBig } from 'lucide-react'

export default async function AthleteLibraryPage() {
  const supabase = await createClient()

  // Fetch exercises
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .is('is_archived', false)
    .order('name', { ascending: true })

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <header className="flex items-center gap-3">
        <LibraryBig className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight uppercase">Biblioteca Técnica</h1>
          <p className="text-muted-foreground mt-1">Estudia los movimientos y mejora tu técnica.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exercises && exercises.length > 0 ? (
          exercises.map((ex) => (
            <Card key={ex.id} className="overflow-hidden flex flex-col glass border-border/50 hover:border-border transition-all shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg leading-tight uppercase tracking-wider">{ex.name}</CardTitle>
                  {ex.difficulty_level && (
                    <span className="text-[10px] uppercase bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold shrink-0">
                      {ex.difficulty_level}
                    </span>
                  )}
                </div>
                <CardDescription className="line-clamp-2 mt-1 text-sm">
                  {ex.instructions || 'Sigue las instrucciones generales del coach durante la clase.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-4">
                {ex.video_url ? (
                  <a href={ex.video_url} target="_blank" rel="noreferrer" className="block">
                    <Button variant="default" className="w-full gap-2" size="sm">
                      <PlaySquare className="w-4 h-4" /> Ver Video
                    </Button>
                  </a>
                ) : (
                  <Button variant="secondary" className="w-full opacity-50 cursor-not-allowed" size="sm" disabled>
                    <Video className="w-4 h-4 mr-2" /> Sin video
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-white/10 rounded-xl bg-background/50">
            <h3 className="text-xl font-bold uppercase tracking-widest text-muted-foreground">Biblioteca en construcción</h3>
            <p className="text-muted-foreground text-sm mt-2">
              Pronto encontrarás aquí el catálogo de movimientos.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
