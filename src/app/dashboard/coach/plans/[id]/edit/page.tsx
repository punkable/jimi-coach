import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ArrowLeft, Layout } from 'lucide-react'
import Link from 'next/link'
import { BuilderClient } from './builder-client'

export default async function PlanEditPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const { id } = resolvedParams
  const supabase = await createClient()

  const { data: plan } = await supabase
    .from('workout_plans')
    .select('*')
    .eq('id', id)
    .single()

  if (!plan) return notFound()

  const { data: days } = await supabase
    .from('workout_days')
    .select('*, workout_blocks(*, workout_movements(*, exercises(*)))')
    .eq('plan_id', id)
    .order('day_of_week', { ascending: true })
    .order('order_index', { foreignTable: 'workout_blocks', ascending: true })
    .order('order_index', { foreignTable: 'workout_blocks.workout_movements', ascending: true })

  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .order('name', { ascending: true })

  return (
    <div className="p-3 md:p-6 xl:p-8 min-h-full flex flex-col gap-5 bg-background">
      <header className="ios-panel p-4 md:p-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/dashboard/coach/plans"
            className="h-11 w-11 rounded-2xl border border-border/70 bg-background/50 text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center justify-center shrink-0 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <div className="section-title text-primary mb-1 flex items-center gap-2">
              <Layout className="w-3.5 h-3.5" /> Constructor de plan
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight truncate">{plan.title}</h1>
            <p className="text-muted-foreground text-xs md:text-sm font-semibold">
              Diseña semanas, bloques, timers y rutinas con ejercicios vinculados a video.
            </p>
          </div>
        </div>
      </header>

      <BuilderClient planId={plan.id} initialPlan={plan} initialDays={days || []} library={exercises || []} />
    </div>
  )
}
