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
      className={`p-3 flex flex-col gap-2 transition-all duration-200 ${
        isDragging 
          ? 'bg-primary/10 scale-[1.01] shadow-xl border-2 border-primary/50 ring-2 ring-primary/5 rounded-lg' 
          : 'hover:bg-secondary/5 bg-transparent border-b border-border/10 last:border-0'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div 
            {...attributes} 
            {...listeners} 
            className="cursor-grab active:cursor-grabbing hover:bg-secondary/20 p-1 rounded-md transition-colors group"
          >
            <GripVertical className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary transition-colors" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[11px] uppercase tracking-tight text-foreground/80">
              {mov.exercise?.name || 'Cargando...'}
            </span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-muted-foreground/10 hover:text-destructive hover:bg-destructive/10 transition-all" 
          onClick={removeMov}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
      
      <div className="flex items-center gap-2 pl-6 animate-in fade-in slide-in-from-top-1 duration-200">
        <div className="flex flex-col gap-0.5">
          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 ml-1">Sets</span>
          <Input 
            className="h-7 text-[10px] w-12 bg-background/30 border-border/10 focus:border-primary/20 rounded-md font-bold px-2" 
            placeholder="3" 
            value={mov.sets} 
            onChange={(e) => updateSets(e.target.value)} 
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 ml-1">Reps</span>
          <Input 
            className="h-7 text-[10px] w-16 bg-background/30 border-border/10 focus:border-primary/20 rounded-md font-bold px-2" 
            placeholder="10-12" 
            value={mov.reps} 
            onChange={(e) => updateReps(e.target.value)} 
          />
        </div>
        <div className="flex flex-col gap-0.5 flex-1">
          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30 ml-1">Carga</span>
          <Input 
            className="h-7 text-[10px] w-full bg-background/30 border-border/10 focus:border-primary/20 rounded-md font-bold px-2" 
            placeholder="75% RM o 60kg" 
            value={mov.weight_percentage} 
            onChange={(e) => updateWeight(e.target.value)} 
          />
        </div>
      </div>
    </div>
  )
}
