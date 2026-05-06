import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Target, Trophy, StickyNote, Plus, Users, Zap, Archive, Pin,
  Activity, TrendingUp, MessageSquare, CheckCircle2
} from 'lucide-react'
import { archiveInsight, createInsight } from '../actions'

export const revalidate = 0

const typeConfig: Record<string, { icon: any; label: string; color: string }> = {
  goal:        { icon: Target,       label: 'Meta',       color: 'text-[var(--metcon)] bg-[var(--metcon)]/10 border-[var(--metcon)]/20' },
  benchmark:   { icon: Zap,          label: 'Benchmark',  color: 'text-[var(--strength)] bg-[var(--strength)]/10 border-[var(--strength)]/20' },
  achievement: { icon: Trophy,       label: 'Logro',      color: 'text-[var(--warmup)] bg-[var(--warmup)]/10 border-[var(--warmup)]/20' },
  note:        { icon: StickyNote,   label: 'Nota',       color: 'text-[var(--gymnastics)] bg-[var(--gymnastics)]/10 border-[var(--gymnastics)]/20' },
  internal:    { icon: MessageSquare,label: 'Interno',    color: 'text-muted-foreground bg-secondary/80 border-border/60' },
}

const inputClass = 'w-full h-12 rounded-2xl border border-border/70 bg-background/55 px-4 text-sm font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
const labelClass = 'text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground'

