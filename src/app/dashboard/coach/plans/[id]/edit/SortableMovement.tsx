import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2 } from 'lucide-react'
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
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className={`p-4 flex flex-col gap-2 transition-colors ${isDragging ? 'bg-primary/20 scale-105 shadow-xl border-primary' : 'hover:bg-secondary/5 bg-transparent'}`}>
      <div className="flex items-center justify-between">
        <span className="font-semibold flex items-center gap-2">
          <div {...attributes} {...listeners} className="cursor-grab hover:bg-secondary/20 p-1 rounded">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
          {mov.exercise?.name}
        </span>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/50 hover:text-destructive" onClick={removeMov}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex gap-2 pl-8">
        <Input className="h-7 text-xs w-16 bg-background/50 pointer-events-auto" placeholder="Sets" value={mov.sets} onChange={(e) => updateSets(e.target.value)} />
        <Input className="h-7 text-xs w-20 bg-background/50 pointer-events-auto" placeholder="Reps" value={mov.reps} onChange={(e) => updateReps(e.target.value)} />
        <Input className="h-7 text-xs w-24 bg-background/50 pointer-events-auto" placeholder="% RM o Kg" value={mov.weight_percentage} onChange={(e) => updateWeight(e.target.value)} />
      </div>
    </div>
  )
}
