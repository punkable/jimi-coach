'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Settings, Save, Loader2, CheckCircle2 } from 'lucide-react'
import { updateProfile } from '../actions'

export default function ProfileForm({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSuccess(false)
    try {
      await updateProfile(name)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="border-white/5 bg-card/40 backdrop-blur-md shadow-xl">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 uppercase tracking-widest text-primary">
          <Settings className="w-5 h-5" />
          Ajustes de Cuenta
        </CardTitle>
        <CardDescription>
          Actualiza tu información personal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Nombre Completo</label>
            <Input 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Tu nombre"
              className="bg-background/50 border-white/10 focus-visible:ring-primary"
            />
          </div>
          
          <Button type="submit" className="w-full font-bold uppercase tracking-widest h-12" disabled={isSaving || name === initialName}>
            {isSaving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
            ) : success ? (
              <><CheckCircle2 className="w-4 h-4 mr-2 text-green-400" /> ¡Guardado!</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Guardar Cambios</>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
