'use client'

import { useState, useEffect } from 'react'
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
  const [hasProgress, setHasProgress] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if there is any workout progress for today in localStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('wod-progress-')) {
          const saved = JSON.parse(localStorage.getItem(key) || '{}')
          const isToday = new Date(saved.timestamp).toDateString() === new Date().toDateString()
          if (isToday && (saved.sets || saved.blocks)) {
            setHasProgress(true)
            break
          }
        }
      }
    } catch (e) {
      console.error('Error checking progress:', e)
    }
  }, [])

  const confirmStart = () => {
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
                      <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
                        {hasProgress ? 'Reanudar Entrenamiento' : 'Comenzar Sesión'}
                      </h3>
                      <p className="text-muted-foreground text-sm md:text-base font-medium">
                        {hasProgress ? 'Continúa donde quedaste.' : 'Selecciona tu día y empieza a entrenar.'}
                      </p>
                    </div>
                  </div>
                </div>
                <Button 
                  size="lg" 
                  className={`h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl group-hover:scale-105 transition-transform ${hasProgress ? 'bg-primary text-primary-foreground animate-pulse' : ''}`}
                >
                  {hasProgress ? 'Reanudar WOD' : 'Entrenar Ahora'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </Link>
      </section>
    </>
  )
}
    </>
  )
}
