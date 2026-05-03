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
      {/* Hero header */}
      <div className="relative px-4 pt-10 pb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col items-center text-center gap-4">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/30 flex items-center justify-center shadow-[0_0_30px_rgba(var(--primary),0.2)]">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-2xl font-black text-primary">{initials}</span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">{profile?.full_name || 'Atleta'}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{profile?.email}</p>
            {profile?.subscription_plan && profile.subscription_plan !== 'Sin Plan Activo' && (
              <span className="inline-block mt-2 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                {profile.subscription_plan}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="px-4 grid grid-cols-3 gap-2.5 mb-6">
        <div className="glass rounded-2xl p-3 text-center">
          <Dumbbell className="w-4 h-4 text-primary mx-auto mb-1" />
          <p className="text-lg font-black leading-none">{results?.length ?? 0}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">WODs</p>
        </div>
        <div className="glass rounded-2xl p-3 text-center">
          <Flame className="w-4 h-4 text-orange-500 mx-auto mb-1" />
          <p className="text-lg font-black leading-none">{currentStreak}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Racha</p>
        </div>
        <div className="glass rounded-2xl p-3 text-center">
          <Medal className="w-4 h-4 text-amber-500 mx-auto mb-1" />
          <p className="text-lg font-black leading-none">
            {profile?.total_classes ?? 0}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Clases</p>
        </div>
      </div>

      <div className="px-4 space-y-4 max-w-lg mx-auto">
        <SubscriptionCard profile={profile} />
        <ProfileForm profile={profile} />

        {/* Logout — prominent, always visible */}
        <div className="pt-4 border-t border-border/30">
          <form action={signout}>
            <Button
              variant="outline"
              type="submit"
              className="w-full gap-2 font-black uppercase tracking-widest h-13 rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
