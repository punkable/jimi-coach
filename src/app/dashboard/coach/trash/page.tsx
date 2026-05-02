import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, RefreshCw, XCircle, AlertTriangle } from 'lucide-react'
import { restoreItem, permanentlyDeleteItem } from './actions'

export default async function TrashPage() {
  const supabase = await createClient()

  // We must use the admin client to bypass RLS for deleted profiles and other tables
  // but for simplicity in this server component, we fetch normally since coaches have access via RLS
  // Wait, RLS for profiles might hide soft-deleted if we added policies. Assuming we didn't add "is null" to RLS.
  
  const { data: profiles } = await supabase.from('profiles').select('*').not('deleted_at', 'is', null)
  const { data: plans } = await supabase.from('workout_plans').select('*').not('deleted_at', 'is', null)
  const { data: exercises } = await supabase.from('exercises').select('*').not('deleted_at', 'is', null)
  const { data: memberships } = await supabase.from('memberships').select('*').not('deleted_at', 'is', null)

  const deletedItems = [
    ...(profiles || []).map(p => ({ ...p, table: 'profiles', type: 'Alumno', name: p.full_name || p.email })),
    ...(plans || []).map(p => ({ ...p, table: 'workout_plans', type: 'Plan de Entrenamiento', name: p.title })),
    ...(exercises || []).map(e => ({ ...e, table: 'exercises', type: 'Ejercicio', name: e.name })),
    ...(memberships || []).map(m => ({ ...m, table: 'memberships', type: 'Modalidad/Plan', name: m.name })),
  ].sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime())

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Trash2 className="w-8 h-8 text-destructive" />
            Papelera de Reciclaje
          </h1>
          <p className="text-muted-foreground mt-1">
            Restaura elementos o destrúyelos. Todo lo que tenga más de 30 días puede ser purgado.
          </p>
        </div>
        <form action={async () => {
          'use server'
          const { purgeOldTrash } = await import('./actions')
          await purgeOldTrash()
        }}>
          <Button variant="outline" type="submit" className="gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground">
            <XCircle className="w-4 h-4" />
            Vaciar Antiguos {'>'} 30 días
          </Button>
        </form>
      </header>

      {deletedItems.length === 0 ? (
        <Card className="border-dashed border-2 bg-transparent">
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Trash2 className="w-12 h-12 mb-4 opacity-20" />
            <h3 className="font-bold text-lg mb-1">La papelera está vacía</h3>
            <p className="text-sm text-center">No hay alumnos, planes ni ejercicios eliminados recientemente.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {deletedItems.map((item) => (
            <Card key={`${item.table}-${item.id}`} className="bg-card/50 flex flex-col md:flex-row justify-between items-center p-4">
              <div className="flex-1 mb-4 md:mb-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest bg-secondary px-2 py-0.5 rounded text-muted-foreground">
                    {item.type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Eliminado el: {new Date(item.deleted_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="font-bold text-lg">{item.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <form action={async () => {
                  'use server'
                  await restoreItem(item.table, item.id)
                }}>
                  <Button variant="outline" size="sm" type="submit" className="gap-2 hover:bg-primary hover:text-primary-foreground">
                    <RefreshCw className="w-4 h-4" /> Restaurar
                  </Button>
                </form>
                
                <form action={async () => {
                  'use server'
                  await permanentlyDeleteItem(item.table, item.id)
                }}>
                  <Button variant="destructive" size="sm" type="submit" className="gap-2">
                    <XCircle className="w-4 h-4" /> Destruir
                  </Button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
