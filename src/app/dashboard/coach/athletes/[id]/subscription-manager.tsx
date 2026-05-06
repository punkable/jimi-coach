'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Save, Loader2, Dumbbell } from 'lucide-react'
import { assignWorkoutPlan } from '../actions'
import { toast } from 'sonner'

export default function SubscriptionManager({
  profile,
  plans,
  currentPlanId,
}: {
  profile: any
  plans: any[]
  currentPlanId?: string
}) {
  const [activePlanId, setActivePlanId] = useState(currentPlanId || 'no-plan')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await assignWorkoutPlan(profile.id, activePlanId)
      toast.success('Plan actualizado con éxito')
    } catch (error) {
      console.error(error)
      toast.error('Error al guardar los cambios')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="ios-panel p-5 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Dumbbell className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="section-title mb-0.5">Programación</p>
          <p className="text-sm font-black uppercase tracking-tight">Asignar plan de entrenamiento</p>
        </div>
      </div>

      <Select value={activePlanId} onValueChange={(val) => setActivePlanId(val || 'no-plan')}>
        <SelectTrigger className="w-full font-bold text-sm h-11 rounded-xl">
          <SelectValue placeholder="Sin plan asignado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="no-plan" className="font-bold text-sm">Sin plan asignado</SelectItem>
          {plans.map((p) => (
            <SelectItem key={p.id} value={p.id} className="font-bold text-sm">{p.title}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        onClick={handleSave}
        disabled={isSaving || activePlanId === (currentPlanId || 'no-plan')}
        className="w-full font-black uppercase tracking-widest h-11 rounded-xl text-xs gap-2"
      >
        {isSaving ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
        ) : (
          <><Save className="w-4 h-4" /> Actualizar plan</>
        )}
      </Button>
    </div>
  )
}
