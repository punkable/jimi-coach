import { createClient } from '@/lib/supabase/server'
import { MessageSquareText, Pin, Target, Trophy, Zap, StickyNote, CalendarDays, UserRound } from 'lucide-react'
import { redirect } from 'next/navigation'

export const revalidate = 0

const typeConfig: Record<string, { icon: any; label: string; color: string }> = {
  goal: { icon: Target, label: 'Meta', color: 'text-[var(--metcon)] bg-[var(--metcon)]/10 border-[var(--metcon)]/20' },
  benchmark: { icon: Zap, label: 'Benchmark', color: 'text-[var(--strength)] bg-[var(--strength)]/10 border-[var(--strength)]/20' },
  achievement: { icon: Trophy, label: 'Logro', color: 'text-[var(--warmup)] bg-[var(--warmup)]/10 border-[var(--warmup)]/20' },
  note: { icon: StickyNote, label: 'Nota del coach', color: 'text-[var(--gymnastics)] bg-[var(--gymnastics)]/10 border-[var(--gymnastics)]/20' },
}

function formatDate(value?: string | null) {
  if (!value) return null
  return new Intl.DateTimeFormat('es-CL', { day: '2-digit', month: 'short' }).format(new Date(value))
}

export default async function AthleteFeedbackPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: assignments } = await supabase
    .from('assigned_plans')
    .select('assigned_by, workout_plans(title)')
    .eq('athlete_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const activeAssignment = assignments?.[0]
  const coachId = activeAssignment?.assigned_by

  let query = supabase
    .from('coach_insights')
    .select('id, type, title, body, target_value, is_pinned, created_at, expires_at, coach_id')
    .or(`athlete_id.eq.${user.id},athlete_id.is.null`)
    .eq('is_archived', false)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  if (coachId) {
    query = query.eq('coach_id', coachId)
  }

  const { data: feedback } = await query
  const notes = feedback || []
  const pinned = notes.filter(item => item.is_pinned).length
  const planRaw = activeAssignment?.workout_plans
  const plan = Array.isArray(planRaw) ? planRaw[0] : planRaw

  return (
    <div className="p-4 md:p-8 xl:p-10 space-y-8 max-w-7xl mx-auto">
      <header className="ios-panel p-6 md:p-8 overflow-hidden relative">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-[var(--review)] to-[var(--metcon)]" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="section-title text-[var(--review)] mb-2 flex items-center gap-2">
              <MessageSquareText className="w-4 h-4" /> Coach
            </div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight">Feedback del coach</h1>
            <p className="text-muted-foreground text-sm md:text-base font-semibold mt-3 max-w-2xl">
              Aquí aparecen metas, correcciones, benchmarks y notas que tu coach deja para orientar tu entrenamiento.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 min-w-[240px]">
            <div className="rounded-2xl bg-[var(--review)]/10 border border-[var(--review)]/20 p-4 text-center">
              <MessageSquareText className="w-5 h-5 text-[var(--review)] mx-auto" />
              <p className="text-2xl font-black mt-2">{notes.length}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Mensajes</p>
            </div>
            <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4 text-center">
              <Pin className="w-5 h-5 text-primary mx-auto" />
              <p className="text-2xl font-black mt-2">{pinned}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Fijados</p>
            </div>
          </div>
        </div>
      </header>

      {plan?.title && (
        <section className="ios-panel p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <UserRound className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="section-title text-muted-foreground">Plan activo</p>
            <h2 className="font-black uppercase tracking-tight">{plan.title}</h2>
          </div>
        </section>
      )}

      {notes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {notes.map((item: any) => {
            const cfg = typeConfig[item.type] || typeConfig.note
            const Icon = cfg.icon
            return (
              <article key={item.id} className={`ios-panel p-5 min-h-[260px] flex flex-col gap-5 ${item.is_pinned ? 'ring-1 ring-primary/30' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest ${cfg.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {cfg.label}
                  </span>
                  {item.is_pinned && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                      <Pin className="w-3 h-3" /> Fijado
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight leading-tight">{item.title}</h2>
                  {item.body && (
                    <p className="text-sm text-muted-foreground mt-3 leading-relaxed font-semibold whitespace-pre-wrap">
                      {item.body}
                    </p>
                  )}
                </div>

                <div className="mt-auto pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <CalendarDays className="w-3.5 h-3.5 text-primary" />
                    {formatDate(item.created_at) || 'Reciente'}
                  </span>
                  {item.target_value && (
                    <span className="text-[10px] font-black bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl text-primary">
                      Objetivo: {item.target_value}
                    </span>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="ios-panel py-20 px-6 text-center border-2 border-dashed border-border/50">
          <MessageSquareText className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="font-black uppercase tracking-tight">Aún no tienes feedback publicado.</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Cuando tu coach publique una meta, nota técnica o benchmark, aparecerá aquí y también podrá destacar en tu dashboard.
          </p>
        </div>
      )}
    </div>
  )
}
