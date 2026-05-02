import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Video, ExternalLink, MessageSquare, CheckCircle, Clock, TrendingUp, Dumbbell, User } from 'lucide-react'
import Link from 'next/link'

export default async function ReviewsPage() {
  const supabase = await createClient()

  // Fetch all recent results with details
  const { data: results } = await supabase
    .from('workout_results')
    .select(`
      *,
      profiles(full_name, avatar_url),
      workout_days(
        title, 
        workout_plans(title)
      ),
      workout_feedback(*),
      workout_set_results(
        *,
        workout_movements(
          exercise_id,
          exercises(name)
        )
      )
    `)
    .order('completed_at', { ascending: false })
    .limit(20)

  return (
    <div className="p-6 md:p-10 space-y-10 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <Video className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Centro de Revisión</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight uppercase">Actividad de Alumnos</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Monitorea los resultados, técnica y feedback de tu academia.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {results && results.length > 0 ? (
          results.map((result: any) => {
            const hasFeedback = result.workout_feedback && result.workout_feedback.length > 0;
            const hasVideo = !!result.video_link;
            
            return (
              <Card key={result.id} className={`glass border-border/40 overflow-hidden flex flex-col ${hasVideo && !hasFeedback ? 'ring-2 ring-primary/30 shadow-[0_0_30px_rgba(var(--primary),0.1)]' : ''}`}>
                <CardHeader className="pb-4 border-b border-border/20 bg-card/30">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center border border-border/30 overflow-hidden">
                        {result.profiles?.avatar_url ? (
                          <img src={result.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                          {result.profiles?.full_name}
                          {hasFeedback && <CheckCircle className="w-4 h-4 text-green-500" />}
                        </CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          {new Date(result.completed_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase font-black text-muted-foreground/60 block tracking-widest mb-1">Esfuerzo</span>
                      <div className={`px-2 py-1 rounded-lg text-xs font-black border ${
                        result.rpe >= 9 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                        result.rpe >= 7 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                        'bg-green-500/10 text-green-500 border-green-500/20'
                      }`}>
                        RPE {result.rpe}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/10">
                    <p className="text-xs font-bold text-foreground/80 uppercase tracking-tight">
                      {result.workout_days?.workout_plans?.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">
                      {result.workout_days?.title}
                    </p>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6 flex-1 flex flex-col space-y-6">
                  {/* Results Detail */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                      <TrendingUp className="w-3 h-3" />
                      Resultados del WOD
                    </div>
                    <div className="space-y-2">
                      {result.workout_set_results && result.workout_set_results.length > 0 ? (
                        // Group by movement
                        Object.entries(result.workout_set_results.reduce((acc: any, set: any) => {
                          const name = set.workout_movements?.exercises?.name || 'Desconocido';
                          if (!acc[name]) acc[name] = [];
                          acc[name].push(set);
                          return acc;
                        }, {})).map(([name, sets]: [string, any]) => (
                          <div key={name} className="bg-secondary/20 rounded-xl p-3 border border-border/20">
                            <p className="text-[11px] font-bold text-foreground mb-2 uppercase tracking-tight flex items-center gap-2">
                              <Dumbbell className="w-3 h-3 text-muted-foreground" /> {name}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {sets.map((s: any, i: number) => (
                                <div key={i} className="bg-background/40 px-2 py-1 rounded text-[10px] border border-border/10 font-medium">
                                  {s.weight ? `${s.weight}kg × ` : ''}{s.reps}{s.distance ? ` · ${s.distance}m` : ''}{s.time_seconds ? ` · ${s.time_seconds}s` : ''}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground italic p-4 bg-secondary/10 rounded-xl border border-dashed border-border/30">
                          No se registraron series individuales.
                        </p>
                      )}
                    </div>
                  </div>

                  {result.notes && (
                    <div className="space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Comentarios del Atleta</div>
                      <div className="bg-amber-500/5 p-4 rounded-2xl border-l-4 border-amber-500/30 text-sm italic text-muted-foreground leading-relaxed">
                        "{result.notes}"
                      </div>
                    </div>
                  )}

                  <div className="mt-auto space-y-4 pt-4 border-t border-border/20">
                    {hasVideo && (
                      <a href={result.video_link} target="_blank" rel="noopener noreferrer">
                        <Button className="w-full h-12 gap-3 justify-center group bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-2xl transition-all">
                          <Video className="w-5 h-5" />
                          <span className="font-bold uppercase tracking-widest text-[11px]">Ver Video de Técnica</span>
                          <ExternalLink className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
                        </Button>
                      </a>
                    )}
                    
                    {hasFeedback ? (
                      <div className="bg-primary/5 p-5 rounded-2xl border border-primary/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3">
                          <CheckCircle className="w-4 h-4 text-primary opacity-20" />
                        </div>
                        <span className="font-black text-primary text-[10px] uppercase tracking-[0.2em] mb-2 block">Feedback Enviado:</span>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {result.workout_feedback[0].coach_notes}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                          <MessageSquare className="w-3 h-3" /> Escribir Corrección
                        </div>
                        <form action={async (formData) => {
                          'use server'
                          const sb = await createClient()
                          const { data: { user } } = await sb.auth.getUser()
                          await sb.from('workout_feedback').insert({
                            workout_result_id: result.id,
                            athlete_id: result.athlete_id,
                            coach_id: user?.id,
                            coach_notes: formData.get('feedback') as string
                          })
                        }} className="space-y-3">
                          <textarea 
                            name="feedback" 
                            required
                            placeholder="Ej: Mantén el pecho alto en el setup..." 
                            className="w-full bg-background/50 border border-border/40 rounded-2xl p-4 text-sm min-h-[100px] focus:outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground/30"
                          />
                          <Button type="submit" className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-[0_8px_20px_rgba(var(--primary),0.2)]">
                            Enviar Feedback
                          </Button>
                        </form>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-full bg-secondary/30 flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Todo en Orden</h3>
            <p className="text-muted-foreground max-w-sm">Tus atletas aún no han completado entrenamientos recientemente.</p>
          </div>
        )}
      </div>
    </div>
  )
}
