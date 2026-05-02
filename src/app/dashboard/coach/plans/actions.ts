'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPlan(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const newPlan = {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    objective: formData.get('objective') as string,
    level: formData.get('level') as string,
    created_by: user.id
  }

  const { data: plan, error } = await supabase
    .from('workout_plans')
    .insert(newPlan)
    .select()
    .single()

  if (error) {
    console.error('Error creating plan:', error)
    throw new Error('Failed to create plan')
  }

  revalidatePath('/dashboard/coach/plans')
  redirect(`/dashboard/coach/plans`)
}

export async function archivePlan(planId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('workout_plans')
    .update({ is_archived: true })
    .eq('id', planId)
    .eq('created_by', user.id)

  if (error) {
    console.error('Error archiving plan:', error)
    throw new Error('Failed to archive plan')
  }

  revalidatePath('/dashboard/coach/plans')
}

export async function assignPlan(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const planId = formData.get('plan_id') as string
  const athleteId = formData.get('athlete_id') as string
  const startDate = formData.get('start_date') as string

  const assignment = {
    plan_id: planId,
    athlete_id: athleteId,
    start_date: startDate,
    assigned_by: user.id
  }

  const { error } = await supabase
    .from('assigned_plans')
    .insert(assignment)

  if (error) {
    console.error('Error assigning plan:', error)
    throw new Error('Failed to assign plan')
  }

  revalidatePath('/dashboard/coach/plans')
  revalidatePath('/dashboard/coach/athletes')
}

export async function savePlanStructure(planId: string, days: any[]) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Due to complexity of nested inserts, the easiest MVP approach is to delete existing days and recreate.
  // In production, we'd do a smart merge.
  await supabase.from('workout_days').delete().eq('plan_id', planId)

  for (const day of days) {
    const { data: insertedDay, error: dayError } = await supabase
      .from('workout_days')
      .insert({ 
        plan_id: planId, 
        day_of_week: day.day_of_week, 
        title: day.title,
        week_number: day.week_number || 1
      })
      .select('id').single()
    
    if (dayError || !insertedDay) continue;

    for (let i = 0; i < day.workout_blocks.length; i++) {
      const block = day.workout_blocks[i]
      const { data: insertedBlock, error: blockError } = await supabase
        .from('workout_blocks')
        .insert({ workout_day_id: insertedDay.id, name: block.name, type: block.type, order_index: i })
        .select('id').single()

      if (blockError || !insertedBlock) continue;

      const movementsToInsert = block.workout_movements.map((m: any, mIdx: number) => ({
        block_id: insertedBlock.id,
        exercise_id: m.exercise_id,
        sets: m.sets,
        reps: m.reps,
        weight_percentage: m.weight_percentage,
        notes: m.notes,
        order_index: mIdx
      }))

      if (movementsToInsert.length > 0) {
        await supabase.from('workout_movements').insert(movementsToInsert)
      }
    }
  }

  revalidatePath(`/dashboard/coach/plans/${planId}/edit`)
  revalidatePath('/dashboard/athlete')
}
