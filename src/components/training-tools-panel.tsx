'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Calculator, Pause, Play, RotateCcw, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const percentageRows = [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const secs = (seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${secs}`
}

export function TrainingToolsPanel({ audience }: { audience: 'athlete' | 'coach' }) {
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [maxWeight, setMaxWeight] = useState('')
  const [customPercentage, setCustomPercentage] = useState('85')

  useEffect(() => {
    if (!isRunning) return

    const interval = window.setInterval(() => {
      setSeconds((value) => value + 1)
    }, 1000)

    return () => window.clearInterval(interval)
  }, [isRunning])

  const weight = Number(maxWeight)
  const customValue = Number(customPercentage)

  const customResult = useMemo(() => {
    if (!weight || !customValue) return null
    return Math.round(weight * customValue) / 100
  }, [customValue, weight])

  return (
    <div className="min-h-[100dvh] px-4 py-8 md:px-8 md:py-10 max-w-6xl mx-auto relative overflow-hidden">
      <Image
        src="/images/looking.png"
        alt=""
        width={224}
        height={224}
        className="pointer-events-none absolute right-0 top-8 w-40 md:w-56 opacity-[0.07]"
      />

      <header className="relative mb-8 max-w-2xl">
        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-primary mb-3">
          {audience === 'coach' ? 'Coach Tools' : 'Training Tools'}
        </p>
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-none">
          Herramientas
        </h1>
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
          Timer y porcentajes disponibles sin iniciar un entrenamiento.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
        <Card className="glass border-primary/20 overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cronómetro</p>
                <h2 className="text-xl font-black uppercase tracking-tight">Timer libre</h2>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Timer className="w-6 h-6" />
              </div>
            </div>

            <div className="text-center py-8 rounded-[28px] bg-white/[0.03] border border-white/5">
              <div className="font-mono text-6xl md:text-7xl font-black tabular-nums tracking-tight">
                {formatTime(seconds)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <Button
                className="h-14 rounded-2xl font-black uppercase tracking-widest"
                variant={isRunning ? 'destructive' : 'default'}
                onClick={() => setIsRunning((value) => !value)}
              >
                {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              <Button
                className="h-14 rounded-2xl font-black uppercase tracking-widest"
                variant="outline"
                onClick={() => {
                  setIsRunning(false)
                  setSeconds(0)
                }}
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-primary/20 overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Carga objetivo</p>
                <h2 className="text-xl font-black uppercase tracking-tight">Calculadora %</h2>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Calculator className="w-6 h-6" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="maxWeight" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">RM / base kg</Label>
                <Input
                  id="maxWeight"
                  type="number"
                  inputMode="decimal"
                  value={maxWeight}
                  onChange={(event) => setMaxWeight(event.target.value)}
                  placeholder="100"
                  className="h-12 rounded-xl bg-background/50 text-lg font-black"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customPercentage" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">% personalizado</Label>
                <Input
                  id="customPercentage"
                  type="number"
                  inputMode="decimal"
                  value={customPercentage}
                  onChange={(event) => setCustomPercentage(event.target.value)}
                  placeholder="85"
                  className="h-12 rounded-xl bg-background/50 text-lg font-black"
                />
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/10 p-4 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Resultado</span>
              <span className="text-2xl font-black">{customResult !== null ? `${customResult} kg` : '-- kg'}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-5">
              {percentageRows.map((percentage) => (
                <div key={percentage} className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 flex items-center justify-between">
                  <span className="text-[10px] font-black text-muted-foreground">{percentage}%</span>
                  <span className="text-sm font-black">{weight ? `${Math.round(weight * percentage) / 100} kg` : '--'}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
