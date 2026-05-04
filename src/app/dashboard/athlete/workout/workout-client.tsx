'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, CheckCircle2, Play, Pause, RotateCcw, Calculator, Timer as TimerIcon, X, Send, Dumbbell, PlusCircle, Search, Trophy, AlertCircle, Video } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { submitWorkoutResult, submitReadiness } from '../actions'
import { Battery, Brain, Activity } from 'lucide-react'
import { WorkoutSetsList, WorkoutSet } from './workout-sets-list'
import { SmartRoutineText } from '@/components/workout/smart-routine-text'
import { CrossFitTimer, TimerType } from './crossfit-timer'

export function WorkoutClient({ day, hasReadiness, prs, allExercises }: { day: any, hasReadiness?: boolean, prs?: Record<string, { weight: number, reps: number }>, allExercises?: any[] }) {
  const [activeTab, setActiveTab] = useState<'workout' | 'tools'>('workout')
  const [readinessOpen, setReadinessOpen] = useState(!hasReadiness)
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
  const [isLoaded, setIsLoaded] = useState(false)
  const storageKey = `wod-progress-${day?.id}`
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const { sets, blocks, timestamp } = JSON.parse(saved)
        // Only resume if it's from today
        const isToday = new Date(timestamp).toDateString() === new Date().toDateString()
        if (isToday) {
          if (sets) setAllSetsData(sets)
          if (blocks) setCompletedBlocks(blocks)
        } else {
          localStorage.removeItem(storageKey)
        }
      }
    } catch (e) {
      console.error('Error loading progress:', e)
    } finally {
      setIsLoaded(true)
    }
  }, [storageKey])

  useEffect(() => {
    if (!day?.id || !isLoaded) return
    try {
      localStorage.setItem(storageKey, JSON.stringify({ 
        sets: allSetsData, 
        blocks: completedBlocks,
        timestamp: new Date().toISOString()
      }))
    } catch (e) {
      console.error('Error saving progress:', e)
    }
  }, [allSetsData, completedBlocks, storageKey, isLoaded])
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
    setCompletedBlocks(prev => ({ ...prev, [blockId]: !prev[blockId] }))
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
        <h2 className="text-2xl font-bold mb-2">Día de Descanso</h2>
        <p className="text-muted-foreground mb-8">No tienes ejercicios asignados o tu coach aún está construyendo este plan.</p>
        <Link href="/dashboard/athlete">
          <Button variant="outline">Volver al Inicio</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background md:max-w-lg md:mx-auto md:w-full md:border-x md:border-border/40 relative overflow-hidden">
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
            {activeVideo?.url ? (
              <iframe 
                src={activeVideo.url.replace('watch?v=', 'embed/')} 
                className="w-full h-full" 
                allowFullScreen 
              />
            ) : (
              <p className="text-white/40 text-xs">Video no disponible</p>
            )}
          </div>
          <div className="p-4 bg-secondary/20">
            <Button className="w-full" onClick={() => setActiveVideo(null)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header — pt-safe ensures notch/dynamic-island doesn't overlap */}
      <header className="sticky top-0 z-20 bg-background/85 backdrop-blur-xl border-b border-border/30"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <Link href="/dashboard/athlete">
              <Button variant="ghost" size="icon" className="rounded-full w-9 h-9 -ml-1">
                <ArrowLeft className="w-4.5 h-4.5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-sm font-black tracking-tight leading-none uppercase">{day.name || day.title || 'WOD'}</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                {day.workout_blocks?.length ?? 0} bloques · {day.workout_blocks?.reduce((a: number, b: any) => a + (b.workout_movements?.length ?? 0), 0) ?? 0} ejercicios
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full w-9 h-9 text-muted-foreground hover:text-destructive"
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
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full w-9 h-9 transition-colors ${activeTab === 'tools' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
              onClick={() => setActiveTab(activeTab === 'tools' ? 'workout' : 'tools')}
            >
              {activeTab === 'tools' ? <X className="w-4 h-4" /> : <TimerIcon className="w-4 h-4" />}
            </Button>
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

      {/* Main Content Area — pb-36 leaves room for finish button + home indicator */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6" style={{ paddingBottom: 'calc(12rem + env(safe-area-inset-bottom))' }}>
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
              <Card className="glass border-primary/30">
                <CardContent className="p-6 flex flex-col items-center">
                  <Timer className="w-8 h-8 text-primary mb-4" />
                  <div className="text-6xl font-black tracking-tighter tabular-nums mb-6 text-foreground drop-shadow-[0_0_15px_rgba(var(--primary),0.3)]">
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

                return (
                  <div
                    key={block.id}
                    className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                      isCompleted
                        ? 'border-primary/20 opacity-60 bg-primary/5'
                        : 'glass border-border/40 shadow-sm'
                    }`}
                  >
                    {/* Block header */}
                    <div className={`flex items-center justify-between px-4 py-4 border-b border-border/10 ${isCompleted ? 'bg-primary/5' : ''}`}>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleBlock(block.id)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            isCompleted 
                              ? 'bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.6)]' 
                              : 'bg-secondary/50 text-muted-foreground border border-border/40'
                          }`}
                        >
                          <CheckCircle2 className={`w-5 h-5 ${isCompleted ? 'animate-in zoom-in-50' : 'opacity-40'}`} />
                        </button>
                        <div>
                          <h3 className={`font-black text-sm tracking-tight uppercase leading-none ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {block.name}
                          </h3>
                          <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                            {blockMovCount > 0 ? `${blockMovCount} ejercicios` : 'Rutina de texto'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {block.timer_type && !isCompleted && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveTimer({ type: block.timer_type, config: block.timer_config || {} })
                            }}
                            className="h-8 rounded-full border-primary/30 text-primary hover:bg-primary/10 gap-1.5 px-3 text-[10px] font-black uppercase tracking-widest"
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
                    {block.description && (
                      <div className="px-4 py-4 bg-secondary/5 bg-gradient-to-br from-primary/5 to-transparent border-b border-border/10">
                        <SmartRoutineText 
                          text={block.description} 
                          exercises={allExercises || []} 
                          blockExercises={block.workout_movements?.map((m: any) => m.exercises) || []}
                          onVideoClick={(url, name) => setActiveVideo({ url, name })}
                        />
                      </div>
                    )}
                    
                    {/* Movements */}
                    {!isCompleted && (
                      <div className="divide-y divide-border/20">
                        {block.workout_movements.map((mov: any, mIdx: number) => {
                          const hasSets = (mov.sets || 0) > 0
                          return (
                            <div key={mIdx} className="p-4 space-y-4">
                              <div className="flex gap-3">
                                {/* Video/icon thumb */}
                                <div className="w-12 h-12 rounded-xl bg-secondary/40 shrink-0 flex items-center justify-center border border-border/30 relative overflow-hidden group">
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
                                        <Timer className="w-2.5 h-2.5" /> {mov.rest}
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

                                {hasSets && (
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
                  </div>
                )
              })}
              {/* Extra Movements Section */}
              {extraMovements.map((mov, idx) => (
                <div key={`extra-${idx}`} className="rounded-2xl border glass border-primary/20 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
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
                className="w-full py-3 border-2 border-dashed border-border/50 rounded-xl text-muted-foreground hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2 text-sm font-medium"
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
              <Timer className="w-5 h-5 animate-pulse" />
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

      {/* Floating Finish Button Area — inline style ensures it clears iOS home indicator */}
      {activeTab === 'workout' && (
        <div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/90 to-transparent pt-16 z-30 pointer-events-none"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)', padding: '4rem 1rem max(env(safe-area-inset-bottom), 16px)' }}
        >
          <Button
            className="w-full h-14 text-base font-black uppercase tracking-widest rounded-2xl shadow-[0_8px_30px_rgba(var(--primary),0.4)] active:scale-95 transition-all pointer-events-auto"
            onClick={() => setFinishOpen(true)}
          >
            Finalizar WOD
          </Button>
        </div>
      )}

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


