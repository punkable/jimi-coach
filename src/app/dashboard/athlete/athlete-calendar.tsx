'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Dumbbell, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlanDay {
  id: string
  day_of_week: number
  week_number: number
  title?: string | null
}

interface ResultRow {
  completed_at: string
}

const MONTH_NAMES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]
const DAY_HEADERS = ['L','M','X','J','V','S','D']
const DAY_FULL = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function planDayToDate(weekNum: number, dayOfWeek: number, anchor: Date) {
  const d = new Date(anchor); d.setHours(0,0,0,0)
  d.setDate(d.getDate() + (weekNum - 1) * 7 + (dayOfWeek - 1))
  return d
}

export function AthleteCalendar({
  planDays = [],
  startDate,
  results = [],
}: {
  planDays?: PlanDay[]
  startDate?: string | null
  results?: ResultRow[]
}) {
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d }, [])
  const [cursor, setCursor] = useState<Date>(() => new Date(today.getFullYear(), today.getMonth(), 1))

  // Map ymd -> { dayId, title, completed }
  const dateMap = useMemo(() => {
    const map = new Map<string, { dayId: string; dayOfWeek: number; weekNumber: number; title?: string | null; completed: boolean }>()
    if (!planDays.length) return map
    const anchor = startDate ? new Date(startDate) : (() => {
      // fallback: current ISO Monday
      const d = new Date()
      const iso = d.getDay() === 0 ? 7 : d.getDay()
      d.setDate(d.getDate() - (iso - 1))
      return d
    })()
    const completedDates = new Set(results.map(r => ymd(new Date(r.completed_at))))
    for (const day of planDays) {
      const date = planDayToDate(day.week_number || 1, day.day_of_week, anchor)
      const key = ymd(date)
      // Keep first if duplicate
      if (!map.has(key)) {
        map.set(key, {
          dayId: day.id,
          dayOfWeek: day.day_of_week,
          weekNumber: day.week_number || 1,
          title: day.title,
          completed: completedDates.has(key),
        })
      }
    }
    return map
  }, [planDays, startDate, results])

  // Build grid: 6 rows × 7 cols
  const grid = useMemo(() => {
    const firstDayOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    // Monday-first offset (JS Sunday = 0)
    const jsDay = firstDayOfMonth.getDay()
    const isoDay = jsDay === 0 ? 7 : jsDay
    const start = new Date(firstDayOfMonth)
    start.setDate(start.getDate() - (isoDay - 1))
    const cells: Date[] = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      cells.push(d)
    }
    return cells
  }, [cursor])

  const [picked, setPicked] = useState<Date | null>(null)
  const pickedKey = picked ? ymd(picked) : null
  const pickedInfo = pickedKey ? dateMap.get(pickedKey) : null
  const pickedIsToday = picked ? picked.toDateString() === today.toDateString() : false
  const pickedIsPast = picked ? picked < today : false

  return (
    <div className="ios-panel p-4 md:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <CalendarIcon className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="section-title text-primary">Mi calendario</p>
            <p className="text-sm font-black uppercase tracking-tight truncate">
              {MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="w-8 h-8 rounded-xl bg-secondary hover:bg-secondary/70 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
            className="h-8 px-3 rounded-xl bg-secondary hover:bg-secondary/70 text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="w-8 h-8 rounded-xl bg-secondary hover:bg-secondary/70 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {DAY_HEADERS.map((d, i) => (
          <div key={i} className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 py-1">
            {d}
          </div>
        ))}
        {grid.map((date, i) => {
          const inMonth = date.getMonth() === cursor.getMonth()
          const isToday = date.toDateString() === today.toDateString()
          const key = ymd(date)
          const info = dateMap.get(key)
          const has = !!info
          const completed = info?.completed
          const isSelected = picked && picked.toDateString() === date.toDateString()

          return (
            <button
              key={i}
              type="button"
              onClick={() => setPicked(date)}
              className={cn(
                'aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-black transition-all relative',
                !inMonth && 'opacity-30',
                isToday && !isSelected && 'ring-1 ring-primary/60',
                isSelected && 'ring-2 ring-primary',
                has && !completed && 'bg-primary/15 text-primary',
                completed && 'bg-primary text-primary-foreground',
                !has && inMonth && 'hover:bg-secondary text-muted-foreground',
              )}
            >
              <span>{date.getDate()}</span>
              {has && !completed && (
                <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground pt-1">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary/40" /> Programado</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> Completado</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full ring-1 ring-primary" /> Hoy</span>
      </div>

      {/* Picked day detail */}
      {picked && (
        <div className="border-t border-border/60 pt-3 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <Dumbbell className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black uppercase tracking-tight truncate">
              {DAY_FULL[(picked.getDay() === 0 ? 6 : picked.getDay() - 1)]} {picked.getDate()} {MONTH_NAMES[picked.getMonth()].slice(0,3)}
            </p>
            {pickedInfo ? (
              <p className="text-[11px] text-muted-foreground font-medium truncate">
                {pickedInfo.title || `Semana ${pickedInfo.weekNumber} · Día ${pickedInfo.dayOfWeek}`}
                {pickedInfo.completed && <span className="text-primary ml-1.5">· ✓ Completado</span>}
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground font-medium">Sin entrenamiento programado</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {pickedInfo && (
              <Link
                href={`/dashboard/athlete/workout?dayId=${pickedInfo.dayId}${pickedIsToday ? '' : '&mode=view'}`}
              >
                <button className="h-8 px-3 rounded-xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity">
                  {pickedIsToday ? 'Entrenar' : pickedIsPast ? 'Ver' : 'Vista previa'}
                </button>
              </Link>
            )}
            <button
              type="button"
              onClick={() => setPicked(null)}
              className="w-8 h-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
