'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { signup } from './actions'
import { Textarea } from '@/components/ui/textarea'
import { User, Activity, Dumbbell, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react'

export function MultiStepSignup({ error }: { error?: string }) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    // Reset submitting state if error or message changes in the URL
    setIsSubmitting(false)
  }, [searchParams])

  // Store data in state to populate hidden inputs so AnimatePresence doesn't destroy the data
  const [formDataState, setFormDataState] = useState({
    full_name: '', email: '', password: '',
    weight_kg: '', height_cm: '', birth_date: '',
    snatch_rm: '', shirt_size: '', bio: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormDataState(prev => ({ ...prev, [e.target.id]: e.target.value }))
  }

  const nextStep = () => {
    // Validate Step 1 before moving to Step 2
    if (step === 1) {
      const form = document.getElementById('signup-form') as HTMLFormElement
      const fn = form.querySelector('#full_name') as HTMLInputElement
      const em = form.querySelector('#email') as HTMLInputElement
      const pw = form.querySelector('#password') as HTMLInputElement
      if (!fn?.value || !em?.value || !pw?.value) {
        form.reportValidity()
        return
      }
    }
    // Validate Step 2 before moving to Step 3
    if (step === 2) {
      const form = document.getElementById('signup-form') as HTMLFormElement
      const wk = form.querySelector('#weight_kg') as HTMLInputElement
      const hc = form.querySelector('#height_cm') as HTMLInputElement
      const bd = form.querySelector('#birth_date') as HTMLInputElement
      if (!wk?.value || !hc?.value || !bd?.value) {
        form.reportValidity()
        return
      }
    }
    setStep((prev) => Math.min(prev + 1, 3))
  }

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1))

  const [localError, setLocalError] = useState<string | undefined>(error)

  return (
    <div className="relative overflow-hidden w-full h-full">
      {/* Progress Bar */}
      <div className="flex gap-2 mb-6 px-1">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${step >= s ? 'bg-primary' : 'bg-primary/20'}`} />
        ))}
      </div>

      {localError && (
        <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md font-medium">
          {localError}
        </div>
      )}

      <form id="signup-form" action={async (data) => {
        setIsSubmitting(true)
        setLocalError(undefined)
        const result = await signup(data)
        if (result?.error) {
          setLocalError(result.error)
          setIsSubmitting(false)
        }
      }} className="relative min-h-[350px]">
        
        {/* Hidden inputs to ensure all data is submitted when form action fires */}
        <input type="hidden" name="full_name" value={formDataState.full_name} />
        <input type="hidden" name="email" value={formDataState.email} />
        <input type="hidden" name="password" value={formDataState.password} />
        <input type="hidden" name="weight_kg" value={formDataState.weight_kg} />
        <input type="hidden" name="height_cm" value={formDataState.height_cm} />
        <input type="hidden" name="birth_date" value={formDataState.birth_date} />
        <input type="hidden" name="snatch_rm" value={formDataState.snatch_rm} />
        <input type="hidden" name="shirt_size" value={formDataState.shirt_size} />
        <input type="hidden" name="bio" value={formDataState.bio} />

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 absolute w-full"
            >
              <div className="flex items-center gap-2 mb-2 text-primary font-bold">
                <User className="w-5 h-5" /> Paso 1: Tu Cuenta
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre completo</Label>
                <Input id="full_name" placeholder="John Doe" value={formDataState.full_name} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="atleta@ejemplo.com" value={formDataState.email} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" value={formDataState.password} onChange={handleChange} required />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 absolute w-full"
            >
              <div className="flex items-center gap-2 mb-2 text-primary font-bold">
                <Activity className="w-5 h-5" /> Paso 2: Datos Físicos
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                El coach necesita estos datos básicos para calcular tus pesos y enviarte un plan acorde a tu edad y contextura.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight_kg">Peso (Kg)</Label>
                  <Input id="weight_kg" type="number" step="0.1" placeholder="Ej: 75.5" value={formDataState.weight_kg} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height_cm">Altura (Cm)</Label>
                  <Input id="height_cm" type="number" placeholder="Ej: 175" value={formDataState.height_cm} onChange={handleChange} required />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
                <Input id="birth_date" type="date" value={formDataState.birth_date} onChange={handleChange} required />
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 absolute w-full"
            >
              <div className="flex items-center gap-2 mb-2 text-primary font-bold">
                <Dumbbell className="w-5 h-5" /> Paso 3: Perfil CrossFit (Opcional)
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Puedes rellenar esto ahora para ahorrar tiempo o dejarlo para después en tu perfil.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="snatch_rm">RM Snatch (Kg)</Label>
                  <Input id="snatch_rm" type="number" step="0.1" placeholder="Opcional" value={formDataState.snatch_rm} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shirt_size">Talla de Polera</Label>
                  <select id="shirt_size" className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1" value={formDataState.shirt_size} onChange={handleChange}>
                    <option className="bg-background text-foreground" value="">Seleccionar...</option>
                    <option className="bg-background text-foreground" value="XS">XS</option>
                    <option className="bg-background text-foreground" value="S">S</option>
                    <option className="bg-background text-foreground" value="M">M</option>
                    <option className="bg-background text-foreground" value="L">L</option>
                    <option className="bg-background text-foreground" value="XL">XL</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biografía o Notas Médicas</Label>
                <Textarea id="bio" placeholder="¿Alguna lesión importante? ¿Cuentanos de ti?" className="resize-none h-20" value={formDataState.bio} onChange={handleChange} />
              </div>

              {error && <p className="text-sm text-destructive font-medium mt-2">{error}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fixed Navigation Buttons at bottom */}
        <div className="absolute bottom-0 left-0 w-full flex gap-2 pt-4 bg-card/80 backdrop-blur">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={prevStep} disabled={isSubmitting}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
            </Button>
          )}
          
          {step < 3 ? (
            <Button type="button" className="flex-1 font-bold" onClick={nextStep}>
              Siguiente <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button type="submit" className="flex-1 font-bold" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Finalizar y Crear Cuenta
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
