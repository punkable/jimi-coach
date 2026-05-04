import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Target, Trophy, StickyNote, Plus, Users, Zap, Archive, Pin, Sparkles } from 'lucide-react'
import { archiveInsight, createInsight } from '../actions'

const typeConfig: Record<string, { icon: any; label: string; color: string }> = {
  goal: { icon: Target, label: 'Meta', color: 'text-[var(--metcon)] bg-[var(--metcon)]/10 border-[var(--metcon)]/20' },
  benchmark: { icon: Zap, label: 'Benchmark', color: 'text-[var(--strength)] bg-[var(--strength)]/10 border-[var(--strength)]/20' },
  achievement: { icon: Trophy, label: 'Logro', color: 'text-[var(--warmup)] bg-[var(--warmup)]/10 border-[var(--warmup)]/20' },
  note: { icon: StickyNote, label: 'Nota', color: 'text-[var(--gymnastics)] bg-[var(--gymnastics)]/10 border-[var(--gymnastics)]/20' },
}

const inputClass = 'w-full h-12 rounded-2xl border border-border/70 bg-background/55 px-4 text-sm font-bold outline-none focus:border-primary focus:ring-3 focus:ring-primary/20 transition-all'
const labelClass = 'section-title text-muted-foreground'

export default async function InsightsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: insights } = await supabase
    .from('coach_insights')
    .select('*, profiles:athlete_id(full_name)')
    .eq('coach_id', user!.id)
    .eq('is_archived', false)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  const { data: athletes } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'athlete')
    .is('deleted_at', null)
    .order('full_name')

  return (
    <div className="p-4 md:p-8 xl:p-10 space-y-8 max-w-7xl mx-auto">
      <header className="ios-panel p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="section-title text-[var(--metcon)] mb-2 flex items-center gap-2">
            <Target className="w-4 h-4" /> Coach Board
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase">Insights para atletas</h1>
          <p className="text-muted-foreground text-sm font-semibold mt-2 max-w-2xl">
            Publica metas, benchmarks, logros y notas que aparecen en el dashboard del alumno para orientar su proceso.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4 text-center">
            <Sparkles className="w-5 h-5 text-primary mx-auto" />
            <p className="text-[10px] font-black uppercase tracking-widest mt-2">Motivación</p>
          </div>
          <div className="rounded-2xl bg-[var(--review)]/10 border border-[var(--review)]/20 p-4 text-center">
            <Users className="w-5 h-5 text-[var(--review)] mx-auto" />
            <p className="text-[10px] font-black uppercase tracking-widest mt-2">{athletes?.length ?? 0} atletas</p>
          </div>
        </div>
      </header>

      <Card className="ios-panel overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary via-[var(--gymnastics)] to-[var(--metcon)]" />
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase tracking-tight">
            <Plus className="w-5 h-5 text-primary" /> Crear insight
          </CardTitle>
          <CardDescription>
            Úsalo para fijar una meta visible, recordar una corrección o destacar un benchmark.
          </CardDescription>
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
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={labelClass}>Tipo</label>
                <select name="type" required className={inputClass}>
                  <option value="goal">Meta / objetivo</option>
                  <option value="benchmark">Benchmark</option>
                  <option value="achievement">Logro / récord</option>
                  <option value="note">Nota del coach</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Destinatario</label>
                <select name="athlete_id" className={inputClass}>
                  <option value="">Todos los atletas</option>
                  {athletes?.map(a => (
                    <option key={a.id} value={a.id}>{a.full_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Título</label>
              <input name="title" required placeholder="Ej: Objetivo de squat esta semana" className={inputClass} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-2 lg:col-span-2">
                <label className={labelClass}>Mensaje</label>
                <textarea
                  name="body"
                  placeholder="Escribe el foco, la corrección o el contexto para el alumno..."
                  className="w-full min-h-[132px] rounded-2xl border border-border/70 bg-background/55 p-4 text-sm font-semibold outline-none focus:border-primary focus:ring-3 focus:ring-primary/20 transition-all resize-y"
                />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className={labelClass}>Valor objetivo</label>
                  <input type="number" name="target_value" placeholder="Ej: 100" className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Expira</label>
                  <input type="date" name="expires_at" className={inputClass} />
                </div>
                <label className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/45 p-4 cursor-pointer">
                  <input type="checkbox" name="is_pinned" className="accent-primary w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Fijar arriba</span>
                </label>
              </div>
            </div>

            <Button type="submit" className="w-full md:w-auto h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-xs gap-2">
              <Plus className="w-4 h-4" /> Publicar en dashboard
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="section-title text-primary mb-2">Activos</p>
            <h2 className="text-2xl font-black uppercase tracking-tight">{insights?.length ?? 0} insights publicados</h2>
          </div>
        </div>

        {insights && insights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {insights.map((insight: any) => {
              const cfg = typeConfig[insight.type] || typeConfig.note
              const Icon = cfg.icon
              return (
                <Card key={insight.id} className={`ios-panel overflow-hidden ${insight.is_pinned ? 'ring-1 ring-primary/30' : ''}`}>
                  <CardContent className="p-5 flex flex-col gap-5 min-h-[260px]">
                    <div className="flex items-start justify-between gap-3">
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest ${cfg.color}`}>
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
                      <h3 className="font-black text-xl tracking-tight leading-tight">{insight.title}</h3>
                      {insight.body && <p className="text-xs text-muted-foreground mt-3 leading-relaxed font-semibold">{insight.body}</p>}
                    </div>

                    <div className="mt-auto space-y-4 pt-4 border-t border-border/60">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                          <Users className="w-3.5 h-3.5 text-primary" />
                          {insight.profiles?.full_name ?? 'Todos'}
                        </div>
                        {insight.target_value && (
                          <span className="text-[10px] font-black bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl text-primary">
                            Objetivo: {insight.target_value}
                          </span>
                        )}
                      </div>

                      <form action={async () => {
                        'use server'
                        await archiveInsight(insight.id)
                      }}>
                        <Button type="submit" variant="outline" className="w-full h-10 rounded-2xl text-[10px] font-black uppercase tracking-widest gap-2 text-muted-foreground">
                          <Archive className="w-3.5 h-3.5" /> Archivar
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="ios-panel py-20 text-center border-dashed border-2 border-border/50">
            <Target className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="font-black text-foreground/70">Aún no hay insights activos.</p>
            <p className="text-sm text-muted-foreground mt-1">Crea el primero usando el formulario de arriba.</p>
          </div>
        )}
      </section>
    </div>
  )
}
