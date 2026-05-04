'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  PlayCircle, Calendar, ChevronRight, CheckCircle2, Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface StartWorkoutCardProps {
  plan: any
  planDays: any[]
  trainedToday: boolean
}

export function StartWorkoutCard({ plan, planDays = [], trainedToday }: StartWorkoutCardProps) {
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0)
  
  // Set initial selected day based on day of week or first available
  useEffect(() => {
    const today = new Date().getDay() // 0 = Sun, 1 = Mon...
    const adjustedToday = today === 0 ? 7 : today
    const todayIdx = planDays.findIndex(d => d.day_of_week === adjustedToday)
    if (todayIdx !== -1) setSelectedDayIdx(todayIdx)
  }, [planDays])

  const selectedDay = planDays[selectedDayIdx]
  const dayNames = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM']

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Mi Planificación</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{plan?.title || 'Sin Plan Asignado'}</p>
        </div>
        <Calendar className="w-5 h-5 text-primary/40" />
      </div>

      {/* Day Selector Hub */}
      <div className="bg-card rounded-[32px] p-2 border border-border/10 shadow-lg">
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-1">
          {planDays.map((day, idx) => {
            const isSelected = selectedDayIdx === idx
            const dayLabel = dayNames[(day.day_of_week - 1) % 7]
            
            return (
              <button
                key={day.id}
                onClick={() => setSelectedDayIdx(idx)}
                className={cn(
                  "flex-1 min-w-[64px] py-4 rounded-[24px] flex flex-col items-center gap-1 transition-all duration-300",
                  isSelected 
                    ? "bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(var(--primary),0.3)] scale-105" 
                    : "hover:bg-secondary/50 text-muted-foreground border border-transparent"
                )}
              >
                <span className={cn(
                  "text-[8px] font-black tracking-widest uppercase",
                  isSelected ? "opacity-70" : "text-muted-foreground/40"
                )}>{dayLabel}</span>
                <span className="text-xl font-black leading-none">{day.day_of_week}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Day Preview Card */}
      {selectedDay && (
        <Card className="glass-card overflow-hidden relative group border-none">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--metcon)]/10 via-transparent to-transparent opacity-50" />
          <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:opacity-[0.1] transition-opacity rotate-12">
            <PlayCircle className="w-40 h-40" />
          </div>
          <CardContent className="p-8 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="space-y-4 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center shadow-2xl font-black text-lg">
                    {selectedDay.day_of_week}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">
                      {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][(selectedDay.day_of_week - 1) % 7]}
                    </h3>
                    <p className="text-primary font-black uppercase tracking-widest text-[10px] mt-1">
                      {selectedDay.title || 'Sesión de Entrenamiento'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-center md:justify-start gap-4">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/20">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--metcon)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {selectedDay.workout_blocks?.length || 0} Bloques
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 border border-border/20">
                    <Zap className="w-3.5 h-3.5 text-[var(--warmup)]" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      CrossFit
                    </span>
                  </div>
                </div>
              </div>

              <Link href={`/dashboard/athlete/workout?dayId=${selectedDay.id}`} className="w-full md:w-auto">
                <Button className="btn-premium w-full md:w-auto h-16 px-10 text-xs gap-3">
                  Entrenar Ahora <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedDay && (
        <div className="py-12 text-center border-2 border-dashed border-border/20 rounded-[32px]">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No hay días configurados en este plan</p>
        </div>
      )}
    </section>
  )
}
