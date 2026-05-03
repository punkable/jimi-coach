'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  PlayCircle, Calendar, ChevronRight, CheckCircle2
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
      <div className="bg-secondary/20 rounded-[32px] p-2 border border-border/10">
        <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
          {planDays.map((day, idx) => {
            const isSelected = selectedDayIdx === idx
            const dayLabel = dayNames[(day.day_of_week - 1) % 7]
            
            return (
              <button
                key={day.id}
                onClick={() => setSelectedDayIdx(idx)}
                className={cn(
                  "flex-1 min-w-[70px] py-3 rounded-[24px] flex flex-col items-center gap-1 transition-all",
                  isSelected 
                    ? "bg-background shadow-xl border border-primary/20 scale-105 z-10" 
                    : "hover:bg-background/40 text-muted-foreground"
                )}
              >
                <span className={cn(
                  "text-[9px] font-black tracking-widest",
                  isSelected ? "text-primary" : "text-muted-foreground/40"
                )}>{dayLabel}</span>
                <span className="text-lg font-black leading-none">{day.day_of_week}</span>
                {day.title && (
                  <span className={cn(
                    "text-[8px] font-bold truncate max-w-[60px] uppercase tracking-tight mt-0.5",
                    isSelected ? "text-foreground" : "text-muted-foreground/30"
                  )}>
                    {day.title}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Day Preview Card */}
      {selectedDay && (
        <Card className="glass border-primary/10 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
            <PlayCircle className="w-32 h-32" />
          </div>
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <span className="text-primary font-black text-xs">D{selectedDay.day_of_week}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-white group-hover:text-primary transition-colors">
                      {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][(selectedDay.day_of_week - 1) % 7]}
                      {selectedDay.title && <span className="text-primary/60"> — {selectedDay.title}</span>}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {selectedDay.workout_blocks?.length || 0} Bloques de entrenamiento
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Brief preview of blocks if needed, but keeping it clean */}
              </div>

              <Link href={`/dashboard/athlete/workout?dayId=${selectedDay.id}`}>
                <Button className="w-full md:w-auto h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-[11px] gap-2 shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                  Entrenar Ahora <ChevronRight className="w-4 h-4" />
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
