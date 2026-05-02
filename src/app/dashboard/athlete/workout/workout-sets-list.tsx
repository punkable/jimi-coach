'use client'

import { useState, useEffect } from 'react'
import { Check, Plus, Minus, Timer, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export type WorkoutSet = {
  movement_id: string
  set_number: number
  weight: number | null
  reps: number | null
  distance: number | null
  time_seconds: number | null
  is_completed: boolean
}

export function WorkoutSetsList({
  movement,
  onSetChange,
  onTimerStart
}: {
  movement: any
  onSetChange: (sets: WorkoutSet[]) => void
  onTimerStart: (seconds: number) => void
}) {
  const [sets, setSets] = useState<WorkoutSet[]>([])
  const trackingType = movement.exercises?.tracking_type || 'weight_reps'

  // Initialize sets based on the coach's prescription (movement.sets)
  useEffect(() => {
    const initialSetsCount = movement.sets || 1
    const initialSets: WorkoutSet[] = []
    for (let i = 0; i < initialSetsCount; i++) {
      // Try to parse reps from string like "10" or "5-5-5"
      let defaultReps = null
      if (movement.reps) {
        const repParts = movement.reps.split('-')
        const r = repParts[Math.min(i, repParts.length - 1)]
        const parsed = parseInt(r)
        if (!isNaN(parsed)) defaultReps = parsed
      }

      initialSets.push({
        movement_id: movement.id,
        set_number: i + 1,
        weight: null,
        reps: defaultReps,
        distance: null,
        time_seconds: null,
        is_completed: false
      })
    }
    setSets(initialSets)
  }, [movement.id, movement.sets, movement.reps])

  // Trigger parent callback when sets change
  useEffect(() => {
    if (sets.length > 0) {
      onSetChange(sets)
    }
  }, [sets]) // eslint-disable-line

  const updateSet = (index: number, field: keyof WorkoutSet, value: any) => {
    const newSets = [...sets]
    newSets[index] = { ...newSets[index], [field]: value }
    setSets(newSets)
  }

  const toggleComplete = (index: number) => {
    const newSets = [...sets]
    const wasCompleted = newSets[index].is_completed
    newSets[index].is_completed = !wasCompleted
    setSets(newSets)

    // If just completed and has rest, trigger timer
    if (!wasCompleted && movement.rest) {
      // Parse rest like "90s" or "1m"
      let seconds = 60
      if (movement.rest.includes('s')) seconds = parseInt(movement.rest)
      else if (movement.rest.includes('m')) seconds = parseInt(movement.rest) * 60
      else seconds = parseInt(movement.rest)
      
      if (!isNaN(seconds) && seconds > 0) {
        onTimerStart(seconds)
      }
    }
  }

  const addSet = () => {
    const newSetNumber = sets.length + 1
    const prevSet = sets.length > 0 ? sets[sets.length - 1] : null
    setSets([
      ...sets,
      {
        movement_id: movement.id,
        set_number: newSetNumber,
        weight: prevSet?.weight || null,
        reps: prevSet?.reps || null,
        distance: prevSet?.distance || null,
        time_seconds: prevSet?.time_seconds || null,
        is_completed: false
      }
    ])
  }

  const removeSet = (index: number) => {
    const newSets = [...sets]
    newSets.splice(index, 1)
    // Re-number
    newSets.forEach((s, i) => s.set_number = i + 1)
    setSets(newSets)
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="grid grid-cols-12 gap-2 text-[10px] uppercase font-bold text-muted-foreground mb-1 px-2">
        <div className="col-span-2 text-center">Set</div>
        
        {trackingType === 'weight_reps' && (
          <>
            <div className="col-span-4 text-center">Peso</div>
            <div className="col-span-4 text-center">Reps</div>
          </>
        )}
        {trackingType === 'reps_only' && (
          <div className="col-span-8 text-center">Reps</div>
        )}
        {trackingType === 'distance_time' && (
          <>
            <div className="col-span-4 text-center">Distancia</div>
            <div className="col-span-4 text-center">Tiempo</div>
          </>
        )}
        {trackingType === 'time_only' && (
          <div className="col-span-8 text-center">Tiempo (s)</div>
        )}
        
        <div className="col-span-2 text-center"><Check className="w-3 h-3 mx-auto" /></div>
      </div>

      {sets.map((set, idx) => (
        <div 
          key={idx} 
          className={`grid grid-cols-12 gap-2 items-center p-2 rounded-lg transition-colors ${
            set.is_completed ? 'bg-primary/10 border border-primary/20' : 'bg-background/50 border border-border/30'
          }`}
        >
          <div className="col-span-2 flex items-center justify-center font-bold text-sm">
            {set.set_number}
          </div>

          {trackingType === 'weight_reps' && (
            <>
              <div className="col-span-4">
                <Input 
                  type="number" 
                  placeholder="kg/lb" 
                  value={set.weight || ''}
                  onChange={e => updateSet(idx, 'weight', parseFloat(e.target.value))}
                  disabled={set.is_completed}
                  className="h-8 text-center bg-transparent border-0 focus-visible:ring-1"
                />
              </div>
              <div className="col-span-4">
                <Input 
                  type="number" 
                  placeholder="reps"
                  value={set.reps || ''}
                  onChange={e => updateSet(idx, 'reps', parseInt(e.target.value))}
                  disabled={set.is_completed}
                  className="h-8 text-center bg-transparent border-0 focus-visible:ring-1"
                />
              </div>
            </>
          )}
          {trackingType === 'reps_only' && (
            <div className="col-span-8">
              <Input 
                type="number" 
                placeholder="reps"
                value={set.reps || ''}
                onChange={e => updateSet(idx, 'reps', parseInt(e.target.value))}
                disabled={set.is_completed}
                className="h-8 text-center bg-transparent border-0 focus-visible:ring-1"
              />
            </div>
          )}
          {trackingType === 'distance_time' && (
            <>
              <div className="col-span-4">
                <Input 
                  type="number" 
                  placeholder="m/km"
                  value={set.distance || ''}
                  onChange={e => updateSet(idx, 'distance', parseFloat(e.target.value))}
                  disabled={set.is_completed}
                  className="h-8 text-center bg-transparent border-0 focus-visible:ring-1"
                />
              </div>
              <div className="col-span-4">
                <Input 
                  type="number" 
                  placeholder="segs"
                  value={set.time_seconds || ''}
                  onChange={e => updateSet(idx, 'time_seconds', parseInt(e.target.value))}
                  disabled={set.is_completed}
                  className="h-8 text-center bg-transparent border-0 focus-visible:ring-1"
                />
              </div>
            </>
          )}
          {trackingType === 'time_only' && (
            <div className="col-span-8">
              <Input 
                type="number" 
                placeholder="segundos"
                value={set.time_seconds || ''}
                onChange={e => updateSet(idx, 'time_seconds', parseInt(e.target.value))}
                disabled={set.is_completed}
                className="h-8 text-center bg-transparent border-0 focus-visible:ring-1"
              />
            </div>
          )}

          <div className="col-span-2 flex justify-center">
            <button
              onClick={() => toggleComplete(idx)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${set.is_completed ? 'bg-primary text-primary-foreground shadow-[0_0_10px_rgba(var(--primary),0.5)]' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      <div className="flex justify-center pt-2">
        <Button variant="ghost" size="sm" onClick={addSet} className="text-xs text-muted-foreground hover:text-primary gap-1">
          <Plus className="w-3 h-3" /> Añadir Serie
        </Button>
        {sets.length > 1 && (
          <Button variant="ghost" size="sm" onClick={() => removeSet(sets.length - 1)} className="text-xs text-muted-foreground hover:text-destructive gap-1">
            <Minus className="w-3 h-3" /> Quitar
          </Button>
        )}
      </div>
    </div>
  )
}
