import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { BuilderClient } from './builder-client'

export default async function PlanEditPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const { id } = resolvedParams
  const supabase = await createClient()

  // Fetch plan details
  const { data: plan } = await supabase
    .from('workout_plans')
    .select('*')
    .eq('id', id)
    .single()

  if (!plan) return notFound()

  // Fetch days, blocks, and movements
  const { data: days } = await supabase
    .from('workout_days')
    .select('*, workout_blocks(*, workout_movements(*, exercises(*)))')
    .eq('plan_id', id)
    .order('day_of_week', { ascending: true })

  // Fetch exercise library for dragging/dropping
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .order('name', { ascending: true })

  return (
    <div className="p-4 md:p-8 h-[calc(100vh-4rem)] flex flex-col gap-4">
      <header className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/coach/plans" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Constructor: {plan.title}</h1>
            <p className="text-muted-foreground text-sm">Arrastra ejercicios y diseña los bloques.</p>
          </div>
        </div>
      </header>

      {/* The interactive builder component */}
      <BuilderClient planId={plan.id} initialDays={days || []} library={exercises || []} />
    </div>
  )
}
