'use client'

import { useState, useEffect } from 'react'
import { Check, Plus, Minus, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export type WorkoutSet = {
  id: string
  movement_id: string
  set_number: number
  weight: number | null
  reps: number | null
  distance: number | null
  time_seconds: number | null
  is_completed: boolean
}

type TrackingType = 'weight_reps' | 'reps_only' | 'distance_time' | 'time_only'

function hasRequiredData(set: WorkoutSet, trackingType: TrackingType): boolean {
  switch (trackingType) {
    case 'weight_reps': return !!(set.weight && set.reps)
    case 'reps_only': return !!set.reps
    case 'distance_time': return !!(set.distance || set.time_seconds)
    case 'time_only': return !!set.time_seconds
    default: return true
  }
}

function SetRow({
  set,
  idx,
  trackingType,
  onUpdate,
  onToggle,
  onRemove,
  canRemove,
}: {
  set: WorkoutSet
  idx: number
  trackingType: TrackingType
  onUpdate: (id: string, field: keyof WorkoutSet, value: any) => void
  onToggle: (id: string) => void
  onRemove: (id: string) => void
  canRemove: boolean
}) {
  const ready = hasRequiredData(set, trackingType)

  return (
    <div
      className={`flex items-center gap-1.5 p-2 rounded-xl border transition-all duration-200 ${
        set.is_completed
          ? 'bg-primary/10 border-primary/30'
          : 'bg-background/50 border-border/30 hover:border-border/60'
      }`}
    >
      <div className="w-8 flex items-center justify-center">
        <span className="text-[10px] font-black text-muted-foreground/40">{set.set_number}</span>
      </div>

      <div className="flex-1 flex gap-1.5">
        {trackingType === 'weight_reps' && (
          <>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="kg"
              value={set.weight ?? ''}
              onChange={e => onUpdate(set.id, 'weight', e.target.value === '' ? null : parseFloat(e.target.value))}
              disabled={set.is_completed}
              className="h-9 text-center text-sm bg-transparent border-border/40 focus-visible:ring-primary"
            />
            <Input
              type="number"
              inputMode="numeric"
              placeholder="reps"
              value={set.reps ?? ''}
              onChange={e => onUpdate(set.id, 'reps', e.target.value === '' ? null : parseInt(e.target.value))}
              disabled={set.is_completed}
              className="h-9 text-center text-sm bg-transparent border-border/40 focus-visible:ring-primary"
            />
          </>
        )}
        {trackingType === 'reps_only' && (
          <Input
            type="number"
            inputMode="numeric"
            placeholder="reps"
            value={set.reps ?? ''}
            onChange={e => onUpdate(set.id, 'reps', e.target.value === '' ? null : parseInt(e.target.value))}
            disabled={set.is_completed}
            className="h-9 text-center text-sm bg-transparent border-border/40 focus-visible:ring-primary"
          />
        )}
        {trackingType === 'distance_time' && (
          <>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="m"
              value={set.distance ?? ''}
              onChange={e => onUpdate(set.id, 'distance', e.target.value === '' ? null : parseFloat(e.target.value))}
              disabled={set.is_completed}
              className="h-9 text-center text-sm bg-transparent border-border/40 focus-visible:ring-primary"
            />
            <Input
              type="number"
              inputMode="numeric"
              placeholder="seg"
              value={set.time_seconds ?? ''}
              onChange={e => onUpdate(set.id, 'time_seconds', e.target.value === '' ? null : parseInt(e.target.value))}
              disabled={set.is_completed}
              className="h-9 text-center text-sm bg-transparent border-border/40 focus-visible:ring-primary"
            />
          </>
        )}
        {trackingType === 'time_only' && (
          <Input
            type="number"
            inputMode="numeric"
            placeholder="seg"
            value={set.time_seconds ?? ''}
            onChange={e => onUpdate(set.id, 'time_seconds', e.target.value === '' ? null : parseInt(e.target.value))}
            disabled={set.is_completed}
            className="h-9 text-center text-sm bg-transparent border-border/40 focus-visible:ring-primary"
          />
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {canRemove && !set.is_completed && (
          <button
            onClick={() => onRemove(set.id)}
            className="w-6 h-6 flex items-center justify-center text-muted-foreground/30 hover:text-destructive/60 transition-colors"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        )}
        <button
          onClick={() => {
            if (!set.is_completed && !ready) return
            onToggle(set.id)
          }}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all relative ${
            set.is_completed
              ? 'bg-primary text-primary-foreground shadow-[0_0_12px_rgba(var(--primary),0.5)]'
              : ready
              ? 'bg-secondary/80 text-muted-foreground hover:bg-primary/20 hover:text-primary border border-border/40'
              : 'bg-secondary/30 text-muted-foreground/30 border border-border/20 cursor-not-allowed'
          }`}
        >
          {set.is_completed ? (
            <Check className="w-4 h-4" />
          ) : !ready ? (
            <AlertCircle className="w-3.5 h-3.5" />
          ) : (
            <Check className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  )
}

export function WorkoutSetsList({
  movement,
  prs,
  initialSets,
  onSetChange,
  onTimerStart,
}: {
  movement: any
  prs?: Record<string, { weight: number, reps: number }>
  initialSets?: WorkoutSet[]
  onSetChange: (sets: WorkoutSet[]) => void
  onTimerStart: (seconds: number) => void
}) {
  const trackingType: TrackingType = movement.exercises?.tracking_type || 'weight_reps'

  // Percentage Calculation Logic
  const pb = prs?.[movement.exercises?.id]
  const percentageStr = movement.weight_percentage ? String(movement.weight_percentage) : null
  const percentageNum = percentageStr ? parseFloat(percentageStr.replace('%', '')) : null
  const calculatedWeight = (pb && percentageNum) ? Math.round(pb.weight * percentageNum / 100) : null

  const buildInitialSets = (): WorkoutSet[] => {
    if (initialSets && initialSets.length > 0) return initialSets

    const count = movement.sets || 1
    return Array.from({ length: count }, (_, i) => {
      let defaultReps: number | null = null
      if (movement.reps) {
        const parts = String(movement.reps).split('-')
        const parsed = parseInt(parts[Math.min(i, parts.length - 1)])
        if (!isNaN(parsed)) defaultReps = parsed
      }
      return {
        id: `${movement.id}-set-${i}`,
        movement_id: movement.id,
        set_number: i + 1,
        weight: calculatedWeight,
        reps: defaultReps,
        distance: null,
        time_seconds: null,
        is_completed: false,
      }
    })
  }

  const [sets, setSets] = useState<WorkoutSet[]>(buildInitialSets)

  useEffect(() => {
    if (sets.length > 0) onSetChange(sets)
  }, [sets]) // eslint-disable-line

  const updateSet = (id: string, field: keyof WorkoutSet, value: any) => {
    setSets(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  const toggleComplete = (id: string) => {
    setSets(prev => prev.map(s => {
      if (s.id !== id) return s
      const willComplete = !s.is_completed
      if (willComplete && movement.rest) {
        let secs = 60
        const r = movement.rest
        if (r.includes('s')) secs = parseInt(r)
        else if (r.includes('m')) secs = parseInt(r) * 60
        else secs = parseInt(r)
        if (!isNaN(secs) && secs > 0) onTimerStart(secs)
      }
      return { ...s, is_completed: willComplete }
    }))
  }

  const addSet = () => {
    setSets(prev => {
      const last = prev[prev.length - 1]
      return [
        ...prev,
        {
          id: `${movement.id}-set-${Date.now()}`,
          movement_id: movement.id,
          set_number: prev.length + 1,
          weight: last?.weight ?? calculatedWeight ?? null,
          reps: last?.reps ?? null,
          distance: last?.distance ?? null,
          time_seconds: last?.time_seconds ?? null,
          is_completed: false,
        },
      ]
    })
  }

  const removeSet = (id: string) => {
    setSets(prev => {
      const next = prev.filter(s => s.id !== id)
      return next.map((s, i) => ({ ...s, set_number: i + 1 }))
    })
  }

  const completeAll = () => {
    setSets(prev => prev.map(s => ({ ...s, is_completed: true })))
  }

  const allReady = sets.every(s => hasRequiredData(s, trackingType))
  const headerLabel: Record<TrackingType, string> = {
    weight_reps: 'Peso · Reps',
    reps_only: 'Repeticiones',
    distance_time: 'Distancia · Tiempo',
    time_only: 'Tiempo (seg)',
  }

  return (
    <div className="mt-3 space-y-2">
      {/* Percentage Info */}
      {percentageNum && (
        <div className="px-2 mb-2">
          <div className="flex items-center justify-between py-1.5 px-3 bg-primary/5 border border-primary/20 rounded-lg">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Objetivo: {percentageNum}%</span>
            {pb ? (
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Basado en RM: {pb.weight}kg</span>
            ) : (
              <span className="text-[10px] font-medium text-muted-foreground/60 italic lowercase">rm no registrado</span>
            )}
          </div>
        </div>
      )}

      {/* Column headers */}
      <div className="flex items-center gap-2 px-2 text-[10px] uppercase font-semibold text-muted-foreground/60 tracking-wider">
        <span className="w-8 text-center">#</span>
        <span className="flex-1 text-center">{headerLabel[trackingType]}</span>
        <span className="w-9 text-center">✓</span>
      </div>

      <div className="space-y-1.5">
        {sets.map((set, idx) => (
          <SetRow
            key={set.id}
            set={set}
            idx={idx}
            trackingType={trackingType}
            onUpdate={updateSet}
            onToggle={toggleComplete}
            onRemove={removeSet}
            canRemove={sets.length > 1}
          />
        ))}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-1 px-1">
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={addSet} className="h-7 text-xs text-muted-foreground hover:text-primary gap-1 px-2">
            <Plus className="w-3 h-3" /> Serie
          </Button>
          {sets.length > 1 && (
            <Button variant="ghost" size="sm" onClick={() => removeSet(sets[sets.length - 1].id)} className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1 px-2">
              <Minus className="w-3 h-3" /> Quitar
            </Button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={completeAll}
          disabled={!allReady}
          className="h-7 text-[10px] px-2 border-primary/30 text-primary hover:bg-primary/10 gap-1 rounded-full disabled:opacity-30"
        >
          <Check className="w-3 h-3" /><Check className="w-3 h-3 -ml-2" /> Todo
        </Button>
      </div>
    </div>
  )
}
