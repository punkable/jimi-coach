'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  ArrowLeft, CheckCircle2, Trophy, Clock, FileText, Video, X,
  Dumbbell, Play, Repeat, Flame, Timer as TimerIcon,
} from 'lucide-react'
import { SmartRoutineText } from '@/components/workout/smart-routine-text'

type SetRow = {
  movement_id: string
  set_number: number
  weight: number | null
  reps: number | null
  distance: number | null
  time_seconds: number | null
  is_completed: boolean | null
}

type CompletedResult = {
  id: string
  completed_at: string
  rpe: number | null
  notes: string | null
  video_link: string | null
  sets: SetRow[]
}

interface Props {
  day: any
  result: CompletedResult
  allExercises?: any[]
}

const blockTypeLabels: Record<string, string> = {
  warmup: 'Calentamiento', strength: 'Fuerza', metcon: 'Metcon',
  gymnastics: 'Gimnasia', cooldown: 'Vuelta a calma', wod: 'WOD',
  core: 'Core', skills: 'Skills', tecnica: 'Técnica', mobility: 'Movilidad',
  other: 'Otro',
}

const blockTypeColors: Record<string, string> = {
  strength: 'border-l-[var(--strength)] bg-[var(--strength)]/5',
  metcon: 'border-l-[var(--metcon)] bg-[var(--metcon)]/5',
  gymnastics: 'border-l-[var(--gymnastics)] bg-[var(--gymnastics)]/5',
  warmup: 'border-l-[var(--warmup)] bg-[var(--warmup)]/5',
  cooldown: 'border-l-[var(--cooldown)] bg-[var(--cooldown)]/5',
}

