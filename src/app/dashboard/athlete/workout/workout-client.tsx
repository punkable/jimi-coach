'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, CheckCircle2, Play, Pause, RotateCcw, Calculator, Timer as TimerIcon, X, Send, Dumbbell, PlusCircle, Search, Trophy, AlertCircle, Video, PlayCircle, Edit3 } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { submitWorkoutResult, submitReadiness } from '../actions'
import { Battery, Brain, Activity } from 'lucide-react'
import { WorkoutSetsList, WorkoutSet } from './workout-sets-list'
import { SmartRoutineText } from '@/components/workout/smart-routine-text'
import { CrossFitTimer, TimerType } from './crossfit-timer'

export function WorkoutClient({ day, hasReadiness, prs, allExercises, viewOnly = false }: { day: any, hasReadiness?: boolean, prs?: Record<string, { weight: number, reps: number }>, allExercises?: any[], viewOnly?: boolean }) {
  const [activeTab, setActiveTab] = useState<'workout' | 'tools'>('workout')
  // Never show readiness in view-only mode
  const [readinessOpen, setReadinessOpen] = useState(!hasReadiness && !viewOnly)
  const [sleep, setSleep] = useState('3')
  const [stress, setStress] = useState('3')
  const [soreness, setSoreness] = useState('3')
  const [isSubmittingReadiness, setIsSubmittingReadiness] = useState(false)
  const [completedBlocks, setCompletedBlocks] = useState<Record<string, boolean>>({})

  // Extra Exercises State
  const [extraMovements, setExtraMovements] = useState<any[]>([])
  const [addExerciseOpen, setAddExerciseOpen] = useState(false)
  const [exerciseSearch, setExerciseSearch] = useState('')
  
  // Hevy-Style State
  const [allSetsData, setAllSetsData] = useState<Record<string, WorkoutSet[]>>({})
  const [restTimerSeconds, setRestTimerSeconds] = useState<number | null>(null)

  // CrossFit Timer State
  const [activeTimer, setActiveTimer] = useState<{ type: TimerType, config: any } | null>(null)

  // ── Persist workout progress to localStorage ──────────────────────────────
  // Storage shape: { sets, blocks, startTime (ISO when first started), updatedAt (ISO last touched) }
  // - We keep startTime stable across saves so the session timer is real, not "time since last save".
  // - We auto-clear on resume if updatedAt is from before today (stale).
  // - Only sessions with meaningful progress (any completed set or block) are kept on save.
  const [isLoaded, setIsLoaded] = useState(false)
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null)
  const [workoutElapsed, setWorkoutElapsed] = useState(0)
  const storageKey = `wod-progress-${day?.id}`

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        const { sets, blocks, startTime, updatedAt, timestamp } = parsed
        const lastTouchIso = updatedAt || timestamp
        const lastTouchDate = lastTouchIso ? new Date(lastTouchIso) : null
        const isToday = lastTouchDate && lastTouchDate.toDateString() === new Date().toDateString()
        const ageMs = lastTouchDate ? Date.now() - lastTouchDate.getTime() : Infinity
        if (isToday && ageMs < 24 * 60 * 60 * 1000) {
          if (sets) setAllSetsData(sets)
          if (blocks) setCompletedBlocks(blocks)
          const startIso = startTime && !isNaN(new Date(startTime).getTime()) ? startTime : lastTouchIso
          if (startIso) {
            setSessionStartTime(startIso)
            setWorkoutElapsed(Math.floor((Date.now() - new Date(startIso).getTime()) / 1000))
          }
        } else {
          localStorage.removeItem(storageKey)
        }
      }
    } catch (e) {
      console.error('Error loading progress:', e)
      try { localStorage.removeItem(storageKey) } catch {}
    } finally {
      setIsLoaded(true)
    }
  }, [storageKey])

  useEffect(() => {
    if (!day?.id || !isLoaded) return
    try {
      const setsArr = Object.values(allSetsData).flat()
      const hasMeaningfulProgress =
        setsArr.some((s: any) => s.is_completed || s.weight || s.reps || s.distance || s.time_seconds) ||
        Object.values(completedBlocks).some(Boolean)

      if (!hasMeaningfulProgress) {
        localStorage.removeItem(storageKey)
        return
      }

      const nowIso = new Date().toISOString()
      const startIso = sessionStartTime || nowIso
      if (!sessionStartTime) setSessionStartTime(startIso)

      localStorage.setItem(storageKey, JSON.stringify({
        sets: allSetsData,
        blocks: completedBlocks,
        startTime: startIso,
        updatedAt: nowIso,
      }))
    } catch (e) {
      console.error('Error saving progress:', e)
    }
  }, [allSetsData, completedBlocks, storageKey, isLoaded, sessionStartTime])

  // Elapsed ticker — derived from stable sessionStartTime so it doesn't reset on saves
  useEffect(() => {
    const interval = setInterval(() => {
      const startMs = sessionStartTime ? new Date(sessionStartTime).getTime() : Date.now()
      setWorkoutElapsed(Math.floor((Date.now() - startMs) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [sessionStartTime])
  // ─────────────────────────────────────────────────────────────────────────

  // Timer Tick
  useEffect(() => {
    if (restTimerSeconds === null || restTimerSeconds <= 0) return
    const interval = setInterval(() => {
      setRestTimerSeconds(prev => (prev && prev > 0 ? prev - 1 : null))
    }, 1000)
    return () => clearInterval(interval)
  }, [restTimerSeconds])

  // Finish Modal State
  const [finishOpen, setFinishOpen] = useState(false)
  const [rpe, setRpe] = useState('7')
  const [notes, setNotes] = useState('')
  const [videoLink, setVideoLink] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Tools State
  const [time, setTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [rmWeight, setRmWeight] = useState('')
  const [rmReps, setRmReps] = useState('')

  // Timer Logic
  useEffect(() => {
    let interval: any;
    if (isRunning) {
      interval = setInterval(() => setTime(t => t + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }


  // Video Modal State for Smart Text
  const [activeVideo, setActiveVideo] = useState<{ url: string, name: string } | null>(null)

  const toggleBlock = (blockId: string) => {
    const isNowCompleted = !completedBlocks[blockId]
    setCompletedBlocks(prev => ({ ...prev, [blockId]: isNowCompleted }))
    
    // Also mark all sets in this block as completed/uncompleted
    const block = day.workout_blocks.find((b: any) => b.id === blockId)
    if (block?.workout_movements) {
      const newSetsData = { ...allSetsData }
      block.workout_movements.forEach((mov: any) => {
        if (newSetsData[mov.id]) {
          newSetsData[mov.id] = newSetsData[mov.id].map(s => ({ ...s, is_completed: isNowCompleted }))
        }
      })
      setAllSetsData(newSetsData)
    }
  }

  const isWorkoutComplete = () => {
    const totalBlocks = day.workout_blocks?.length ?? 0
    const completedCount = Object.values(completedBlocks).filter(Boolean).length
    return completedCount >= totalBlocks
  }

  const handleSubmitResult = async () => {
    setIsSubmitting(true)
    try {
      // Flatten allSetsData into a single array for the backend
      const setsToSubmit = Object.values(allSetsData).flat().filter(s => s.is_completed)
      
      const res = await submitWorkoutResult(day.id, parseInt(rpe), notes, videoLink, setsToSubmit)
      if (res.success) {
        localStorage.removeItem(storageKey)
        window.location.href = '/dashboard/athlete'
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!day || !day.workout_blocks || day.workout_blocks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full mt-20">
        <h2 className="text-2xl font-bold mb-2">
          {viewOnly ? 'Sin entrenamiento programado' : 'Día sin entrenamiento'}
        </h2>
        <p className="text-muted-foreground mb-8 max-w-xs">
          {viewOnly
            ? 'Este día no tiene ejercicios ni rutina asignada todavía.'
            : 'Tu coach aún no ha cargado bloques para este día. Si crees que ya debería estar listo, pregúntale por WhatsApp.'}
        </p>
        <Link href="/dashboard/athlete">
          <Button variant="outline">Volver al Inicio</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background md:max-w-2xl md:mx-auto md:w-full relative overflow-hidden">
      {/* Smart Video Dialog */}
      <Dialog open={!!activeVideo} onOpenChange={() => setActiveVideo(null)}>
        <DialogContent className="max-w-[90vw] w-[400px] rounded-3xl border-border/40 glass-strong p-0 overflow-hidden">
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
              const embedId = m?.[1]
              if (!embedId) {
                return (
                  <a href={activeVideo.url} target="_blank" rel="noreferrer" className="text-primary text-xs font-bold hover:underline">
                    Abrir video en nueva pestaña →
                  </a>
                )
              }
              return (
                <iframe
                  src={`https://www.youtube.com/embed/${embedId}?autoplay=1`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )
            })()}
          </div>
          <div className="p-4 bg-secondary/20">
            <Button className="w-full" onClick={() => setActiveVideo(null)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header — pt-safe ensures notch/dynamic-island doesn't overlap */}
      <header className="sticky top-0 z-20 bg-background/88 backdrop-blur-xl border-b border-border/60"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Link href="/dashboard/athlete">
              <Button variant="ghost" size="icon" className="rounded-2xl w-10 h-10 -ml-1 shrink-0">
                <ArrowLeft className="w-4.5 h-4.5" />
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-sm font-black tracking-tight leading-none uppercase truncate">{day.name || day.title || 'WOD'}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                {viewOnly ? (
                  <span className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">Solo lectura</span>
                ) : (
                  <span className="text-[10px] text-primary font-black tabular-nums">
                    ⏱ {Math.floor(workoutElapsed / 60).toString().padStart(2, '0')}:{(workoutElapsed % 60).toString().padStart(2, '0')}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground font-medium">
                  · {day.workout_blocks?.length ?? 0} bloques
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {viewOnly ? (
              <Link href={`/dashboard/athlete/workout?dayId=${day.id}`}>
                <Button size="sm" className="h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest mr-1 gap-1.5">
                  <PlayCircle className="w-3.5 h-3.5" /> Iniciar
                </Button>
              </Link>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-2xl w-10 h-10 text-muted-foreground hover:text-destructive"
                onClick={() => {
                  if (confirm('¿Quieres reiniciar la sesión? Se borrará el progreso actual de este día.')) {
                    localStorage.removeItem(storageKey)
                    window.location.reload()
                  }
                }}
                title="Reiniciar Sesión"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
            {!viewOnly && (
              <Button
                variant="ghost"
                size="icon"
                className={`rounded-2xl w-10 h-10 transition-colors ${activeTab === 'tools' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
                onClick={() => setActiveTab(activeTab === 'tools' ? 'workout' : 'tools')}
              >
                {activeTab === 'tools' ? <X className="w-4 h-4" /> : <TimerIcon className="w-4 h-4" />}
              </Button>
            )}
            {!viewOnly && activeTab === 'workout' && (
              <Button
                size="sm"
                className="ml-1 h-9 px-3 rounded-xl font-black uppercase tracking-widest text-[10px] gap-1.5"
                onClick={() => setFinishOpen(true)}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Finalizar</span>
              </Button>
            )}
          </div>
        </div>
        {/* Progress bar */}
        {activeTab === 'workout' && (() => {
          const total = day.workout_blocks?.length ?? 0
          const done = Object.values(completedBlocks).filter(Boolean).length
          const pct = total > 0 ? (done / total) * 100 : 0
          return (
            <div className="h-0.5 bg-border/20">
              <div
                className="h-full bg-primary transition-all duration-700 ease-out shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                style={{ width: `${pct}%` }}
              />
            </div>
          )
        })()}
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-5" style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'tools' ? (
            <motion.div 
              key="tools"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Chronometer */}
              <Card className="ios-panel border-primary/30">
                <CardContent className="p-6 flex flex-col items-center">
                  <TimerIcon className="w-8 h-8 text-primary mb-4" />
                  <div className="text-6xl font-black tracking-tighter tabular-nums mb-6 px-4 py-2 bg-secondary/50 rounded-2xl border border-white/5 drop-shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                    {formatTime(time)}
                  </div>
                  <div className="flex gap-4">
                    <Button size="lg" variant={isRunning ? "destructive" : "default"} onClick={() => setIsRunning(!isRunning)} className="w-24 rounded-full">
                      {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </Button>
                    <Button size="lg" variant="outline" onClick={() => { setIsRunning(false); setTime(0) }} className="w-24 rounded-full">
                      <RotateCcw className="w-6 h-6" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

            </motion.div>
          ) : (
            <motion.div 
              key="workout"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {day.workout_blocks.map((block: any) => {
                const isCompleted = completedBlocks[block.id]
                const blockMovCount = block.workout_movements?.length ?? 0
                const routineText = typeof block.description === 'string' ? block.description.trim() : ''
                const footerText = typeof block.description_footer === 'string' ? block.description_footer.trim() : ''
                
                const typeColors: Record<string, string> = {
                  strength: 'border-l-[var(--strength)]',
                  metcon: 'border-l-[var(--metcon)]',
                  gymnastics: 'border-l-[var(--gymnastics)]',
                  warmup: 'border-l-[var(--warmup)]',
                  cooldown: 'border-l-[var(--cooldown)]',
                }
                const accentColor = typeColors[block.type] || 'border-l-primary'
                const bgAccent = block.type ? `bg-[var(--${block.type})]/5` : 'bg-primary/5'
                const iconBg = block.type ? `bg-[var(--${block.type})]/10 text-[var(--${block.type})]` : 'bg-primary/10 text-primary'

                return (
                  <div
                    key={block.id}
                    className={`ios-panel rounded-[24px] border transition-all duration-300 overflow-hidden border-l-4 ${accentColor} ${
                      isCompleted
                        ? 'opacity-70 bg-secondary/20'
                        : `border-border/70 ${bgAccent}`
                    }`}
                  >
                    {/* Block header */}
                    <div className={`flex items-center justify-between gap-3 px-4 py-4 border-b border-border/60 ${isCompleted ? 'bg-primary/5' : ''}`}>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleBlock(block.id)}
                          className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${
                            isCompleted 
                              ? 'bg-primary text-primary-foreground shadow-lg' 
                              : `${iconBg} border border-border/60`
                          }`}
                        >
                          <CheckCircle2 className={`w-5 h-5 ${isCompleted ? 'animate-in zoom-in-50' : 'opacity-40'}`} />
                        </button>
                        <div className="min-w-0">
                          <h3 className={`font-black text-sm tracking-tight uppercase leading-none truncate ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {block.name}
                          </h3>
                          <p className="text-[10px] text-muted-foreground mt-1 font-medium truncate">
                            {blockMovCount > 0 ? `${blockMovCount} ejercicios` : 'Rutina de texto'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        {block.timer_type && !isCompleted && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveTimer({ type: block.timer_type, config: block.timer_config || {} })
                            }}
                            className="h-8 rounded-xl border-primary/30 text-primary hover:bg-primary/10 gap-1.5 px-3 text-[10px] font-black uppercase tracking-widest"
                          >
                            <TimerIcon className="w-3.5 h-3.5" /> Iniciar
                          </Button>
                        )}
                        {isCompleted && (
                          <span className="text-[9px] font-black bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase tracking-widest">
                            Completado
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Routine Description */}
                    {routineText && (
                      <div className="px-4 py-4 bg-[var(--gymnastics)]/8 bg-gradient-to-br from-[var(--gymnastics)]/10 to-transparent border-b border-[var(--gymnastics)]/20">
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gymnastics)]">
                              Rutina libre del WOD
                            </p>
                            <p className="text-[10px] text-muted-foreground font-semibold mt-1">
                              Formato, notas y ejercicios con video vinculados por tu coach.
                            </p>
                          </div>
                          <div className="h-9 w-9 rounded-2xl bg-[var(--gymnastics)]/10 border border-[var(--gymnastics)]/20 flex items-center justify-center shrink-0">
                            <Video className="w-4 h-4 text-[var(--gymnastics)]" />
                          </div>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-background/55 p-4">
                          <SmartRoutineText 
                            text={routineText} 
                            exercises={allExercises || []} 
                            blockExercises={block.workout_movements?.map((m: any) => m.exercises).filter(Boolean) || []}
                            onVideoClick={(url, name) => setActiveVideo({ url, name })}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Movements */}
                    {!isCompleted && (
                      <div className="space-y-3 p-3">
                        {block.workout_movements.map((mov: any, mIdx: number) => {
                          const hasSets = (mov.sets || 0) > 0
                          return (
                            <div key={mIdx} className="p-4 space-y-4 rounded-2xl border border-border/60 bg-background/40">
                              <div className="flex gap-3">
                                {/* Video/icon thumb */}
                                <div className="w-12 h-12 rounded-2xl bg-secondary/50 shrink-0 flex items-center justify-center border border-border/60 relative overflow-hidden group">
                                  {mov.exercises?.video_url ? (
                                    <button 
                                      onClick={() => setActiveVideo({ url: mov.exercises.video_url, name: mov.exercises.name })}
                                      className="absolute inset-0 flex items-center justify-center bg-primary/5 hover:bg-primary/15 transition-colors">
                                      <Play className="w-5 h-5 text-primary fill-primary/20 group-hover:scale-110 transition-transform" />
                                    </button>
                                  ) : (
                                    <Dumbbell className="w-5 h-5 text-muted-foreground/30" />
                                  )}
                                </div>
                                
                                <div className="flex-1">
                                  <h4 className="font-bold text-foreground text-sm leading-tight uppercase tracking-tight">{mov.exercises?.name || 'Movimiento'}</h4>
                                  {mov.exercises?.instructions && (
                                    <p className="text-[10px] text-muted-foreground leading-snug mt-1 italic">
                                      {mov.exercises.instructions}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {hasSets && (
                                      <span className="text-[10px] font-black bg-secondary/60 text-secondary-foreground px-2 py-0.5 rounded-md uppercase tracking-widest border border-border/20">
                                        {mov.sets} x {mov.reps || '-'}
                                      </span>
                                    )}
                                    {mov.weight_percentage && (
                                      <span className="text-[10px] font-black bg-primary/15 text-primary px-2 py-0.5 rounded-md uppercase tracking-widest border border-primary/20">
                                        {mov.weight_percentage}
                                      </span>
                                    )}
                                    {mov.rest && (
                                      <span className="text-[10px] font-black bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-md uppercase tracking-widest border border-blue-500/20 flex items-center gap-1">
                                        <TimerIcon className="w-2.5 h-2.5" /> {mov.rest}
                                      </span>
                                    )}
                                  </div>
                                  {prs && mov.exercises?.id && prs[mov.exercises.id] && (
                                    <div className="mt-2 flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg w-fit">
                                      <Trophy className="w-3 h-3 text-amber-500" />
                                      <span className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter">
                                        PB: {prs[mov.exercises.id].weight}kg × {prs[mov.exercises.id].reps}
                                      </span>
                                    </div>
                                  )}
                                  {mov.notes && <p className="text-[10px] text-muted-foreground mt-2 border-l-2 border-primary/30 pl-2">{mov.notes}</p>}
                                </div>
                              </div>

                                {hasSets && !viewOnly && (
                                  <WorkoutSetsList
                                    movement={mov}
                                    prs={prs}
                                    initialSets={allSetsData[mov.id]}
                                    onSetChange={(sets) => {
                                      setAllSetsData(prev => ({ ...prev, [mov.id]: sets }))
                                      const updatedAllSets: Record<string, WorkoutSet[]> = { ...allSetsData, [mov.id]: sets }
                                      const allBlockMovements = block.workout_movements || []
                                      let blockCompleted = true
                                      allBlockMovements.forEach((m: any) => {
                                        if ((m.sets || 0) <= 0) return // Skip video-only movements
                                        const mId = m.id as string
                                        const mSets = updatedAllSets[mId]
                                        if (!mSets || mSets.length === 0 || !mSets.every((s: any) => s.is_completed)) {
                                          blockCompleted = false
                                        }
                                      })
                                      if (blockCompleted && allBlockMovements.length > 0) {
                                        setCompletedBlocks(prev => ({ ...prev, [block.id]: true }))
                                      } else if (!blockCompleted) {
                                        setCompletedBlocks(prev => ({ ...prev, [block.id]: false }))
                                      }
                                    }}
                                    onTimerStart={(secs) => setRestTimerSeconds(secs)}
                                  />
                                )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Footer free-text — notes after movements */}
                    {footerText && (
                      <div className="px-4 py-4 bg-[var(--gymnastics)]/5 border-t border-[var(--gymnastics)]/15">
                        <div className="flex items-center gap-2 mb-2">
                          <Edit3 className="w-3.5 h-3.5 text-[var(--gymnastics)]" />
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--gymnastics)]">
                            Notas finales
                          </p>
                        </div>
                        <div className="rounded-2xl border border-border/60 bg-background/55 p-3">
                          <SmartRoutineText
                            text={footerText}
                            exercises={allExercises || []}
                            blockExercises={block.workout_movements?.map((m: any) => m.exercises).filter(Boolean) || []}
                            onVideoClick={(url, name) => setActiveVideo({ url, name })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              {/* Extra Movements Section */}
              {extraMovements.map((mov, idx) => (
                <div key={`extra-${idx}`} className="ios-panel rounded-2xl border-primary/20 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center justify-between px-4 py-3 bg-primary/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                        <PlusCircle className="w-4 h-4 text-primary" />
                      </div>
                      <h3 className="font-black text-sm tracking-tight uppercase">{mov.name}</h3>
                    </div>
                    <button 
                      onClick={() => setExtraMovements(prev => prev.filter((_, i) => i !== idx))}
                      className="text-muted-foreground/40 hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4">
                    <WorkoutSetsList
                      movement={{ id: `extra-${idx}`, exercises: mov, sets: 3 }}
                      initialSets={allSetsData[`extra-${idx}`]}
                      onSetChange={(sets) => {
                        setAllSetsData(prev => ({ ...prev, [`extra-${idx}`]: sets }))
                      }}
                      onTimerStart={(secs) => setRestTimerSeconds(secs)}
                    />
                  </div>
                </div>
              ))}

              {/* Add Extra Exercise Button */}
              <button
                onClick={() => setAddExerciseOpen(true)}
                className="w-full py-4 border border-dashed border-border/70 rounded-2xl text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest"
              >
                <PlusCircle className="w-4 h-4" />
                Añadir Ejercicio Extra
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Rest Timer */}
      <AnimatePresence>
        {restTimerSeconds !== null && restTimerSeconds > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed right-4 z-50"
            style={{ bottom: 'calc(env(safe-area-inset-bottom) + 6rem)' }}
          >
            <div className="glass bg-primary/90 text-primary-foreground px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 border border-primary-foreground/20">
              <TimerIcon className="w-5 h-5 animate-pulse" />
              <span className="font-mono font-bold text-lg">
                {Math.floor(restTimerSeconds / 60)}:{(restTimerSeconds % 60).toString().padStart(2, '0')}
              </span>
              <button 
                onClick={() => setRestTimerSeconds(null)} 
                className="ml-2 bg-primary-foreground/20 hover:bg-primary-foreground/40 rounded-full p-1 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Home-indicator spacer for iOS */}
      <div className="shrink-0" style={{ height: 'env(safe-area-inset-bottom)' }} />

      {/* Finish Confirmation / Feedback Modal */}
      <Dialog open={finishOpen} onOpenChange={setFinishOpen}>
        <DialogContent className="max-w-[90vw] w-[400px] rounded-3xl border-border/40 glass-strong">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Finalizar Entrenamiento</DialogTitle>
          </DialogHeader>
          
          {!isWorkoutComplete() && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl mb-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">WOD Incompleto</p>
                <p className="text-[11px] text-amber-200/70 mt-1 leading-relaxed">
                  Aún tienes bloques sin marcar como completados. ¿Estás seguro de que quieres finalizar ahora?
                </p>
              </div>
            </div>
          )}

          <div className="space-y-6 pt-2">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Esfuerzo Percibido (RPE)</Label>
                <span className="text-lg font-black text-primary">{rpe}/10</span>
              </div>
              <input 
                type="range" min="1" max="10" 
                value={rpe} onChange={(e) => setRpe(e.target.value)}
                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[8px] font-bold text-muted-foreground/40 uppercase tracking-tighter">
                <span>Paseo por el parque</span>
                <span>Muerte total</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Notas para el Coach</Label>
              <textarea 
                id="notes" 
                placeholder="Ej: Molestia en hombro, me sentí fuerte..." 
                value={notes} onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-background/50 border border-border/40 rounded-xl p-3 text-sm min-h-[80px] focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Link de Video (Técnica)</Label>
              <div className="relative">
                <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                <Input 
                  id="video" placeholder="Google Drive, YouTube, IG..." 
                  value={videoLink} onChange={(e) => setVideoLink(e.target.value)}
                  className="bg-background/50 pl-10 border-border/40 h-11"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                className="flex-1 h-12 rounded-xl font-bold uppercase tracking-widest text-[11px]"
                onClick={() => setFinishOpen(false)}
              >
                Volver
              </Button>
              <Button 
                className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-[0_8px_20px_rgba(var(--primary),0.3)]"
                onClick={handleSubmitResult}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Guardando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Extra Exercise Dialog */}
      <Dialog open={addExerciseOpen} onOpenChange={setAddExerciseOpen}>
        <DialogContent className="max-w-[90vw] w-[400px] rounded-3xl border-border/40 glass-strong p-0 overflow-hidden">
          <div className="p-6 pb-0">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">Añadir Ejercicio</DialogTitle>
            </DialogHeader>
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
              <Input 
                placeholder="Buscar ejercicio..." 
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                className="bg-background/50 pl-10 border-border/40"
              />
            </div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-2 mt-2">
            {allExercises?.filter(ex => ex.name.toLowerCase().includes(exerciseSearch.toLowerCase())).map(ex => (
              <button
                key={ex.id}
                onClick={() => {
                  setExtraMovements(prev => [...prev, ex])
                  setAddExerciseOpen(false)
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-primary/10 transition-colors text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-secondary/40 flex items-center justify-center border border-border/30 group-hover:border-primary/30 transition-all">
                  <Dumbbell className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{ex.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{ex.category || 'General'}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Readiness Modal */}
      <Dialog open={readinessOpen} onOpenChange={setReadinessOpen}>
        <DialogContent className="max-w-[90vw] w-[400px] rounded-3xl border-border/40 glass-strong">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              Estado Diario
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-8 pt-6">
            <ReadinessSlider 
              label="Calidad de Sueño" 
              value={sleep} 
              onChange={setSleep} 
              icon={Battery} 
              labels={['Fatal', 'Pobre', 'Ok', 'Bien', 'Top']} 
            />
            <ReadinessSlider 
              label="Nivel de Estrés" 
              value={stress} 
              onChange={setStress} 
              icon={Brain} 
              labels={['Bajo', 'Ok', 'Medio', 'Alto', 'Máximo']} 
            />
            <ReadinessSlider 
              label="Dolor Muscular" 
              value={soreness} 
              onChange={setSoreness} 
              icon={Dumbbell} 
              labels={['Nada', 'Leve', 'Ok', 'Mucho', 'Roto']} 
            />
            
            <Button 
              className="w-full h-14 rounded-2xl font-black uppercase tracking-widest shadow-[0_8px_30px_rgba(var(--primary),0.3)]"
              disabled={isSubmittingReadiness}
              onClick={async () => {
                setIsSubmittingReadiness(true)
                try {
                  await submitReadiness(parseInt(sleep), parseInt(stress), parseInt(soreness))
                  setReadinessOpen(false)
                } catch (e) {
                  console.error(e)
                } finally {
                  setIsSubmittingReadiness(false)
                }
              }}
            >
              {isSubmittingReadiness ? 'Guardando...' : 'Empezar Entrenamiento'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CrossFit Timer Modal */}
      {activeTimer && (
        <CrossFitTimer 
          type={activeTimer.type} 
          config={activeTimer.config} 
          onClose={() => setActiveTimer(null)} 
        />
      )}
    </div>
  )
}

function ReadinessSlider({ label, value, onChange, icon: Icon, labels }: { label: string, value: string, onChange: (v: string) => void, icon: any, labels: string[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</Label>
      </div>
      <input 
        type="range" min="1" max="5" 
        value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
      />
      <div className="flex justify-between px-1">
        {labels.map((l, i) => (
          <span key={i} className={`text-[8px] font-bold uppercase tracking-tighter transition-colors ${parseInt(value) === i + 1 ? 'text-primary' : 'text-muted-foreground/30'}`}>
            {l}
          </span>
        ))}
      </div>
    </div>
  )
}
