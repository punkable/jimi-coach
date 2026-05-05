'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Timer, Calculator, Play, Pause, RotateCcw, Plus, Trash2, ArrowLeftRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

// ─── Timer Tool ──────────────────────────────────────────────────────────────

type TimerMode = 'countdown' | 'stopwatch' | 'emom' | 'amrap'

const PRESET_TIMES = [
  { label: '5 min',  seconds: 300 },
  { label: '10 min', seconds: 600 },
  { label: '12 min', seconds: 720 },
  { label: '15 min', seconds: 900 },
  { label: '20 min', seconds: 1200 },
]

function pad(n: number) { return String(n).padStart(2, '0') }
function formatTime(s: number) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
}

function TimerTool() {
  const [mode, setMode] = useState<TimerMode>('countdown')
  const [duration, setDuration] = useState(600)
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [intervalLen, setIntervalLen] = useState(60)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const remaining = mode === 'countdown' || mode === 'amrap'
    ? Math.max(0, duration - elapsed)
    : elapsed

  const currentInterval = mode === 'emom' ? Math.floor(elapsed / intervalLen) + 1 : null
  const intervalRemaining = mode === 'emom' ? intervalLen - (elapsed % intervalLen) : null

  const stop = useCallback(() => {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  const reset = useCallback(() => {
    stop()
    setElapsed(0)
  }, [stop])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed((e) => {
          if ((mode === 'countdown' || mode === 'amrap') && e >= duration) {
            stop()
            return e
          }
          return e + 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, mode, duration, stop])

  const modeTabs: { key: TimerMode; label: string }[] = [
    { key: 'countdown',  label: 'Cuenta regresiva' },
    { key: 'stopwatch',  label: 'Cronómetro' },
    { key: 'amrap',      label: 'AMRAP' },
    { key: 'emom',       label: 'EMOM' },
  ]

  return (
    <div className="space-y-5">
      {/* Mode tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {modeTabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { reset(); setMode(key) }}
            className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              mode === key
                ? 'bg-primary text-black'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Duration config */}
      {(mode === 'countdown' || mode === 'amrap' || mode === 'emom') && (
        <div className="space-y-3">
          <p className="section-title">{mode === 'emom' ? 'Duración total' : 'Tiempo'}</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_TIMES.map(({ label, seconds }) => (
              <button
                key={seconds}
                onClick={() => { reset(); setDuration(seconds) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${
                  duration === seconds
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {mode === 'emom' && (
            <div className="flex items-center gap-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide w-28">Intervalo (seg)</p>
              <div className="flex items-center gap-2">
                {[30, 45, 60, 90, 120].map((s) => (
                  <button
                    key={s}
                    onClick={() => { reset(); setIntervalLen(s) }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                      intervalLen === s
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {s}s
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Big clock */}
      <div className="ios-panel p-8 text-center space-y-2">
        <p className="font-mono text-7xl font-black tracking-tight tabular-nums">
          {formatTime(mode === 'countdown' || mode === 'amrap' ? remaining : elapsed)}
        </p>
        {mode === 'emom' && currentInterval !== null && (
          <div className="space-y-1">
            <p className="text-sm font-black text-primary uppercase tracking-widest">
              Intervalo #{currentInterval}
            </p>
            <p className="text-3xl font-mono font-black text-muted-foreground">
              {formatTime(intervalRemaining!)}
            </p>
          </div>
        )}
        {(mode === 'countdown' || mode === 'amrap') && elapsed >= duration && (
          <p className="text-primary font-black uppercase tracking-widest text-sm animate-pulse">¡Tiempo!</p>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <Button
          className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-sm gap-2"
          onClick={() => setRunning((r) => !r)}
          disabled={(mode === 'countdown' || mode === 'amrap') && elapsed >= duration}
        >
          {running ? <><Pause className="w-4 h-4" /> Pausar</> : <><Play className="w-4 h-4" /> Iniciar</>}
        </Button>
        <Button
          variant="outline"
          className="h-12 px-4 rounded-xl"
          onClick={reset}
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

// ─── Percentage Calculator ────────────────────────────────────────────────────

const DEFAULT_PERCENTAGES = [50, 55, 60, 65, 70, 75, 80, 85, 90, 95]

function PercentageCalculator() {
  const [unit, setUnit] = useState<'kg' | 'lbs'>('kg')
  const [maxWeight, setMaxWeight] = useState('')
  const [percentages, setPercentages] = useState<number[]>(DEFAULT_PERCENTAGES)
  const [customInput, setCustomInput] = useState('')

  const max = parseFloat(maxWeight) || 0

  const toDisplay = (kg: number) => unit === 'kg' ? kg : +(kg * 2.20462).toFixed(1)
  const fromDisplay = (val: number) => unit === 'kg' ? val : +(val / 2.20462).toFixed(2)

  const baseKg = unit === 'kg' ? max : fromDisplay(max)

  const addCustom = () => {
    const v = parseInt(customInput)
    if (v > 0 && v <= 200 && !percentages.includes(v)) {
      setPercentages((prev) => [...prev, v].sort((a, b) => a - b))
      setCustomInput('')
    }
  }

  const removePercentage = (p: number) => {
    if (percentages.length > 1) setPercentages((prev) => prev.filter((x) => x !== p))
  }

  return (
    <div className="space-y-5">

      {/* Weight input + unit toggle */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="number"
            inputMode="decimal"
            placeholder={`Peso máximo (${unit})`}
            value={maxWeight}
            onChange={(e) => setMaxWeight(e.target.value)}
            className="w-full h-12 rounded-xl border border-border bg-secondary px-4 text-sm font-bold placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-muted-foreground uppercase">{unit}</span>
        </div>
        <button
          onClick={() => {
            if (maxWeight) {
              const asKg = unit === 'kg' ? parseFloat(maxWeight) : fromDisplay(parseFloat(maxWeight))
              setUnit((u) => u === 'kg' ? 'lbs' : 'kg')
              setMaxWeight(String(+(unit === 'kg' ? toDisplay(asKg) : asKg).toFixed(1)))
            } else {
              setUnit((u) => u === 'kg' ? 'lbs' : 'kg')
            }
          }}
          className="h-12 px-4 rounded-xl border border-border bg-secondary font-black text-xs uppercase tracking-wide flex items-center gap-2 hover:border-primary/30 hover:text-primary transition-all"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          {unit === 'kg' ? 'lbs' : 'kg'}
        </button>
      </div>

      {/* Percentage grid */}
      {baseKg > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {percentages.map((p) => {
            const kg = +(baseKg * p / 100).toFixed(2)
            const display = toDisplay(kg)
            return (
              <div
                key={p}
                className="ios-panel p-3 flex items-center justify-between group"
              >
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{p}%</p>
                  <p className="text-xl font-black tabular-nums">{display} <span className="text-xs text-muted-foreground">{unit}</span></p>
                </div>
                {!DEFAULT_PERCENTAGES.includes(p) && (
                  <button
                    onClick={() => removePercentage(p)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="ios-panel p-8 text-center">
          <p className="text-muted-foreground text-sm">Ingresa tu peso máximo para ver los porcentajes.</p>
        </div>
      )}

      {/* Custom percentage */}
      <div className="space-y-2">
        <p className="section-title">Añadir porcentaje personalizado</p>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder="ej. 73"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustom()}
            className="flex-1 h-10 rounded-xl border border-border bg-secondary px-4 text-sm font-bold placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <Button
            variant="outline"
            className="h-10 px-4 rounded-xl gap-1.5 font-black text-xs uppercase"
            onClick={addCustom}
          >
            <Plus className="w-3.5 h-3.5" /> Añadir
          </Button>
        </div>
        {percentages.filter((p) => !DEFAULT_PERCENTAGES.includes(p)).length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {percentages.filter((p) => !DEFAULT_PERCENTAGES.includes(p)).map((p) => (
              <span
                key={p}
                className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-full bg-primary/15 text-primary border border-primary/25"
              >
                {p}%
                <button onClick={() => removePercentage(p)}>
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Tools Page ──────────────────────────────────────────────────────────

type Tool = 'timer' | 'calculator'

export default function ToolsPage() {
  const [active, setActive] = useState<Tool>('timer')

  return (
    <div className="pb-20 px-4 md:px-6 max-w-2xl mx-auto" style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}>
      <div className="pt-6 space-y-6">

        <div>
          <p className="section-title text-primary mb-1">Herramientas</p>
          <h1 className="page-title">Tools</h1>
        </div>

        {/* Tool selector */}
        <div className="grid grid-cols-2 gap-3">
          {([
            { key: 'timer',      icon: Timer,      label: 'Timer',         sub: 'Cronómetro / EMOM / AMRAP' },
            { key: 'calculator', icon: Calculator, label: 'Calculadora',   sub: 'Porcentajes de carga'       },
          ] as { key: Tool; icon: typeof Timer; label: string; sub: string }[]).map(({ key, icon: Icon, label, sub }) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`ios-panel p-4 text-left transition-all ${
                active === key
                  ? 'border-primary/40 bg-primary/5'
                  : 'hover:border-primary/20'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
                active === key ? 'bg-primary/20' : 'bg-secondary'
              }`}>
                <Icon className={`w-4 h-4 ${active === key ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <p className={`text-sm font-black uppercase tracking-tight ${active === key ? 'text-primary' : ''}`}>{label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
            </button>
          ))}
        </div>

        {/* Active tool */}
        <div className="ios-panel p-5">
          {active === 'timer' ? <TimerTool /> : <PercentageCalculator />}
        </div>
      </div>
    </div>
  )
}
