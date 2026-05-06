import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function SortableMovement({
  id,
  mov,
  mIdx,
  updateSets,
  updateReps,
  updateWeight,
  removeMov,
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

  const tt = mov.exercise?.tracking_type || 'weight_reps'
  const labels: Record<string, { reps: string; weight: string; repsPh: string; weightPh: string }> = {
    weight_reps:   { reps: 'Reps',     weight: 'Carga',     repsPh: '10-12', weightPh: '75% RM' },
    reps_only:     { reps: 'Reps',     weight: 'Tempo',     repsPh: '8',     weightPh: '3-1-1-1' },
    distance_time: { reps: 'Distancia', weight: 'Tiempo',   repsPh: '500m',  weightPh: '2:00' },
    time_only:     { reps: 'Tiempo',   weight: 'Notas',     repsPh: '0:30',  weightPh: 'AMRAP' },
  }
  const { reps: repsLabel, weight: weightLabel, repsPh, weightPh } = labels[tt] || labels.weight_reps

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 flex flex-col gap-3 transition-all duration-200 rounded-2xl ${
        isDragging
          ? 'bg-primary/10 scale-[1.01] shadow-xl border border-primary/50 ring-2 ring-primary/5'
          : 'hover:bg-secondary/40 bg-background/30 border border-border/50'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing hover:bg-secondary p-1.5 rounded-lg transition-colors group shrink-0"
          >
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-black text-[11px] uppercase tracking-tight text-foreground truncate">
              {mov.exercise?.name || 'Cargando...'}
            </span>
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">
              Movimiento {mIdx + 1}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-xl text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
          onClick={removeMov}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 pl-0 md:pl-8 animate-in fade-in slide-in-from-top-1 duration-200">
        <div className="flex flex-col gap-1">
          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/55 ml-1">Sets</span>
          <Input
            className="h-9 text-[11px] w-full bg-background/60 border-border/60 focus:border-primary/30 rounded-xl font-bold px-2"
            placeholder="3"
            value={mov.sets}
            onChange={(e) => updateSets(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/55 ml-1">{repsLabel}</span>
          <Input
            className="h-9 text-[11px] w-full bg-background/60 border-border/60 focus:border-primary/30 rounded-xl font-bold px-2"
            placeholder={repsPh}
            value={mov.reps}
            onChange={(e) => updateReps(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/55 ml-1">{weightLabel}</span>
          <Input
            className="h-9 text-[11px] w-full bg-background/60 border-border/60 focus:border-primary/30 rounded-xl font-bold px-2"
            placeholder={weightPh}
            value={mov.weight_percentage}
            onChange={(e) => updateWeight(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
