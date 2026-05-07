'use server'

import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function getAuthorizedCoach() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Use admin client for role check to avoid RLS issues
  const db = getSupabaseAdmin()
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'coach' && profile?.role !== 'admin') {
    throw new Error('Not authorized')
  }

  return { user, role: profile.role as 'coach' | 'admin' }
}

async function assertCanManagePlan(planId: string, userId: string, role: string) {
  const admin = getSupabaseAdmin()
  const { data: plan, error } = await admin
    .from('workout_plans')
    .select('id, created_by')
    .eq('id', planId)
    .single()

  if (error) throw error
  if (!plan) throw new Error('Plan not found')
  if (role !== 'admin' && plan.created_by !== userId) {
    throw new Error('Not authorized to manage this plan')
  }
}

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
  const { user, role } = await getAuthorizedCoach()
  await assertCanManagePlan(planId, user.id, role)

  const db = getSupabaseAdmin()
  const { error } = await db
    .from('workout_plans')
    .update({ is_archived: true })
    .eq('id', planId)

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

  const planId    = formData.get('plan_id')    as string
  const athleteId = formData.get('athlete_id') as string
  const startDate = formData.get('start_date') as string

  if (!planId || !athleteId) throw new Error('Faltan datos')

  // Use admin client to bypass RLS — this is a coach/admin action
  const db = getSupabaseAdmin()

  // Remove any existing assignment first (one plan per athlete)
  await db.from('assigned_plans').delete().eq('athlete_id', athleteId)

  const { error } = await db.from('assigned_plans').insert({
    plan_id:     planId,
    athlete_id:  athleteId,
    start_date:  startDate,
    assigned_by: user.id,
  })

  if (error) {
    console.error('Error assigning plan:', error)
    throw new Error('No se pudo asignar el plan')
  }

  revalidatePath('/dashboard/coach/plans')
  revalidatePath('/dashboard/coach/athletes')
  revalidatePath(`/dashboard/coach/athletes/${athleteId}`)
  revalidatePath('/dashboard/athlete')
}

