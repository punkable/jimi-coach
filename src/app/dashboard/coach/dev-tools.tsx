'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PlayCircle, Loader2 } from 'lucide-react'
import { seedDemoWod } from '../athlete/ranking/actions'

export function DevTools() {
  const [loading, setLoading] = useState(false)

  const handleSeed = async () => {
    setLoading(true)
    try {
      await seedDemoWod()
      alert('WOD de prueba generado con éxito')
    } catch (error) {
      console.error(error)
      alert('Error al generar WOD')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-border/30">
      <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Herramientas Dev</p>
      <Button 
        onClick={handleSeed}
        disabled={loading}
        variant="outline"
        className="w-full h-12 rounded-xl border-dashed border-2 border-primary/30 text-primary hover:bg-primary/10 font-black uppercase tracking-widest text-[10px] gap-2"
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <PlayCircle className="w-3.5 h-3.5" />
        )}
        Generar WOD Demo
      </Button>
    </div>
  )
}
