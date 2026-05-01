import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Video, ExternalLink, MessageSquare, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default async function ReviewsPage() {
  const supabase = await createClient()

  // Fetch results that have a video link
  const { data: results } = await supabase
    .from('workout_results')
    .select('*, profiles(full_name), workout_days(title, workout_plans(title)), workout_feedback(*)')
    .not('video_link', 'is', null)
    .order('completed_at', { ascending: false })

  return (
    <div className="p-4 md:p-8 space-y-6">
      <header className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-primary/20 rounded-xl text-primary">
          <Video className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Revisiones Técnicas</h1>
          <p className="text-muted-foreground mt-1">Evalúa los videos enviados por tus atletas.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {results && results.length > 0 ? (
          results.map((result: any) => {
            const hasFeedback = result.workout_feedback && result.workout_feedback.length > 0;
            return (
              <Card key={result.id} className={`glass border-border/50 shadow-lg ${hasFeedback ? 'opacity-80 grayscale-[30%]' : 'border-primary/30'}`}>
                <CardHeader className="pb-3 border-b border-border/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        {result.profiles?.full_name}
                        {hasFeedback && <CheckCircle className="w-4 h-4 text-green-500" />}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {result.workout_days?.workout_plans?.title} - {result.workout_days?.title}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Esfuerzo</span>
                      <span className="text-lg font-black text-primary">RPE {result.rpe}/10</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {result.notes && (
                    <div className="bg-background/40 p-3 rounded-lg border border-border/30 text-sm italic text-muted-foreground">
                      "{result.notes}"
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <a href={result.video_link} target="_blank" rel="noopener noreferrer">
                      <Button variant="secondary" className="w-full gap-2 justify-between group">
                        <span className="flex items-center gap-2"><Video className="w-4 h-4 text-primary" /> Ver Video del Alumno</span>
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                      </Button>
                    </a>
                    
                    {hasFeedback ? (
                      <div className="bg-primary/10 p-3 rounded-lg border border-primary/20 text-sm mt-2">
                        <span className="font-bold text-primary text-xs uppercase mb-1 block">Tu Corrección:</span>
                        {result.workout_feedback[0].coach_notes}
                      </div>
                    ) : (
                      <form action={async (formData) => {
                        'use server'
                        const sb = await createClient()
                        const { data: { user } } = await sb.auth.getUser()
                        await sb.from('workout_feedback').insert({
                          workout_result_id: result.id,
                          athlete_id: result.athlete_id,
                          coach_id: user?.id,
                          coach_notes: formData.get('feedback')
                        })
                      }} className="space-y-3 mt-2">
                        <textarea 
                          name="feedback" 
                          required
                          placeholder="Escribe tu corrección técnica aquí..." 
                          className="w-full bg-background/50 border border-border/50 rounded-lg p-3 text-sm min-h-[80px] focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <Button type="submit" className="w-full gap-2">
                          <MessageSquare className="w-4 h-4" /> Enviar Feedback
                        </Button>
                      </form>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card className="glass border-dashed col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 bg-secondary/20 rounded-full mb-4">
                <CheckCircle className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">Todo al día</h3>
              <p className="text-muted-foreground">Tus atletas aún no han subido videos técnicos nuevos para revisar.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
