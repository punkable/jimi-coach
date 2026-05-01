'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Save, Loader2, CheckCircle2 } from 'lucide-react'
import { updateCoachProfile } from './actions'

export default function CoachSettingsForm({ initialName, email }: { initialName: string, email: string }) {
  const [name, setName] = useState(initialName)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSuccess(false)
    try {
      await updateCoachProfile(name)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Perfil del Entrenador
        </CardTitle>
        <CardDescription>Actualiza tu información personal</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre Completo</Label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Tu nombre"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} disabled className="bg-muted" />
            </div>
          </div>
          <Button type="submit" disabled={isSaving || name === initialName}>
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
