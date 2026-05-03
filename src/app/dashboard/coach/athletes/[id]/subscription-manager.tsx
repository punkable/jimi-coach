'use client'
 
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Flame, Save, Loader2, Dumbbell } from 'lucide-react'
import { updateAthleteSubscription, assignWorkoutPlan } from '../actions'
import { toast } from 'sonner'
 
export default function SubscriptionManager({ 
  profile, 
  memberships, 
  plans, 
  currentPlanId 
}: { 
  profile: any, 
  memberships: any[], 
  plans: any[], 
  currentPlanId?: string 
}) {
  const [membership, setMembership] = useState(profile?.subscription_plan || "Sin Plan Activo")
  const [activePlanId, setActivePlanId] = useState(currentPlanId || "no-plan")
  const [isSaving, setIsSaving] = useState(false)
 
  const handleSave = async () => {
    setIsSaving(true)
    try {
      // 1. Update Membership Text
      await updateAthleteSubscription(profile.id, membership, 0, 0)
      
      // 2. Update Workout Plan Assignment if changed
      if (activePlanId !== currentPlanId && activePlanId !== "no-plan") {
        await assignWorkoutPlan(profile.id, activePlanId)
      }
      
      toast.success('Cambios guardados con éxito')
    } catch (error) {
      console.error(error)
      toast.error('Error al guardar los cambios')
    } finally {
      setIsSaving(false)
    }
  }
 
  return (
    <Card className="border-primary/20 bg-card/40 shadow-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -z-10" />
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2 uppercase tracking-widest text-primary">
          <Flame className="w-5 h-5" />
          Membresía y Programación
        </CardTitle>
        <CardDescription>
          Gestiona el nivel de acceso y el plan de entrenamiento del atleta.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
              Plan Contratado
            </label>
            <Select value={membership} onValueChange={(val) => setMembership(val)}>
              <SelectTrigger className="w-full bg-background/50 border-white/10 font-bold uppercase text-xs h-11">
                <SelectValue placeholder="Selecciona un plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sin Plan Activo">Sin Plan Activo</SelectItem>
                {memberships.map(opt => (
                  <SelectItem key={opt.id} value={opt.name}>{opt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
 
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
              <Dumbbell className="w-3 h-3" /> Programación (WOD)
            </label>
            <Select value={activePlanId} onValueChange={(val) => setActivePlanId(val)}>
              <SelectTrigger className="w-full bg-background/50 border-white/10 font-bold uppercase text-xs h-11">
                <SelectValue placeholder="Sin Programación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-plan">Sin Programación</SelectItem>
                {plans.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
 
        <Button onClick={handleSave} disabled={isSaving} className="w-full font-black uppercase tracking-[0.2em] h-12 mt-4 shadow-lg shadow-primary/20">
          {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</> : <><Save className="w-4 h-4 mr-2" /> Guardar Cambios</>}
        </Button>
      </CardContent>
    </Card>
  )
}