export default async function InsightsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = getSupabaseAdmin()

  // Fetch insights
  const { data: insights } = await admin
    .from('coach_insights')
    .select('*, profiles:athlete_id(full_name)')
    .eq('coach_id', user!.id)
    .eq('is_archived', false)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  // Fetch athletes (managed by this coach)
  const { data: athletes } = await admin
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'athlete')
    .eq('managed_by', user!.id)
    .is('deleted_at', null)
    .order('full_name')

  const athleteIds = athletes?.map(a => a.id) ?? []

  // Fetch recent workout results for all managed athletes
  const { data: recentResults } = athleteIds.length > 0
    ? await admin
        .from('workout_results')
        .select('id, athlete_id, completed_at, rpe, completed')
        .in('athlete_id', athleteIds)
        .eq('completed', true)
        .order('completed_at', { ascending: false })
        .limit(500)
    : { data: [] }

  // Build per-athlete metrics
  const athleteMetrics = (athletes ?? []).map(athlete => {
    const athResults = (recentResults ?? []).filter(r => r.athlete_id === athlete.id)
    const totalWorkouts = athResults.length
    const lastWorkout = athResults[0]?.completed_at ?? null
    const avgRpe = athResults.length > 0
      ? Math.round(athResults.slice(0, 10).reduce((s, r) => s + (r.rpe || 0), 0) / Math.min(athResults.slice(0, 10).length, 1))
      : null
    const daysSinceLastWorkout = lastWorkout
      ? Math.floor((Date.now() - new Date(lastWorkout).getTime()) / 86400000)
      : null
    return { ...athlete, totalWorkouts, lastWorkout, avgRpe, daysSinceLastWorkout }
  }).sort((a, b) => (b.daysSinceLastWorkout ?? 999) - (a.daysSinceLastWorkout ?? 999))

  const totalWorkoutsAll = (recentResults ?? []).length
  const activeThisWeek = (recentResults ?? []).filter(r => {
    const d = new Date(r.completed_at)
    const now = new Date()
    return (now.getTime() - d.getTime()) < 7 * 86400000
  }).length

  const publicInsights = (insights ?? []).filter(i => i.type !== 'internal')
  const internalNotes = (insights ?? []).filter(i => i.type === 'internal')

  return (
    <div className="p-4 md:p-8 xl:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="ios-panel p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="section-title text-[var(--metcon)] mb-2 flex items-center gap-2">
            <Target className="w-4 h-4" /> Coach Board
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase">Seguimiento & Comunicación</h1>
          <p className="text-muted-foreground text-sm font-semibold mt-2 max-w-2xl">
            Panel de seguimiento de atletas, notas al equipo y mensajes visibles en el dashboard del alumno.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4 text-center">
            <Users className="w-5 h-5 text-primary mx-auto" />
            <p className="text-xl font-black mt-1">{athletes?.length ?? 0}</p>
            <p className="text-[9px] font-black uppercase tracking-widest mt-1 text-muted-foreground">Atletas</p>
          </div>
          <div className="rounded-2xl bg-[var(--gymnastics)]/10 border border-[var(--gymnastics)]/20 p-4 text-center">
            <Activity className="w-5 h-5 text-[var(--gymnastics)] mx-auto" />
            <p className="text-xl font-black mt-1">{activeThisWeek}</p>
            <p className="text-[9px] font-black uppercase tracking-widest mt-1 text-muted-foreground">Esta semana</p>
          </div>
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-center">
            <TrendingUp className="w-5 h-5 text-amber-500 mx-auto" />
            <p className="text-xl font-black mt-1">{totalWorkoutsAll}</p>
            <p className="text-[9px] font-black uppercase tracking-widest mt-1 text-muted-foreground">Total WODs</p>
          </div>
        </div>
      </header>

      {/* Athlete Activity Monitor */}
      {athleteMetrics.length > 0 && (
        <section className="space-y-4">
          <div>
            <p className="section-title text-primary mb-1">Monitor de actividad</p>
            <h2 className="text-2xl font-black uppercase tracking-tight">Seguimiento por atleta</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {athleteMetrics.map(athlete => {
              const inactive = athlete.daysSinceLastWorkout !== null && athlete.daysSinceLastWorkout > 5
              const critical = athlete.daysSinceLastWorkout !== null && athlete.daysSinceLastWorkout > 10
              const neverTrained = athlete.totalWorkouts === 0
              return (
                <div
                  key={athlete.id}
                  className={`ios-panel p-4 flex items-start gap-4 transition-all ${
                    critical || neverTrained ? 'border-destructive/30 bg-destructive/3' : inactive ? 'border-amber-500/25' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg font-black ${
                    critical || neverTrained ? 'bg-destructive/10 border border-destructive/20' :
                    inactive ? 'bg-amber-500/10 border border-amber-500/20' :
                    'bg-primary/10 border border-primary/20'
                  }`}>
                    {athlete.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm uppercase tracking-tight truncate">{athlete.full_name}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-[9px] font-black uppercase tracking-widest bg-secondary/60 border border-border/50 px-2 py-1 rounded-lg">
                        {athlete.totalWorkouts} WODs
                      </span>
                      {athlete.avgRpe !== null && athlete.avgRpe > 0 && (
                        <span className="text-[9px] font-black uppercase tracking-widest bg-secondary/60 border border-border/50 px-2 py-1 rounded-lg">
                          RPE {athlete.avgRpe}/10
                        </span>
                      )}
                      {athlete.daysSinceLastWorkout !== null ? (
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${
                          critical ? 'bg-destructive/10 border-destructive/30 text-destructive' :
                          inactive ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
                          'bg-primary/10 border-primary/20 text-primary'
                        }`}>
                          {athlete.daysSinceLastWorkout === 0 ? 'Hoy' :
                           athlete.daysSinceLastWorkout === 1 ? 'Ayer' :
                           `Hace ${athlete.daysSinceLastWorkout}d`}
                        </span>
                      ) : (
                        <span className="text-[9px] font-black uppercase tracking-widest bg-destructive/10 border border-destructive/30 text-destructive px-2 py-1 rounded-lg">
                          Sin entrenos
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Create Public Insight */}
        <Card className="ios-panel overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary via-[var(--gymnastics)] to-[var(--metcon)]" />
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tight">
              <MessageSquare className="w-5 h-5 text-primary" /> Mensaje a atleta
            </CardTitle>
            <p className="text-xs text-muted-foreground font-semibold">
              Aparece en el dashboard del alumno seleccionado.
            </p>
          </CardHeader>
          <CardContent>
            <form
              action={async (fd) => {
                'use server'
                await createInsight({
                  athleteId: fd.get('athlete_id') as string || null,
                  type: fd.get('type') as string,
                  title: fd.get('title') as string,
                  body: fd.get('body') as string,
                  targetValue: fd.get('target_value') ? parseFloat(fd.get('target_value') as string) : null,
                  isPinned: fd.get('is_pinned') === 'on',
                  expiresAt: fd.get('expires_at') as string || null,
                })
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className={labelClass}>Tipo</label>
                  <select name="type" required className={inputClass}>
                    <option value="goal">Meta / objetivo</option>
                    <option value="benchmark">Benchmark</option>
                    <option value="achievement">Logro / récord</option>
                    <option value="note">Nota del coach</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Destinatario</label>
                  <select name="athlete_id" className={inputClass}>
                    <option value="">Todos los atletas</option>
                    {athletes?.map(a => (
                      <option key={a.id} value={a.id}>{a.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Título</label>
                <input name="title" required placeholder="Ej: Foco técnico esta semana" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Mensaje</label>
                <textarea
                  name="body"
                  placeholder="Escribe el foco, la corrección o el contexto para el alumno..."
                  className="w-full min-h-[100px] rounded-2xl border border-border/70 bg-background/55 p-4 text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-y"
                />
              </div>
              <div className="flex flex-wrap gap-3 items-end">
                <div className="space-y-1.5 flex-1 min-w-[120px]">
                  <label className={labelClass}>Valor objetivo</label>
                  <input type="number" name="target_value" placeholder="Ej: 100 kg" className={inputClass} />
                </div>
                <div className="space-y-1.5 flex-1 min-w-[120px]">
                  <label className={labelClass}>Expira</label>
                  <input type="date" name="expires_at" className={inputClass} />
                </div>
                <label className="flex items-center gap-2 h-12 px-4 rounded-2xl border border-border/70 bg-background/45 cursor-pointer shrink-0">
                  <input type="checkbox" name="is_pinned" className="accent-primary w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Fijar arriba</span>
                </label>
              </div>
              <Button type="submit" className="w-full h-11 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-2">
                <Plus className="w-4 h-4" /> Publicar mensaje
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Internal Notes */}
        <Card className="ios-panel overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-border/60 to-border/30" />
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-xl font-black uppercase tracking-tight">
              <StickyNote className="w-5 h-5 text-muted-foreground" /> Notas internas
            </CardTitle>
            <p className="text-xs text-muted-foreground font-semibold">
              Solo visibles para el equipo de coaches. No aparecen para atletas.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              action={async (fd) => {
                'use server'
                await createInsight({
                  athleteId: fd.get('athlete_id') as string || null,
                  type: 'internal',
                  title: fd.get('title') as string,
                  body: fd.get('body') as string,
                  targetValue: null,
                  isPinned: false,
                  expiresAt: null,
                })
              }}
              className="space-y-3"
            >
              <div className="space-y-1.5">
                <label className={labelClass}>Sobre atleta (opcional)</label>
                <select name="athlete_id" className={inputClass}>
                  <option value="">General del equipo</option>
                  {athletes?.map(a => (
                    <option key={a.id} value={a.id}>{a.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Título</label>
                <input name="title" required placeholder="Ej: Revisar técnica de snatch" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Detalle</label>
                <textarea
                  name="body"
                  placeholder="Observaciones, recordatorios, tareas de seguimiento..."
                  className="w-full min-h-[80px] rounded-2xl border border-border/70 bg-background/55 p-4 text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-y"
                />
              </div>
              <Button type="submit" variant="secondary" className="w-full h-11 rounded-2xl font-black uppercase tracking-widest text-[10px] gap-2 border border-border/70">
                <Plus className="w-4 h-4" /> Guardar nota interna
              </Button>
            </form>

            {internalNotes.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/60">
                {internalNotes.slice(0, 5).map((note: any) => (
                  <div key={note.id} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40 border border-border/40">
                    <StickyNote className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black uppercase tracking-tight truncate">{note.title}</p>
                      {note.profiles?.full_name && (
                        <p className="text-[9px] text-muted-foreground mt-0.5">{note.profiles.full_name}</p>
                      )}
                    </div>
                    <form action={async () => {
                      'use server'
                      await archiveInsight(note.id)
                    }}>
                      <button type="submit" className="text-muted-foreground hover:text-destructive transition-colors">
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Public Insights */}
      <section className="space-y-5">
        <div>
          <p className="section-title text-primary mb-1">Publicados para atletas</p>
          <h2 className="text-2xl font-black uppercase tracking-tight">{publicInsights.length} insights activos</h2>
        </div>

        {publicInsights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {publicInsights.map((insight: any) => {
              const cfg = typeConfig[insight.type] || typeConfig.note
              const Icon = cfg.icon
              return (
                <Card key={insight.id} className={`ios-panel overflow-hidden ${insight.is_pinned ? 'ring-1 ring-primary/30' : ''}`}>
                  <CardContent className="p-5 flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest ${cfg.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </div>
                      {insight.is_pinned && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
                          <Pin className="w-3 h-3" /> Fijado
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-black text-base tracking-tight leading-tight">{insight.title}</h3>
                      {insight.body && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{insight.body}</p>}
                    </div>
                    <div className="mt-auto pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        {insight.profiles?.full_name ?? 'Todos'}
                      </div>
                      {insight.target_value && (
                        <span className="text-[10px] font-black bg-primary/10 border border-primary/20 px-2 py-1 rounded-lg text-primary">
                          {insight.target_value}
                        </span>
                      )}
                      <form action={async () => {
                        'use server'
                        await archiveInsight(insight.id)
                      }}>
                        <Button type="submit" variant="ghost" size="sm" className="h-7 rounded-lg text-[9px] font-black uppercase tracking-widest gap-1 text-muted-foreground hover:text-destructive">
                          <Archive className="w-3 h-3" /> Archivar
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="ios-panel py-16 text-center border-dashed border-2 border-border/50">
            <CheckCircle2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-black text-foreground/70">Sin mensajes activos para atletas.</p>
            <p className="text-sm text-muted-foreground mt-1">Usa el formulario de arriba para publicar.</p>
          </div>
        )}
      </section>
    </div>
  )
}
