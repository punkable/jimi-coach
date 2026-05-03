import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Flame, Activity, CheckCircle2 } from 'lucide-react'

export default function SubscriptionCard({ profile }: { profile: any }) {
  const plan = profile?.subscription_plan || 'Sin plan activo'
  const total = profile?.total_classes || 0
  const used = profile?.classes_used || 0
  const remaining = Math.max(0, total - used)
  
  const progressPercentage = total > 0 ? (used / total) * 100 : 0

  return (
    <Card className="border-primary/20 bg-card/40 backdrop-blur-md shadow-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -z-10" />
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2 uppercase tracking-widest text-primary">
          <Flame className="w-5 h-5" />
          Tu Suscripción
        </CardTitle>
        <CardDescription>
          Estado actual de tu plan de entrenamiento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold mb-1">Estado</p>
          <div className="flex items-center gap-3">
            <div className="text-2xl font-black uppercase text-foreground">
              {plan !== 'Sin plan activo' ? 'Activa' : 'Inactiva'}
            </div>
            {plan !== 'Sin plan activo' && (
              <span className="flex h-6 items-center gap-1.5 px-3 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                <CheckCircle2 className="w-3 h-3" /> {plan}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground bg-secondary/10 p-4 rounded-2xl border border-border/10">
          <Activity className="w-5 h-5 text-primary/50" />
          <p className="text-xs leading-relaxed">
            {plan !== 'Sin plan activo' 
              ? 'Tienes acceso ilimitado a tus WODs y seguimiento de progreso.' 
              : 'Habla con tu coach para activar tu membresía y comenzar a entrenar.'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
