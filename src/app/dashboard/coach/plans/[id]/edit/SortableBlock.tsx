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

  return (
    <div ref={setNodeRef} style={style} className="group/block">
      <Card className={`border-border/30 bg-card/30 rounded-[24px] overflow-hidden shadow-sm hover:shadow-md transition-all border-l-4 border-l-primary/40 ${isDragging ? 'ring-2 ring-primary/20 shadow-2xl' : ''}`}>
        <div className="p-4 border-b border-border/10 bg-muted/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div 
              {...attributes} 
              {...listeners} 
              className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg hover:bg-secondary/40 transition-colors opacity-20 group-hover/block:opacity-100"
            >
              <GripHorizontal className="w-4 h-4 text-muted-foreground" />
            </div>
            <input 
              className="bg-transparent font-black text-[11px] uppercase tracking-widest outline-none w-full focus:text-primary transition-colors" 
              value={block.name}
              onChange={(e) => onRename(e.target.value)}
            />
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md opacity-0 group-hover/block:opacity-100 hover:text-destructive transition-all" onClick={onRemove}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
        
        {children}
      </Card>
    </div>
  )
}
