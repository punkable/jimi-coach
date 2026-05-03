'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Trophy, Dumbbell, Star, Crown, PlayCircle, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { seedDemoWod } from './actions'
import { useState } from 'react'

export function RankingClient({ leaderboard }: { leaderboard: any[] }) {
  const [loading, setLoading] = useState(false)

  const handleSeed = async () => {
    setLoading(true)
    await seedDemoWod()
    setLoading(false)
    alert('¡WOD de prueba creado y asignado! Revisa tu dashboard.')
  }

  return (
    <div className="min-h-[100dvh] pb-20 px-4 md:px-8 lg:px-10 max-w-5xl mx-auto" style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}>
      <header className="flex flex-col items-center text-center gap-4 mb-10">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.3)]"
        >
          <Trophy className="w-9 h-9 text-white" />
        </motion.div>
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter italic">Box Leaderboard</h1>
          <p className="text-muted-foreground text-sm font-medium">Compite. Supérate. Repite.</p>
        </div>
      </header>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-3 mb-10 items-end px-2">
        {/* 2nd Place */}
        {leaderboard[1] && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="relative">
               <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-slate-300/10 border-2 border-slate-400/30 flex items-center justify-center overflow-hidden backdrop-blur-sm">
                {leaderboard[1].avatar ? <img src={leaderboard[1].avatar} className="object-cover w-full h-full" /> : <span className="text-xl font-black">{leaderboard[1].name[0]}</span>}
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-400 flex items-center justify-center border-2 border-background shadow-lg">
                <span className="text-[10px] font-black text-white">2</span>
              </div>
              <div className="absolute -bottom-2 -left-2 text-xl filter drop-shadow-md">
                {leaderboard[1].emoji}
              </div>
            </div>
            <p className="text-[10px] font-black uppercase truncate w-full text-center opacity-70">{leaderboard[1].name.split(' ')[0]}</p>
          </motion.div>
        )}

        {/* 1st Place */}
        {leaderboard[0] && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="relative">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-9 left-1/2 -translate-x-1/2"
              >
                <Crown className="w-9 h-9 text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
              </motion.div>
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-[32px] bg-amber-500/10 border-4 border-amber-500/50 flex items-center justify-center overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.2)]">
                {leaderboard[0].avatar ? <img src={leaderboard[0].avatar} className="object-cover w-full h-full" /> : <span className="text-4xl font-black text-amber-500">{leaderboard[0].name[0]}</span>}
              </div>
              <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center border-4 border-background shadow-xl">
                <Zap className="w-5 h-5 text-white fill-white" />
              </div>
              <div className="absolute -bottom-3 -left-3 text-3xl filter drop-shadow-lg">
                {leaderboard[0].emoji}
              </div>
            </div>
            <p className="text-xs font-black uppercase truncate w-full text-center text-amber-500 tracking-widest">{leaderboard[0].name.split(' ')[0]}</p>
          </motion.div>
        )}

        {/* 3rd Place */}
        {leaderboard[2] && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="relative">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-orange-800/10 border-2 border-orange-700/30 flex items-center justify-center overflow-hidden backdrop-blur-sm">
                {leaderboard[2].avatar ? <img src={leaderboard[2].avatar} className="object-cover w-full h-full" /> : <span className="text-xl font-black">{leaderboard[2].name[0]}</span>}
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-orange-700 flex items-center justify-center border-2 border-background shadow-lg">
                <span className="text-[10px] font-black text-white">3</span>
              </div>
              <div className="absolute -bottom-2 -left-2 text-xl filter drop-shadow-md">
                {leaderboard[2].emoji}
              </div>
            </div>
            <p className="text-[10px] font-black uppercase truncate w-full text-center opacity-70">{leaderboard[2].name.split(' ')[0]}</p>
          </motion.div>
        )}
      </div>

      {/* List Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-[32px] border-border/40 overflow-hidden shadow-2xl relative"
      >
        <div className="bg-white/5 p-5 border-b border-border/20 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Clasificación</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Rendimiento</span>
        </div>
        
        <div className="divide-y divide-border/10">
          {leaderboard.map((user, index) => (
            <motion.div 
              key={user.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center justify-between p-4 md:p-6 transition-all hover:bg-white/5 ${index === 0 ? 'bg-amber-500/[0.03]' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className={`text-sm font-black w-6 text-center ${index < 3 ? 'text-primary scale-110' : 'text-muted-foreground/40'}`}>
                  {index + 1}
                </div>
                <div className="relative">
                  <div className={`w-11 h-11 md:w-13 md:h-13 rounded-2xl bg-secondary/50 border ${index < 3 ? 'border-primary/50' : 'border-border/30'} overflow-hidden shrink-0`}>
                    {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold">{user.name[0]}</div>}
                  </div>
                  <div className="absolute -bottom-1 -right-1 text-xs">
                    {user.emoji}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-tight">{user.name}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground uppercase bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                      <Dumbbell className="w-3 h-3 text-primary/70" /> {user.wods} <span className="hidden sm:inline">Sesiones</span>
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground uppercase bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                      <Star className="w-3 h-3 text-amber-500/70" /> {user.prs} <span className="hidden sm:inline">Récords</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xl font-black leading-none ${index === 0 ? 'text-amber-500' : 'text-foreground'}`}>
                  {user.points.toLocaleString()}
                </p>
                <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 mt-1.5">Puntos</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Demo Tools */}
      <div className="mt-12 pt-8 border-t border-border/20">
        <Card className="bg-primary/5 border-dashed border-2 border-primary/20 rounded-[32px] overflow-hidden">
          <CardContent className="p-8 md:p-12 text-center">
            <PlayCircle className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-black uppercase tracking-tight mb-2">Modo Desarrollador</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-8 font-medium">
              ¿Quieres probar cómo se ve un entrenamiento con múltiples ejercicios? Pulsa el botón para generar un WOD de prueba.
            </p>
            <Button 
              onClick={handleSeed}
              disabled={loading}
              className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs gap-3 shadow-xl shadow-primary/20"
            >
              {loading ? 'Generando...' : 'Crear WOD de Prueba'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
