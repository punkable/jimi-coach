import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft, User, Phone, Ruler, Weight, Calendar, Activity,
  CheckCircle2, Clock, AlertCircle, Minus, BarChart2, ClipboardList,
} from 'lucide-react'
import Link from 'next/link'
import SubscriptionManager from './subscription-manager'
import { resolvePlanAnchor, planDayToLocalDate } from '@/lib/date'

const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

type DayStatus = 'completado' | 'iniciado' | 'pendiente' | 'sin-contenido' | 'futuro'

function DayStatusBadge({ status }: { status: DayStatus }) {
  const map: Record<DayStatus, { label: string; className: string; Icon: any }> = {
    completado:     { label: 'Completado',     Icon: CheckCircle2, className: 'bg-primary/15 text-primary border-primary/25' },
    iniciado:       { label: 'En curso',       Icon: Clock,        className: 'bg-amber-500/15 text-amber-500 border-amber-500/25' },
    pendiente:      { label: 'Pendiente',      Icon: AlertCircle,  className: 'bg-secondary text-muted-foreground border-border' },
    futuro:         { label: 'Próximo',        Icon: Calendar,     className: 'bg-secondary text-muted-foreground/50 border-border/30' },
    'sin-contenido':{ label: 'Sin contenido',  Icon: Minus,        className: 'bg-secondary/50 text-muted-foreground/40 border-border/20' },
  }
  const { label, Icon, className } = map[status]
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${className}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}

