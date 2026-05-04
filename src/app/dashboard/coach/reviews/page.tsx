import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Video, ExternalLink, MessageSquare, CheckCircle, Clock, Dumbbell, User, Archive, StickyNote } from 'lucide-react'
import { updateReviewStatus, createFeedback } from '../actions'

type StatusFilter = 'pending' | 'done' | 'archived'

export default async function ReviewsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status = 'pending' } = await searchParams
  const supabase = await createClient()

  const query = supabase
    .from('workout_results')
    .select(`
      *,
      profiles(full_name, avatar_url),
      workout_days(title, workout_plans(title)),
      workout_feedback(*),
      workout_set_results(
        weight, reps, distance, time_seconds, set_number, is_completed,
        workout_movements(
          exercise_id,
          exercises(name)
        )
      )
    `)
    .order('completed_at', { ascending: false })
    .limit(30)

  const { data: results } = await query

  // Filter based on status tab
  const filtered = results?.filter((r: any) => {
    const fb = r.workout_feedback?.[0]
    if (status === 'pending') return !fb || fb.status === 'pending'
    if (status === 'done') return fb?.status === 'done'
    if (status === 'archived') return fb?.status === 'archived'
    return true
  }) ?? []

  const tabs: { key: StatusFilter; label: string; color: string }[] = [
    { key: 'pending', label: 'Pendiente', color: 'text-amber-500 border-amber-500/50 bg-amber-500/10' },
    { key: 'done', label: 'Revisado', color: 'text-green-500 border-green-500/50 bg-green-500/10' },
    { key: 'archived', label: 'Archivado', color: 'text-muted-foreground border-border/50 bg-secondary/30' },
  ]

  return (
    <div className="p-4 md:p-8 xl:p-10 space-y-8 max-w-7xl mx-auto">
      <header className="ios-panel p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="section-title text-[var(--review)] mb-2 flex items-center gap-2">
            <Video className="w-4 h-4" />
            <span>Centro de revisión</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase">Actividad de alumnos</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Monitorea, revisa y da feedback a tus atletas.</p>
        </div>
        <div className="rounded-2xl border border-[var(--review)]/20 bg-[var(--review)]/10 px-5 py-4 text-[var(--review)]">
          <MessageSquare className="w-6 h-6" />
          <p className="mt-2 text-[10px] font-black uppercase tracking-widest">Feedback técnico</p>
        </div>
      </header>

      {/* Status Tabs */}
      <div className="ios-panel p-2 flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <a key={tab.key} href={`?status=${tab.key}`}>
            <div className={`px-4 py-2 rounded-xl border text-[11px] font-black uppercase tracking-widest cursor-pointer transition-all ${
              status === tab.key ? tab.color : 'text-muted-foreground border-border/30 bg-transparent hover:bg-secondary/30'
            }`}>
              {tab.label}
              {tab.key === 'pending' && results && (
                <span className="ml-2 text-[9px]">
                  ({results.filter((r: any) => !r.workout_feedback?.[0] || r.workout_feedback[0].status === 'pending').length})
                </span>
              )}
            </div>
          </a>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {filtered.length > 0 ? (
          filtered.map((result: any) => {
            const fb = result.workout_feedback?.[0]
            const hasVideo = !!result.video_link
            const groupedSets = result.workout_set_results?.reduce((acc: any, set: any) => {
              const name = set.workout_movements?.exercises?.name || 'Ejercicio'
              if (!acc[name]) acc[name] = []
              acc[name].push(set)
              return acc
            }, {}) ?? {}

            return (
              <Card key={result.id} className={`ios-panel border-border/40 overflow-hidden flex flex-col ${hasVideo && (!fb || fb.status === 'pending') ? 'ring-1 ring-[var(--review)]/30' : ''}`}>
                <CardHeader className="pb-4 border-b border-border/20 bg-card/45">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[var(--athlete)]/10 flex items-center justify-center border border-[var(--athlete)]/20">
                        {result.profiles?.avatar_url ? (
                          <img src={result.profiles.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <User className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-base font-black uppercase tracking-tight">{result.profiles?.full_name}</CardTitle>
                        <CardDescription className="text-[10px] flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(result.completed_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </CardDescription>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-lg text-xs font-black border ${
                      result.rpe >= 9 ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                      result.rpe >= 7 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                      'bg-green-500/10 text-green-500 border-green-500/20'
                    }`}>
                      RPE {result.rpe ?? '-'}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/10">
                    <p className="text-xs font-bold text-foreground/80 uppercase tracking-tight">{result.workout_days?.workout_plans?.title}</p>
                    <p className="text-[10px] text-muted-foreground">{result.workout_days?.title}</p>
                  </div>
                </CardHeader>

                <CardContent className="pt-6 flex-1 flex flex-col space-y-6">
                  {/* Sets breakdown */}
                  {Object.keys(groupedSets).length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                        <Dumbbell className="w-3 h-3" /> Series registradas
                      </p>
                      {Object.entries(groupedSets).map(([name, sets]: [string, any]) => (
                        <div key={name} className="bg-secondary/20 rounded-xl p-3 border border-border/20">
                          <p className="text-[11px] font-bold uppercase tracking-tight mb-2">{name}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {sets.filter((s: any) => s.is_completed).map((s: any, i: number) => (
                              <span key={i} className="bg-background/50 border border-border/20 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                                {s.weight ? `${s.weight}kg × ` : ''}{s.reps || s.time_seconds || s.distance}
                                {s.time_seconds ? 's' : ''}{s.distance ? 'm' : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {result.notes && (
                      <div className="bg-amber-500/5 p-4 rounded-2xl border-l-4 border-amber-500/30 text-sm italic text-muted-foreground leading-relaxed">
                      "{result.notes}"
                    </div>
                  )}

                  <div className="mt-auto space-y-4 pt-4 border-t border-border/20">
                    {hasVideo && (
                      <a href={result.video_link} target="_blank" rel="noopener noreferrer">
                        <Button className="w-full h-11 gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-xl transition-all font-bold uppercase tracking-widest text-[10px]">
                          <Video className="w-4 h-4" /> Ver video técnico <ExternalLink className="w-3 h-3 opacity-40" />
                        </Button>
                      </a>
                    )}

                    {/* Private Notes */}
                    {fb?.private_notes && (
                      <div className="bg-secondary/30 p-4 rounded-xl border border-border/20">
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1 flex items-center gap-1">
                          <StickyNote className="w-3 h-3" /> Nota Privada (solo tú la ves)
                        </p>
                        <p className="text-xs text-muted-foreground">{fb.private_notes}</p>
                      </div>
                    )}

                    {/* Feedback / Correction */}
                    {fb?.coach_notes && (
                      <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
                        <p className="text-[9px] font-black uppercase tracking-widest text-primary/60 mb-1">Corrección enviada</p>
                        <p className="text-xs text-muted-foreground">{fb.coach_notes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    {status === 'pending' && (
                      <div className="space-y-3">
                        <div className="flex flex-col gap-2">
                          <form action={async (fd) => {
                            'use server'
                            await createFeedback(result.id, result.athlete_id, fd.get('feedback') as string)
                          }} className="space-y-2">
                            <textarea
                              name="feedback"
                              placeholder="Escribe tu corrección técnica (opcional)..."
                              className="w-full bg-background/55 border border-border/60 rounded-xl p-3 text-sm font-semibold min-h-[92px] focus:outline-none focus:ring-2 focus:ring-[var(--review)]/30"
                            />
                            <div className="flex gap-2">
                              <Button type="submit" className="flex-1 h-11 rounded-xl font-black uppercase tracking-widest text-[10px]">
                                <MessageSquare className="w-4 h-4 mr-2" /> Enviar feedback
                              </Button>
                            </div>
                          </form>
                          
                          <div className="flex gap-2">
                            {!fb ? (
                              <form action={async () => {
                                'use server'
                                await createFeedback(result.id, result.athlete_id, '', 'archived')
                              }} className="w-full">
                                <Button type="submit" variant="outline" className="w-full h-11 rounded-xl text-muted-foreground border-border/40 hover:bg-secondary/50 font-black uppercase tracking-widest text-[10px]">
                                  <Archive className="w-4 h-4 mr-2" /> Archivar sin feedback
                                </Button>
                              </form>
                            ) : (
                              <>
                                <form action={async () => {
                                  'use server'
                                  await updateReviewStatus(fb.id, 'done')
                                }} className="flex-1">
                                  <Button type="submit" variant="outline" className="w-full h-9 text-[10px] font-black uppercase tracking-widest rounded-xl border-green-500/30 text-green-500 hover:bg-green-500/10">
                                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Marcar Hecho
                                  </Button>
                                </form>
                                <form action={async () => {
                                  'use server'
                                  await updateReviewStatus(fb.id, 'archived')
                                }} className="flex-1">
                                  <Button type="submit" variant="outline" className="w-full h-9 text-[10px] font-black uppercase tracking-widest rounded-xl text-muted-foreground hover:bg-secondary/50">
                                    <Archive className="w-3.5 h-3.5 mr-1" /> Archivar
                                  </Button>
                                </form>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {status === 'done' && fb?.id && (
                      <form action={async () => {
                        'use server'
                        await updateReviewStatus(fb.id, 'archived')
                      }}>
                        <Button type="submit" variant="outline" size="sm" className="text-[10px] font-black uppercase tracking-widest rounded-xl text-muted-foreground">
                          <Archive className="w-3.5 h-3.5 mr-1" /> Archivar
                        </Button>
                      </form>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
            <CheckCircle className="w-12 h-12 text-muted-foreground/20 mb-4" />
            <h3 className="text-xl font-black uppercase tracking-tight mb-2">Sin resultados en esta sección</h3>
            <p className="text-muted-foreground text-sm">
              {status === 'pending' ? 'Todos los resultados han sido revisados.' : 'No hay registros en esta categoría.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
