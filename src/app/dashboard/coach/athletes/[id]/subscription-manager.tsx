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
      await updateAthleteSubscription(profile.id, membership)
      
      // 2. Update Workout Plan Assignment if changed
      if (activePlanId !== currentPlanId) {
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
    <Card className="bg-white/[0.03] border border-white/5 rounded-[40px] shadow-2xl overflow-hidden relative backdrop-blur-3xl group hover:border-primary/20 transition-all duration-500">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -z-10 group-hover:bg-primary/10 transition-colors duration-500" />
      <CardHeader className="pb-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black flex items-center gap-3 uppercase tracking-tighter text-white">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <Flame className="w-6 h-6 text-primary" />
              </div>
              Status & Programación
            </CardTitle>
            <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
              Control de acceso y asignación de carga
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-primary tracking-[0.3em] flex items-center gap-2">
              Plan Contratado
            </label>
            <Select value={membership} onValueChange={(val) => setMembership(val || "Sin Plan Activo")}>
              <SelectTrigger className="w-full bg-white/5 border-white/10 font-black uppercase text-[11px] h-14 rounded-2xl tracking-widest hover:bg-white/10 transition-all">
                <SelectValue placeholder="Selecciona membresía" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0a] border-white/10 text-white rounded-2xl overflow-hidden">
                <SelectItem value="Sin Plan Activo" className="font-bold uppercase text-[10px] tracking-widest focus:bg-primary focus:text-black">Sin Plan Activo</SelectItem>
                {memberships.map(opt => (
                  <SelectItem key={opt.id} value={opt.name} className="font-bold uppercase text-[10px] tracking-widest focus:bg-primary focus:text-black">{opt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
 
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-[var(--metcon)] tracking-[0.3em] flex items-center gap-2">
              <Dumbbell className="w-3.5 h-3.5" /> Programación WOD
            </label>
            <Select value={activePlanId} onValueChange={(val) => setActivePlanId(val || "no-plan")}>
              <SelectTrigger className="w-full bg-white/5 border-white/10 font-black uppercase text-[11px] h-14 rounded-2xl tracking-widest hover:bg-white/10 transition-all">
                <SelectValue placeholder="Sin Programación" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0a] border-white/10 text-white rounded-2xl overflow-hidden">
                <SelectItem value="no-plan" className="font-bold uppercase text-[10px] tracking-widest focus:bg-primary focus:text-black">Sin Programación</SelectItem>
                {plans.map(p => (
                  <SelectItem key={p.id} value={p.id} className="font-bold uppercase text-[10px] tracking-widest focus:bg-primary focus:text-black">{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
 
        <Button 
          onClick={handleSave} 
          disabled={isSaving} 
          className="w-full font-black uppercase tracking-[0.3em] h-16 rounded-[24px] bg-primary text-black hover:bg-primary/90 shadow-[0_15px_40px_rgba(204,255,0,0.2)] active:scale-95 transition-all text-xs border-none mt-4"
        >
          {isSaving ? (
            <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Sincronizando...</>
          ) : (
            <><Save className="w-5 h-5 mr-3 stroke-[3]" /> Actualizar Atleta</>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