export default async function AthleteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = getSupabaseAdmin()

  // Load athlete profile
  const { data: profile } = await admin.from('profiles').select('*').eq('id', id).single()
  if (!profile) {
    return <div className="p-8 text-center text-destructive font-bold">Atleta no encontrado.</div>
  }

  // All available plans (for assignment manager)
  const { data: plans } = await admin
    .from('workout_plans')
    .select('id, title')
    .eq('is_archived', false)
    .order('title', { ascending: true })

  // Current assignment with start_date
  const { data: assignments } = await admin
    .from('assigned_plans')
    .select('plan_id, start_date, workout_plans(id, title)')
    .eq('athlete_id', id)
    .order('created_at', { ascending: false })
    .limit(1)

  const currentAssignment = assignments?.[0]
  const currentPlanId = currentAssignment?.plan_id ?? undefined
  const rawAssignedPlan = currentAssignment?.workout_plans
  const assignedPlan: { id: string; title: string } | null = Array.isArray(rawAssignedPlan)
    ? rawAssignedPlan[0] ?? null
    : rawAssignedPlan ?? null

  // Workout days for the assigned plan, with block count
  let planDays: any[] = []
  if (currentPlanId) {
    const { data } = await admin
      .from('workout_days')
      .select('id, day_of_week, week_number, title, is_published, workout_blocks(id)')
      .eq('plan_id', currentPlanId)
      .eq('is_published', true)
      .order('week_number', { ascending: true })
      .order('day_of_week', { ascending: true })
    planDays = data || []
  }

  // All completed workout results for this athlete (for the assigned plan's days)
  const planDayIds = planDays.map((d: any) => d.id)
  let resultsMap: Map<string, { completed: boolean; rpe: number | null; completed_at: string }> = new Map()
  if (planDayIds.length > 0) {
    const { data: wResults } = await admin
      .from('workout_results')
      .select('workout_day_id, completed, rpe, completed_at')
      .eq('athlete_id', id)
      .in('workout_day_id', planDayIds)
      .order('completed_at', { ascending: false })
    // Keep the most recent result per day
    for (const r of (wResults || [])) {
      if (r.workout_day_id && !resultsMap.has(r.workout_day_id)) {
        resultsMap.set(r.workout_day_id, { completed: r.completed ?? false, rpe: r.rpe, completed_at: r.completed_at })
      }
    }
  }

  // Latest 5 results for history section
  const { data: recentResults } = await admin
    .from('workout_results')
    .select('id, rpe, video_link, completed_at, workout_day_id, completed')
    .eq('athlete_id', id)
    .order('completed_at', { ascending: false })
    .limit(5)

  // Compute per-day status
  const anchor = resolvePlanAnchor(currentAssignment?.start_date ?? null)
  const today = new Date(); today.setHours(0, 0, 0, 0)

  const daysWithStatus = planDays.map((day: any) => {
    const blockCount: number = (day.workout_blocks ?? []).length
    const result = resultsMap.get(day.id)
    const dayDate = planDayToLocalDate(day.week_number || 1, day.day_of_week, anchor)
    const isPast = dayDate < today
    const isToday = dayDate.toDateString() === today.toDateString()

    let status: DayStatus
    if (blockCount === 0) {
      status = 'sin-contenido'
    } else if (result?.completed) {
      status = 'completado'
    } else if (result && !result.completed) {
      status = 'iniciado'
    } else if (isPast || isToday) {
      status = 'pendiente'
    } else {
      status = 'futuro'
    }

    return { day, blockCount, result, dayDate, status }
  })

  const completedCount = daysWithStatus.filter(d => d.status === 'completado').length
  const totalWithContent = daysWithStatus.filter(d => d.status !== 'sin-contenido').length

  // Group by week for display
  const byWeek = new Map<number, typeof daysWithStatus>()
  for (const item of daysWithStatus) {
    const wk = item.day.week_number || 1
    if (!byWeek.has(wk)) byWeek.set(wk, [])
    byWeek.get(wk)!.push(item)
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      <header className="flex items-center gap-4">
        <Link href="/dashboard/coach/athletes">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight uppercase">{profile.full_name || 'Sin nombre'}</h1>
          <p className="text-muted-foreground mt-1">{profile.email}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: profile info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 uppercase tracking-widest text-primary">
                <User className="w-5 h-5" /> Datos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                { icon: Phone,  label: 'Teléfono', value: profile.phone_number },
                { icon: Weight, label: 'Peso',     value: profile.weight_kg ? `${profile.weight_kg} kg` : null },
                { icon: Ruler,  label: 'Altura',   value: profile.height_cm ? `${profile.height_cm} cm` : null },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Icon className="w-4 h-4" /> {label}
                  </span>
                  <span className="font-medium">{value || '—'}</span>
                </div>
              ))}
              {profile.bio && (
                <div className="pt-2">
                  <span className="text-muted-foreground block mb-1 text-xs uppercase tracking-widest font-bold">Notas</span>
                  <p className="bg-secondary/20 p-3 rounded-md text-muted-foreground text-xs">{profile.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right columns */}
        <div className="md:col-span-2 space-y-6">
          {/* Assignment manager */}
          <SubscriptionManager
            profile={profile}
            plans={plans || []}
            currentPlanId={currentPlanId}
          />

          {/* ─── Workout Progress Tracker ───────────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg uppercase tracking-widest text-primary flex items-center gap-2">
                    <BarChart2 className="w-5 h-5" /> Seguimiento de Programación
                  </CardTitle>
                  <CardDescription>
                    {assignedPlan
                      ? `${assignedPlan.title} · ${completedCount}/${totalWithContent} días completados`
                      : 'Sin programación asignada'}
                  </CardDescription>
                </div>
                {totalWithContent > 0 && (
                  <div className="shrink-0 text-right">
                    <p className="text-3xl font-black text-primary leading-none">
                      {Math.round((completedCount / totalWithContent) * 100)}%
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">
                      Adherencia
                    </p>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {planDays.length === 0 ? (
                <div className="py-8 text-center">
                  <ClipboardList className="w-8 h-8 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                    {assignedPlan ? 'Sin días publicados en esta programación' : 'Sin programación asignada'}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Array.from(byWeek.entries()).map(([weekNum, items]) => (
                    <div key={weekNum}>
                      {byWeek.size > 1 && (
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">
                          Semana {weekNum}
                        </p>
                      )}
                      <div className="space-y-2">
                        {items.map(({ day, blockCount, result, dayDate, status }) => {
                          const dayName = DAY_NAMES[(day.day_of_week - 1) % 7]
                          const dateStr = dayDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                          return (
                            <div
                              key={day.id}
                              className="flex items-center gap-3 p-3 rounded-2xl border border-border/50 bg-card/30 hover:bg-card/60 transition-colors"
                            >
                              {/* Day icon */}
                              <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 border text-center ${
                                status === 'completado'
                                  ? 'bg-primary/15 border-primary/25'
                                  : status === 'iniciado'
                                  ? 'bg-amber-500/15 border-amber-500/25'
                                  : 'bg-secondary border-border/30'
                              }`}>
                                <span className="text-[8px] font-black uppercase tracking-tighter text-muted-foreground leading-none">{dayName.slice(0,3)}</span>
                                <span className={`text-sm font-black leading-none mt-0.5 ${status === 'completado' ? 'text-primary' : ''}`}>
                                  {dayDate.getDate()}
                                </span>
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="font-black text-sm uppercase tracking-tight leading-none truncate">
                                  {day.title || dayName}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <span className="text-[10px] text-muted-foreground">{dateStr}</span>
                                  {blockCount > 0 && (
                                    <>
                                      <span className="text-[10px] text-muted-foreground/40">·</span>
                                      <span className="text-[10px] text-muted-foreground">{blockCount} {blockCount === 1 ? 'bloque' : 'bloques'}</span>
                                    </>
                                  )}
                                  {result?.rpe != null && (
                                    <>
                                      <span className="text-[10px] text-muted-foreground/40">·</span>
                                      <span className="text-[10px] font-bold text-primary">RPE {result.rpe}</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Status badge */}
                              <DayStatusBadge status={status} />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg uppercase tracking-widest text-primary flex items-center gap-2">
                <Activity className="w-5 h-5" /> Historial Reciente
              </CardTitle>
              <CardDescription>Últimas 5 sesiones registradas</CardDescription>
            </CardHeader>
            <CardContent>
              {recentResults && recentResults.length > 0 ? (
                <div className="space-y-3">
                  {recentResults.map((res: any) => (
                    <div key={res.id} className="flex justify-between items-center p-3 bg-secondary/10 border border-border rounded-xl">
                      <div>
                        <p className="font-bold text-sm flex items-center gap-2">
                          {res.completed
                            ? <CheckCircle2 className="w-4 h-4 text-primary" />
                            : <Clock className="w-4 h-4 text-amber-500" />}
                          {res.completed ? 'Completado' : 'Iniciado'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(res.completed_at).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        {res.rpe != null && (
                          <span className="inline-block bg-primary/20 text-primary px-2 py-1 rounded-lg font-black text-sm">
                            RPE {res.rpe}
                          </span>
                        )}
                        {res.video_link && (
                          <a href={res.video_link} target="_blank" rel="noreferrer" className="block text-xs text-blue-400 hover:underline">
                            Ver video →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">No hay sesiones registradas aún.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
