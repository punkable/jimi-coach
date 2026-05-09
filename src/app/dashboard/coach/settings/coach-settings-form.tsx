'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { User, Save, Loader2, CheckCircle2, Award, Target as TargetIcon } from 'lucide-react'
import { updateCoachProfile } from './actions'

export default function CoachSettingsForm({ profile, email }: { profile: any; email: string }) {
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    phone: profile?.phone_number || '',
    bio: profile?.bio || '',
    specialty: profile?.specialty || '',
    certifications: profile?.certifications || '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSuccess(false)
    try {
      await updateCoachProfile(formData)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="ios-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Perfil del coach
        </CardTitle>
        <CardDescription>Datos visibles para tus alumnos y útiles para coordinar con tu equipo.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Nombre completo</Label>
              <Input name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Tu nombre" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={email} disabled className="bg-muted" />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono / WhatsApp</Label>
              <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="+569..." />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5"><TargetIcon className="w-3 h-3" /> Especialidad</Label>
              <Input name="specialty" value={formData.specialty} onChange={handleChange} placeholder="Ej: CrossFit, Halterofilia, Endurance..." />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Bio breve</Label>
            <Textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} placeholder="Cómo te describes como coach..." className="resize-none" />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><Award className="w-3 h-3" /> Certificaciones / experiencia</Label>
            <Textarea
              name="certifications"
              value={formData.certifications}
              onChange={handleChange}
              rows={2}
              placeholder="Ej: CrossFit L2, INEFC, 10 años de experiencia"
              className="resize-none"
            />
          </div>

          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
            ) : success ? (
              <><CheckCircle2 className="w-4 h-4 mr-2 text-green-400" /> Guardado</>
            ) : (
              <><Save className="w-4 h-4 mr-2" /> Guardar cambios</>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
