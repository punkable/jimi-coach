'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { assignPlan } from './actions'

type Athlete = {
  id: string
  full_name: string
  email: string
}

export function AssignDialog({ planId, athletes }: { planId: string, athletes: Athlete[] }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" className="flex-1" size="sm" onClick={() => setOpen(true)}>Asignar</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md glass border-border/50">
        <DialogHeader>
          <DialogTitle>Asignar Planificación</DialogTitle>
        </DialogHeader>
        <form action={async (formData) => {
          await assignPlan(formData)
          setOpen(false)
        }} className="space-y-4 pt-4">
          <input type="hidden" name="plan_id" value={planId} />
          
          <div className="space-y-2">
            <Label htmlFor="athlete_id">Seleccionar Alumno</Label>
            <select 
              id="athlete_id" 
              name="athlete_id" 
              required
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="" className="bg-background text-foreground">-- Selecciona un atleta --</option>
              {athletes.map(a => (
                <option key={a.id} value={a.id} className="bg-background text-foreground">
                  {a.full_name || a.email}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_date">Fecha de Inicio</Label>
            <Input 
              id="start_date" 
              name="start_date" 
              type="date" 
              required 
              defaultValue={new Date().toISOString().split('T')[0]}
              className="bg-background/50"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit">Asignar al Atleta</Button>
          </div>
        </form>
      </DialogContent>
      </Dialog>
    </>
  )
}
