'use client'

import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'

interface StreakMascotProps {
  streak: number
}

export function StreakMascot({ streak }: StreakMascotProps) {
  const isActive = streak > 0

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-card rounded-2xl border border-border shadow-lg overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
      
      {/* Character Animation Container */}
      <motion.div
        className="relative w-24 h-24 flex items-center justify-center z-10"
        animate={isActive ? {
          y: [0, -8, 0],
          scale: [1, 1.05, 1]
        } : { 
          y: 5,
          scale: 0.95
        }}
        transition={isActive ? {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        } : {
          duration: 0.5
        }}
      >
        {/* Flame Background Glow */}
        {isActive && (
          <motion.div 
            className="absolute inset-0 bg-primary/20 blur-xl rounded-full"
            animate={{ opacity: [0.4, 0.8, 0.4], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {/* The Mascot Icon (Flame) */}
        <motion.div
          animate={isActive ? {
            rotate: [-2, 2, -2]
          } : {
            rotate: 0
          }}
          transition={isActive ? {
            duration: 0.5,
            repeat: Infinity,
            ease: "easeInOut"
          } : {}}
        >
          <Flame 
            className={`w-16 h-16 ${isActive ? 'text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.8)]' : 'text-muted-foreground opacity-50'}`}
            strokeWidth={isActive ? 2 : 1.5}
          />
        </motion.div>

        {/* Eyes */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2 mt-2">
          {isActive ? (
            <>
              <div className="w-1.5 h-1.5 bg-background rounded-full" />
              <div className="w-1.5 h-1.5 bg-background rounded-full" />
            </>
          ) : (
            <>
              <div className="w-2 h-0.5 bg-background/50 rounded-full" />
              <div className="w-2 h-0.5 bg-background/50 rounded-full" />
            </>
          )}
        </div>
      </motion.div>

      {/* Text Info */}
      <div className="mt-4 text-center z-10">
        <h3 className="text-2xl font-black tabular-nums tracking-tight">
          {streak} {streak === 1 ? 'Día' : 'Días'}
        </h3>
        <p className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
          {isActive ? '¡Racha activa!' : 'Sin racha'}
        </p>
        <p className="text-xs text-muted-foreground mt-1 max-w-[150px]">
          {isActive 
            ? '¡Sigue así! Estás on fire 🔥'
            : 'Registra un WOD para despertar a la llama.'}
        </p>
      </div>
    </div>
  )
}
