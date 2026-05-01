import { createClient } from '@/lib/supabase/server'
import { LogOut, User } from 'lucide-react'
import { signout } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import ProfileForm from './profile-form'

export default async function AthleteProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single()

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto mt-6">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30">
          <User className="w-12 h-12 text-primary" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold uppercase tracking-tight">{profile?.full_name || 'Atleta'}</h1>
          <p className="text-muted-foreground">{profile?.email}</p>
        </div>
      </div>

      <ProfileForm initialName={profile?.full_name || ''} />

      <form action={signout} className="pt-4 border-t border-white/5">
        <Button variant="destructive" type="submit" className="w-full gap-2 font-bold uppercase tracking-widest h-12">
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </Button>
      </form>
    </div>
  )
}
