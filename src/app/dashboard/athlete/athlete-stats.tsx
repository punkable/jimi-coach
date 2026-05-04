'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Trophy, Info, Target, Zap } from 'lucide-react'

export function AthleteStats({ 
  totalWorkouts = 0, 
  currentStreak = 0,
  trivia = ""
}: { 
  totalWorkouts: number, 
  currentStreak: number,
  trivia?: string 
}) {
  const datoCurioso = trivia || "Levantar pesas mejora tu salud."

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      
      {/* Dato Curioso */}
      <Card className="md:col-span-1 glass border-primary/20 bg-gradient-to-br from-primary/10 to-background overflow-hidden relative">
        <div className="absolute -right-4 -top-4 opacity-10">
          <Info className="w-32 h-32 text-primary" />
        </div>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" /> Dato Curioso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            "{datoCurioso}"
          </p>
        </CardContent>
      </Card>

      {/* Estadísticas de Progreso */}
      <Card className="md:col-span-2 glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" /> Actividad Reciente
          </CardTitle>
          <CardDescription>Sesiones completadas en las últimas semanas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full flex items-center justify-center bg-secondary/10 rounded-xl border border-border/20">
            <div className="text-center p-6">
              <Trophy className="w-12 h-12 text-primary/40 mx-auto mb-3" />
              <p className="text-sm font-medium">¡Sigue así!</p>
              <p className="text-xs text-muted-foreground mt-1">Has completado {totalWorkouts} entrenamientos en total.</p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
