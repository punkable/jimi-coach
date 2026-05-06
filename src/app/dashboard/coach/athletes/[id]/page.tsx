import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, Phone, Ruler, Weight, Calendar, Target } from 'lucide-react'
import Link from 'next/link'
import SubscriptionManager from './subscription-manager'

export default async function AthleteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch athlete profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  // Fetch all workout plans
  const { data: plans } = await supabase
    .from('workout_plans')
    .select('id, title')
    .is('is_archived', false)
    .order('title', { ascending: true })

  // Fetch their current plan assignment
  const { data: assignment } = await supabase
    .from('assigned_plans')
    .select('plan_id')
    .eq('athlete_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!profile) {
    return <div className="p-8 text-center text-destructive font-bold">Atleta no encontrado.</div>
  }

  // Fetch their latest workout results (RPE)
  const { data: results } = await supabase
    .from('workout_results')
    .select('*, workout_days(title)')
    .eq('athlete_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

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
        {/* Info Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 uppercase tracking-widest text-primary">
                <User className="w-5 h-5" />
                Datos Físicos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-muted-foreground flex items-center gap-2"><Phone className="w-4 h-4"/> Teléfono</span>
                <span className="font-medium">{profile.phone_number || '-'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-muted-foreground flex items-center gap-2"><Weight className="w-4 h-4"/> Peso</span>
                <span className="font-medium">{profile.weight_kg ? `${profile.weight_kg} kg` : '-'}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-muted-foreground flex items-center gap-2"><Ruler className="w-4 h-4"/> Altura</span>
                <span className="font-medium">{profile.height_cm ? `${profile.height_cm} cm` : '-'}</span>
              </div>
              <div className="flex items-center justify-between pb-2">
                <span className="text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4"/> Talla Polera</span>
                <span className="font-medium">{profile.shirt_size || '-'}</span>
              </div>
              {profile.bio && (
                <div className="pt-2">
                  <span className="text-muted-foreground block mb-1">Notas / Bio:</span>
                  <p className="bg-secondary/20 p-3 rounded-md text-muted-foreground">{profile.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Subscription & Progress Column */}
        <div className="md:col-span-2 space-y-6">
          <SubscriptionManager
            profile={profile}
            plans={plans || []}
            currentPlanId={assignment?.plan_id}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg uppercase tracking-widest text-primary">Últimos Entrenamientos</CardTitle>
              <CardDescription>RPE e historial reciente del alumno</CardDescription>
            </CardHeader>
            <CardContent>
              {results && results.length > 0 ? (
                <div className="space-y-4">
                  {results.map((res: any) => (
                    <div key={res.id} className="flex justify-between items-center p-3 bg-secondary/10 border border-border rounded-lg">
                      <div>
                        <p className="font-bold">{res.workout_days?.title || 'Día de entrenamiento'}</p>
                        <p className="text-xs text-muted-foreground">{new Date(res.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block bg-primary/20 text-primary px-2 py-1 rounded font-black text-sm">
                          RPE: {res.rpe}
                        </span>
                        {res.video_link && (
                          <a href={res.video_link} target="_blank" rel="noreferrer" className="block text-xs text-blue-400 mt-1 hover:underline">
                            Ver Video
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">No hay entrenamientos registrados aún.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
