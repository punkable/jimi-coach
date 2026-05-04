import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExerciseVideoPreview } from '@/components/exercise-video-preview'
import { BookOpen, Search } from 'lucide-react'

export default async function AthleteLibraryPage() {
  const supabase = await createClient()

  const { data: exercises } = await supabase
    .from('exercises')
    .select('id, name, category, difficulty_level, instructions, video_url')
    .is('is_archived', false)
    .order('name', { ascending: true })

  return (
    <div className="min-h-[100dvh] px-4 py-8 md:px-8 md:py-10 max-w-6xl mx-auto relative overflow-hidden">
      <Image src="/images/list.png" alt="" width={224} height={224} className="pointer-events-none absolute right-0 top-8 w-40 md:w-56 opacity-[0.06]" />

      <header className="relative mb-8">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-primary mb-3">Biblioteca</p>
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-none">Ejercicios</h1>
        <p className="text-sm text-muted-foreground mt-3 max-w-2xl leading-relaxed">
          Revisa videos y notas de movimiento sin iniciar un entrenamiento.
        </p>
      </header>

      {exercises && exercises.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative">
          {exercises.map((exercise) => (
            <Card key={exercise.id} className="glass border-border/50 overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  {exercise.difficulty_level && (
                    <span className="text-[9px] uppercase bg-primary/20 text-primary px-2 py-0.5 rounded-full font-black shrink-0">
                      {exercise.difficulty_level}
                    </span>
                  )}
                </div>
                <CardTitle className="text-lg leading-tight uppercase tracking-tight mt-4">{exercise.name}</CardTitle>
                <CardDescription className="line-clamp-3 mt-1 text-xs leading-relaxed">
                  {exercise.instructions || 'Tu coach puede completar esta descripción con claves específicas del movimiento.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-4">
                <ExerciseVideoPreview url={exercise.video_url} name={exercise.name} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center border-2 border-dashed border-border/20 rounded-[32px]">
          <Search className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">Biblioteca sin ejercicios visibles</p>
        </div>
      )}
    </div>
  )
}
