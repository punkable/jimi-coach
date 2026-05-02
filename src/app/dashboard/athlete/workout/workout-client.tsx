'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, CheckCircle2, Play, Pause, RotateCcw, Calculator, Timer, X, Send, Dumbbell, PlusCircle, Search, Trophy } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { submitWorkoutResult, submitReadiness } from '../actions'
import { Battery, Brain, Activity } from 'lucide-react'
import { WorkoutSetsList, WorkoutSet } from './workout-sets-list'

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

  // ── Persist workout progress to localStorage ──────────────────────────────
  const storageKey = `wod-progress-${day?.id}`
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const { sets, blocks } = JSON.parse(saved)
        if (sets) setAllSetsData(sets)
        if (blocks) setCompletedBlocks(blocks)
      }
    } catch {}
  }, [storageKey])

  useEffect(() => {
    if (!day?.id) return
    try {
      localStorage.setItem(storageKey, JSON.stringify({ sets: allSetsData, blocks: completedBlocks }))
    } catch {}
  }, [allSetsData, completedBlocks, storageKey])
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
  const [estimated1RM, setEstimated1RM] = useState<number | null>(null)

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

  // 1RM Calculator Logic (Epley Formula)
  const calculateRM = () => {
    const w = parseFloat(rmWeight)
    const r = parseInt(rmReps)
    if (w > 0 && r > 0) {
      const rm = w * (1 + r / 30)
      setEstimated1RM(Math.round(rm))
    }
  }

  const toggleBlock = (blockId: string) => {
    setCompletedBlocks(prev => ({ ...prev, [blockId]: !prev[blockId] }))
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
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/85 backdrop-blur-xl border-b border-border/30">
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
          <Button
            variant="ghost"
            size="icon"
            className={`rounded-full w-9 h-9 transition-colors ${activeTab === 'tools' ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
            onClick={() => setActiveTab(activeTab === 'tools' ? 'workout' : 'tools')}
          >
            {activeTab === 'tools' ? <X className="w-4 h-4" /> : <Timer className="w-4 h-4" />}
          </Button>
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
      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
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

              {/* RM Calculator */}
              <Card className="glass">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Calculator className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-lg">Calculadora 1RM</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-xs text-muted-foreground">Peso (kg/lb)</label>
                      <Input type="number" placeholder="Ej: 100" value={rmWeight} onChange={e => setRmWeight(e.target.value)} className="bg-background/50" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Repeticiones</label>
                      <Input type="number" placeholder="Ej: 5" value={rmReps} onChange={e => setRmReps(e.target.value)} className="bg-background/50" />
                    </div>
                  </div>
                  <Button className="w-full" onClick={calculateRM}>Calcular</Button>
                  
                  {estimated1RM && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-6 p-4 bg-primary/10 rounded-xl text-center border border-primary/20">
                      <p className="text-sm text-muted-foreground">Tu 1RM Estimado es:</p>
                      <p className="text-4xl font-black text-primary">{estimated1RM} <span className="text-lg font-normal">kg/lb</span></p>
                    </motion.div>
                  )}
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
                    <div
                      className={`flex items-center justify-between px-4 py-3 cursor-pointer ${
                        isCompleted ? 'bg-transparent' : 'bg-card/50'
                      }`}
                      onClick={() => toggleBlock(block.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                          isCompleted
                            ? 'bg-primary border-primary shadow-[0_0_8px_rgba(var(--primary),0.4)]'
                            : 'border-muted-foreground/30'
                        }`}>
                          {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
                        </div>
                        <div>
                          <h3 className={`font-black text-sm tracking-tight uppercase ${
                            isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}>
                            {block.name}
                          </h3>
                          <p className="text-[10px] text-muted-foreground font-medium">{blockMovCount} ejercicio{blockMovCount !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <X className={`w-4 h-4 text-muted-foreground/40 transition-transform ${isCompleted ? 'rotate-0' : 'rotate-45'}`} />
                    </div>
                    
                    {/* Movements */}
                    {!isCompleted && (
                      <div className="divide-y divide-border/20">
                        {block.workout_movements.map((mov: any, mIdx: number) => (
                          <div key={mIdx} className="p-4 space-y-4">
                            <div className="flex gap-3">
                              {/* Video/icon thumb */}
                              <div className="w-12 h-12 rounded-xl bg-secondary/40 shrink-0 flex items-center justify-center border border-border/30 relative overflow-hidden group">
                                {mov.exercises?.video_url ? (
                                  <a href={mov.exercises.video_url} target="_blank" rel="noopener noreferrer"
                                    className="absolute inset-0 flex items-center justify-center bg-primary/5 hover:bg-primary/15 transition-colors">
                                    <Play className="w-5 h-5 text-primary fill-primary/20 group-hover:scale-110 transition-transform" />
                                  </a>
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
                                  <span className="text-[10px] font-black bg-secondary/60 text-secondary-foreground px-2 py-0.5 rounded-md uppercase tracking-widest border border-border/20">
                                    {mov.sets || '-'} x {mov.reps || '-'}
                                  </span>
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

                            <WorkoutSetsList
                              movement={mov}
                              onSetChange={(sets) => {
                                setAllSetsData(prev => ({ ...prev, [mov.id]: sets }))
                                const updatedAllSets: Record<string, WorkoutSet[]> = { ...allSetsData, [mov.id]: sets }
                                const allBlockMovements = block.workout_movements || []
                                let blockCompleted = true
                                allBlockMovements.forEach((m: any) => {
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
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Extra exercises added by athlete */}
              {extraMovements.length > 0 && (
                <Card className="glass border-border/40 shadow-lg overflow-hidden">
                  <div className="p-4 bg-primary/5 border-b border-border/40">
                    <h3 className="font-bold text-lg">Ejercicios Extra</h3>
                  </div>
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/50">
                      {extraMovements.map((ex: any, idx: number) => {
                        const fakeMovId = `extra-${ex.id}-${idx}`
                        const fakeMov = { id: fakeMovId, exercises: ex, sets: 3, reps: null, rest: null, weight_percentage: null, notes: null }
                        return (
                          <div key={fakeMovId} className="p-4 bg-background/30 flex gap-4">
                            <div className="w-16 h-16 rounded-md overflow-hidden bg-secondary/30 shrink-0 flex items-center justify-center border border-border/50">
                              {ex.video_url ? (
                                <a href={ex.video_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:scale-110 transition-transform">
                                  <Play className="w-8 h-8 fill-primary/20" />
                                </a>
                              ) : (
                                <Dumbbell className="w-6 h-6 text-muted-foreground/50" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-bold text-foreground text-sm">{ex.name}</h4>
                                <button onClick={() => setExtraMovements(prev => prev.filter((_, i) => i !== idx))} className="text-destructive/60 hover:text-destructive shrink-0">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              {ex.instructions && (
                                <p className="text-[11px] text-muted-foreground leading-snug mt-1 mb-2">{ex.instructions}</p>
                              )}
                              <WorkoutSetsList
                                movement={fakeMov}
                                onSetChange={(sets) => setAllSetsData(prev => ({ ...prev, [fakeMovId]: sets }))}
                                onTimerStart={(secs) => setRestTimerSeconds(secs)}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

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
            className="fixed bottom-24 right-4 z-50"
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

      {/* Floating Finish Button Area */}
      {activeTab === 'workout' && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/80 to-transparent pt-12 pb-safe z-30 pointer-events-none">
          <Button 
            className="w-full h-14 text-base font-black uppercase tracking-widest rounded-2xl shadow-[0_8px_30px_rgba(var(--primary),0.4)] active:scale-95 transition-all pointer-events-auto"
            onClick={() => setFinishOpen(true)}
          >
            Finalizar WOD
          </Button>
        </div>
      )}

      {/* Finish Workout Modal */}
      <Dialog open={finishOpen} onOpenChange={setFinishOpen}>
        <DialogContent className="sm:max-w-md glass border-border/50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">¡Entrenamiento Superado!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>¿Qué tan duro estuvo? (RPE: {rpe}/10)</Label>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">Fácil</span>
                <input 
                  type="range" min="1" max="10" 
                  value={rpe} onChange={(e) => setRpe(e.target.value)}
                  className="flex-1 accent-primary"
                />
                <span className="text-xs text-muted-foreground">Máximo</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas para el Coach (Opcional)</Label>
              <Input 
                id="notes" placeholder="Ej: Me dolió un poco el hombro..." 
                value={notes} onChange={(e) => setNotes(e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video">Link de Video Técnico (Opcional)</Label>
              <Input 
                id="video" placeholder="Link de Drive, YouTube o IG" 
                value={videoLink} onChange={(e) => setVideoLink(e.target.value)}
                className="bg-background/50"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Pega el link de tu levantamiento pesado para que el coach lo revise.
              </p>
            </div>

            <div className="pt-4">
              <Button 
                className="w-full gap-2" 
                disabled={isSubmitting}
                onClick={async () => {
                  setIsSubmitting(true)
                  try {
                    const flattenedSets = Object.values(allSetsData).flat()
                    await submitWorkoutResult(day.id, parseInt(rpe), notes, videoLink, flattenedSets)
                    // Clear saved progress after successful submission
                    try { localStorage.removeItem(storageKey) } catch {}
                    setFinishOpen(false)
                    window.location.href = '/dashboard/athlete'
                  } catch (e) {
                    console.error("Error submitting workout", e)
                  } finally {
                    setIsSubmitting(false)
                  }
                }}
              >
                {isSubmitting ? 'Enviando...' : (
                  <>
                    <Send className="w-4 h-4" /> Enviar Resultados
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Readiness Modal */}
      <Dialog open={readinessOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md glass border-border/50 hide-close">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" /> Daily Readiness
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <p className="text-sm text-muted-foreground">Antes de empezar, cuéntale a tu coach cómo te sientes hoy.</p>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Battery className="w-4 h-4 text-blue-500" /> Calidad de Sueño (1-5)</Label>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">Malo</span>
                <input type="range" min="1" max="5" value={sleep} onChange={(e) => setSleep(e.target.value)} className="flex-1 accent-blue-500" />
                <span className="text-xs text-muted-foreground">Excelente</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Brain className="w-4 h-4 text-purple-500" /> Nivel de Estrés (1-5)</Label>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">Bajo</span>
                <input type="range" min="1" max="5" value={stress} onChange={(e) => setStress(e.target.value)} className="flex-1 accent-purple-500" />
                <span className="text-xs text-muted-foreground">Alto</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Dumbbell className="w-4 h-4 text-orange-500" /> Dolor Muscular (1-5)</Label>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">Nada</span>
                <input type="range" min="1" max="5" value={soreness} onChange={(e) => setSoreness(e.target.value)} className="flex-1 accent-orange-500" />
                <span className="text-xs text-muted-foreground">Mucho</span>
              </div>
            </div>

            <Button 
              className="w-full font-bold" 
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
              {isSubmittingReadiness ? 'Guardando...' : 'Iniciar Entrenamiento'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Extra Exercise Modal */}
      <Dialog open={addExerciseOpen} onOpenChange={setAddExerciseOpen}>
        <DialogContent className="sm:max-w-md glass border-border/50 max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-primary" />
              Añadir Ejercicio Extra
            </DialogTitle>
          </DialogHeader>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ejercicio..."
              value={exerciseSearch}
              onChange={e => setExerciseSearch(e.target.value)}
              className="pl-9 bg-background/50"
              autoFocus
            />
          </div>
          <div className="flex-1 overflow-y-auto mt-3 space-y-2 pr-1">
            {(allExercises ?? [])
              .filter(ex => ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()))
              .map((ex: any) => (
                <button
                  key={ex.id}
                  onClick={() => {
                    setExtraMovements(prev => [...prev, ex])
                    setAddExerciseOpen(false)
                    setExerciseSearch('')
                  }}
                  className="w-full text-left p-3 rounded-lg bg-background/50 hover:bg-primary/10 border border-border/30 hover:border-primary/40 transition-all group"
                >
                  <p className="font-semibold text-sm group-hover:text-primary transition-colors">{ex.name}</p>
                  {ex.category && (
                    <p className="text-xs text-muted-foreground mt-0.5">{ex.category}</p>
                  )}
                </button>
              ))
            }
            {(allExercises ?? []).filter(ex => ex.name.toLowerCase().includes(exerciseSearch.toLowerCase())).length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-8">No se encontraron ejercicios</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
