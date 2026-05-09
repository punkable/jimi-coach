import { CheckCircle2, ClipboardList, Activity, User, Calendar, Clock } from 'lucide-react'

type Coach = { id: string; full_name?: string | null; specialty?: string | null } | null
type Plan  = { title: string; start_date?: string | null; days_count?: number } | null

export default function ProgramacionCard({
  assignedPlan,
  coach,
}: {
  assignedPlan: Plan
  coach: Coach
}) {
  const status: 'active' | 'pending' | 'none' =
    assignedPlan ? 'active' : coach ? 'pending' : 'none'

  const statusMap = {
    active:  { label: 'Programación activa',           color: 'text-primary',          bg: 'bg-primary/15 border-primary/25',                  Icon: CheckCircle2 },
    pending: { label: 'Pendiente de programación',     color: 'text-amber-500',        bg: 'bg-amber-500/15 border-amber-500/25',              Icon: Clock },
    none:    { label: 'Sin coach asignado',            color: 'text-muted-foreground', bg: 'bg-secondary border-border',                       Icon: ClipboardList },
  }
  const { label, color, bg, Icon } = statusMap[status]

  return (
    <div className="ios-panel p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${bg}`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="section-title mb-0.5">Programación</p>
          <p className={`text-sm font-black uppercase tracking-tight ${color}`}>{label}</p>
        </div>
      </div>

      {/* Coach */}
      {coach && (
        <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-xl border border-border/50">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Tu coach</p>
            <p className="font-bold text-sm truncate">{coach.full_name || 'Coach'}</p>
            {coach.specialty && <p className="text-[10px] text-muted-foreground truncate">{coach.specialty}</p>}
          </div>
        </div>
      )}

      {/* Plan */}
      {assignedPlan && (
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-3 bg-primary/8 rounded-xl border border-primary/15">
            <Activity className="w-4 h-4 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{assignedPlan.title}</p>
              {assignedPlan.start_date && (
                <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Desde {new Date(assignedPlan.start_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>
          {typeof assignedPlan.days_count === 'number' && assignedPlan.days_count > 0 && (
            <p className="text-[10px] text-muted-foreground px-1">
              {assignedPlan.days_count} {assignedPlan.days_count === 1 ? 'día publicado' : 'días publicados'} en tu programación.
            </p>
          )}
        </div>
      )}

      {/* Empty states */}
      {status === 'pending' && (
        <p className="text-[11px] text-muted-foreground leading-relaxed px-1">
          Tu coach aún no ha publicado entrenamientos para ti. Aparecerán aquí en cuanto los cree.
        </p>
      )}
      {status === 'none' && (
        <p className="text-[11px] text-muted-foreground leading-relaxed px-1">
          Aún no tienes coach asignado. Cuando lo tengas, su programación personalizada se mostrará aquí.
        </p>
      )}
    </div>
  )
}
