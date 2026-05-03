'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Trophy, Info, Target, Zap } from 'lucide-react'

// Dummy PR data for the chart
const prData = [
  { name: 'Ene', BackSquat: 100, Snatch: 60 },
  { name: 'Feb', BackSquat: 105, Snatch: 62 },
  { name: 'Mar', BackSquat: 110, Snatch: 65 },
  { name: 'Abr', BackSquat: 110, Snatch: 70 },
  { name: 'May', BackSquat: 120, Snatch: 75 },
]

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
            <Target className="w-5 h-5 text-primary" /> Evolución 1RM (Estimado)
          </CardTitle>
          <CardDescription>Tu progreso en levantamientos principales (kg)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={prData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line type="monotone" dataKey="BackSquat" stroke="#f97316" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Snatch" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#f97316]"></div> Back Squat</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#8b5cf6]"></div> Snatch</div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
