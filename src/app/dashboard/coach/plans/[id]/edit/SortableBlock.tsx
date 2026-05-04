import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripHorizontal, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function SortableBlock({ id, children, block, onRemove, onRename }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.9 : 1,
  }

  const typeConfigs: Record<string, { color: string, label: string, bg: string }> = {
    strength: { color: 'text-[var(--strength)]', label: 'Fuerza / Técnica', bg: 'bg-[var(--strength)]/10 border-[var(--strength)]/20' },
    metcon: { color: 'text-primary', label: 'WOD / Metcon', bg: 'bg-primary/10 border-primary/20' },
    gymnastics: { color: 'text-[var(--gymnastics)]', label: 'Gimnasia', bg: 'bg-[var(--gymnastics)]/10 border-[var(--gymnastics)]/20' },
    warmup: { color: 'text-[var(--warmup)]', label: 'Warmup', bg: 'bg-[var(--warmup)]/10 border-[var(--warmup)]/20' },
    cooldown: { color: 'text-[var(--cooldown)]', label: 'Cooldown', bg: 'bg-[var(--cooldown)]/10 border-[var(--cooldown)]/20' },
  }
  const config = typeConfigs[block.type] || { color: 'text-primary', label: 'Bloque', bg: 'bg-primary/10 border-primary/20' }

  return (
    <div ref={setNodeRef} style={style} className="group/block">
      <Card className={`ios-panel rounded-[22px] overflow-hidden hover:border-primary/40 transition-all ${isDragging ? 'ring-4 ring-primary/20 shadow-[0_18px_80px_rgba(0,0,0,0.28)]' : ''}`}>
        <div className={cn('p-3 md:p-4 flex items-center justify-between gap-3 border-b border-border/60', config.bg)}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-2 rounded-xl hover:bg-background/50 transition-colors shrink-0"
            >
              <GripHorizontal className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className={cn('text-[9px] font-black uppercase tracking-[0.2em] mb-1', config.color)}>
                {config.label}
              </span>
              <input
                className="bg-transparent font-black text-sm uppercase tracking-tight outline-none w-full text-foreground focus:text-primary transition-colors placeholder:text-muted-foreground/40"
                value={block.name}
                placeholder="Nombre del bloque..."
                onChange={(e) => onRename(e.target.value)}
              />
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all shrink-0"
            onClick={onRemove}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-3 md:p-4 bg-background/35">
          {children}
        </div>
      </Card>
    </div>
  )
}
