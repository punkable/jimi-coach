import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Video, PlaySquare, LibraryBig } from 'lucide-react'

export default async function AthleteLibraryPage() {
  const supabase = await createClient()

  // Fetch exercises
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
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
            <Card key={ex.id} className="overflow-hidden flex flex-col border-primary/10 bg-card/40 backdrop-blur-sm hover:border-primary/40 transition-colors">
              <div className="relative aspect-video w-full bg-secondary/10 border-b border-white/5 flex flex-col items-center justify-center p-4 text-center">
                <Video className="w-10 h-10 text-primary/30 mb-3" />
                {ex.video_url ? (
                  <a href={ex.video_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-primary/20 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-full text-sm font-bold transition-all">
                    <PlaySquare className="w-4 h-4" /> Ver Demostración
                  </a>
                ) : (
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Pronto disponible</span>
                )}
              </div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg uppercase tracking-wider">{ex.name}</CardTitle>
                  {ex.difficulty_level && (
                    <span className="text-[10px] uppercase bg-secondary text-secondary-foreground px-2 py-0.5 rounded-sm font-bold">
                      {ex.difficulty_level}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="mt-auto">
                <CardDescription className="text-sm">
                  {ex.instructions || 'Sigue las instrucciones generales del coach durante la clase.'}
                </CardDescription>
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
