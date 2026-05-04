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
  try {
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
      const { error: metaErr } = await supabase
        .from('workout_plans')
        .update({ 
          title: planMeta.title, 
          description: planMeta.description,
          is_community_enabled: planMeta.is_community_enabled 
        })
        .eq('id', planId)
      if (metaErr) throw metaErr
    }

    // 2. Fetch existing structure to handle deletions
    const { data: existingDays, error: fetchDaysErr } = await supabase
      .from('workout_days')
      .select('id, workout_blocks(id, workout_movements(id))')
      .eq('plan_id', planId)
    
    if (fetchDaysErr) throw fetchDaysErr

    const incomingDayIds = days.map(d => d.id).filter(id => id.length > 15)
    const daysToDelete = existingDays?.filter(d => !incomingDayIds.includes(d.id)).map(d => d.id) || []

    if (daysToDelete.length > 0) {
      const { error: delDaysErr } = await supabase.from('workout_days').delete().in('id', daysToDelete)
      if (delDaysErr) throw delDaysErr
    }

    for (const day of days) {
      const isNewDay = day.id.length < 15
      let dayId = day.id

      if (isNewDay) {
        const { data: newDay, error: insDayErr } = await supabase
          .from('workout_days')
          .insert({
            plan_id: planId,
            day_of_week: day.day_of_week,
            week_number: day.week_number || 1,
            is_published: day.is_published ?? true
          })
          .select('id')
          .single()
        
        if (insDayErr) throw insDayErr
        dayId = newDay?.id
      } else {
        const { error: updDayErr } = await supabase
          .from('workout_days')
          .update({
            day_of_week: day.day_of_week,
            week_number: day.week_number || 1,
            is_published: day.is_published
          })
          .eq('id', dayId)
        
        if (updDayErr) throw updDayErr
      }

      if (!dayId) continue

      // Handle Blocks
      const { data: existingBlocks, error: fetchBlocksErr } = await supabase
        .from('workout_blocks')
        .select('id')
        .eq('workout_day_id', dayId)
      
      if (fetchBlocksErr) throw fetchBlocksErr

      const incomingBlockIds = day.workout_blocks.map((b: any) => b.id).filter((id: string) => id.length > 15)
      const blocksToDelete = existingBlocks.filter(b => !incomingBlockIds.includes(b.id)).map(b => b.id)

      if (blocksToDelete.length > 0) {
        await supabase.from('workout_movements').delete().in('block_id', blocksToDelete)
        const { error: delBlocksErr } = await supabase.from('workout_blocks').delete().in('id', blocksToDelete)
        if (delBlocksErr) throw delBlocksErr
      }

      for (let i = 0; i < day.workout_blocks.length; i++) {
        const block = day.workout_blocks[i]
        const isNewBlock = block.id.length < 15
        
        const blockData = {
          workout_day_id: dayId,
          name: block.name || 'Sin nombre',
          description: block.description || '',
          type: block.type || 'strength',
          timer_type: block.timer_type,
          timer_config: block.timer_config,
          order_index: i
        }

        console.log(`SAVING BLOCK ${block.id}:`, { name: blockData.name, descLength: blockData.description?.length })

        let blockId = block.id
        if (isNewBlock) {
          const { data: newBlock, error: insBlockErr } = await supabase.from('workout_blocks').insert(blockData).select('id').single()
          if (insBlockErr) throw insBlockErr
          blockId = newBlock?.id
        } else {
          const { error: updBlockErr } = await supabase.from('workout_blocks').update(blockData).eq('id', blockId)
          if (updBlockErr) throw updBlockErr
        }

        // Handle Movements inside Block
        const { data: existingMovs, error: fetchMovsErr } = await supabase
          .from('workout_movements')
          .select('id')
          .eq('block_id', blockId)
        
        if (fetchMovsErr) throw fetchMovsErr

        const incomingMovIds = block.workout_movements.map((m: any) => m.id).filter((id: string) => id.length > 15)
        const movsToDelete = existingMovs.filter(m => !incomingMovIds.includes(m.id)).map(m => m.id)

    if (movsToDelete.length > 0) {
          const { error: delMovErr } = await supabase.from('workout_movements').delete().in('id', movsToDelete)
          if (delMovErr) throw delMovErr
        }

        for (let j = 0; j < block.workout_movements.length; j++) {
          const mov = block.workout_movements[j]
          const isNewMov = mov.id.length < 15
          const movData = {
            block_id: blockId,
            exercise_id: mov.exercise_id,
            sets: mov.sets,
            reps: mov.reps,
            weight_percentage: mov.weight_percentage,
            notes: mov.notes,
            order_index: j
          }

          if (isNewMov) {
            const { error: insMovErr } = await supabase.from('workout_movements').insert(movData)
            if (insMovErr) throw insMovErr
          } else {
            const { error: updMovErr } = await supabase.from('workout_movements').update(movData).eq('id', mov.id)
            if (updMovErr) throw updMovErr
          }
        }
      }
    }

    // Return the updated structure with explicit ordering
    const { data: updatedDays, error: finalFetchErr } = await supabase
      .from('workout_days')
      .select('*, workout_blocks(*, workout_movements(*, exercises(*)))')
      .eq('plan_id', planId)
      .order('day_of_week', { ascending: true })
      .order('order_index', { foreignTable: 'workout_blocks', ascending: true })
      .order('order_index', { foreignTable: 'workout_blocks.workout_movements', ascending: true })

    if (finalFetchErr) throw finalFetchErr

    revalidatePath(`/dashboard/coach/plans/${planId}/edit`)
    revalidatePath('/dashboard/athlete')
    revalidatePath('/dashboard/athlete/workout')
    return { success: true, days: updatedDays }
  } catch (err: any) {
    console.error('SAVE PLAN ERROR:', err)
    return { success: false, error: err.message || 'Error desconocido' }
  }
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
