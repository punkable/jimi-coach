import { createClient } from '@/lib/supabase/server'
import { LogOut, User, Medal, Flame, Dumbbell } from 'lucide-react'
import { signout } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import ProfileForm from './profile-form'
import SubscriptionCard from './subscription-card'

export default async function AthleteProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single()

  const { data: results } = await supabase
    .from('workout_results')
    .select('completed_at, rpe')
    .eq('athlete_id', user?.id)
    .eq('completed', true)
    .order('completed_at', { ascending: false })

  // Streak
  let currentStreak = 0
  if (results && results.length > 0) {
    const uniqueDates = Array.from(new Set(results.map(r => r.completed_at.split('T')[0])))
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
      let checkDate = new Date(uniqueDates[0])
      currentStreak = 1
      for (let i = 1; i < uniqueDates.length; i++) {
        checkDate.setDate(checkDate.getDate() - 1)
        if (uniqueDates[i] === checkDate.toISOString().split('T')[0]) currentStreak++
        else break
      }
    }
  }

  const initials = profile?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?'

  return (
    <div className="pb-8" style={{ paddingTop: 'max(env(safe-area-inset-top), 0px)' }}>
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Avatar & Main Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass rounded-[32px] p-8 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/30 flex items-center justify-center shadow-xl mb-6">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="w-full h-full rounded-3xl object-cover" />
                ) : (
                  <span className="text-3xl font-black text-primary">{initials}</span>
                )}
              </div>
              <h1 className="text-2xl font-black tracking-tight uppercase">{profile?.full_name || 'Atleta'}</h1>
              <p className="text-sm text-muted-foreground mt-1">{profile?.email}</p>
              
              <div className="mt-8 pt-8 border-t border-border/30 w-full space-y-4">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Membresía</span>
                  <span className="text-xs font-bold text-primary">{profile?.subscription_plan || 'Sin Plan'}</span>
                </div>
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estado</span>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Logout on Desktop */}
            <div className="hidden lg:block pt-4">
              <form action={signout}>
                <Button
                  variant="outline"
                  type="submit"
                  className="w-full gap-2 font-black uppercase tracking-widest h-14 rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 transition-all shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </Button>
              </form>
            </div>
          </div>

          {/* Right Column: Stats & Forms */}
          <div className="lg:col-span-8 space-y-8">
            {/* Quick stats grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="glass rounded-[24px] p-6 text-center border-primary/10">
                <Dumbbell className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-2xl font-black leading-none">{results?.length ?? 0}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">WODs</p>
              </div>
              <div className="glass rounded-[24px] p-6 text-center border-orange-500/10">
                <Flame className="w-5 h-5 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-black leading-none">{currentStreak}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">Racha</p>
              </div>
              <div className="glass rounded-[24px] p-6 text-center border-amber-500/10">
                <Medal className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                <p className="text-2xl font-black leading-none">{profile?.total_classes ?? 0}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">Clases</p>
              </div>
            </div>

            <div className="space-y-6">
              <SubscriptionCard profile={profile} />
              <ProfileForm profile={profile} />
            </div>

            {/* Mobile Logout */}
            <div className="lg:hidden pt-8 border-t border-border/30">
              <form action={signout}>
                <Button
                  variant="outline"
                  type="submit"
                  className="w-full gap-2 font-black uppercase tracking-widest h-14 rounded-2xl border-destructive/30 text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
