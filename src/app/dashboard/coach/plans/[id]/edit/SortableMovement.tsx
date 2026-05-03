import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function SortableMovement({ 
  id, mov, mIdx, 
  updateSets, updateReps, updateWeight, removeMov 
}: any) {
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
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`p-4 flex flex-col gap-3 transition-all duration-200 ${
        isDragging 
          ? 'bg-primary/10 scale-[1.02] shadow-2xl border-2 border-primary/50 ring-4 ring-primary/5 rounded-xl' 
          : 'hover:bg-secondary/5 bg-transparent border-b border-border/10 last:border-0'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            {...attributes} 
            {...listeners} 
            className="cursor-grab active:cursor-grabbing hover:bg-secondary/20 p-1.5 rounded-lg transition-colors group"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm uppercase tracking-tight text-foreground/90">
              {mov.exercise?.name || 'Cargando...'}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 flex items-center gap-1">
              <Hash className="w-2.5 h-2.5" /> Posición {mIdx + 1}
            </span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-muted-foreground/20 hover:text-destructive hover:bg-destructive/10 transition-all" 
          onClick={removeMov}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex items-center gap-3 pl-10">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Sets</span>
          <Input 
            className="h-8 text-xs w-16 bg-background/50 border-border/20 focus:border-primary/30 rounded-lg font-bold" 
            placeholder="3" 
            value={mov.sets} 
            onChange={(e) => updateSets(e.target.value)} 
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Reps</span>
          <Input 
            className="h-8 text-xs w-24 bg-background/50 border-border/20 focus:border-primary/30 rounded-lg font-bold" 
            placeholder="10-12" 
            value={mov.reps} 
            onChange={(e) => updateReps(e.target.value)} 
          />
        </div>
        <div className="flex flex-col gap-1 flex-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 ml-1">Carga / % RM</span>
          <Input 
            className="h-8 text-xs w-full bg-background/50 border-border/20 focus:border-primary/30 rounded-lg font-bold" 
            placeholder="75% RM o 60kg" 
            value={mov.weight_percentage} 
            onChange={(e) => updateWeight(e.target.value)} 
          />
        </div>
      </div>
    </div>
  )
}
