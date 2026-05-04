import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Crown, Plus, Trash2, CreditCard, Users, CheckCircle2 } from 'lucide-react'
import { createMembership, deleteMembership } from './actions'

export default async function MembershipsPage() {
  const supabase = await createClient()
  const { data: memberships } = await supabase
    .from('memberships')
    .select('*')
    .is('deleted_at', null)
    .order('price', { ascending: true })

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
      <header>
        <h1 className="text-3xl font-black uppercase tracking-tight">Modalidades y Planes</h1>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest mt-1">
          Configura los planes contratados por tus alumnos (Membresías)
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Form */}
        <div className="lg:col-span-1">
          <Card className="glass border-primary/20 sticky top-8">
            <CardHeader>
              <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> Nueva Modalidad
              </CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold tracking-widest">
                Define un nuevo plan de suscripción
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createMembership} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre del Plan</label>
                  <Input name="name" placeholder="Ej: Plan Pro Mensual" required className="bg-secondary/30 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descripción Corta</label>
                  <Textarea name="description" placeholder="Ej: Acceso ilimitado y seguimiento..." className="bg-secondary/30 rounded-xl resize-none h-20" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Precio ($)</label>
                    <Input name="price" type="number" placeholder="45000" className="bg-secondary/30 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Clases/Mes</label>
                    <Input name="defaultClasses" type="number" placeholder="12" className="bg-secondary/30 rounded-xl" />
                  </div>
                </div>
                <Button type="submit" className="w-full font-black uppercase tracking-widest text-xs h-12 rounded-xl mt-2 shadow-lg shadow-primary/20">
                  Crear Modalidad
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* List */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memberships && memberships.length > 0 ? (
              memberships.map((m) => (
                <Card key={m.id} className="glass group hover:border-primary/40 transition-all duration-300 overflow-hidden">
                  <div className="h-1 bg-primary/20 group-hover:bg-primary transition-colors" />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Crown className="w-5 h-5" />
                      </div>
                      <form action={deleteMembership.bind(null, m.id)}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/20 hover:text-destructive hover:bg-destructive/10 transition-all rounded-full">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </form>
                    </div>
                    <CardTitle className="text-xl font-black uppercase tracking-tight mt-4">{m.name}</CardTitle>
                    <p className="text-xs text-muted-foreground font-medium h-8 line-clamp-2">{m.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-3 mt-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2"><CreditCard className="w-3 h-3"/> Precio</span>
                        <span className="font-black text-primary">${Number(m.price).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2"><CheckCircle2 className="w-3 h-3"/> Créditos</span>
                        <span className="font-bold">{m.default_classes} clases</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-20 text-center glass rounded-3xl border-dashed border-2 border-border/20">
                <CreditCard className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground font-black uppercase tracking-[0.2em]">No hay modalidades creadas</p>
                <p className="text-[10px] text-muted-foreground/50 mt-2 uppercase">Comienza creando tu primer plan a la izquierda</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
