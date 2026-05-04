import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Crown, Plus, Trash2, CreditCard, Sparkles, CheckCircle2 } from 'lucide-react'
import { createMembership, deleteMembership } from './actions'

export default async function MembershipsPage() {
  const supabase = await createClient()
  const { data: memberships } = await supabase
    .from('memberships')
    .select('*')
    .is('deleted_at', null)
    .order('price', { ascending: true })

  return (
    <div className="p-4 md:p-8 xl:p-10 space-y-8 max-w-7xl mx-auto">
      <header className="ios-panel p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="section-title text-[var(--coach)] mb-2">Modelo comercial</div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">Modalidades y planes</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Define membresías claras para que cada atleta entienda qué incluye su seguimiento.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="rounded-2xl bg-[var(--strength)]/10 border border-[var(--strength)]/20 px-4 py-3">
            <Crown className="w-5 h-5 mx-auto text-[var(--strength)]" />
            <p className="text-[10px] font-black uppercase tracking-widest mt-2">Premium</p>
          </div>
          <div className="rounded-2xl bg-[var(--metcon)]/10 border border-[var(--metcon)]/20 px-4 py-3">
            <Sparkles className="w-5 h-5 mx-auto text-[var(--metcon)]" />
            <p className="text-[10px] font-black uppercase tracking-widest mt-2">Simple</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Form */}
        <div className="lg:col-span-1">
          <Card className="ios-panel sticky top-8">
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
                  <Input name="name" placeholder="Ej: Plan Pro Mensual" required />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descripción Corta</label>
                  <Textarea name="description" placeholder="Ej: Acceso ilimitado y seguimiento..." className="bg-background/55 rounded-xl resize-none h-24 font-semibold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Precio ($)</label>
                  <Input name="price" type="number" placeholder="45000" />
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
                <Card key={m.id} className="ios-panel group hover:border-primary/40 transition-all duration-300 overflow-hidden">
                  <div className="h-1.5 bg-gradient-to-r from-[var(--strength)] via-[var(--primary)] to-[var(--metcon)] opacity-70 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <Crown className="w-5 h-5" />
                      </div>
                      <form action={deleteMembership.bind(null, m.id)}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/20 hover:text-destructive hover:bg-destructive/10 transition-all rounded-full">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </form>
                    </div>
                    <CardTitle className="text-xl font-black tracking-tight mt-4">{m.name}</CardTitle>
                    <p className="text-xs text-muted-foreground font-medium h-8 line-clamp-2">{m.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-3 mt-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-2"><CreditCard className="w-3 h-3"/> Valor</span>
                        <span className="font-black text-primary">${Number(m.price).toLocaleString()}</span>
                      </div>
                      <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--gymnastics)]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--gymnastics)]">
                        <CheckCircle2 className="w-3 h-3" /> Activo
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-20 text-center ios-panel border-dashed border-2 border-border/20">
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