function formatTime(seconds?: number | null) {
  if (!seconds || seconds <= 0) return null
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`
}

function setDisplay(set: SetRow, trackingType?: string | null): string | null {
  // Pick fields based on what was actually recorded; tracking_type biases the format
  const w = set.weight, r = set.reps, d = set.distance, t = set.time_seconds
  switch (trackingType) {
    case 'reps_only':
      if (r != null) return `${r} reps`
      break
    case 'distance_time': {
      const parts: string[] = []
      if (d != null) parts.push(`${d} m`)
      const time = formatTime(t)
      if (time) parts.push(time)
      if (parts.length) return parts.join(' · ')
      break
    }
    case 'time_only': {
      const time = formatTime(t)
      if (time) return time
      break
    }
    case 'calories':
      if (r != null) return `${r} cal`
      break
    case 'rounds':
      if (r != null) return `${r} ${r === 1 ? 'ronda' : 'rondas'}`
      break
    case 'custom':
      if (r != null) return `${r}`
      if (w != null) return `${w}`
      break
  }
  // Default weight_reps
  if (w != null && r != null) return `${w} kg × ${r}`
  if (w != null) return `${w} kg`
  if (r != null) return `${r} reps`
  const time = formatTime(t)
  if (time) return time
  if (d != null) return `${d} m`
  return null
}

export function WorkoutSummary({ day, result, allExercises = [] }: Props) {
  const [activeVideo, setActiveVideo] = useState<{ url: string; name: string } | null>(null)

  const completedAt = new Date(result.completed_at)
  const dateValid = !isNaN(completedAt.getTime())
  const dateLabel = dateValid
    ? completedAt.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : null
  const timeLabel = dateValid
    ? completedAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : null

  // Group sets by movement_id
  const setsByMovement = new Map<string, SetRow[]>()
  for (const s of result.sets ?? []) {
    if (!s.movement_id) continue
    const arr = setsByMovement.get(s.movement_id) ?? []
    arr.push(s)
    setsByMovement.set(s.movement_id, arr)
  }
  for (const arr of setsByMovement.values()) {
    arr.sort((a, b) => (a.set_number ?? 0) - (b.set_number ?? 0))
  }

  const completedSetCount = (result.sets ?? []).filter(s => s.is_completed).length
  const rpeColor = result.rpe == null
    ? 'bg-secondary text-muted-foreground border-border'
    : result.rpe >= 9 ? 'bg-red-500/15 text-red-400 border-red-500/25'
    : result.rpe >= 7 ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'

  return (
    <div className="flex-1 flex flex-col h-full bg-background md:max-w-3xl md:mx-auto md:w-full overflow-hidden">
      {/* Header */}
      <header
        className="shrink-0 px-4 md:px-5 py-3 border-b border-border/40 flex items-center gap-2"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}
      >
        <Link href="/dashboard/athlete">
          <Button variant="ghost" size="icon" className="rounded-2xl w-9 h-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-500 leading-none">
            Resumen del entrenamiento
          </p>
          <h1 className="text-sm font-black uppercase tracking-tight truncate mt-0.5">
            {day?.title || day?.name || 'WOD completado'}
          </h1>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5" /> Completado
        </span>
      </header>

      {/* Body */}
      <div
        className="flex-1 overflow-y-auto p-4 md:p-5 space-y-5"
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
      >
        {/* Hero summary card */}
        <div className="ios-panel p-5 border-emerald-500/30 bg-gradient-to-br from-emerald-500/8 via-emerald-500/4 to-transparent space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-500">Sesión registrada</p>
              {dateLabel && (
                <p className="text-sm font-black uppercase tracking-tight mt-0.5 capitalize">
                  {dateLabel}
                </p>
              )}
              {timeLabel && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Finalizado a las {timeLabel}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-border/50 bg-card/40 p-3 text-center">
              <Trophy className={`w-4 h-4 mx-auto mb-1 ${result.rpe != null ? 'text-amber-400' : 'text-muted-foreground/30'}`} />
              <p className="text-lg font-black tabular-nums">{result.rpe ?? '—'}</p>
              <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">RPE</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/40 p-3 text-center">
              <Repeat className={`w-4 h-4 mx-auto mb-1 ${completedSetCount > 0 ? 'text-primary' : 'text-muted-foreground/30'}`} />
              <p className="text-lg font-black tabular-nums">{completedSetCount}</p>
              <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">Sets</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/40 p-3 text-center">
              <Dumbbell className="w-4 h-4 mx-auto mb-1 text-[var(--gymnastics)]" />
              <p className="text-lg font-black tabular-nums">{day?.workout_blocks?.length ?? 0}</p>
              <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">Bloques</p>
            </div>
          </div>

          {result.rpe != null && (
            <div className="flex justify-center">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${rpeColor}`}>
                Esfuerzo {result.rpe >= 9 ? 'extremo' : result.rpe >= 7 ? 'alto' : 'moderado'} · {result.rpe}/10
              </span>
            </div>
          )}

          {result.video_link && (
            <a
              href={result.video_link} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-400 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-colors"
            >
              <Video className="w-3.5 h-3.5" /> Ver video del entrenamiento
            </a>
          )}

          {result.notes && (
            <div className="rounded-xl bg-card/40 border border-border/50 p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <FileText className="w-3 h-3 text-muted-foreground" />
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Notas del alumno</p>
              </div>
              <p className="text-[12px] text-foreground/90 leading-relaxed whitespace-pre-line">{result.notes}</p>
            </div>
          )}
        </div>

        {/* Blocks */}
        {(day?.workout_blocks ?? []).length === 0 ? (
          <div className="ios-panel p-6 text-center border-2 border-dashed">
            <p className="text-sm text-muted-foreground">
              Este entrenamiento fue completado, pero no hay detalle de bloques en la programación.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground px-1">
              Detalle de la sesión
            </p>
            {day.workout_blocks.map((block: any) => {
              const accent = blockTypeColors[block.type] || 'border-l-primary bg-primary/5'
              const description = typeof block.description === 'string' ? block.description.trim() : ''
              const footer = typeof block.description_footer === 'string' ? block.description_footer.trim() : ''
              const movements = block.workout_movements ?? []

              return (
                <div key={block.id} className={`ios-panel rounded-2xl border-l-4 overflow-hidden ${accent}`}>
                  {/* Block header */}
                  <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground leading-none">
                        {blockTypeLabels[block.type] || block.type || 'Bloque'}
                      </p>
                      <h3 className="text-sm font-black uppercase tracking-tight truncate mt-1">{block.name}</h3>
                    </div>
                    {block.timer_type && block.timer_type !== 'none' && (
                      <span className="shrink-0 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-secondary/60 border border-border/50 px-2 py-1 rounded-lg">
                        <TimerIcon className="w-3 h-3" />
                        {String(block.timer_type).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Top free text */}
                  {description && (
                    <div className="px-4 py-3 bg-[var(--gymnastics)]/5 border-b border-[var(--gymnastics)]/15">
                      <SmartRoutineText
                        text={description}
                        exercises={allExercises}
                        blockExercises={movements.map((m: any) => m.exercises).filter(Boolean)}
                        onVideoClick={(url, name) => setActiveVideo({ url, name })}
                      />
                    </div>
                  )}

                  {/* Movements — strength blocks group consecutive same-exercise rows */}
                  {movements.length > 0 && (() => {
                    const isStrengthBlock = block.type === 'strength'
                    // Build groups of consecutive same-exercise movements for strength
                    const groups: Array<{ exerciseId: string; exercise: any; lines: any[] }> = []
                    movements.forEach((mov: any) => {
                      if (isStrengthBlock) {
                        const last = groups[groups.length - 1]
                        if (last && last.exerciseId === mov.exercise_id) {
                          last.lines.push(mov)
                        } else {
                          groups.push({ exerciseId: mov.exercise_id, exercise: mov.exercises, lines: [mov] })
                        }
                      } else {
                        // For non-strength, each movement is its own group of 1
                        groups.push({ exerciseId: mov.exercise_id, exercise: mov.exercises, lines: [mov] })
                      }
                    })

                    return (
                      <div className="divide-y divide-border/30">
                        {groups.map((group, gIdx) => {
                          const ex = group.exercise
                          const tracking = ex?.tracking_type ?? 'weight_reps'
                          // For grouped strength: show one header + multiple lines
                          if (isStrengthBlock && group.lines.length > 1) {
                            return (
                              <div key={`${group.exerciseId}-${gIdx}`} className="px-4 py-3 space-y-2">
                                <div className="flex items-start gap-3">
                                  {ex?.video_url ? (
                                    <button
                                      type="button"
                                      onClick={() => setActiveVideo({ url: ex.video_url, name: ex.name })}
                                      className="shrink-0 w-10 h-10 rounded-xl bg-primary/5 hover:bg-primary/15 border border-border/50 flex items-center justify-center"
                                      title="Ver video técnico"
                                    >
                                      <Play className="w-4 h-4 text-primary fill-primary/20" />
                                    </button>
                                  ) : (
                                    <div className="shrink-0 w-10 h-10 rounded-xl bg-secondary/40 border border-border/50 flex items-center justify-center">
                                      <Dumbbell className="w-4 h-4 text-muted-foreground/40" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-black uppercase tracking-tight truncate">
                                      {ex?.name || 'Movimiento'}
                                    </p>
                                    <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                                      {group.lines.length} líneas de fuerza
                                    </p>
                                  </div>
                                </div>
                                {/* Lines table */}
                                <div className="space-y-1.5 ml-13 sm:ml-0">
                                  {group.lines.map((line: any, lineIdx: number) => {
                                    const recorded = setsByMovement.get(line.id) ?? []
                                    const programmed: string[] = []
                                    if (line.sets && line.sets > 0) programmed.push(`${line.sets} × ${line.reps || '—'}`)
                                    if (line.weight_percentage) programmed.push(line.weight_percentage)
                                    return (
                                      <div key={line.id} className="rounded-xl border border-border/40 bg-card/40 px-3 py-2 space-y-1.5">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                          <span className="text-[10px] font-black text-foreground">
                                            <span className="text-[var(--strength)] mr-1.5">L{lineIdx + 1}</span>
                                            {programmed.join(' · ') || '—'}
                                          </span>
                                          {recorded.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                              {recorded.map((s, i) => {
                                                const label = setDisplay(s, tracking)
                                                const ok = s.is_completed
                                                return (
                                                  <span
                                                    key={i}
                                                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black tabular-nums border ${
                                                      ok
                                                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-500'
                                                        : 'bg-secondary/40 border-border/40 text-muted-foreground'
                                                    }`}
                                                  >
                                                    <span className="opacity-60">#{s.set_number ?? i + 1}</span>
                                                    <span>{label ?? '—'}</span>
                                                  </span>
                                                )
                                              })}
                                            </div>
                                          )}
                                        </div>
                                        {line.notes && (
                                          <p className="text-[9px] text-muted-foreground italic border-l-2 border-[var(--strength)]/30 pl-2">
                                            {line.notes}
                                          </p>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          }

                          // Single-line group: render as a normal movement row
                          const mov = group.lines[0]
                          const recorded = setsByMovement.get(mov.id) ?? []
                          const programmed: string[] = []
                          if (mov.sets && mov.sets > 0) programmed.push(`${mov.sets} × ${mov.reps || '-'}`)
                          if (mov.weight_percentage) programmed.push(mov.weight_percentage)
                          if (mov.rest) programmed.push(`R: ${mov.rest}`)

                          return (
                            <div key={mov.id} className="px-4 py-3 flex flex-col gap-3 sm:flex-row sm:gap-4">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                {ex?.video_url ? (
                                  <button
                                    type="button"
                                    onClick={() => setActiveVideo({ url: ex.video_url, name: ex.name })}
                                    className="shrink-0 w-10 h-10 rounded-xl bg-primary/5 hover:bg-primary/15 border border-border/50 flex items-center justify-center"
                                    title="Ver video técnico"
                                  >
                                    <Play className="w-4 h-4 text-primary fill-primary/20" />
                                  </button>
                                ) : (
                                  <div className="shrink-0 w-10 h-10 rounded-xl bg-secondary/40 border border-border/50 flex items-center justify-center">
                                    <Dumbbell className="w-4 h-4 text-muted-foreground/40" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-black uppercase tracking-tight truncate">
                                    {ex?.name || 'Movimiento'}
                                  </p>
                                  {programmed.length > 0 && (
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                      Programado: {programmed.join(' · ')}
                                    </p>
                                  )}
                                  {mov.notes && (
                                    <p className="text-[10px] text-muted-foreground italic mt-1 leading-relaxed border-l-2 border-primary/30 pl-2">
                                      {mov.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="sm:w-[40%] sm:max-w-[260px] shrink-0">
                                {recorded.length > 0 ? (
                                  <div className="space-y-1.5">
                                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-500/80">
                                      Registrado
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {recorded.map((s, i) => {
                                        const label = setDisplay(s, tracking)
                                        const ok = s.is_completed
                                        return (
                                          <span
                                            key={i}
                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black tabular-nums border ${
                                              ok
                                                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-500'
                                                : 'bg-secondary/40 border-border/40 text-muted-foreground'
                                            }`}
                                          >
                                            <span className="opacity-60">#{s.set_number ?? i + 1}</span>
                                            <span>{label ?? '—'}</span>
                                          </span>
                                        )
                                      })}
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-muted-foreground/60 italic">
                                    Sin sets registrados
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}

                  {/* Footer free text */}
                  {footer && (
                    <div className="px-4 py-3 bg-[var(--gymnastics)]/5 border-t border-[var(--gymnastics)]/15">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--gymnastics)] mb-1.5">
                        Notas finales
                      </p>
                      <SmartRoutineText
                        text={footer}
                        exercises={allExercises}
                        blockExercises={movements.map((m: any) => m.exercises).filter(Boolean)}
                        onVideoClick={(url, name) => setActiveVideo({ url, name })}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {result.sets && result.sets.length === 0 && (day?.workout_blocks ?? []).some((b: any) => (b.workout_movements ?? []).length > 0) && (
          <div className="ios-panel p-4 border-2 border-dashed border-border/40 text-center">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Este entrenamiento fue completado, pero no hay detalle de sets registrado para esta sesión.
            </p>
          </div>
        )}

        <div className="flex justify-center pt-2">
          <Link href="/dashboard/athlete">
            <Button variant="outline" className="h-10 px-5 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Volver al dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Video dialog */}
      <Dialog open={!!activeVideo} onOpenChange={() => setActiveVideo(null)}>
        <DialogContent className="max-w-[90vw] w-[420px] rounded-3xl border-border/40 p-0 overflow-hidden">
          <div className="p-4 border-b border-border/10 flex items-center justify-between">
            <h3 className="font-black uppercase tracking-tight text-sm">{activeVideo?.name}</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setActiveVideo(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="aspect-video bg-black flex items-center justify-center">
            {(() => {
              if (!activeVideo?.url) return <p className="text-white/40 text-xs">Video no disponible</p>
              const m = activeVideo.url.match(/[?&]v=([^&]+)/) || activeVideo.url.match(/youtu\.be\/([^?&]+)/)
              const id = m?.[1]
              if (!id) {
                return (
                  <a href={activeVideo.url} target="_blank" rel="noreferrer" className="text-primary text-xs font-bold hover:underline">
                    Abrir video en nueva pestaña →
                  </a>
                )
              }
              return (
                <iframe
                  src={`https://www.youtube.com/embed/${id}?autoplay=1`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
