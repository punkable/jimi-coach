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
  const [localError, setLocalError] = useState<string | undefined>(error)
  const searchParams = useSearchParams()

  useEffect(() => {
    setIsSubmitting(false)
  }, [searchParams])

  const [formDataState, setFormDataState] = useState({
    full_name: '',
    email: '',
    password: '',
    weight_kg: '',
    height_cm: '',
    birth_date: '',
    snatch_rm: '',
    shirt_size: '',
    bio: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormDataState(prev => ({ ...prev, [e.target.id]: e.target.value }))
  }

  const nextStep = () => {
    const form = document.getElementById('signup-form') as HTMLFormElement
    if (step === 1) {
      const fn = form.querySelector('#full_name') as HTMLInputElement
      const em = form.querySelector('#email') as HTMLInputElement
      const pw = form.querySelector('#password') as HTMLInputElement
      if (!fn?.value || !em?.value || !pw?.value) {
        form.reportValidity()
        return
      }
    }
    if (step === 2) {
      const wk = form.querySelector('#weight_kg') as HTMLInputElement
      const hc = form.querySelector('#height_cm') as HTMLInputElement
      const bd = form.querySelector('#birth_date') as HTMLInputElement
      if (!wk?.value || !hc?.value || !bd?.value) {
        form.reportValidity()
        return
      }
    }
    setStep(prev => Math.min(prev + 1, 3))
  }

  const prevStep = () => setStep(prev => Math.max(prev - 1, 1))

  return (
    <div className="relative overflow-hidden w-full">
      <div className="flex gap-2 mb-6 px-1">
        {[1, 2, 3].map(s => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${step >= s ? 'bg-primary' : 'bg-secondary'}`} />
        ))}
      </div>

      {localError && (
        <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-2xl font-medium">
          {localError}
        </div>
      )}

      <form
        id="signup-form"
        action={async data => {
          setIsSubmitting(true)
          setLocalError(undefined)
          const result = await signup(data)
          if (result?.error) {
            setLocalError(result.error)
            setIsSubmitting(false)
          }
        }}
        className="relative min-h-[390px]"
      >
        {Object.entries(formDataState).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <StepShell key="step1" icon={User} eyebrow="Paso 1" title="Tu cuenta" color="primary">
              <Field label="Nombre completo">
                <Input id="full_name" placeholder="Nombre y apellido" value={formDataState.full_name} onChange={handleChange} required className="h-12 rounded-2xl bg-secondary/55" />
              </Field>
              <Field label="Email">
                <Input id="email" type="email" placeholder="atleta@ejemplo.com" value={formDataState.email} onChange={handleChange} required className="h-12 rounded-2xl bg-secondary/55" />
              </Field>
              <Field label="Contraseña">
                <Input id="password" type="password" placeholder="••••••••" value={formDataState.password} onChange={handleChange} required className="h-12 rounded-2xl bg-secondary/55" />
              </Field>
            </StepShell>
          )}

          {step === 2 && (
            <StepShell key="step2" icon={Activity} eyebrow="Paso 2" title="Datos físicos" color="athlete">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tu coach usa estos datos para ajustar cargas, progresiones y contexto del entrenamiento.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Peso kg">
                  <Input id="weight_kg" type="number" step="0.1" placeholder="75.5" value={formDataState.weight_kg} onChange={handleChange} required className="h-12 rounded-2xl bg-secondary/55" />
                </Field>
                <Field label="Altura cm">
                  <Input id="height_cm" type="number" placeholder="175" value={formDataState.height_cm} onChange={handleChange} required className="h-12 rounded-2xl bg-secondary/55" />
                </Field>
              </div>
              <Field label="Fecha de nacimiento">
                <Input id="birth_date" type="date" value={formDataState.birth_date} onChange={handleChange} required className="h-12 rounded-2xl bg-secondary/55" />
              </Field>
            </StepShell>
          )}

          {step === 3 && (
            <StepShell key="step3" icon={Dumbbell} eyebrow="Paso 3" title="Perfil CrossFit" color="strength">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Puedes completar estos datos ahora o editarlos después desde tu perfil.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="RM Snatch">
                  <Input id="snatch_rm" type="number" step="0.1" placeholder="Opcional" value={formDataState.snatch_rm} onChange={handleChange} className="h-12 rounded-2xl bg-secondary/55" />
                </Field>
                <Field label="Talla">
                  <select id="shirt_size" className="flex h-12 w-full rounded-2xl border border-input bg-secondary/55 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" value={formDataState.shirt_size} onChange={handleChange}>
                    <option className="bg-background text-foreground" value="">Seleccionar</option>
                    {['XS', 'S', 'M', 'L', 'XL'].map(size => (
                      <option key={size} className="bg-background text-foreground" value={size}>{size}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Notas para tu coach">
                <Textarea id="bio" placeholder="Lesiones, objetivos, experiencia o contexto importante." className="resize-none h-22 rounded-2xl bg-secondary/55" value={formDataState.bio} onChange={handleChange} />
              </Field>
            </StepShell>
          )}
        </AnimatePresence>

        <div className="absolute bottom-0 left-0 w-full flex gap-2 pt-4 bg-card/90 backdrop-blur">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={prevStep} disabled={isSubmitting} className="h-12 rounded-2xl">
              <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
            </Button>
          )}
          {step < 3 ? (
            <Button type="button" className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-xs" onClick={nextStep}>
              Siguiente <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button type="submit" className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-xs" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Crear cuenta
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string, children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="section-title">{label}</Label>
      {children}
    </div>
  )
}

function StepShell({ icon: Icon, eyebrow, title, color, children }: { icon: any, eyebrow: string, title: string, color: string, children: React.ReactNode }) {
  const colorMap: Record<string, string> = {
    primary: 'text-primary bg-primary/10 border-primary/20',
    athlete: 'text-[var(--athlete)] bg-[var(--athlete)]/10 border-[var(--athlete)]/20',
    strength: 'text-[var(--strength)] bg-[var(--strength)]/10 border-[var(--strength)]/20',
  }

  return (
    <motion.div
      initial={{ x: 18, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -18, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4 absolute w-full"
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="section-title">{eyebrow}</p>
          <h3 className="text-lg font-black uppercase tracking-tight">{title}</h3>
        </div>
      </div>
      {children}
    </motion.div>
  )
}
