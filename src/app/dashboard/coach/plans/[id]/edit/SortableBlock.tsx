import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripHorizontal, Trash2, Video, Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

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
    strength: { color: 'text-red-500', label: 'Fuerza / Técnica', bg: 'bg-red-500/10 border-red-500/20' },
    metcon: { color: 'text-primary', label: 'WOD / Metcon', bg: 'bg-primary/10 border-primary/20' },
    gymnastics: { color: 'text-blue-500', label: 'Gimnasia', bg: 'bg-blue-500/10 border-blue-500/20' },
    warmup: { color: 'text-amber-500', label: 'Warmup', bg: 'bg-amber-500/10 border-amber-500/20' },
    cooldown: { color: 'text-cyan-500', label: 'Cooldown', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  }
  const config = typeConfigs[block.type] || { color: 'text-primary', label: 'Bloque', bg: 'bg-primary/10 border-primary/20' }

  return (
    <div ref={setNodeRef} style={style} className="group/block">
      <Card className={`border-white/10 bg-[#1a1a1a] rounded-[32px] overflow-hidden shadow-2xl hover:border-primary/40 transition-all ${isDragging ? 'ring-4 ring-primary/20 shadow-[0_0_100px_rgba(0,0,0,0.5)]' : ''}`}>
        {/* Block Header */}
        <div className={cn("p-4 flex items-center justify-between gap-3 border-b border-white/5", config.bg)}>
          <div className="flex items-center gap-3 flex-1">
            <div 
              {...attributes} 
              {...listeners} 
              className="cursor-grab active:cursor-grabbing p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <GripHorizontal className="w-4 h-4 text-white/40" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] mb-1", config.color)}>{config.label}</span>
              <input 
                className="bg-transparent font-black text-sm uppercase tracking-tight outline-none w-full text-white focus:text-primary transition-colors placeholder:text-white/10" 
                value={block.name}
                placeholder="Nombre del bloque..."
                onChange={(e) => onRename(e.target.value)}
              />
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-destructive/20 hover:text-destructive transition-all" onClick={onRemove}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="p-4 bg-black/20">
          {children}
        </div>
      </Card>
    </div>
  )
}
