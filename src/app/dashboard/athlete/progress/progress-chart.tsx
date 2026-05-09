'use client'

import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

export function ProgressChart({ data }: { data: any[] }) {
  // oldest → newest left to right
  const chartData = data.slice().reverse().map(d => ({
    name: new Date(d.completed_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
    rpe: d.rpe ?? null,
  })).filter(d => d.rpe !== null)

  if (chartData.length < 2) {
    return (
      <div className="h-[180px] w-full flex items-center justify-center text-center text-muted-foreground text-xs">
        Necesitas al menos 2 entrenos con RPE para ver tendencias.
      </div>
    )
  }

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRpe" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#7ec400" stopOpacity={0.45}/>
              <stop offset="95%" stopColor="#7ec400" stopOpacity={0.02}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#888888"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="#888888"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            domain={[0, 10]}
            ticks={[0, 5, 10]}
            width={24}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(20,20,20,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 700,
              padding: '6px 10px',
            }}
            labelStyle={{ color: '#888' }}
            itemStyle={{ color: '#7ec400' }}
            formatter={(v: any) => [`${v}/10`, 'RPE']}
          />
          <Area
            type="monotone"
            dataKey="rpe"
            stroke="#7ec400"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#colorRpe)"
            dot={{ r: 3, stroke: '#7ec400', strokeWidth: 2, fill: '#0a0a0a' }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
