'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Settings, Save, Loader2, CheckCircle2, Smile, Target, AlertTriangle,
  CalendarRange, MessageSquare, Trophy,
} from 'lucide-react'
import { updateProfile } from '../actions'
import { motion, AnimatePresence } from 'framer-motion'

const EXPERIENCE_LEVELS = [
  { value: '',           label: 'Sin definir' },
  { value: 'principiante', label: 'Principiante (<1 año)' },
  { value: 'intermedio',   label: 'Intermedio (1-3 años)' },
  { value: 'avanzado',     label: 'Avanzado (3+ años)' },
  { value: 'competidor',   label: 'Competidor / Rx+' },
]

export default function ProfileForm({ profile }: { profile: any }) {
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    phone: profile?.phone_number || '',
    bio: profile?.bio || '',
    weight: profile?.weight_kg || '',
    height: profile?.height_cm || '',
    snatchRm: profile?.snatch_rm || '',
    shirtSize: profile?.shirt_size || '',
    birthDate: profile?.birth_date || '',
    emoji: profile?.emoji || '💪',
    goal: profile?.goal || '',
    experienceLevel: profile?.experience_level || '',
    injuries: profile?.injuries || '',
    availability: profile?.availability || '',
    athleteNotes: profile?.athlete_notes || '',
  })

  const emojis = ['💪', '🔥', '🦁', '🦍', '🏋️', '⚡', '🏆', '💎', '🚀', '🥊', '🌪️', '🧿', '🦴', '🦈', '🦅', '🎯', '✨', '👑', '🦾', '🌟']

  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const initials = profile?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
        weight: formData.weight ? parseFloat(formData.weight as any) : null,
        height: formData.height ? parseInt(formData.height as any) : null,
        snatchRm: formData.snatchRm ? parseFloat(formData.snatchRm as any) : null,
        shirtSize: formData.shirtSize,
        birthDate: formData.birthDate || null,
        emoji: formData.emoji,
        goal: formData.goal,
        experienceLevel: formData.experienceLevel,
        injuries: formData.injuries,
        availability: formData.availability,
        athleteNotes: formData.athleteNotes,
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const inputClass = 'h-12 bg-background/50 border-white/5 focus-visible:ring-primary rounded-xl font-medium'
  const selectClass = inputClass + ' w-full px-3 outline-none focus:ring-2 focus:ring-primary/40'
  const labelClass = 'text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1'

  return (
    <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
      {/* Avatar sidebar */}
      <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-6">
        <div className="glass rounded-[32px] p-8 flex flex-col items-center text-center relative">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none rounded-[32px]" />

          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="relative w-28 h-28 md:w-32 md:h-32 rounded-[32px] bg-secondary/50 border-2 border-primary/20 flex items-center justify-center shadow-2xl mb-6 hover:border-primary/50 transition-all active:scale-95 group"
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-10 transition-opacity">
              <span className="text-4xl font-black">{initials}</span>
            </div>
            <span className="text-5xl md:text-6xl drop-shadow-xl filter saturate-150">
              {formData.emoji}
            </span>
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-[30px] transition-opacity">
              <Smile className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-primary text-white p-1.5 rounded-xl shadow-lg border-2 border-background">
              <Settings className="w-3 h-3" />
            </div>
          </button>

          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute inset-x-4 top-40 bg-card/95 backdrop-blur-2xl border border-primary/20 p-4 rounded-3xl z-50 shadow-2xl grid grid-cols-5 gap-2"
              >
                {emojis.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, emoji: em })
                      setShowEmojiPicker(false)
                    }}
                    className={`text-2xl p-2 rounded-xl hover:bg-primary/20 transition-all ${formData.emoji === em ? 'bg-primary/10 border border-primary/30' : ''}`}
                  >
                    {em}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <h2 className="text-2xl font-black tracking-tight uppercase leading-tight mb-1 break-words max-w-full">{formData.fullName || 'Atleta'}</h2>
          <p className="text-[11px] font-black uppercase tracking-widest text-primary mb-2">Tu identidad LDRFIT</p>
        </div>

        <Button
          type="submit"
          className="w-full font-black uppercase tracking-widest h-14 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95"
          disabled={isSaving}
        >
          {isSaving ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Guardando...</>
          ) : success ? (
            <><CheckCircle2 className="w-5 h-5 mr-2 text-green-400" /> Guardado</>
          ) : (
            <><Save className="w-5 h-5 mr-2" /> Guardar cambios</>
          )}
        </Button>
      </div>

      {/* Forms */}
      <div className="lg:col-span-8 space-y-6 min-w-0">
        {/* Basic data */}
        <Card className="border-white/5 bg-card/40 backdrop-blur-md shadow-xl rounded-[32px]">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2 font-black uppercase tracking-tighter">
              <Settings className="w-4 h-4 text-primary" /> Datos personales
            </CardTitle>
            <CardDescription>Información básica de contacto y antropometría.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Nombre completo</label>
                <Input name="fullName" value={formData.fullName} onChange={handleChange} className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Teléfono / WhatsApp</label>
                <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="+569..." className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Fecha de nacimiento</label>
                <Input name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Talla polera</label>
                <Input name="shirtSize" value={formData.shirtSize} onChange={handleChange} placeholder="S, M, L, XL" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Peso (kg)</label>
                <Input name="weight" type="number" step="0.1" value={formData.weight} onChange={handleChange} className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Estatura (cm)</label>
                <Input name="height" type="number" value={formData.height} onChange={handleChange} className={inputClass} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className={labelClass}>RM Snatch (kg)</label>
                <Input name="snatchRm" type="number" step="0.1" value={formData.snatchRm} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coach planning data */}
        <Card className="border-white/5 bg-card/40 backdrop-blur-md shadow-xl rounded-[32px]">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2 font-black uppercase tracking-tighter">
              <Target className="w-4 h-4 text-[var(--metcon)]" /> Datos para tu coach
            </CardTitle>
            <CardDescription>Le ayudan a tu coach a personalizar tu programación. Puedes dejarlo en blanco si aún no lo sabes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass + ' flex items-center gap-1.5'}>
                  <Trophy className="w-3 h-3" /> Objetivo principal
                </label>
                <Input name="goal" value={formData.goal} onChange={handleChange} placeholder="Ej: ganar fuerza, competir, perder grasa" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Nivel de experiencia</label>
                <select name="experienceLevel" value={formData.experienceLevel} onChange={handleChange} className={selectClass}>
                  {EXPERIENCE_LEVELS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass + ' flex items-center gap-1.5'}>
                <CalendarRange className="w-3 h-3" /> Disponibilidad / días preferidos
              </label>
              <Input name="availability" value={formData.availability} onChange={handleChange} placeholder="Ej: Lun/Mié/Vie 19h, fines de semana mañana" className={inputClass} />
            </div>

            <div className="space-y-1.5">
              <label className={labelClass + ' flex items-center gap-1.5 text-amber-500'}>
                <AlertTriangle className="w-3 h-3" /> Lesiones o limitaciones
              </label>
              <Textarea
                name="injuries"
                value={formData.injuries}
                onChange={handleChange}
                rows={2}
                placeholder="Ej: hombro derecho doloroso desde 2024, evitar burpees de pecho"
                className="bg-background/50 border-white/5 focus-visible:ring-primary resize-none rounded-xl font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClass + ' flex items-center gap-1.5'}>
                <MessageSquare className="w-3 h-3" /> Notas para tu coach
              </label>
              <Textarea
                name="athleteNotes"
                value={formData.athleteNotes}
                onChange={handleChange}
                rows={3}
                placeholder="Cualquier contexto que ayude a planificar mejor: viajes, sueño, motivación, dolencias recientes..."
                className="bg-background/50 border-white/5 focus-visible:ring-primary resize-none rounded-xl font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>Bio breve (opcional, pública)</label>
              <Textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={2}
                placeholder="Cómo te describirías como atleta..."
                className="bg-background/50 border-white/5 focus-visible:ring-primary resize-none rounded-xl font-medium"
              />
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full lg:hidden font-black uppercase tracking-widest h-14 rounded-2xl shadow-xl shadow-primary/20"
          disabled={isSaving}
        >
          {isSaving ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Guardando...</>
          ) : success ? (
            <><CheckCircle2 className="w-5 h-5 mr-2 text-green-400" /> Guardado</>
          ) : (
            <><Save className="w-5 h-5 mr-2" /> Guardar cambios</>
          )}
        </Button>
      </div>
    </form>
  )
}
