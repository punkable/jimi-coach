'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Save, Trash2, AlertTriangle, Eye, Video, Loader2 } from 'lucide-react'
import { updateExercise, hardDeleteExercise } from '../../actions'
import { toast } from 'sonner'

const CATEGORIES = [
  { value: 'strength',        label: 'Fuerza' },
  { value: 'metcon',          label: 'MetCon' },
  { value: 'gymnastics',      label: 'Gimnasia' },
  { value: 'weightlifting',   label: 'Halterofilia' },
  { value: 'monostructural',  label: 'Monoestructural' },
  { value: 'mobility',        label: 'Movilidad' },
  { value: 'warmup',          label: 'Calentamiento' },
  { value: 'cooldown',        label: 'Vuelta a la calma' },
]

const DIFFICULTIES = [
  { value: 'beginner',     label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio'   },
  { value: 'advanced',     label: 'Avanzado'     },
]

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?&]+)/)
  if (match) return `https://www.youtube.com/embed/${match[1]}`
  return null
}

export function ExerciseEditClient({ exercise }: { exercise: any }) {
  const router = useRouter()
  const [videoUrl, setVideoUrl] = useState(exercise.video_url || '')
  const [showPreview, setShowPreview] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const updateAction = updateExercise.bind(null, exercise.id)
  const previewEmbed = videoUrl ? getYouTubeEmbedUrl(videoUrl) : null

  const handleHardDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await hardDeleteExercise(exercise.id)
      if (res?.archived) {
        toast.warning(res.reason || 'El ejercicio está en uso, se archivó.')
      } else {
        toast.success('Ejercicio eliminado.')
      }
      router.push('/dashboard/coach/library')
    } catch (e) {
      console.error(e)
      toast.error('Error al eliminar el ejercicio')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <form action={updateAction} className="ios-panel p-5 md:p-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="section-title">Nombre del ejercicio</Label>
          <Input id="name" name="name" defaultValue={exercise.name} required className="h-11 rounded-xl font-bold" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category" className="section-title">Categoría</Label>
            <select
              id="category"
              name="category"
              defaultValue={exercise.category || 'strength'}
              className="flex h-11 w-full items-center rounded-xl border border-border bg-secondary px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {CATEGORIES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="difficulty_level" className="section-title">Dificultad</Label>
            <select
              id="difficulty_level"
              name="difficulty_level"
              defaultValue={exercise.difficulty_level || 'intermediate'}
              className="flex h-11 w-full items-center rounded-xl border border-border bg-secondary px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {DIFFICULTIES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="video_url" className="section-title">URL del video (YouTube/Vimeo)</Label>
            {videoUrl && (
              <button
                type="button"
                onClick={() => setShowPreview((v) => !v)}
                className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
              >
                <Eye className="w-3 h-3" />
                {showPreview ? 'Ocultar' : 'Previsualizar'}
              </button>
            )}
          </div>
          <Input
            id="video_url"
            name="video_url"
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="h-11 rounded-xl font-mono text-xs"
          />
          {showPreview && (
            <div className="mt-2 aspect-video w-full rounded-xl overflow-hidden bg-black border border-border">
              {previewEmbed ? (
                <iframe
                  src={previewEmbed}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Preview"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-center p-4">
                  <div>
                    <Video className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">URL no compatible para preview embebido.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="section-title">Descripción corta</Label>
          <Input
            id="description"
            name="description"
            defaultValue={exercise.description || ''}
            placeholder="Frase breve que describe el movimiento (1 línea)"
            className="h-11 rounded-xl text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructions" className="section-title">Instrucciones / notas técnicas</Label>
          <textarea
            id="instructions"
            name="instructions"
            defaultValue={exercise.instructions || ''}
            placeholder="Puntos clave, errores comunes, progresiones..."
            className="flex min-h-[100px] w-full rounded-xl border border-border bg-secondary px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link href="/dashboard/coach/library" className="sm:flex-1">
            <Button variant="outline" type="button" className="w-full h-11 rounded-xl font-black uppercase tracking-widest text-xs">
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            className="sm:flex-[2] h-11 rounded-xl font-black uppercase tracking-widest text-xs gap-2"
          >
            <Save className="w-4 h-4" /> Guardar cambios
          </Button>
        </div>
      </form>

      {/* Danger zone */}
      <div className="ios-panel p-5 border border-destructive/30 bg-destructive/5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </div>
          <div>
            <p className="section-title text-destructive mb-0.5">Zona peligrosa</p>
            <p className="text-sm font-black uppercase tracking-tight">Eliminar ejercicio</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Si el ejercicio está siendo usado en alguna planificación, se archivará automáticamente
          en lugar de borrarse para preservar el historial de los atletas.
        </p>
        {confirmDelete ? (
          <div className="flex gap-3">
            <Button
              variant="outline"
              type="button"
              className="flex-1 h-10 rounded-xl text-xs"
              onClick={() => setConfirmDelete(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              type="button"
              className="flex-1 h-10 rounded-xl text-xs font-black uppercase tracking-widest gap-2"
              onClick={handleHardDelete}
              disabled={isDeleting}
            >
              {isDeleting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Eliminando...</> : <><Trash2 className="w-3.5 h-3.5" /> Confirmar eliminación</>}
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            type="button"
            className="w-full h-10 rounded-xl text-xs font-black uppercase tracking-widest gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="w-3.5 h-3.5" /> Eliminar permanentemente
          </Button>
        )}
      </div>
    </div>
  )
}
