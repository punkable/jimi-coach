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
          <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold mb-1">Plan Actual</p>
          <div className="text-2xl font-black uppercase text-foreground">
            {plan}
          </div>
        </div>

        {total > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-bold uppercase tracking-wider">
              <span>Clases Usadas: {used}</span>
              <span className="text-primary">Disponibles: {remaining}</span>
            </div>
            <div className="h-3 w-full bg-secondary/50 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-right mt-1">
              De un total de {total} clases
            </p>
          </div>
        )}

        {total === 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/20 p-3 rounded-md">
            <Activity className="w-4 h-4" />
            No tienes un paquete de clases activo. Habla con el coach.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
