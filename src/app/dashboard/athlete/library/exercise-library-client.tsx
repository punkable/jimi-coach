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
  video_url?: string | null
  tracking_type?: string | null
  description?: string | null
}

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?&]+)/)
  if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1`
  return null
}

function VideoModal({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
  const embedUrl = exercise.video_url ? getYouTubeEmbedUrl(exercise.video_url) : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-card rounded-3xl overflow-hidden shadow-2xl border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <p className="section-title text-primary mb-0.5">{exercise.category || 'General'}</p>
            <h2 className="text-xl font-black uppercase tracking-tight">{exercise.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video */}
        <div className="aspect-video w-full bg-black">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={exercise.name}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Video className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No se puede previsualizar este video.</p>
                {exercise.video_url && (
                  <a
                    href={exercise.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-primary text-sm font-bold hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Abrir en nueva pestaña
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {(exercise.description || exercise.instructions) && (
          <div className="p-5 space-y-2">
            {exercise.description && (
              <p className="text-sm font-semibold leading-relaxed">{exercise.description}</p>
            )}
            {exercise.instructions && exercise.instructions !== exercise.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{exercise.instructions}</p>
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

  const categories = useMemo(() => {
    return Array.from(new Set(exercises.map(ex => ex.category || 'General'))).sort()
  }, [exercises])

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
      {videoExercise && (
        <VideoModal exercise={videoExercise} onClose={() => setVideoExercise(null)} />
      )}

      <div className="space-y-6">
        <div className="ios-panel p-4 md:p-5 sticky top-0 z-20">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar ejercicio, categoría o indicación técnica..."
                className="h-12 rounded-2xl pl-11 bg-background/55 border-border/70 font-semibold"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
              <button
                type="button"
                onClick={() => setCategory('all')}
                className={cn(
                  'h-12 px-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all',
                  category === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background/45 border-border/70 text-muted-foreground hover:text-foreground'
                )}
              >
                Todo
              </button>
              {categories.map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={cn(
                    'h-12 px-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all',
                    category === item ? 'bg-primary text-primary-foreground border-primary' : 'bg-background/45 border-border/70 text-muted-foreground hover:text-foreground'
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(exercise => (
            <article key={exercise.id} className="ios-panel p-5 flex flex-col gap-5 min-h-[280px] overflow-hidden">
              <div className="flex items-start justify-between gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Dumbbell className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-[var(--gymnastics)]/10 border border-[var(--gymnastics)]/20 text-[var(--gymnastics)] text-[9px] font-black uppercase tracking-widest">
                    {exercise.category || 'General'}
                  </span>
                  {exercise.difficulty_level && (
                    <span className="px-3 py-1.5 rounded-xl bg-[var(--strength)]/10 border border-[var(--strength)]/20 text-[var(--strength)] text-[9px] font-black uppercase tracking-widest">
                      {exercise.difficulty_level}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-black uppercase tracking-tight leading-tight">{exercise.name}</h2>
                <div className="flex items-center gap-2 mt-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <Target className="w-3.5 h-3.5 text-primary" />
                  {exercise.tracking_type || 'Técnica y ejecución'}
                </div>
              </div>

              <p className="text-sm text-muted-foreground font-semibold leading-relaxed line-clamp-3">
                {exercise.description || exercise.instructions || 'Movimiento de la biblioteca LDRFIT.'}
              </p>

              <div className="mt-auto flex items-center justify-between gap-3 pt-4 border-t border-border/60">
                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <Layers3 className="w-3.5 h-3.5 text-primary" />
                  Biblioteca oficial
                </span>
                {exercise.video_url ? (
                  <Button
                    type="button"
                    onClick={() => setVideoExercise(exercise)}
                    className="h-10 rounded-2xl px-4 text-[10px] font-black uppercase tracking-widest gap-2"
                  >
                    <Video className="w-4 h-4" /> Ver video
                  </Button>
                ) : (
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
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
