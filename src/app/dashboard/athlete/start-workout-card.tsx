'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  PlayCircle, ChevronRight, ChevronLeft, CheckCircle2, Zap, Video, Calendar, AlertCircle, RotateCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { resolvePlanAnchor, isoWeekday, localToday } from '@/lib/date'

const DAY_NAMES_SHORT = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']
const DAY_NAMES_FULL  = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const MONTH_SHORT     = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

function fmtDate(date: Date): string {
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

interface StartWorkoutCardProps {
  plan: any
  planDays: any[]
  trainedToday: boolean
  startDate?: string | null
  completedDayIds?: string[]
}

interface WeekDay {
  date: Date
  dow: number          // 1=Mon..7=Sun
  weekNum: number      // plan week number (could be < 1 if before plan start)
  inPlan: boolean      // true if (weekNum, dow) is within the plan's range AND there's a planDay
  planDay: any | null
}

export function StartWorkoutCard({ plan, planDays = [], trainedToday, startDate, completedDayIds = [] }: StartWorkoutCardProps) {
  const completedSet = new Set(completedDayIds)

  const today = useMemo(() => localToday(), [])
  const anchor = useMemo(() => resolvePlanAnchor(startDate ?? null), [startDate])

  // Plan-week range: which plan weeks have any programmed day
  const planWeekNumbers = useMemo(
    () => Array.from(new Set(planDays.map((d: any) => d.week_number || 1))).sort((a, b) => a - b),
    [planDays]
  )
  const lastPlanWeek = planWeekNumbers[planWeekNumbers.length - 1] ?? 0

  // Compute plan-week / dow for any calendar date relative to anchor.
  // weekNum < 1 means before the plan starts.
  const dateToPlanCoords = (d: Date): { weekNum: number; dow: number } => {
    const days = Math.floor((d.getTime() - anchor.getTime()) / 86400000)
    const weekNum = Math.floor(days / 7) + 1
    const dow = ((days % 7) + 7) % 7 + 1
    return { weekNum, dow }
  }

  // Today's calendar Monday (Mon-Sun ISO week containing today)
  const todayMonday = useMemo(() => {
    const d = new Date(today)
    d.setHours(0, 0, 0, 0)
    const iso = isoWeekday(d)
    d.setDate(d.getDate() - (iso - 1))
    return d
  }, [today])

  // Calendar-based week navigation. 0 = this week, -1 = last, +1 = next, etc.
  // The plan's first week (in calendar terms) defines the lower bound for navigation,
  // and the plan's last week defines the upper bound — but we let the user navigate
  // 1 week beyond either side for context.
  const planFirstMonday = anchor
  const planLastMonday = useMemo(() => {
    if (lastPlanWeek <= 0) return null
    const d = new Date(anchor)
    d.setDate(d.getDate() + (lastPlanWeek - 1) * 7)
    return d
  }, [anchor, lastPlanWeek])

  // Compute initial offset: today's week if it intersects plan range, else snap into range
  const initialOffset = useMemo(() => {
    const todayCoords = dateToPlanCoords(today)
    // Inside the plan range → show this calendar week
    if (todayCoords.weekNum >= 1 && todayCoords.weekNum <= lastPlanWeek) return 0
    // Before the plan starts → jump forward to plan week 1
    if (todayCoords.weekNum < 1 && planFirstMonday) {
      const diff = Math.round((planFirstMonday.getTime() - todayMonday.getTime()) / (7 * 86400000))
      return diff
    }
    // After the plan ends → still show "this week" (will display empty plan slots)
    return 0
  }, [today, todayMonday, planFirstMonday, lastPlanWeek]) // eslint-disable-line react-hooks/exhaustive-deps

  const [weekOffset, setWeekOffset] = useState<number>(initialOffset)
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0)
  const [pendingDayIds, setPendingDayIds] = useState<Set<string>>(new Set())

  // Monday of the displayed calendar week
  const displayedMonday = useMemo(() => {
    const d = new Date(todayMonday)
    d.setDate(d.getDate() + weekOffset * 7)
    return d
  }, [todayMonday, weekOffset])

  // 7 calendar dates for the displayed week, with plan-day overlay
  const allWeekDays: WeekDay[] = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(displayedMonday)
      date.setDate(date.getDate() + i)
      const { weekNum, dow } = dateToPlanCoords(date)
      const planDay = (weekNum >= 1)
        ? planDays.find((d: any) => (d.week_number || 1) === weekNum && d.day_of_week === dow) ?? null
        : null
      return { date, dow, weekNum, inPlan: !!planDay, planDay }
    })
  }, [displayedMonday, planDays]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select today (if in displayed week) else first day with workout, else Monday
  useEffect(() => {
    const todayIdx = allWeekDays.findIndex(w => w.date.toDateString() === today.toDateString())
    if (todayIdx >= 0) { setSelectedDayIdx(todayIdx); return }
    const planIdx = allWeekDays.findIndex(w => w.planDay !== null)
    setSelectedDayIdx(planIdx >= 0 ? planIdx : 0)
  }, [weekOffset, planDays]) // eslint-disable-line react-hooks/exhaustive-deps

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
        const setsArr = Object.values(sets || {}).flat() as any[]
        const hasProgress =
          setsArr.some((s: any) => s.is_completed || s.weight || s.reps || s.distance || s.time_seconds) ||
          Object.values(blocks || {}).some(Boolean)
        if (hasProgress) pending.add(day.id)
      } catch {}
    }
    setPendingDayIds(pending)
  }, [planDays])

  const selected    = allWeekDays[selectedDayIdx] ?? null
  const selectedDay = selected?.planDay ?? null

  const selectedBlocks    = selectedDay?.workout_blocks ?? []
  const selectedMovements = selectedBlocks.flatMap((b: any) => b.workout_movements ?? [])
  const videoCount        = selectedMovements.filter((m: any) => m.exercises?.video_url || m.exercise?.video_url).length
  const mainTimer         = selectedBlocks.find((b: any) => b.timer_type && b.timer_type !== 'none')?.timer_type
  const blockTypes        = Array.from(new Set<string>(selectedBlocks.map((b: any) => b.type).filter(Boolean)))

  const blockTypeLabels: Record<string, string> = {
    warmup: 'Calentamiento', strength: 'Fuerza', metcon: 'Metcon',
    gymnastics: 'Gimnasia', cooldown: 'Vuelta a calma', wod: 'WOD',
    core: 'Core', skills: 'Skills', tecnica: 'Técnica', mobility: 'Movilidad', other: 'Otro',
  }
  const focusLabel =
    selectedDay?.title ||
    blockTypes.map((t: string) => blockTypeLabels[t] || t).slice(0, 2).join(' + ') ||
    'Entrenamiento del día'
  const timerLabel = mainTimer
    ? `Timer ${String(mainTimer).toUpperCase()}`
    : `${selectedBlocks.length} ${selectedBlocks.length === 1 ? 'bloque' : 'bloques'}`
  const mediaLabel = videoCount > 0
    ? `${videoCount} ${videoCount === 1 ? 'video técnico' : 'videos técnicos'}`
    : `${selectedMovements.length} ${selectedMovements.length === 1 ? 'ejercicio' : 'ejercicios'}`

  const isSelectedToday = selected ? selected.date.toDateString() === today.toDateString() : false
  const isSelectedPast  = selected ? selected.date < today : false
  const selectedDate    = selected?.date ?? null

  const isPending      = selectedDay ? pendingDayIds.has(selectedDay.id) : false
  const isSelectedDone = selectedDay ? completedSet.has(selectedDay.id) : false

  // Header label: "Esta semana", "Semana pasada", "Próxima semana", or absolute date range
  const sundayOfWeek = useMemo(() => {
    const d = new Date(displayedMonday); d.setDate(d.getDate() + 6); return d
  }, [displayedMonday])
  const weekRangeLabel = `${displayedMonday.getDate()} ${MONTH_SHORT[displayedMonday.getMonth()]} – ${sundayOfWeek.getDate()} ${MONTH_SHORT[sundayOfWeek.getMonth()]}`
  const offsetLabel =
    weekOffset === 0 ? 'Esta semana' :
    weekOffset === 1 ? 'Próxima semana' :
    weekOffset === -1 ? 'Semana pasada' :
    weekOffset > 0 ? `En ${weekOffset} semanas` :
    `Hace ${-weekOffset} semanas`

  // Plan-week label if any day in displayed week falls in the plan range
  const inPlanWeekNum = useMemo(() => {
    const inRange = allWeekDays.find(w => w.weekNum >= 1 && w.weekNum <= lastPlanWeek)
    return inRange?.weekNum ?? null
  }, [allWeekDays, lastPlanWeek])

  // Disable "previous" if before plan start by 2+ weeks; "next" if 2+ after plan end
  const minOffset = (planFirstMonday && lastPlanWeek > 0)
    ? Math.round((planFirstMonday.getTime() - todayMonday.getTime()) / (7 * 86400000)) - 1
    : -1
  const maxOffset = (planLastMonday && lastPlanWeek > 0)
    ? Math.round((planLastMonday.getTime() - todayMonday.getTime()) / (7 * 86400000)) + 1
    : 1
  const canGoPrev = weekOffset > minOffset
  const canGoNext = weekOffset < maxOffset

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="min-w-0">
          <h2 className="text-2xl font-black uppercase tracking-tight">Mi Programación</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 truncate">
            {plan?.title || 'Sin programación asignada'}
          </p>
        </div>
        <Calendar className="w-5 h-5 text-primary/40 shrink-0" />
      </div>

      {/* Week navigation header */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary leading-none">
            {offsetLabel}
            {inPlanWeekNum && (
              <span className="text-muted-foreground/60 ml-2">· Semana {inPlanWeekNum} del plan</span>
            )}
          </p>
          <p className="text-sm font-black uppercase tracking-tight mt-1 truncate">
            {weekRangeLabel}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => canGoPrev && setWeekOffset(o => o - 1)}
            disabled={!canGoPrev}
            title="Semana anterior"
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center transition-colors',
              canGoPrev ? 'bg-secondary hover:bg-secondary/70' : 'bg-secondary/30 text-muted-foreground/30 cursor-not-allowed'
            )}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {weekOffset !== 0 && (
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              title="Volver a esta semana"
              className="h-9 px-3 rounded-xl bg-secondary hover:bg-secondary/70 text-[10px] font-black uppercase tracking-widest transition-colors"
            >
              Hoy
            </button>
          )}
          <button
            type="button"
            onClick={() => canGoNext && setWeekOffset(o => o + 1)}
            disabled={!canGoNext}
            title="Semana siguiente"
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center transition-colors',
              canGoNext ? 'bg-secondary hover:bg-secondary/70' : 'bg-secondary/30 text-muted-foreground/30 cursor-not-allowed'
            )}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day Selector — 7 calendar days of the displayed week */}
      <div className="bg-card/40 backdrop-blur-xl rounded-[28px] p-2 border border-border/10 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="flex gap-1 overflow-x-auto no-scrollbar px-1 relative z-10 snap-x snap-mandatory">
          {allWeekDays.map((wd, idx) => {
            const isSelected = selectedDayIdx === idx
            const isToday    = wd.date.toDateString() === today.toDateString()
            const hasPending = wd.planDay ? pendingDayIds.has(wd.planDay.id) : false
            const hasWorkout = wd.planDay !== null
            const isCompleted = wd.planDay ? completedSet.has(wd.planDay.id) : false
            const isPast      = wd.date < today

            return (
              <button
                key={`${wd.date.toISOString()}-${idx}`}
                onClick={() => setSelectedDayIdx(idx)}
                className={cn(
                  'shrink-0 w-[46px] sm:w-[52px] py-3 rounded-[18px] flex flex-col items-center gap-1 transition-all duration-300 relative group snap-start',
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-[0_0_30px_rgba(204,255,0,0.3)]'
                    : isToday
                    ? 'border border-primary/40 text-primary hover:bg-primary/10'
                    : 'hover:bg-white/5 text-muted-foreground border border-transparent'
                )}
              >
                {isSelected && (
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-[18px] pointer-events-none" />
                )}
                <span className={cn(
                  'text-[8px] font-black tracking-[0.15em] uppercase',
                  isSelected ? 'text-primary-foreground/80' : isToday ? 'text-primary' : 'text-muted-foreground/50'
                )}>
                  {DAY_NAMES_SHORT[wd.dow - 1]}
                </span>
                <span className="text-base font-black leading-none tracking-tighter">{wd.date.getDate()}</span>
                {/* Indicator dot — priority: pending → completed → today → has-workout → empty */}
                {hasPending && !isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                {!hasPending && isCompleted && !isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                {!hasPending && !isCompleted && isToday && !isSelected && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                {!hasPending && !isCompleted && !isToday && hasWorkout && !isSelected && (
                  <span className={cn('w-1.5 h-1.5 rounded-full', isPast ? 'bg-muted-foreground/40' : 'bg-primary/60')} />
                )}
                {!hasPending && !isCompleted && !isToday && !hasWorkout && !isSelected && <span className="w-1.5 h-1.5 rounded-full bg-transparent" />}
                {isSelected && <div className="absolute -bottom-1 w-4 h-1 bg-white/40 rounded-full" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Day — has workout */}
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
                  <span className="relative">{selectedDate?.getDate()}</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl font-black uppercase tracking-tight text-white leading-none">
                    {DAY_NAMES_FULL[selectedDay.day_of_week - 1]}
                    {selectedDate && (
                      <span className="ml-2 text-sm font-bold text-white/40">{fmtDate(selectedDate)}</span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-primary font-black uppercase tracking-[0.15em] text-[10px] truncate max-w-[140px]">
                      {focusLabel}
                    </span>
                    <div className="h-1 w-1 rounded-full bg-white/20 shrink-0" />
                    <span className="text-white/40 font-bold uppercase tracking-widest text-[9px] shrink-0">
                      {isSelectedDone
                        ? 'Completado'
                        : isSelectedToday
                          ? (isPending ? 'En progreso' : 'Pendiente')
                          : isSelectedPast ? 'Día pasado' : 'Próximo'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Chips */}
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                  <Zap className="w-3.5 h-3.5 text-primary fill-primary/20 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-[0.08em] text-white/80 whitespace-nowrap">{timerLabel}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                  {isSelectedToday && trainedToday ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--strength)] shrink-0" />
                  ) : (
                    <Video className="w-3.5 h-3.5 text-[var(--strength)] shrink-0" />
                  )}
                  <span className="text-[10px] font-black uppercase tracking-[0.08em] text-white/80 whitespace-nowrap">
                    {isSelectedToday && trainedToday ? 'Resultado guardado' : mediaLabel}
                  </span>
                </div>
              </div>

              {/* CTA — completed > pending > today > past > future */}
              <div className="flex flex-col gap-2">
                <Button
                  onClick={(e) => {
                    if (isSelectedDone) {
                      window.location.href = `/dashboard/athlete/workout?dayId=${selectedDay.id}&mode=summary`
                      return
                    }
                    if (isSelectedToday && !isSelectedDone) {
                      try {
                        for (let i = 0; i < localStorage.length; i++) {
                          const key = localStorage.key(i)
                          if (!key?.startsWith('wod-progress-')) continue
                          const pendingId = key.replace('wod-progress-', '')
                          if (pendingId === selectedDay.id) continue
                          const raw = localStorage.getItem(key)
                          if (!raw) continue
                          const { sets, blocks } = JSON.parse(raw)
                          const hasProgress = (sets && Object.keys(sets).length > 0) || (blocks && Object.keys(blocks).length > 0)
                          if (!hasProgress) continue
                          const choice = confirm('Tienes otro entrenamiento sin finalizar. ¿Quieres descartarlo y empezar el de hoy?')
                          if (choice) localStorage.removeItem(key)
                          else { e.preventDefault(); window.location.href = `/dashboard/athlete/workout?dayId=${pendingId}`; return }
                          break
                        }
                      } catch {}
                    }
                    const mode = isSelectedToday ? '' : '&mode=view'
                    window.location.href = `/dashboard/athlete/workout?dayId=${selectedDay.id}${mode}`
                  }}
                  className={cn(
                    "h-16 w-full px-10 rounded-[24px] text-primary-foreground hover:scale-[1.02] active:scale-95 transition-all font-black uppercase tracking-widest text-sm flex items-center gap-4 group/btn border-none justify-center",
                    isSelectedDone
                      ? "bg-emerald-500 hover:bg-emerald-600 shadow-[0_20px_50px_rgba(16,185,129,0.25)]"
                      : isPending
                      ? "bg-amber-500 hover:bg-amber-600 shadow-[0_20px_50px_rgba(245,158,11,0.25)]"
                      : "bg-primary shadow-[0_20px_50px_rgba(204,255,0,0.25)]"
                  )}
                >
                  {isSelectedDone ? (
                    <><CheckCircle2 className="w-5 h-5" /> Ver resumen</>
                  ) : isPending ? (
                    <><RotateCcw className="w-5 h-5" /> Reanudar</>
                  ) : isSelectedToday ? (
                    <>Entrenar Ahora</>
                  ) : isSelectedPast ? (
                    <>Ver Entrenamiento</>
                  ) : (
                    <>Ver Día</>
                  )}
                  <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center group-hover/btn:translate-x-1 transition-transform">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </Button>
                {isPending && (
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

      {/* Selected day has no workout */}
      {selected && !selectedDay && (
        <Card className="glass-card overflow-hidden relative border-none rounded-[32px]">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/40 via-transparent to-transparent opacity-40" />
          <CardContent className="p-6 md:p-8 relative z-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-secondary/60 border border-border/60 flex items-center justify-center mx-auto">
              <Calendar className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">
                {DAY_NAMES_FULL[selected.dow - 1]} {selected.date.getDate()} {selected.date.toLocaleDateString('es-ES', { month: 'short' })}
              </p>
              <h3 className="text-xl font-black uppercase tracking-tight">
                {isSelectedToday ? 'Sin entrenamiento hoy' : 'Sin entrenamiento'}
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                {isSelectedToday
                  ? 'No tienes entrenamiento programado para hoy. Selecciona otro día arriba o navega a otra semana.'
                  : selected.weekNum < 1
                  ? 'Esta fecha es anterior al inicio de tu programación.'
                  : selected.weekNum > lastPlanWeek
                  ? 'Esta fecha está después del fin de tu programación. Pregúntale a tu coach por la próxima.'
                  : 'No hay entrenamiento programado para este día.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No plan configured at all */}
      {planDays.length === 0 && (
        <div className="py-12 text-center border-2 border-dashed border-border/20 rounded-[32px]">
          <AlertCircle className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Sin días configurados en esta programación</p>
        </div>
      )}
    </section>
  )
}
