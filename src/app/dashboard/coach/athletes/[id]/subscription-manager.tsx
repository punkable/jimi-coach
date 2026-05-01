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
  const [totalClasses, setTotalClasses] = useState(profile?.total_classes || 0)
  const [classesUsed, setClassesUsed] = useState(profile?.classes_used || 0)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateAthleteSubscription(profile.id, plan, totalClasses, classesUsed)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const addClass = () => setClassesUsed((prev: number) => Math.min(prev + 1, totalClasses))
  const removeClass = () => setClassesUsed((prev: number) => Math.max(prev - 1, 0))

  return (
    <Card className="border-primary/20 bg-card/40 shadow-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -z-10" />
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2 uppercase tracking-widest text-primary">
          <Flame className="w-5 h-5" />
          Control de Clases y Plan
        </CardTitle>
        <CardDescription>
          Asigna un plan y descuenta clases cuando asista.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Plan Contratado</label>
          <Select value={plan} onValueChange={(val) => {
            setPlan(val)
            const selectedMembership = memberships.find(m => m.name === val)
            if (selectedMembership && totalClasses === 0) {
              setTotalClasses(selectedMembership.default_classes)
            }
          }}>
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Total Clases</label>
            <Input 
              type="number" 
              value={totalClasses} 
              onChange={(e) => setTotalClasses(parseInt(e.target.value) || 0)} 
              className="bg-background/50 border-white/10 text-center font-bold text-lg"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Clases Usadas</label>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={removeClass} disabled={classesUsed <= 0}>
                <Minus className="w-4 h-4" />
              </Button>
              <Input 
                type="number" 
                value={classesUsed} 
                onChange={(e) => setClassesUsed(parseInt(e.target.value) || 0)} 
                className="bg-background/50 border-white/10 text-center font-bold text-lg"
              />
              <Button variant="outline" size="icon" onClick={addClass} disabled={classesUsed >= totalClasses}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Bar Preview */}
        {totalClasses > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-sm font-bold uppercase tracking-wider">
              <span>Usadas: {classesUsed}</span>
              <span className="text-primary">Disponibles: {totalClasses - classesUsed}</span>
            </div>
            <div className="h-3 w-full bg-secondary/50 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${classesUsed >= totalClasses ? 'bg-destructive' : 'bg-primary'}`}
                style={{ width: `${(classesUsed / totalClasses) * 100}%` }}
              />
            </div>
          </div>
        )}

        <Button onClick={handleSave} disabled={isSaving} className="w-full font-bold uppercase tracking-widest h-12 mt-4">
          {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Actualizando...</> : <><Save className="w-4 h-4 mr-2" /> Guardar Estado</>}
        </Button>
      </CardContent>
    </Card>
  )
}
