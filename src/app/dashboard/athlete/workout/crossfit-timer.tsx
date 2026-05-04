'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Timer as TimerIcon, Volume2, VolumeX, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'framer-motion'

export type TimerType = 'amrap' | 'for_time' | 'emom' | 'tabata'

interface TimerConfig {
  minutes?: number
  seconds?: number
  rounds?: number
  work?: number
  rest?: number
}

export function CrossFitTimer({ 
  type, 
  config, 
  onClose 
}: { 
  type: TimerType, 
  config: TimerConfig,
  onClose: () => void
}) {
  const [isActive, setIsActive] = useState(false)
  const [isSoundEnabled, setIsSoundEnabled] = useState(true)
  const [time, setTime] = useState(0) // in seconds
  const [round, setRound] = useState(1)
  const [phase, setPhase] = useState<'work' | 'rest' | 'prepare'>('prepare')
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize time based on type
  useEffect(() => {
    if (type === 'amrap') {
      setTime((config.minutes || 0) * 60 + (config.seconds || 0))
    } else if (type === 'for_time') {
      setTime(0)
    } else if (type === 'emom') {
      setTime(60)
      setRound(1)
    } else if (type === 'tabata') {
      setTime(10) // 10s preparation
      setPhase('prepare')
      setRound(1)
    }
  }, [type, config])

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setTime((prev) => {
          if (type === 'for_time') return prev + 1
          
          if (prev <= 1) {
            handleTimerEnd()
            return prev // Logic handled in handleTimerEnd
          }
          
          // Sound at 3, 2, 1
          if (isSoundEnabled && prev <= 4 && prev > 1) {
            playBeep(400, 0.1)
          }
          
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isActive, type, isSoundEnabled])

  const handleTimerEnd = () => {
    if (isSoundEnabled) playBeep(800, 0.3)

    if (type === 'emom') {
      if (round < (config.rounds || 1)) {
        setRound(prev => prev + 1)
        setTime(60)
      } else {
        setIsActive(false)
      }
    } else if (type === 'tabata') {
      if (phase === 'prepare') {
        setPhase('work')
        setTime(config.work || 20)
      } else if (phase === 'work') {
        setPhase('rest')
        setTime(config.rest || 10)
      } else if (phase === 'rest') {
        if (round < (config.rounds || 8)) {
          setRound(prev => prev + 1)
          setPhase('work')
          setTime(config.work || 20)
        } else {
          setIsActive(false)
        }
      }
    } else if (type === 'amrap') {
      setIsActive(false)
    }
  }

  const playBeep = (freq: number, duration: number) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime)
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime)

      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)

      oscillator.start()
      oscillator.stop(audioCtx.currentTime + duration)
    } catch (e) {
      console.warn('Audio context failed', e)
    }
  }

  const formatTime = (s: number) => {
    const mins = Math.floor(Math.abs(s) / 60)
    const secs = Math.abs(s) % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getPhaseColor = () => {
    if (phase === 'work') return 'text-primary'
    if (phase === 'rest') return 'text-blue-400'
    if (phase === 'prepare') return 'text-amber-400'
    return 'text-foreground'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 glass-strong bg-background/80 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="relative w-full max-w-md bg-card border border-border/40 rounded-[3rem] shadow-2xl p-8 flex flex-col items-center">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest">
            <TimerIcon className="w-3.5 h-3.5" />
            {type.replace('_', ' ')}
          </div>
          {type === 'tabata' || type === 'emom' ? (
            <h4 className={`text-sm font-bold uppercase tracking-tight ${getPhaseColor()}`}>
              {phase === 'prepare' ? 'Preparate' : phase === 'work' ? `Ronda ${round} - Trabajo` : `Ronda ${round} - Descanso`}
            </h4>
          ) : (
            <h4 className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              Entrenamiento en curso
            </h4>
          )}
        </div>

        <div className={`text-8xl font-black font-mono tracking-tighter mb-12 tabular-nums ${getPhaseColor()}`}>
          {formatTime(time)}
        </div>

        <div className="grid grid-cols-3 gap-6 w-full max-w-[280px]">
          <Button
            variant="secondary"
            size="icon"
            className="w-16 h-16 rounded-3xl"
            onClick={() => {
              setIsActive(false)
              if (type === 'amrap') setTime((config.minutes || 0) * 60 + (config.seconds || 0))
              else if (type === 'for_time') setTime(0)
              else if (type === 'emom') { setTime(60); setRound(1); }
              else if (type === 'tabata') { setTime(10); setPhase('prepare'); setRound(1); }
            }}
          >
            <RotateCcw className="w-6 h-6" />
          </Button>

          <Button
            size="icon"
            className={`w-16 h-16 rounded-3xl shadow-xl transition-transform active:scale-95 ${isActive ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-primary hover:bg-primary shadow-primary/20'}`}
            onClick={() => setIsActive(!isActive)}
          >
            {isActive ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current translate-x-0.5" />}
          </Button>

          <Button
            variant="secondary"
            size="icon"
            className="w-16 h-16 rounded-3xl"
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
          >
            {isSoundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6 text-muted-foreground/40" />}
          </Button>
        </div>

        {(type === 'emom' || type === 'tabata') && (
          <div className="mt-8 flex gap-2">
            {Array.from({ length: config.rounds || 1 }).map((_, i) => (
              <div 
                key={i} 
                className={`w-2 h-2 rounded-full transition-all duration-500 ${i + 1 < round ? 'bg-primary' : i + 1 === round ? 'bg-primary w-6 animate-pulse' : 'bg-secondary'}`} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
