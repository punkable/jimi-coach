import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { LogOut, Flame, Dumbbell, TrendingUp } from 'lucide-react'
import { signout } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import ProfileForm from './profile-form'
import ProgramacionCard from './subscription-card'

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

  // Current assignment + plan + day count
  const { data: assignments } = await supabase
    .from('assigned_plans')
    .select('start_date, plan_id, workout_plans(id, title)')
    .eq('athlete_id', user?.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const rawPlan = assignments?.[0]?.workout_plans
  const planObj = Array.isArray(rawPlan) ? rawPlan[0] : rawPlan
  let assignedPlan: any = null
  if (planObj && assignments?.[0]?.plan_id) {
    const { count } = await supabase
      .from('workout_days')
      .select('id', { count: 'exact', head: true })
      .eq('plan_id', assignments[0].plan_id)
      .eq('is_published', true)
    assignedPlan = {
      title: planObj.title,
      start_date: assignments[0].start_date,
      days_count: count ?? 0,
    }
  }

  // Coach assigned (managed_by)
  let coach: any = null
  if (profile?.managed_by) {
    const { data: c } = await supabase
      .from('profiles')
      .select('id, full_name, specialty')
      .eq('id', profile.managed_by)
      .single()
    coach = c || null
  }

  // Streak (local-date)
  const localDateStr = (d: string | Date) => {
    const date = typeof d === 'string' ? new Date(d) : d
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }
  let currentStreak = 0
  if (results && results.length > 0) {
    const uniqueDates = Array.from(new Set(results.map(r => localDateStr(r.completed_at))))
    const today = new Date()
    const todayStr = localDateStr(today)
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = localDateStr(yesterday)
    if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
      let checkDate = new Date(uniqueDates[0]); currentStreak = 1
      for (let i = 1; i < uniqueDates.length; i++) {
        checkDate.setDate(checkDate.getDate() - 1)
        if (uniqueDates[i] === localDateStr(checkDate)) currentStreak++
        else break
      }
    }
  }

  const last5 = results?.slice(0, 5) ?? []
  const avgRpe = last5.length > 0
    ? Math.round(last5.reduce((a, r) => a + (r.rpe || 0), 0) / last5.length)
    : null

  return (
    <div className="pb-24 px-4 md:px-6 lg:px-8 max-w-5xl mx-auto" style={{ paddingTop: 'max(env(safe-area-inset-top), 24px)' }}>
      <div className="pt-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-5xl">
            {profile?.emoji || '💪'}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight">{profile?.full_name || 'Atleta'}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{profile?.email}</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto w-full">
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

        <ProgramacionCard assignedPlan={assignedPlan} coach={coach} />

        <ProfileForm profile={profile} />

        <div className="pt-4 flex flex-col items-center gap-5">
          <form action={signout} className="w-full max-w-xs">
            <Button
              variant="outline" type="submit"
              className="w-full gap-2 font-black uppercase tracking-widest h-12 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 transition-all"
            >
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </Button>
          </form>
          <div className="flex flex-col items-center gap-2">
            <Image src="/images/poker.png" alt="Rex" width={48} height={48} className="rex-art opacity-40" />
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">LDRFIT v1.3</p>
          </div>
        </div>
      </div>
    </div>
  )
}
