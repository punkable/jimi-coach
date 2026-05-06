'use client'

import { useMemo, useState } from 'react'
import { Search, Video, Dumbbell, Layers3, Target, X, ExternalLink } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Exercise = {
  id: string
  name: string
  category?: string | null
  difficulty_level?: string | null
  instructions?: string | null
  description?: string | null
  video_url?: string | null
  tracking_type?: string | null
}

function getYouTubeEmbedUrl(url: string): string | null {
  const m = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?&]+)/)
  return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=1` : null
}

function VideoModal({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
  const embed = exercise.video_url ? getYouTubeEmbedUrl(exercise.video_url) : null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
      style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}
    >
      <div
        className="relative w-full max-w-2xl bg-card rounded-3xl overflow-hidden shadow-2xl border border-border my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 p-5 border-b border-border">
          <div className="min-w-0 flex-1">
            <p className="section-title text-primary mb-0.5 truncate">{exercise.category || 'General'}</p>
            <h2 className="text-lg font-black uppercase tracking-tight leading-tight truncate">{exercise.name}</h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            aria-label="Cerrar"
            className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="aspect-video w-full bg-black">
          {embed ? (
            <iframe
              src={embed}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={exercise.name}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-4">
              <div className="text-center">
                <Video className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground mb-2">URL no compatible para preview</p>
                {exercise.video_url && (
                  <a
                    href={exercise.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-primary text-sm font-bold hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Abrir en nueva pestaña
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {(exercise.description || exercise.instructions) && (
          <div className="p-5 space-y-2 max-h-[40vh] overflow-y-auto">
            {exercise.description && (
              <p className="text-sm font-semibold leading-relaxed">{exercise.description}</p>
            )}
            {exercise.instructions && exercise.instructions !== exercise.description && (
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{exercise.instructions}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function ExerciseLibraryClient({ exercises }: { exercises: Exercise[] }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [videoExercise, setVideoExercise] = useState<Exercise | null>(null)

  const categories = useMemo(
    () => Array.from(new Set(exercises.map(ex => ex.category || 'General'))).sort(),
    [exercises],
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return exercises.filter(ex => {
      const matchesCategory = category === 'all' || (ex.category || 'General') === category
      const haystack = `${ex.name} ${ex.category || ''} ${ex.instructions || ''} ${ex.description || ''}`.toLowerCase()
      return matchesCategory && (!needle || haystack.includes(needle))
    })
  }, [category, exercises, query])

  return (
    <>
      {videoExercise && <VideoModal exercise={videoExercise} onClose={() => setVideoExercise(null)} />}

      <div className="space-y-6">
        {/* Filter bar */}
        <div className="ios-panel p-4 md:p-5 sticky top-0 z-20">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar ejercicio, categoría o indicación técnica..."
                className="h-12 rounded-2xl pl-11 bg-background/55 border-border/70 font-semibold w-full"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0 -mx-1 px-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setCategory('all')}
                className={cn(
                  'h-10 lg:h-12 px-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shrink-0',
                  category === 'all'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background/45 border-border/70 text-muted-foreground hover:text-foreground'
                )}
              >
                Todo
              </button>
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={cn(
                    'h-10 lg:h-12 px-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all shrink-0',
                    category === item
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background/45 border-border/70 text-muted-foreground hover:text-foreground'
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((exercise) => (
            <article
              key={exercise.id}
              className="ios-panel p-5 flex flex-col gap-4 min-h-[260px] overflow-hidden"
            >
              {/* Header row: keep icon and chips on opposite sides without overlap */}
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Dumbbell className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 min-w-0 max-w-[60%]">
                  <span className="px-2.5 py-1 rounded-lg bg-[var(--gymnastics)]/10 border border-[var(--gymnastics)]/20 text-[var(--gymnastics)] text-[9px] font-black uppercase tracking-widest truncate">
                    {exercise.category || 'General'}
                  </span>
                  {exercise.difficulty_level && (
                    <span className="px-2.5 py-1 rounded-lg bg-[var(--strength)]/10 border border-[var(--strength)]/20 text-[var(--strength)] text-[9px] font-black uppercase tracking-widest truncate">
                      {exercise.difficulty_level}
                    </span>
                  )}
                </div>
              </div>

              <div className="min-w-0">
                <h2 className="text-lg md:text-xl font-black uppercase tracking-tight leading-tight break-words">
                  {exercise.name}
                </h2>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <Target className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate">{exercise.tracking_type || 'Técnica y ejecución'}</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground font-semibold leading-relaxed line-clamp-3">
                {exercise.description || exercise.instructions || 'Movimiento de la biblioteca LDRFIT.'}
              </p>

              <div className="mt-auto flex items-center justify-between gap-3 pt-3 border-t border-border/60">
                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground min-w-0">
                  <Layers3 className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate">Biblioteca oficial</span>
                </span>
                {exercise.video_url ? (
                  <Button
                    type="button"
                    onClick={() => setVideoExercise(exercise)}
                    className="h-9 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest gap-1.5 shrink-0"
                  >
                    <Video className="w-3.5 h-3.5" /> Ver video
                  </Button>
                ) : (
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 shrink-0">
                    Sin video
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="ios-panel py-20 text-center">
            <Search className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="font-black uppercase tracking-tight">No encontramos ejercicios con ese filtro.</p>
            <p className="text-sm text-muted-foreground mt-1">Prueba otra búsqueda o cambia de categoría.</p>
          </div>
        )}
      </div>
    </>
  )
}
