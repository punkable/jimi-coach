'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, CheckCircle2, Play, Pause, RotateCcw, Calculator, Timer, X, Send, Dumbbell } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { submitWorkoutResult, submitReadiness } from '../actions'
import { Battery, Brain, Activity } from 'lucide-react'
import { WorkoutSetsList, WorkoutSet } from './workout-sets-list'

export function WorkoutClient({ day, hasReadiness }: { day: any, hasReadiness?: boolean }) {
  const [activeTab, setActiveTab] = useState<'workout' | 'tools'>('workout')
  const [readinessOpen, setReadinessOpen] = useState(!hasReadiness)
  const [sleep, setSleep] = useState('3')
  const [stress, setStress] = useState('3')
  const [soreness, setSoreness] = useState('3')
  const [isSubmittingReadiness, setIsSubmittingReadiness] = useState(false)
  const [completedBlocks, setCompletedBlocks] = useState<Record<string, boolean>>({})
  
  // Hevy-Style State
  const [allSetsData, setAllSetsData] = useState<Record<string, WorkoutSet[]>>({})
  const [restTimerSeconds, setRestTimerSeconds] = useState<number | null>(null)

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
    <div className="flex-1 flex flex-col h-full bg-background md:max-w-xl md:mx-auto md:w-full md:border-x md:border-border/50 relative shadow-2xl">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border/50 bg-background/80 backdrop-blur z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/athlete">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold tracking-tight">{day.title || 'Entrenamiento'}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="icon" className="rounded-full bg-primary/20 text-primary" onClick={() => setActiveTab(activeTab === 'tools' ? 'workout' : 'tools')}>
            {activeTab === 'tools' ? <X className="w-5 h-5" /> : <Timer className="w-5 h-5" />}
          </Button>
        </div>
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
                
                return (
                  <Card key={block.id} className={`overflow-hidden transition-all duration-300 ${isCompleted ? 'opacity-50 grayscale border-primary/20' : 'glass border-border/40 shadow-lg'}`}>
                    <div className={`p-4 flex items-center justify-between cursor-pointer ${isCompleted ? 'bg-secondary/20' : 'bg-primary/5'}`} onClick={() => toggleBlock(block.id)}>
                      <h3 className={`font-bold text-lg ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {block.name}
                      </h3>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${isCompleted ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                        {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                    </div>
                    
                    {!isCompleted && (
                      <CardContent className="p-0">
                        <div className="divide-y divide-border/50">
                          {block.workout_movements.map((mov: any, mIdx: number) => (
                            <div key={mIdx} className="p-4 bg-background/30 flex gap-4">
                              <div className="w-16 h-16 rounded-md overflow-hidden bg-secondary/30 shrink-0 flex items-center justify-center border border-border/50">
                                {mov.exercises?.video_url ? (
                                  <a href={mov.exercises.video_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:scale-110 transition-transform">
                                    <Play className="w-8 h-8 fill-primary/20" />
                                  </a>
                                ) : (
                                  <Dumbbell className="w-6 h-6 text-muted-foreground/50" />
                                )}
                              </div>
                              
                              <div className="flex-1">
                                <h4 className="font-bold text-foreground text-sm leading-tight mb-1">{mov.exercises?.name || 'Movimiento'}</h4>
                                {mov.exercises?.instructions && (
                                  <p className="text-[11px] text-muted-foreground leading-snug mt-1 mb-2">
                                    {mov.exercises.instructions}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mt-2">
                                  <span className="font-medium bg-secondary/50 text-muted-foreground px-2 py-0.5 rounded flex items-center gap-1">
                                    Objetivo: {mov.sets || '-'}x{mov.reps || '-'}
                                  </span>
                                  {mov.weight_percentage && <span className="font-medium bg-primary/20 text-primary px-2 py-0.5 rounded">{mov.weight_percentage}</span>}
                                  {mov.rest && <span className="font-medium bg-blue-500/20 text-blue-500 px-2 py-0.5 rounded flex items-center gap-1"><Timer className="w-3 h-3" /> {mov.rest}</span>}
                                </div>
                                {mov.notes && <p className="text-xs text-muted-foreground mt-2 italic">{mov.notes}</p>}

                                <WorkoutSetsList 
                                  movement={mov} 
                                  onSetChange={(sets) => {
                                    setAllSetsData(prev => ({ ...prev, [mov.id]: sets }))
                                    // Auto-complete block if all sets of all movements in block are completed
                                    const updatedAllSets: Record<string, WorkoutSet[]> = { ...allSetsData, [mov.id]: sets }
                                    const allBlockMovements = block.workout_movements || []
                                    let blockCompleted = true
                                    allBlockMovements.forEach((m: any) => {
                                      const mId = m.id as string;
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
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })}
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

      {/* Floating Finish Button */}
      {activeTab === 'workout' && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent pt-12">
          <Button 
            className="w-full h-14 text-lg font-bold rounded-full shadow-[0_0_20px_rgba(var(--primary),0.3)]"
            onClick={() => setFinishOpen(true)}
          >
            COMPLETAR ENTRENAMIENTO
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

    </div>
  )
}
