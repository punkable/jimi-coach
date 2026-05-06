import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { LogOut, Flame, Dumbbell, TrendingUp } from 'lucide-react'
import { signout } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import ProfileForm from './profile-form'
import PlanStatusCard from './subscription-card'

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

  // Fetch current assigned plan
  const { data: assignments } = await supabase
    .from('assigned_plans')
    .select('start_date, workout_plans(title)')
    .eq('athlete_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const rawPlan = assignments?.[0]?.workout_plans
  const planObj = Array.isArray(rawPlan) ? rawPlan[0] : rawPlan
  const assignedPlan = planObj
    ? { title: planObj.title, start_date: assignments?.[0]?.start_date }
    : null

  // Streak
  let currentStreak = 0
  if (results && results.length > 0) {
    const uniqueDates = Array.from(new Set(results.map(r => r.completed_at.split('T')[0])))
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
      let checkDate = new Date(uniqueDates[0]); currentStreak = 1
      for (let i = 1; i < uniqueDates.length; i++) {
        checkDate.setDate(checkDate.getDate() - 1)
        if (uniqueDates[i] === checkDate.toISOString().split('T')[0]) currentStreak++
        else break
      }
    }
  }

  const last5 = results?.slice(0, 5) ?? []
  const avgRpe = last5.length > 0
    ? Math.round(last5.reduce((a, r) => a + (r.rpe || 0), 0) / last5.length)
    : null

  return (
    <div className="pb-20 px-4 md:px-6 max-w-2xl mx-auto" style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}>
      <div className="pt-6 space-y-6">

        {/* Avatar + name */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-5xl">
            {profile?.emoji || '💪'}
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">{profile?.full_name || 'Atleta'}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{profile?.email}</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="ios-panel p-4 text-center">
            <Dumbbell className="w-4 h-4 text-primary mx-auto mb-1.5" />
            <p className="text-2xl font-black">{results?.length ?? 0}</p>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider mt-1">WODs</p>
          </div>
          <div className="ios-panel p-4 text-center">
            <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1.5" />
            <p className={`text-2xl font-black ${currentStreak > 0 ? 'text-orange-400' : ''}`}>{currentStreak}</p>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider mt-1">Racha</p>
          </div>
          <div className="ios-panel p-4 text-center">
            <TrendingUp className="w-4 h-4 text-[var(--gymnastics)] mx-auto mb-1.5" />
            <p className="text-2xl font-black">{avgRpe ?? '—'}</p>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider mt-1">RPE Prom</p>
          </div>
        </div>

        <PlanStatusCard assignedPlan={assignedPlan} />

        <ProfileForm profile={profile} />

        <div className="pt-4 flex flex-col items-center gap-5">
          <form action={signout} className="w-full">
            <Button
              variant="outline" type="submit"
              className="w-full gap-2 font-black uppercase tracking-widest h-12 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 transition-all"
            >
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </Button>
          </form>
          <div className="flex flex-col items-center gap-2">
            <Image src="/images/poker.png" alt="Rex" width={48} height={48} className="rex-art opacity-40" />
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">LDRFIT v1.2</p>
          </div>
        </div>
      </div>
    </div>
  )
}
