'use client'

import { useState } from 'react'
import { PlaySquare, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'

function toEmbedUrl(url: string) {
  if (url.includes('watch?v=')) return url.replace('watch?v=', 'embed/')
  if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'www.youtube.com/embed/')
  return url
}

export function ExerciseVideoPreview({ url, name }: { url?: string | null, name: string }) {
  const [open, setOpen] = useState(false)

  if (!url) {
    return (
      <Button variant="secondary" className="flex-1 opacity-50 cursor-not-allowed" size="sm" disabled>
        Sin video
      </Button>
    )
  }

  return (
    <>
      <Button variant="default" className="w-full gap-2" size="sm" onClick={() => setOpen(true)}>
        <PlaySquare className="w-4 h-4" /> Video
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[92vw] w-[440px] rounded-3xl border-border/40 glass-strong p-0 overflow-hidden">
          <div className="p-4 border-b border-border/10 flex items-center justify-between gap-3">
            <h3 className="font-black uppercase tracking-tight text-sm truncate">{name}</h3>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full shrink-0" onClick={() => setOpen(false)} aria-label="Cerrar video">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="aspect-video bg-black flex items-center justify-center">
            <iframe
              src={toEmbedUrl(url)}
              className="w-full h-full"
              allowFullScreen
              title={name}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
