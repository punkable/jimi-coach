'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  PlayCircle, Dumbbell, AlertTriangle, 
  Zap, ArrowRight 
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface StartWorkoutCardProps {
  plan: any
  trainedToday: boolean
}

export function StartWorkoutCard({ plan, trainedToday }: StartWorkoutCardProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const handleStartClick = (e: React.MouseEvent) => {
    if (trainedToday) {
      e.preventDefault()
      setShowConfirm(true)
    }
  }

  const confirmStart = () => {
    setShowConfirm(false)
    router.push('/dashboard/athlete/workout')
  }

  return (
    <>
      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-xl font-black uppercase tracking-tight">Tu Entrenamiento</h2>
          {plan && <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{plan.title}</span>}
        </div>
        
        <Link 
          href="/dashboard/athlete/workout" 
          onClick={handleStartClick}
          className="block group"
        >
          <Card className="glass overflow-hidden border-primary/20 group-hover:border-primary/50 transition-all duration-300 relative">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Dumbbell className="w-32 h-32 -rotate-12" />
            </div>
            <CardContent className="p-8 md:p-12">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.4)]">
                      <PlayCircle className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
                        {trainedToday ? 'Volver a Entrenar' : 'Comenzar WOD'}
                      </h3>
                      <p className="text-muted-foreground text-sm md:text-base font-medium">
                        {trainedToday ? '¡Ya entrenaste hoy! ¿Quieres otra sesión?' : 'Pulsa para iniciar tu sesión de hoy.'}
                      </p>
                    </div>
                  </div>
                </div>
                <Button 
                  size="lg" 
                  className={`h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl group-hover:scale-105 transition-transform ${trainedToday ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' : ''}`}
                >
                  {trainedToday ? 'Nueva Sesión' : 'Entrenar Ahora'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </Link>
      </section>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="glass border-primary/20 max-w-[90vw] md:max-w-md rounded-3xl">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-left">
              ¿Entrenar de nuevo?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-base text-left pt-2 leading-relaxed">
              Ya tienes un entrenamiento registrado hoy. Si decides entrenar de nuevo, se considerará como <span className="text-white font-bold">una clase extra</span> y se descontará de tu membresía.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 my-4">
            <div className="flex gap-3">
              <Zap className="w-5 h-5 text-primary shrink-0" />
              <p className="text-xs font-medium text-primary/90 leading-relaxed">
                Cada inicio de WOD consume 1 cupo de tu plan actual. Asegúrate de tener clases disponibles.
              </p>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirm(false)}
              className="w-full sm:w-auto rounded-xl font-bold uppercase tracking-widest text-xs"
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmStart}
              className="w-full sm:w-auto rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
            >
              Confirmar Sesión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
