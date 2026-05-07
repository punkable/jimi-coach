'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  PlayCircle, Calendar, ChevronRight, CheckCircle2, Zap, Video, RotateCcw
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface StartWorkoutCardProps {
  plan: any
  planDays: any[]
  trainedToday: boolean
  trainedPercentage?: number
}

export function StartWorkoutCard({ plan, planDays = [], trainedToday }: StartWorkoutCardProps) {
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0)
  const [pendingDayIds, setPendingDayIds] = useState<Set<string>>(new Set())

  // Set initial selected day based on day of week or first available
  useEffect(() => {
    const today = new Date().getDay() // 0 = Sun, 1 = Mon...
    const adjustedToday = today === 0 ? 7 : today
    const todayIdx = planDays.findIndex(d => d.day_of_week === adjustedToday)
    if (todayIdx !== -1) setSelectedDayIdx(todayIdx)
  }, [planDays])

  // Detect pending (in-progress) sessions from localStorage
  useEffect(() => {
    const pending = new Set<string>()
    for (const day of planDays) {
      try {
        const saved = localStorage.getItem(`wod-progress-${day.id}`)
        if (!saved) continue
        const { updatedAt, sets, blocks } = JSON.parse(saved)
        if (!updatedAt) continue
        const lastTouch = new Date(updatedAt)
        const isToday = lastTouch.toDateString() === new Date().toDateString()
        const ageMs = Date.now() - lastTouch.getTime()
        if (!isToday || ageMs >= 24 * 60 * 60 * 1000) continue
        // Only count sessions with meaningful progress
        const setsArr = Object.values(sets || {}).flat() as any[]
        const hasProgress =
          setsArr.some((s: any) => s.is_completed || s.weight || s.reps || s.distance || s.time_seconds) ||
          Object.values(blocks || {}).some(Boolean)
        if (hasProgress) pending.add(day.id)
      } catch {}
    }
    setPendingDayIds(pending)
  }, [planDays])

  const selectedDay = planDays[selectedDayIdx]
  const dayNames = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM']
  const selectedBlocks = selectedDay?.workout_blocks ?? []
  const selectedMovements = selectedBlocks.flatMap((block: any) => block.workout_movements ?? [])
  const videoCount = selectedMovements.filter((movement: any) => movement.exercises?.video_url || movement.exercise?.video_url).length
  const mainTimer = selectedBlocks.find((block: any) => block.timer_type && block.timer_type !== 'none')?.timer_type
  const blockTypes = Array.from(new Set<string>(selectedBlocks.map((block: any) => block.type).filter(Boolean)))
  const blockTypeLabels: Record<string, string> = {
    warmup: 'Calentamiento',
    strength: 'Fuerza',
    metcon: 'Metcon',
    gymnastics: 'Gimnasia',
    cooldown: 'Vuelta a calma',
    wod: 'WOD',
  }
  const focusLabel =
    selectedDay?.title ||
    blockTypes.map((type: string) => blockTypeLabels[type] || type).slice(0, 2).join(' + ') ||
    'Entrenamiento del dia'
  const timerLabel = mainTimer
    ? `Timer ${String(mainTimer).toUpperCase()}`
    : `${selectedBlocks.length} ${selectedBlocks.length === 1 ? 'bloque' : 'bloques'} listos`
  const mediaLabel = videoCount > 0
    ? `${videoCount} ${videoCount === 1 ? 'video tecnico' : 'videos tecnicos'}`
    : `${selectedMovements.length} ${selectedMovements.length === 1 ? 'ejercicio' : 'ejercicios'} del plan`

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Mi Planificación</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{plan?.title || 'Sin Plan Asignado'}</p>
        </div>
        <Calendar className="w-5 h-5 text-primary/40" />
      </div>

      {/* Day Selector Hub */}
      <div className="bg-card/40 backdrop-blur-xl rounded-[28px] p-2 border border-border/10 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-1 relative z-10">
          {planDays.map((day, idx) => {
            const isSelected = selectedDayIdx === idx
            const dayLabel = dayNames[(day.day_of_week - 1) % 7]
            
            return (
              <button
                key={day.id}
                onClick={() => setSelectedDayIdx(idx)}
                className={cn(
                  "flex-1 min-w-[72px] py-5 rounded-[22px] flex flex-col items-center gap-1.5 transition-all duration-500 relative group",
                  isSelected 
                    ? "bg-primary text-primary-foreground shadow-[0_0_30px_rgba(204,255,0,0.3)] scale-[1.02]" 
                    : "hover:bg-white/5 text-muted-foreground border border-transparent"
                )}
              >
                {isSelected && (
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-[22px] pointer-events-none" />
                )}
                <span className={cn(
                  "text-[9px] font-black tracking-[0.2em] uppercase",
                  isSelected ? "text-primary-foreground/80" : "text-muted-foreground/30"
                )}>{dayLabel}</span>
                <span className="text-2xl font-black leading-none tracking-tighter">{day.day_of_week}</span>
                {isSelected && (
                  <div className="absolute -bottom-1 w-6 h-1 bg-white/40 rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Day Preview Card */}
      {selectedDay && (
        <Card className="glass-card overflow-hidden relative group border-none rounded-[32px]">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-40 group-hover:opacity-60 transition-opacity duration-700" />
          <div className="absolute -bottom-16 -right-16 opacity-[0.03] group-hover:opacity-[0.06] transition-all duration-700 rotate-12">
            <PlayCircle className="w-56 h-56" />
          </div>

          <CardContent className="p-5 md:p-8 relative z-10">
            <div className="flex flex-col gap-5">
              {/* Top row: day badge + title + status */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-[0_8px_24px_rgba(204,255,0,0.35)] font-black text-xl shrink-0 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/10 to-transparent" />
                  <span className="relative">{selectedDay.day_of_week}</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl font-black uppercase tracking-tight text-white leading-none">
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][(selectedDay.day_of_week - 1) % 7]}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-primary font-black uppercase tracking-[0.15em] text-[10px] truncate max-w-[140px]">
                      {focusLabel}
                    </span>
                    <div className="h-1 w-1 rounded-full bg-white/20 shrink-0" />
                    <span className="text-white/40 font-bold uppercase tracking-widest text-[9px] shrink-0">
                      {trainedToday ? 'Completado hoy' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Chips row */}
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                  <Zap className="w-3.5 h-3.5 text-primary fill-primary/20 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-[0.08em] text-white/80 whitespace-nowrap">
                    {timerLabel}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                  {trainedToday ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--strength)] shrink-0" />
                  ) : (
                    <Video className="w-3.5 h-3.5 text-[var(--strength)] shrink-0" />
                  )}
                  <span className="text-[10px] font-black uppercase tracking-[0.08em] text-white/80 whitespace-nowrap">
                    {trainedToday ? 'Resultado guardado' : mediaLabel}
                  </span>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col gap-2">
                <Link href={`/dashboard/athlete/workout?dayId=${selectedDay.id}`} className="w-full md:w-auto">
                  <Button className={cn(
                    "h-20 w-full px-12 rounded-[24px] text-primary-foreground hover:scale-[1.02] active:scale-95 transition-all font-black uppercase tracking-widest text-sm flex items-center gap-4 group/btn border-none",
                    pendingDayIds.has(selectedDay.id)
                      ? "bg-amber-500 hover:bg-amber-600 shadow-[0_20px_50px_rgba(245,158,11,0.25)]"
                      : "bg-primary shadow-[0_20px_50px_rgba(204,255,0,0.25)]"
                  )}>
                    {pendingDayIds.has(selectedDay.id) ? (
                      <><RotateCcw className="w-5 h-5" /> Reanudar</>
                    ) : (
                      <>Entrenar Ahora</>
                    )}
                    <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center group-hover/btn:translate-x-1 transition-transform">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </Button>
                </Link>
                {pendingDayIds.has(selectedDay.id) && (
                  <button
                    onClick={() => {
                      try { localStorage.removeItem(`wod-progress-${selectedDay.id}`) } catch {}
                      setPendingDayIds(prev => { const n = new Set(prev); n.delete(selectedDay.id); return n })
                    }}
                    className="text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors text-center"
                  >
                    Descartar sesión anterior
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedDay && (
        <div className="py-12 text-center border-2 border-dashed border-border/20 rounded-[32px]">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No hay días configurados en este plan</p>
        </div>
      )}
    </section>
  )
}
