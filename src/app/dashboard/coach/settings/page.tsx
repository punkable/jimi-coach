import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogOut, Building2, CreditCard, Dumbbell } from 'lucide-react'
import { signout } from '@/app/login/actions'
import CoachSettingsForm from './coach-settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id || '').single()

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ajustes</h1>
          <p className="text-muted-foreground mt-1">Configuración de tu cuenta y academia.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <div className="md:col-span-2">
          <CoachSettingsForm initialName={profile?.full_name || ''} email={user?.email || ''} />
        </div>

        {/* Account Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Academia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" disabled>Personalizar Marca (Próximamente)</Button>
              <Button variant="outline" className="w-full justify-start" disabled>Ajustes de Notificación</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-primary" />
                Tu Academia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Administras "LDRFIT" y tienes acceso completo a todas las funciones Pro de forma vitalicia.</p>
              <Button variant="secondary" className="w-full" disabled>Plan Activo: Fundador</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="pt-8 border-t border-border flex justify-end">
        <form action={signout}>
          <Button variant="destructive" type="submit" className="gap-2">
            <LogOut className="w-4 h-4" />
            Cerrar Sesión de Forma Segura
          </Button>
        </form>
      </div>
    </div>
  )
}
