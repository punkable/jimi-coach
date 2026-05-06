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
  elapsed: number
  startedToday: boolean
  startedDate: Date
  day?: PlanDay
}

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

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
        const parsed = JSON.parse(raw)
        const { timestamp, startTime, sets, blocks } = parsed
        // Only treat as pending if there's actual progress
        const hasProgress = (sets && Object.keys(sets).length > 0) || (blocks && Object.keys(blocks).length > 0)
        if (!hasProgress) continue
        const startedDate = new Date(timestamp)
        const startedDay = new Date(startedDate); startedDay.setHours(0,0,0,0)
        const dayId = key.replace('wod-progress-', '')
        const day = planDays.find((d) => d.id === dayId)
        candidates.push({
          dayId,
          elapsed: Math.floor((Date.now() - (startTime || startedDate.getTime())) / 1000),
          startedToday: startedDay.getTime() === today.getTime(),
          startedDate,
          day,
        })
      }
      // Prefer today's pending; otherwise the most recent
      candidates.sort((a, b) => Number(b.startedToday) - Number(a.startedToday) || b.startedDate.getTime() - a.startedDate.getTime())
      if (candidates[0]) setPending(candidates[0])
    } catch {
      // ignore localStorage errors
    }
  }, [planDays])

  if (!pending) return null

  const mm = Math.floor(pending.elapsed / 60).toString().padStart(2, '0')
  const ss = (pending.elapsed % 60).toString().padStart(2, '0')

  // Build clear context line
  const dayName = pending.day ? DAY_NAMES[(pending.day.day_of_week - 1) % 7] : null
  const subtitle = pending.startedToday
    ? `WOD de hoy en curso · ${mm}:${ss} registrados`
    : `Iniciado ${pending.startedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}${dayName ? ` (${dayName})` : ''} · ${mm}:${ss}`

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
