import { createClient } from '@/lib/supabase/server'
import { BookOpen, Video, Dumbbell } from 'lucide-react'
import { ExerciseLibraryClient } from './exercise-library-client'
import { redirect } from 'next/navigation'

export const revalidate = 0

export default async function AthleteLibraryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: exercises } = await supabase
    .from('exercises')
    .select('id, name, category, difficulty_level, instructions, video_url, tracking_type')
    .eq('is_archived', false)
    .order('name', { ascending: true })

  const list = exercises || []
  const videoCount = list.filter(ex => ex.video_url).length
  const categoryCount = new Set(list.map(ex => ex.category || 'General')).size

  return (
    <div className="p-4 md:p-8 xl:p-10 space-y-8 max-w-7xl mx-auto">
      <header className="ios-panel p-6 md:p-8 overflow-hidden relative">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-[var(--gymnastics)] to-[var(--metcon)]" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="section-title text-primary mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Técnica
            </div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight">Biblioteca de ejercicios</h1>
            <p className="text-muted-foreground text-sm md:text-base font-semibold mt-3 max-w-2xl">
              Consulta los mismos movimientos que tu coach usa en tus WODs. Si un ejercicio aparece etiquetado en la rutina libre, su video sale desde esta biblioteca.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 min-w-[240px]">
            <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4 text-center">
              <Dumbbell className="w-5 h-5 text-primary mx-auto" />
              <p className="text-2xl font-black mt-2">{list.length}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Ejercicios</p>
            </div>
            <div className="rounded-2xl bg-[var(--gymnastics)]/10 border border-[var(--gymnastics)]/20 p-4 text-center">
              <Video className="w-5 h-5 text-[var(--gymnastics)] mx-auto" />
              <p className="text-2xl font-black mt-2">{videoCount}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{categoryCount} categorías</p>
            </div>
          </div>
        </div>
      </header>

      <ExerciseLibraryClient exercises={list} />
    </div>
  )
}
