'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Flame, Plus, Minus, Save, Loader2 } from 'lucide-react'
import { updateAthleteSubscription } from '../actions'

export default function SubscriptionManager({ profile, memberships }: { profile: any, memberships: any[] }) {
  const [plan, setPlan] = useState(profile?.subscription_plan || "Sin Plan Activo")
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // We still pass 0 for classes since they are no longer used in the UI
      await updateAthleteSubscription(profile.id, plan, 0, 0)
    } catch (error) {
      console.error(error)
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
          Control de Membresía
        </CardTitle>
        <CardDescription>
          Asigna un plan activo al atleta para permitirle entrenar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Plan Contratado</label>
          <Select value={plan} onValueChange={(val) => setPlan(val)}>
            <SelectTrigger className="w-full bg-background/50 border-white/10 font-bold uppercase">
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

        <Button onClick={handleSave} disabled={isSaving} className="w-full font-bold uppercase tracking-widest h-12 mt-4">
          {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Actualizando...</> : <><Save className="w-4 h-4 mr-2" /> Guardar Plan</>}
        </Button>
      </CardContent>
    </Card>
  )
}
