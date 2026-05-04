import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserPlus, Users, Mail, Shield, Trash2, ChevronRight, CheckCircle2 } from 'lucide-react'
import { registerCoach } from './actions'

export default async function StaffPage(props: { searchParams: Promise<{ success?: string }> }) {
  const searchParams = await props.searchParams
  const isSuccess = searchParams.success === 'true'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard/coach')
  }

  const { data: coaches } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'coach')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
      <header>
        <h1 className="text-3xl font-black uppercase tracking-tight">Gestión de Staff</h1>
        <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest mt-1">
          Administra tu equipo de coaches y sus permisos
        </p>
      </header>

      {isSuccess && (
        <div className="bg-primary/20 border border-primary/30 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          <p className="text-sm font-bold uppercase tracking-tight text-primary">¡Coach registrado con éxito! Ya puede iniciar sesión.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass md:col-span-1 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" /> Nuevo Coach
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={registerCoach} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre Completo</label>
                <Input name="fullName" placeholder="Ej: Juan Pérez" required className="bg-secondary/30" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email Profesional</label>
                <Input name="email" type="email" placeholder="coach@ldrfit.com" required className="bg-secondary/30" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contraseña Temporal</label>
                <Input name="password" type="password" placeholder="••••••••" required className="bg-secondary/30" />
              </div>
              <Button type="submit" className="w-full font-black uppercase tracking-widest text-xs h-11">
                Registrar Coach
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="glass md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Equipo Actual
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {coaches && coaches.length > 0 ? (
              <div className="divide-y divide-border/10">
                {coaches.map((coach) => (
                  <div key={coach.id} className="p-4 flex items-center justify-between hover:bg-secondary/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
                        {coach.full_name?.[0]?.toUpperCase() || 'C'}
                      </div>
                      <div>
                        <p className="font-bold text-sm uppercase tracking-tight">{coach.full_name}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">{coach.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <Shield className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">No hay coaches registrados aún</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
