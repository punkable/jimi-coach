'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

export function ProgressChart({ data }: { data: any[] }) {
  // Format data for chart
  const chartData = data.slice().reverse().map(d => ({
    name: new Date(d.completed_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
    rpe: d.rpe || 0
  }))

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRpe" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="name" 
            stroke="#888888" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
          />
          <YAxis 
            stroke="#888888" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false} 
            domain={[0, 10]}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '12px', fontSize: '12px' }}
            itemStyle={{ color: 'hsl(var(--primary))' }}
          />
          <Area 
            type="monotone" 
            dataKey="rpe" 
            stroke="hsl(var(--primary))" 
            strokeWidth={3} 
            fillOpacity={1} 
            fill="url(#colorRpe)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
