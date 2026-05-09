'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PlayCircle, X, AlertTriangle } from 'lucide-react'

interface PlanDay {
  id: string
  day_of_week: number
  week_number: number
  title?: string | null
}

interface PendingInfo {
  dayId: string
  elapsed: number | null   // seconds, null if unknown
  startedToday: boolean
  startedDate: Date | null
  day?: PlanDay
}

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

/** Parse an ISO/string/number into a valid Date or null. Never returns Invalid Date. */
function safeDate(input: any): Date | null {
  if (!input) return null
  const d = input instanceof Date ? input : new Date(input)
  return isNaN(d.getTime()) ? null : d
}

export function PendingWorkoutBanner({ planDays = [], startDate }: { planDays?: PlanDay[]; startDate?: string | null }) {
  const [pending, setPending] = useState<PendingInfo | null>(null)

  useEffect(() => {
    try {
      const today = new Date(); today.setHours(0,0,0,0)
      const candidates: PendingInfo[] = []

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key?.startsWith('wod-progress-')) continue
        const raw = localStorage.getItem(key)
        if (!raw) continue

        let parsed: any
        try { parsed = JSON.parse(raw) } catch { continue }

        // workout-client writes { sets, blocks, startTime (ISO), updatedAt (ISO) }.
        // Older sessions may have used `timestamp`. Be tolerant of all.
        const { startTime, updatedAt, timestamp, sets, blocks } = parsed || {}
        const dayId = key.replace('wod-progress-', '')

        // Bail on entries with no real progress
        const setsArr = Object.values(sets || {}).flat() as any[]
        const hasProgress =
          setsArr.some((s: any) => s?.is_completed || s?.weight || s?.reps || s?.distance || s?.time_seconds) ||
          Object.values(blocks || {}).some(Boolean)
        if (!hasProgress) {
          // Clean up empty/corrupt ghost sessions silently
          try { localStorage.removeItem(key) } catch {}
          continue
        }

        // Pick the freshest valid timestamp from any of the known fields
        const startedDate =
          safeDate(startTime) ??
          safeDate(updatedAt) ??
          safeDate(timestamp) ??
          null

        // Elapsed in seconds — only if we have a usable start
        let elapsed: number | null = null
        if (startedDate) {
          const ms = Date.now() - startedDate.getTime()
          elapsed = ms >= 0 && isFinite(ms) ? Math.floor(ms / 1000) : null
        }

        const startedDay = startedDate ? new Date(startedDate) : null
        startedDay?.setHours(0, 0, 0, 0)

        candidates.push({
          dayId,
          elapsed,
          startedToday: !!startedDay && startedDay.getTime() === today.getTime(),
          startedDate,
          day: planDays.find(d => d.id === dayId),
        })
      }

      // Prefer today's pending; otherwise the most recent
      candidates.sort((a, b) => {
        const tDiff = Number(b.startedToday) - Number(a.startedToday)
        if (tDiff !== 0) return tDiff
        const aT = a.startedDate?.getTime() ?? 0
        const bT = b.startedDate?.getTime() ?? 0
        return bT - aT
      })
      if (candidates[0]) setPending(candidates[0])
    } catch {
      // ignore localStorage errors
    }
  }, [planDays])

  if (!pending) return null

  // Format elapsed safely — never render NaN:NaN
  const elapsedLabel = (() => {
    if (pending.elapsed == null || !isFinite(pending.elapsed) || pending.elapsed < 0) return null
    const m = Math.floor(pending.elapsed / 60)
    const s = pending.elapsed % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  })()

  // Format started-on date safely
  const startedDateLabel = pending.startedDate
    ? pending.startedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    : null

  const dayName = pending.day ? DAY_NAMES[(pending.day.day_of_week - 1) % 7] : null

  const subtitle = pending.startedToday
    ? `WOD de hoy en curso${elapsedLabel ? ` · ${elapsedLabel} registrados` : ''}`
    : startedDateLabel
      ? `Iniciado ${startedDateLabel}${dayName ? ` (${dayName})` : ''}${elapsedLabel ? ` · ${elapsedLabel}` : ''}`
      : 'Sesión sin finalizar'

  const isStale = !pending.startedToday

  return (
    <div className={`ios-panel p-4 flex items-center gap-3 ${isStale ? 'border-amber-500/30 bg-amber-500/5' : 'border-primary/30 bg-primary/5'}`}>
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${isStale ? 'bg-amber-500/15' : 'bg-primary/15'}`}>
        {isStale ? <AlertTriangle className="w-5 h-5 text-amber-500" /> : <PlayCircle className="w-5 h-5 text-primary" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-black uppercase tracking-tight ${isStale ? 'text-amber-500' : 'text-primary'}`}>
          {isStale ? 'Sesión sin finalizar' : 'Entrenamiento pendiente'}
        </p>
        <p className="text-[11px] text-muted-foreground font-medium truncate">{subtitle}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Link href={`/dashboard/athlete/workout?dayId=${pending.dayId}`}>
          <Button size="sm" className="h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest">
            Reanudar
          </Button>
        </Link>
        <button
          type="button"
          title="Descartar progreso"
          onClick={() => {
            if (confirm(isStale ? '¿Descartar el progreso de la sesión sin finalizar?' : '¿Ocultar el banner? El progreso queda guardado.')) {
              if (isStale) {
                try { localStorage.removeItem(`wod-progress-${pending.dayId}`) } catch {}
              }
              setPending(null)
            }
          }}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
