'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Settings, Save, Loader2, CheckCircle2 } from 'lucide-react'
import { updateProfile } from '../actions'

export default function ProfileForm({ profile }: { profile: any }) {
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    phone: profile?.phone_number || '',
    bio: profile?.bio || '',
    weight: profile?.weight_kg || '',
    height: profile?.height_cm || '',
    snatchRm: profile?.snatch_rm || '',
    shirtSize: profile?.shirt_size || '',
    birthDate: profile?.birth_date || ''
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
      await updateProfile({
        fullName: formData.fullName,
        phone: formData.phone,
        bio: formData.bio,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseInt(formData.height) : null,
        snatchRm: formData.snatchRm ? parseFloat(formData.snatchRm) : null,
        shirtSize: formData.shirtSize,
        birthDate: formData.birthDate || null
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="border-white/5 bg-card/40 backdrop-blur-md shadow-xl mt-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 uppercase tracking-widest text-primary">
          <Settings className="w-5 h-5" />
          Datos Físicos y Personales
        </CardTitle>
        <CardDescription>
          Mantén tu información al día para una mejor planificación
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Nombre Completo</label>
              <Input name="fullName" value={formData.fullName} onChange={handleChange} className="bg-background/50 border-white/10 focus-visible:ring-primary" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Teléfono / WhatsApp</label>
              <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="+569..." className="bg-background/50 border-white/10 focus-visible:ring-primary" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Fecha de Nacimiento</label>
              <Input name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} className="bg-background/50 border-white/10 focus-visible:ring-primary" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Talla de Polera</label>
              <Input name="shirtSize" value={formData.shirtSize} onChange={handleChange} placeholder="S, M, L, XL" className="bg-background/50 border-white/10 focus-visible:ring-primary" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Peso (kg)</label>
              <Input name="weight" type="number" step="0.1" value={formData.weight} onChange={handleChange} className="bg-background/50 border-white/10 focus-visible:ring-primary" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Estatura (cm)</label>
              <Input name="height" type="number" value={formData.height} onChange={handleChange} className="bg-background/50 border-white/10 focus-visible:ring-primary" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">RM de Snatch (kg) - Opcional</label>
              <Input name="snatchRm" type="number" step="0.1" value={formData.snatchRm} onChange={handleChange} className="bg-background/50 border-white/10 focus-visible:ring-primary" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Biografía / Lesiones / Notas</label>
              <Textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} className="bg-background/50 border-white/10 focus-visible:ring-primary resize-none" placeholder="Cuéntanos un poco sobre ti o si tienes alguna lesión que debamos considerar..." />
            </div>
          </div>
          
          <Button type="submit" className="w-full font-bold uppercase tracking-widest h-12 mt-6" disabled={isSaving}>
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
