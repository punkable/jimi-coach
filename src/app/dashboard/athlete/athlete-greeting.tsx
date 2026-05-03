'use client'

import { useState, useEffect } from 'react'

export function AthleteGreeting({ name }: { name: string }) {
  const [greeting, setGreeting] = useState('¡Hola')
  const [datoCurioso, setDatoCurioso] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    const g = hour < 12 ? '¡Buenos días' : hour < 19 ? '¡Buenas tardes' : '¡Buenas noches'
    setGreeting(g)

    const curiosidades = [
      "¿Sabías que Fran (21-15-9 de Thrusters y Pull-Ups) fue uno de los primeros WODs diseñados por Greg Glassman?",
      "El récord mundial de Murph (con chaleco de 20lb) es de 34:38 minutos, por Hunter McIntyre.",
      "Levantar pesas pesadas mejora el reclutamiento de fibras musculares rápidas, haciéndote más explosivo.",
      "La gimnasia en CrossFit mejora drásticamente tu propiocepción (conciencia espacial).",
      "El RPE (Esfuerzo Percibido) es la mejor herramienta para autoregular tu intensidad diaria.",
      "La hidratación adecuada puede mejorar tu rendimiento en el WOD hasta en un 20%."
    ]
    setDatoCurioso(curiosidades[Math.floor(Math.random() * curiosidades.length)])
  }, [])

  return (
    <div>
      <p className="text-muted-foreground text-sm md:text-base font-medium">{greeting},</p>
      <h1 className="text-4xl md:text-6xl font-black tracking-tight mt-1 uppercase text-white">
        {name}<span className="text-primary">.</span>
      </h1>
      {datoCurioso && (
        <p className="text-[10px] md:text-xs font-bold text-primary/60 uppercase tracking-widest mt-2 max-w-xs leading-relaxed">
          TIP: {datoCurioso}
        </p>
      )}
    </div>
  )
}
