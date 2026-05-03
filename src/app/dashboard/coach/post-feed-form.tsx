'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { postToFeed } from './actions'
import { Send, Megaphone, Loader2, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function PostFeedForm() {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)
    try {
      await postToFeed(content, 'announcement')
      setContent('')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="glass rounded-3xl p-6 border-primary/20 bg-primary/5 relative overflow-hidden">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
          <Megaphone className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-black text-sm uppercase tracking-tight">Comunicado al Box</h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Publicar en el feed social</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <Input 
            placeholder="Escribe un anuncio, felicitación o aviso..."
            className="bg-background/50 border-border/40 h-12 rounded-2xl pr-12 focus:ring-primary/20 text-sm"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={isSubmitting || !content.trim()}
            className="absolute right-1.5 top-1.5 h-9 w-9 rounded-xl shadow-lg transition-all active:scale-95"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </form>

      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center gap-2 z-10"
          >
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-green-600">Publicado con éxito</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
