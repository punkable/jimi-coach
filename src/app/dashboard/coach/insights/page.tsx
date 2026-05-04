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
      <div className="bg-white/[0.03] border border-white/5 rounded-[40px] p-8 md:p-10 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-primary/10 transition-colors duration-700" />
        
        <h2 className="text-2xl font-black uppercase tracking-tight mb-10 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          Crear Nuevo Objetivo
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
          className="space-y-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Tipo de Insight</label>
              <select name="type" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 h-14 text-sm font-bold focus:ring-1 focus:ring-primary focus:bg-white/10 transition-all outline-none appearance-none">
                <option value="goal">🎯 Meta / Objetivo</option>
                <option value="benchmark">⚡ Benchmark</option>
                <option value="achievement">🏆 Logro / Record</option>
                <option value="note">📝 Nota de Coach</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Destinatario</label>
              <select name="athlete_id" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 h-14 text-sm font-bold focus:ring-1 focus:ring-primary focus:bg-white/10 transition-all outline-none appearance-none">
                <option value="">👥 Todos los Atletas (Global)</option>
                {athletes?.map(a => (
                  <option key={a.id} value={a.id}>{a.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Título del Insight *</label>
            <input
              name="title" required
              placeholder="Ej: Nuevo PR de Snatch a la vista"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 h-14 text-sm font-bold focus:ring-1 focus:ring-primary focus:bg-white/10 transition-all outline-none"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-3 lg:col-span-2">
              <label className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Descripción / Detalles</label>
              <textarea
                name="body"
                placeholder="Escribe el mensaje motivador o detalles técnicos aquí..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-medium min-h-[120px] focus:ring-1 focus:ring-primary focus:bg-white/10 transition-all outline-none resize-none"
              />
            </div>
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Valor (kg/reps)</label>
                <input
                  type="number" name="target_value"
                  placeholder="Ej: 100"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 h-14 text-sm font-bold focus:ring-1 focus:ring-primary focus:bg-white/10 transition-all outline-none"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Fecha de Expiración</label>
                <input
                  type="date" name="expires_at"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 h-14 text-sm font-bold focus:ring-1 focus:ring-primary focus:bg-white/10 transition-all outline-none"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer group/check">
                <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover/check:border-primary/40 transition-all">
                  <input type="checkbox" name="is_pinned" className="accent-primary w-4 h-4" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-white/60 group-hover/check:text-primary transition-colors">Fijar arriba</span>
              </label>
            </div>
          </div>

          <Button type="submit" className="w-full md:w-auto h-16 px-12 rounded-[24px] font-black uppercase tracking-[0.3em] text-xs bg-primary text-black hover:bg-primary/90 shadow-[0_15px_40px_rgba(204,255,0,0.2)] active:scale-95 transition-all border-none">
            <Plus className="w-5 h-5 mr-3 stroke-[3]" /> Publicar en el Dashboard
          </Button>
        </form>
      </div>

      {/* Insights List */}
      <div className="space-y-6">
        <h2 className="text-2xl font-black uppercase tracking-tight">Activos ({insights?.length ?? 0})</h2>

        {insights && insights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {insights.map((insight: any) => {
              const cfg = typeConfig[insight.type] || typeConfig.note
              const Icon = cfg.icon
              return (
                <div key={insight.id} className={`bg-white/[0.03] rounded-[40px] p-8 border border-white/5 flex flex-col gap-6 relative group hover:border-primary/20 transition-all duration-500 overflow-hidden ${insight.is_pinned ? 'ring-1 ring-primary/20 bg-primary/[0.02]' : ''}`}>
                  <div className="absolute top-0 right-0 p-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                    <Icon className="w-32 h-32" />
                  </div>

                  <div className="flex items-start justify-between relative z-10">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest ${cfg.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {cfg.label}
                    </div>
                    {insight.is_pinned && (
                      <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 animate-pulse">
                        Fijado
                      </span>
                    )}
                  </div>

                  <div className="relative z-10">
                    <h3 className="font-black text-xl uppercase tracking-tight leading-tight text-white group-hover:text-primary transition-colors">{insight.title}</h3>
                    {insight.body && <p className="text-xs text-white/40 mt-3 leading-relaxed font-medium">{insight.body}</p>}
                  </div>

                  <div className="mt-auto relative z-10">
                    <div className="flex items-center justify-between mb-6 pt-6 border-t border-white/5">
                      <div className="flex items-center gap-2 text-[10px] text-white/40 font-black uppercase tracking-widest">
                        <Users className="w-3.5 h-3.5 text-primary/40" />
                        {insight.profiles?.full_name ?? 'Comunidad Global'}
                      </div>
                      {insight.target_value && (
                        <span className="text-[10px] font-black bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-primary">
                          Objetivo: {insight.target_value}
                        </span>
                      )}
                    </div>

                    <form action={async () => {
                      'use server'
                      await archiveInsight(insight.id)
                    }}>
                      <button type="submit" className="w-full py-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] text-white/20 hover:text-white/60 hover:bg-white/10 transition-all font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                        <Archive className="w-3.5 h-3.5" /> Archivar Insight
                      </button>
                    </form>
                  </div>
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
