import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target, Trophy, Star, StickyNote, Plus, Users, Zap, Archive } from 'lucide-react'
import { archiveInsight, createInsight } from '../actions'

const typeConfig: Record<string, { icon: any; label: string; color: string }> = {
  goal: { icon: Target, label: 'Meta', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  benchmark: { icon: Zap, label: 'Benchmark', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  achievement: { icon: Trophy, label: 'Logro', color: 'text-green-500 bg-green-500/10 border-green-500/20' },
  note: { icon: StickyNote, label: 'Nota', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
}

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
    <div className="p-6 md:p-10 space-y-10 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <Target className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Coach Board</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight uppercase">Insights para Atletas</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            Fija metas, benchmarks y notas que tus atletas ven en su dashboard.
          </p>
        </div>
      </header>

      {/* Create Form */}
      <div className="glass rounded-3xl p-6 md:p-8 border-border/40">
        <h2 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" /> Nuevo Insight
        </h2>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tipo</label>
              <select name="type" required className="w-full bg-background/50 border border-border/40 rounded-xl px-4 h-11 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="goal">🎯 Meta</option>
                <option value="benchmark">⚡ Benchmark</option>
                <option value="achievement">🏆 Logro</option>
                <option value="note">📝 Nota / Motivación</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Atleta</label>
              <select name="athlete_id" className="w-full bg-background/50 border border-border/40 rounded-xl px-4 h-11 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="">👥 Para todos los atletas</option>
                {athletes?.map(a => (
                  <option key={a.id} value={a.id}>{a.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Título *</label>
            <input
              name="title" required
              placeholder="Ej: Llega a 100kg en Snatch este mes"
              className="w-full bg-background/50 border border-border/40 rounded-xl px-4 h-11 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descripción / Contexto</label>
              <textarea
                name="body"
                placeholder="Detalles adicionales, contexto o palabras de motivación..."
                className="w-full bg-background/50 border border-border/40 rounded-xl p-4 text-sm min-h-[80px] focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valor Objetivo (kg/reps)</label>
                <input
                  type="number" name="target_value"
                  placeholder="Ej: 100"
                  className="w-full bg-background/50 border border-border/40 rounded-xl px-4 h-11 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Expira</label>
                <input
                  type="date" name="expires_at"
                  className="w-full bg-background/50 border border-border/40 rounded-xl px-4 h-11 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input type="checkbox" name="is_pinned" className="accent-primary w-4 h-4 rounded" />
                <span className="text-sm font-bold">Fijar arriba</span>
              </label>
            </div>
          </div>

          <Button type="submit" className="h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-[0_8px_20px_rgba(var(--primary),0.25)]">
            <Plus className="w-4 h-4 mr-2" /> Publicar Insight
          </Button>
        </form>
      </div>

      {/* Insights List */}
      <div className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight">Activos ({insights?.length ?? 0})</h2>

        {insights && insights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insights.map((insight: any) => {
              const cfg = typeConfig[insight.type] || typeConfig.note
              const Icon = cfg.icon
              return (
                <div key={insight.id} className={`glass rounded-3xl p-6 border-border/40 flex flex-col gap-4 ${insight.is_pinned ? 'ring-1 ring-primary/30' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${cfg.color}`}>
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </div>
                    {insight.is_pinned && (
                      <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded-full border border-primary/20">
                        Fijado
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-black text-lg uppercase tracking-tight leading-tight">{insight.title}</h3>
                    {insight.body && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{insight.body}</p>}
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/20">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold">
                      <Users className="w-3 h-3" />
                      {insight.profiles?.full_name ?? 'Todos'}
                    </div>
                    {insight.target_value && (
                      <span className="text-[10px] font-black bg-secondary/60 border border-border/30 px-2 py-1 rounded-lg text-foreground/80">
                        → {insight.target_value}
                      </span>
                    )}
                  </div>

                  <form action={async () => {
                    'use server'
                    await archiveInsight(insight.id)
                  }}>
                    <button type="submit" className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors font-bold uppercase tracking-widest">
                      <Archive className="w-3 h-3" /> Archivar
                    </button>
                  </form>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="glass rounded-3xl py-20 text-center border-dashed border-2 border-border/30">
            <Target className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="font-bold text-foreground/60">Ningún insight activo todavía.</p>
            <p className="text-sm text-muted-foreground mt-1">Crea el primero usando el formulario de arriba.</p>
          </div>
        )}
      </div>
    </div>
  )
}
