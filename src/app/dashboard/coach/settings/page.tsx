import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogOut, Users, ClipboardList, Activity } from 'lucide-react'
import { signout } from '@/app/login/actions'
import CoachSettingsForm from './coach-settings-form'

export const revalidate = 0

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id || '').single()

  // Lightweight stats
  const admin = getSupabaseAdmin()
  const [{ count: athleteCount }, { count: planCount }, { count: assignedCount }] = await Promise.all([
    admin.from('profiles').select('id', { count: 'exact', head: true })
      .eq('role', 'athlete').eq('managed_by', user?.id || '').is('deleted_at', null),
    admin.from('workout_plans').select('id', { count: 'exact', head: true })
      .eq('created_by', user?.id || '').eq('is_archived', false),
    admin.from('assigned_plans').select('id', { count: 'exact', head: true })
      .eq('assigned_by', user?.id || ''),
  ])

  return (
    <div className="p-4 md:p-8 xl:p-10 space-y-8 max-w-5xl mx-auto">
      <header className="ios-panel p-6 md:p-7 flex flex-col md:flex-row md:items-start justify-between gap-5">
        <div>
          <div className="section-title text-[var(--coach)] mb-2">Centro de control</div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">Mi perfil de coach</h1>
          <p className="text-muted-foreground mt-1">Datos profesionales y resumen de tu actividad.</p>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-2 md:gap-3 shrink-0">
          <div className="rounded-2xl bg-primary/10 border border-primary/20 px-3 py-3 md:px-4 md:py-4 text-center min-w-[80px]">
            <Users className="w-4 h-4 text-primary mx-auto mb-1" />
            <p className="text-xl md:text-2xl font-black">{athleteCount ?? 0}</p>
            <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">Alumnos</p>
          </div>
          <div className="rounded-2xl bg-[var(--gymnastics)]/10 border border-[var(--gymnastics)]/20 px-3 py-3 md:px-4 md:py-4 text-center min-w-[80px]">
            <ClipboardList className="w-4 h-4 text-[var(--gymnastics)] mx-auto mb-1" />
            <p className="text-xl md:text-2xl font-black">{planCount ?? 0}</p>
            <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">Programas</p>
          </div>
          <div className="rounded-2xl bg-[var(--metcon)]/10 border border-[var(--metcon)]/20 px-3 py-3 md:px-4 md:py-4 text-center min-w-[80px]">
            <Activity className="w-4 h-4 text-[var(--metcon)] mx-auto mb-1" />
            <p className="text-xl md:text-2xl font-black">{assignedCount ?? 0}</p>
            <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">Asignados</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <CoachSettingsForm profile={profile} email={user?.email || ''} />
        </div>

        <div className="space-y-6">
          <Card className="ios-panel">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                Cuenta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                Acceso de coach activo. Para gestionar staff y permisos avanzados, contacta al administrador.
              </p>
              <form action={signout}>
                <Button variant="destructive" type="submit" className="w-full gap-2">
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
