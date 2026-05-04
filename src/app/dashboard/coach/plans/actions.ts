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

  // Role check
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'coach' && profile?.role !== 'admin') {
    throw new Error('Not authorized')
  }

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

export async function savePlanStructure(planId: string, days: any[], planMeta?: { title: string, description: string, is_community_enabled?: boolean }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Role check
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'coach' && profile?.role !== 'admin') {
    throw new Error('Not authorized')
  }

  // 1. Update Plan Metadata if provided
  if (planMeta) {
    await supabase
      .from('workout_plans')
      .update({ 
        title: planMeta.title, 
        description: planMeta.description,
        is_community_enabled: planMeta.is_community_enabled 
      })
      .eq('id', planId)
  }

  // 2. Fetch existing structure to handle deletions
  const { data: existingDays } = await supabase
    .from('workout_days')
    .select('id, workout_blocks(id, workout_movements(id))')
    .eq('plan_id', planId)

  const incomingDayIds = days.map(d => d.id).filter(id => id.length > 15) // UUIDs are long
  const daysToDelete = existingDays?.filter(d => !incomingDayIds.includes(d.id)).map(d => d.id) || []

  // Delete days no longer present (CASCADE will handle blocks/movements)
  if (daysToDelete.length > 0) {
    await supabase.from('workout_days').delete().in('id', daysToDelete)
  }

  for (const day of days) {
    const isNewDay = day.id.length < 15
    const dayData = {
      plan_id: planId,
      day_of_week: day.day_of_week,
      title: day.title,
      week_number: day.week_number || 1,
      is_published: day.is_published ?? true
    }

    let dayId = day.id
    if (isNewDay) {
      const { data: newDay } = await supabase.from('workout_days').insert(dayData).select('id').single()
      dayId = newDay?.id
    } else {
      await supabase.from('workout_days').update(dayData).eq('id', dayId)
    }

    if (!dayId) continue

    // Handle Blocks
    const existingBlocks = existingDays?.find(d => d.id === dayId)?.workout_blocks || []
    const incomingBlockIds = day.workout_blocks.map((b: any) => b.id).filter((id: string) => id.length > 15)
    const blocksToDelete = existingBlocks.filter(b => !incomingBlockIds.includes(b.id)).map(b => b.id)

    if (blocksToDelete.length > 0) {
      await supabase.from('workout_blocks').delete().in('id', blocksToDelete)
    }

    for (let i = 0; i < day.workout_blocks.length; i++) {
      const block = day.workout_blocks[i]
      const isNewBlock = block.id.length < 15
      const blockData = {
        workout_day_id: dayId,
        name: block.name,
        description: block.description,
        type: block.type,
        order_index: i
      }

      let blockId = block.id
      if (isNewBlock) {
        const { data: newBlock } = await supabase.from('workout_blocks').insert(blockData).select('id').single()
        blockId = newBlock?.id
      } else {
        await supabase.from('workout_blocks').update(blockData).eq('id', blockId)
      }

      if (!blockId) continue

      // Handle Movements (Simplest is to recreate movements for the block to ensure order, 
      // but if we want to preserve IDs for results, we must upsert)
      // Actually, results point to WORKOUT_DAY_ID in many places, or WORKOUT_RESULT links to DAY.
      // But if results link to specific MOVEMENTS (not yet in schema for results), we'd need more care.
      // Current schema: workout_results.workout_day_id. 
      // So as long as DAY_ID is preserved, results are safe.
      
      // Handle Movements (UPSERT strategy to preserve athlete results linked to movement_id)
      const existingMovements = (await supabase.from('workout_movements').select('id').eq('block_id', blockId)).data || []
      const incomingMovementIds = block.workout_movements.map((m: any) => m.id).filter((id: string) => id?.length > 15)
      
      const movementsToDelete = existingMovements.filter(m => !incomingMovementIds.includes(m.id)).map(m => m.id)
      if (movementsToDelete.length > 0) {
        await supabase.from('workout_movements').delete().in('id', movementsToDelete)
      }

      for (let mIdx = 0; mIdx < block.workout_movements.length; mIdx++) {
        const m = block.workout_movements[mIdx]
        const isNewMov = !m.id || m.id.length < 15
        const movData = {
          block_id: blockId,
          exercise_id: m.exercise_id,
          sets: m.sets,
          reps: m.reps,
          weight_percentage: m.weight_percentage,
          notes: m.notes,
          order_index: mIdx
        }

        if (isNewMov) {
          await supabase.from('workout_movements').insert(movData)
        } else {
          await supabase.from('workout_movements').update(movData).eq('id', m.id)
        }
      }
    }
  }

  revalidatePath(`/dashboard/coach/plans/${planId}/edit`)
  revalidatePath('/dashboard/athlete')
  revalidatePath('/dashboard/athlete/workout')
}

export async function toggleWeekStatus(planId: string, weekNumber: number, isPublished: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('workout_days')
    .update({ is_published: isPublished })
    .eq('plan_id', planId)
    .eq('week_number', weekNumber)

  if (error) {
    console.error('Error toggling week status:', error)
    throw new Error('Failed to update week status')
  }

  revalidatePath(`/dashboard/coach/plans/${planId}/edit`)
  revalidatePath('/dashboard/athlete')
  revalidatePath('/dashboard/athlete/workout')
}