export async function savePlanStructure(planId: string, days: any[], planMeta?: { title: string, description: string, is_community_enabled?: boolean }) {
  try {
    const { user, role } = await getAuthorizedCoach()
    await assertCanManagePlan(planId, user.id, role)
    const supabase = getSupabaseAdmin()
    const savedBlockDescriptions: Record<string, string> = {}

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
            title: day.title || null,
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
            title: day.title || null,
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
        .select('id, description, description_footer')
        .eq('workout_day_id', dayId)

      if (fetchBlocksErr) throw fetchBlocksErr

      const incomingBlockIds = day.workout_blocks.map((b: any) => b.id).filter((id: string) => id.length > 15)
      const blocksToDelete = (existingBlocks || []).filter(b => !incomingBlockIds.includes(b.id)).map(b => b.id)

      if (blocksToDelete.length > 0) {
        await supabase.from('workout_movements').delete().in('block_id', blocksToDelete)
        const { error: delBlocksErr } = await supabase.from('workout_blocks').delete().in('id', blocksToDelete)
        if (delBlocksErr) throw delBlocksErr
      }

      for (let i = 0; i < day.workout_blocks.length; i++) {
        const block = day.workout_blocks[i]
        const isNewBlock = block.id.length < 15

        const existingBlock = existingBlocks?.find((existing: any) => existing.id === block.id)
        const incomingDescription = typeof block.description === 'string' ? block.description : undefined
        const descriptionToPersist =
          incomingDescription !== undefined && incomingDescription.length > 0
            ? incomingDescription
            : existingBlock?.description || ''
        const incomingFooter = typeof block.description_footer === 'string' ? block.description_footer : undefined
        const footerToPersist =
          incomingFooter !== undefined
            ? (incomingFooter.length > 0 ? incomingFooter : null)
            : (existingBlock?.description_footer ?? null)

        const blockData = {
          workout_day_id: dayId,
          name: block.name || 'Sin nombre',
          description: descriptionToPersist,
          description_footer: footerToPersist,
          type: block.type || 'strength',
          timer_type: block.timer_type || null,
          timer_config: block.timer_config || {},
          order_index: i
        }

        let blockId = block.id
        if (isNewBlock) {
          const { data: newBlock, error: insBlockErr } = await supabase
            .from('workout_blocks')
            .insert(blockData)
            .select('id')
            .single()
          if (insBlockErr) throw insBlockErr
          blockId = newBlock?.id
          if (blockId) savedBlockDescriptions[blockId] = descriptionToPersist
        } else {
          const { error: updBlockErr } = await supabase
            .from('workout_blocks')
            .update(blockData)
            .eq('id', blockId)
          if (updBlockErr) throw updBlockErr
          savedBlockDescriptions[blockId] = descriptionToPersist
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
    const hydratedDays = (updatedDays || []).map((day: any) => ({
      ...day,
      workout_blocks: (day.workout_blocks || []).map((block: any) => ({
        ...block,
        description:
          savedBlockDescriptions[block.id] !== undefined
            ? savedBlockDescriptions[block.id]
            : block.description
      }))
    }))

    revalidatePath(`/dashboard/coach/plans/${planId}/edit`)
    revalidatePath('/dashboard/athlete')
    revalidatePath('/dashboard/athlete/workout')
    return { success: true, days: hydratedDays }
  } catch (err: any) {
    console.error('SAVE PLAN ERROR:', err)
    return { success: false, error: err.message || 'Error desconocido' }
  }
}

export async function toggleWeekStatus(planId: string, weekNumber: number, isPublished: boolean) {
  const { user, role } = await getAuthorizedCoach()
  await assertCanManagePlan(planId, user.id, role)

  const db = getSupabaseAdmin()
  const { error } = await db
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

export async function createExerciseQuick(
  name: string,
  category: string,
  opts?: { tracking_type?: string; video_url?: string; description?: string }
): Promise<{ exercise?: { id: string, name: string, category: string | null, tracking_type: string | null, video_url: string | null }, error?: string }> {
  try {
    const { user } = await getAuthorizedCoach()
    const admin = getSupabaseAdmin()
    const { data, error } = await admin
      .from('exercises')
      .insert({
        name: name.trim(),
        category: category || 'General',
        tracking_type: opts?.tracking_type || 'weight_reps',
        video_url: opts?.video_url?.trim() || null,
        description: opts?.description?.trim() || null,
        created_by: user.id,
      })
      .select('id, name, category, tracking_type, video_url')
      .single()
    if (error) throw error
    revalidatePath('/dashboard/coach/library')
    revalidatePath('/dashboard/athlete/library')
    return { exercise: data }
  } catch (err: any) {
    return { error: err.message || 'Error al crear ejercicio' }
  }
}

export async function updateBlockDescription(blockId: string, description: string) {
  try {
    const { user, role } = await getAuthorizedCoach()
    const supabase = getSupabaseAdmin()
    const { data: block, error: blockErr } = await supabase
      .from('workout_blocks')
      .select('id, workout_days(plan_id)')
      .eq('id', blockId)
      .single()

    if (blockErr) throw blockErr
    const rawDay = block?.workout_days
    const day = Array.isArray(rawDay) ? rawDay[0] : rawDay
    if (!day?.plan_id) throw new Error('No se encontro el plan del bloque')
    await assertCanManagePlan(day.plan_id, user.id, role)

    const { error } = await supabase
      .from('workout_blocks')
      .update({ description })
      .eq('id', blockId)

    if (error) throw error

    revalidatePath('/dashboard/coach/plans')
    revalidatePath('/dashboard/athlete')
    revalidatePath('/dashboard/athlete/workout')
    return { success: true, description }
  } catch (err: any) {
    console.error('Error updating block description:', err)
    return { success: false, error: err.message || 'Failed to update block description' }
  }
}
