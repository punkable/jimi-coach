import { CheckCircle2, ClipboardList, Activity } from 'lucide-react'

export default function PlanStatusCard({ assignedPlan }: { assignedPlan: { title: string; start_date?: string } | null }) {
  return (
    <div className="ios-panel p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <ClipboardList className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="section-title mb-0.5">Programación</p>
          <p className="text-sm font-black uppercase tracking-tight">
            {assignedPlan ? 'Programación activa' : 'Sin programación asignada'}
          </p>
        </div>
        {assignedPlan && (
          <CheckCircle2 className="w-5 h-5 text-primary ml-auto shrink-0" />
        )}
      </div>

      {assignedPlan ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-primary/8 rounded-xl border border-primary/15">
            <Activity className="w-4 h-4 text-primary shrink-0" />
            <div>
              <p className="font-bold text-sm">{assignedPlan.title}</p>
              {assignedPlan.start_date && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Desde {new Date(assignedPlan.start_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Tu coach diseñó esta programación para ti. Entrena los días indicados y registra cada sesión.
          </p>
        </div>
      ) : (
        <div className="p-3 bg-secondary rounded-xl">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Tu coach todavía no te asignó una programación. Mientras tanto, puedes explorar la biblioteca técnica.
          </p>
        </div>
      )}
    </div>
  )
}
