'use client'

import { useState } from 'react'
import { PlaySquare, X, ExternalLink, Video } from 'lucide-react'
import { Button } from '@/components/ui/button'

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?&]+)/)
  if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1`
  return null
}

export function VideoPopupButton({ videoUrl, exerciseName }: { videoUrl: string; exerciseName: string }) {
  const [open, setOpen] = useState(false)
  const embedUrl = getYouTubeEmbedUrl(videoUrl)

  return (
    <>
      <Button
        variant="default"
        className="w-full gap-2 rounded-xl font-bold"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <PlaySquare className="w-4 h-4" /> Video
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-card rounded-3xl overflow-hidden shadow-2xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-black uppercase tracking-tight">{exerciseName}</h2>
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-video w-full bg-black">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={exerciseName}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <Video className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-primary text-sm font-bold hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Abrir en nueva pestaña
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
