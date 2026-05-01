import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LogOut, User, Settings } from 'lucide-react'
import { signout } from '@/app/login/actions'

export default async function AthleteProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single()

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto mt-6">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center">
          <User className="w-12 h-12 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold">{profile?.full_name || 'Atleta'}</h1>
          <p className="text-muted-foreground">{profile?.email}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Ajustes de Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full justify-start">Editar Perfil</Button>
          <Button variant="outline" className="w-full justify-start">Cambiar Contraseña</Button>
          <Button variant="outline" className="w-full justify-start">Notificaciones</Button>
        </CardContent>
      </Card>

      <form action={signout}>
        <Button variant="destructive" type="submit" className="w-full gap-2">
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </Button>
      </form>
    </div>
  )
}
