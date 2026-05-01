'use strict'
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitWorkoutResult(workoutDayId: string, rpe: number, notes: string, videoLink: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Insert the result
  const { data: result, error: resultError } = await supabase
    .from('workout_results')
    .insert({
      athlete_id: user.id,
      workout_day_id: workoutDayId,
      completed: true,
      rpe: rpe,
      notes: notes,
      video_link: videoLink || null
    })
    .select('id')
    .single()

  if (resultError) {
    console.error('Error submitting result:', resultError)
    throw new Error('Failed to submit result')
  }

  revalidatePath('/dashboard/athlete')
  revalidatePath('/dashboard/athlete/progress')
  
  return { success: true }
}

export async function updateProfile(fullName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', user.id)

  if (error) {
    console.error('Error updating profile:', error)
    throw new Error('Failed to update profile')
  }

  revalidatePath('/dashboard/athlete', 'layout')
  return { success: true }
}
