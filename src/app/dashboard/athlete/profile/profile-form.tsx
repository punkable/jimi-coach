'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Settings, Save, Loader2, CheckCircle2, User, Smile } from 'lucide-react'
import { updateProfile } from '../actions'
import { motion, AnimatePresence } from 'framer-motion'

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
    emoji: profile?.emoji || '💪'
  })

  const emojis = ['💪', '🔥', '🦁', '🦍', '🏋️', '⚡', '🏆', '💎', '🚀', '🥊', '🌪️', '🧿', '🦴', '🦈', '🦅', '🎯', '✨', '👑', '🦾', '🔥']
  
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const initials = profile?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'

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
        birthDate: formData.birthDate || null,
        emoji: formData.emoji
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
      {/* Visual Avatar Sidebar (Moves into the Left Column conceptually) */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="glass rounded-[32px] p-8 flex flex-col items-center text-center relative group">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          
          <button 
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="relative w-28 h-28 md:w-32 md:h-32 rounded-[32px] bg-secondary/50 border-2 border-primary/20 flex items-center justify-center shadow-2xl mb-6 hover:border-primary/50 transition-all active:scale-95 group"
          >
            {/* Background Initials or Avatar */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-10 transition-opacity">
               <span className="text-4xl font-black">{initials}</span>
            </div>
            
            {/* The Actual Emoji */}
            <span className="text-5xl md:text-6xl drop-shadow-xl filter saturate-150">
              {formData.emoji}
            </span>
            
            {/* Hover Indicator */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-[30px] transition-opacity">
               <Smile className="w-8 h-8 text-white" />
            </div>

            {/* Tap Badge */}
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
                className="absolute inset-x-4 top-40 bg-card/95 backdrop-blur-2xl border border-primary/20 p-4 rounded-3xl z-50 shadow-2xl grid grid-cols-4 gap-2"
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

          <h2 className="text-2xl font-black tracking-tight uppercase leading-tight mb-1">{formData.fullName || 'Atleta'}</h2>
          <p className="text-[11px] font-black uppercase tracking-widest text-primary mb-6">Identidad Jimi.coach</p>
          
          <div className="w-full h-px bg-border/20 mb-6" />
          
          <div className="w-full space-y-4">
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Plan</span>
                <span className="text-xs font-black uppercase text-primary tracking-tighter">{profile?.subscription_plan || 'Sin Plan'}</span>
             </div>
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Estado</span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-green-500 uppercase italic">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Activo
                </span>
             </div>
          </div>
        </div>
      </div>

      {/* Main Forms Section */}
      <div className="lg:col-span-8 space-y-6">
        <Card className="border-white/5 bg-card/40 backdrop-blur-md shadow-xl rounded-[32px]">
          <CardHeader className="bg-white/5 pb-8">
            <CardTitle className="text-xl flex items-center gap-3 font-black uppercase tracking-tighter">
              <div className="p-2 rounded-xl bg-primary/10">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              Datos del Perfil
            </CardTitle>
            <CardDescription className="font-medium">
              Completa tu perfil para que el coach personalice tus WODs
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-8">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Nombre Completo</label>
                  <Input name="fullName" value={formData.fullName} onChange={handleChange} className="h-12 bg-background/50 border-white/5 focus-visible:ring-primary rounded-xl font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Teléfono / WhatsApp</label>
                  <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="+569..." className="h-12 bg-background/50 border-white/5 focus-visible:ring-primary rounded-xl font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Nacimiento</label>
                  <Input name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} className="h-12 bg-background/50 border-white/5 focus-visible:ring-primary rounded-xl font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Talla Polera</label>
                  <Input name="shirtSize" value={formData.shirtSize} onChange={handleChange} placeholder="S, M, L, XL" className="h-12 bg-background/50 border-white/5 focus-visible:ring-primary rounded-xl font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Peso (kg)</label>
                  <Input name="weight" type="number" step="0.1" value={formData.weight} onChange={handleChange} className="h-12 bg-background/50 border-white/5 focus-visible:ring-primary rounded-xl font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Estatura (cm)</label>
                  <Input name="height" type="number" value={formData.height} onChange={handleChange} className="h-12 bg-background/50 border-white/5 focus-visible:ring-primary rounded-xl font-medium" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">RM Snatch (kg)</label>
                  <Input name="snatchRm" type="number" step="0.1" value={formData.snatchRm} onChange={handleChange} className="h-12 bg-background/50 border-white/5 focus-visible:ring-primary rounded-xl font-medium" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Biografía / Notas</label>
                  <Textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} className="bg-background/50 border-white/5 focus-visible:ring-primary resize-none rounded-xl font-medium" placeholder="Alguna lesión o comentario para tu coach..." />
                </div>
              </div>
              
              <Button type="submit" className="w-full font-black uppercase tracking-widest h-14 mt-6 rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95" disabled={isSaving}>
                {isSaving ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Guardando...</>
                ) : success ? (
                  <><CheckCircle2 className="w-5 h-5 mr-2 text-green-400" /> ¡Perfil Guardado!</>
                ) : (
                  <><Save className="w-5 h-5 mr-2" /> Guardar Cambios</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
