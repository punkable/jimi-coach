import { createClient } from '@/lib/supabase/server'
import { LogOut, Flame, Dumbbell, Medal } from 'lucide-react'
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

  return (
    <div className="pb-20" style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}>
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="pt-10 space-y-10">
          
          {/* Quick stats grid */}
          <div className="grid grid-cols-3 gap-4 max-w-4xl mx-auto">
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

          <div className="space-y-8">
            <SubscriptionCard profile={profile} />
            <ProfileForm profile={profile} />
          </div>

          <div className="pt-10 flex flex-col items-center">
            <form action={signout} className="w-full max-w-xs">
              <Button
                variant="outline"
                type="submit"
                className="w-full gap-2 font-black uppercase tracking-widest h-14 rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 transition-all shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </Button>
            </form>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-6">Jimi Coach v1.2</p>
          </div>
        </div>
      </div>
    </div>
  )
}
