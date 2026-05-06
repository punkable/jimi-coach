'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PlayCircle, X } from 'lucide-react'

interface PendingInfo {
  dayId: string
  dayTitle?: string
  elapsed: number
}

export function PendingWorkoutBanner() {
  const [pending, setPending] = useState<PendingInfo | null>(null)

  useEffect(() => {
    try {
      const today = new Date().toDateString()
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key?.startsWith('wod-progress-')) continue
        const raw = localStorage.getItem(key)
        if (!raw) continue
        const { timestamp, startTime } = JSON.parse(raw)
        if (new Date(timestamp).toDateString() !== today) continue
        const dayId = key.replace('wod-progress-', '')
        const elapsed = Math.floor((Date.now() - (startTime || Date.now())) / 1000)
        setPending({ dayId, elapsed })
        break
      }
    } catch {
      // ignore localStorage errors
    }
  }, [])

  if (!pending) return null

  const mm = Math.floor(pending.elapsed / 60).toString().padStart(2, '0')
  const ss = (pending.elapsed % 60).toString().padStart(2, '0')

  return (
    <div className="ios-panel p-4 border-primary/30 bg-primary/5 flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
        <PlayCircle className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black uppercase tracking-tight text-primary">Entrenamiento pendiente</p>
        <p className="text-[11px] text-muted-foreground font-medium">
          Dejaste un WOD en curso · {mm}:{ss} registrados
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Link href={`/dashboard/athlete/workout?dayId=${pending.dayId}`}>
          <Button size="sm" className="h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest">
            Reanudar
          </Button>
        </Link>
        <button
          type="button"
          onClick={() => setPending(null)}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
