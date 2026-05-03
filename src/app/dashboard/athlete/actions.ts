'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitWorkoutResult(workoutDayId: string, rpe: number, notes: string, videoLink: string, sets?: any[]) {
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

  if (sets && sets.length > 0) {
    // Strip client-only id field before insert
    const setsToInsert = sets.map(({ id: _id, ...s }) => ({
      ...s,
      workout_result_id: result.id
    }))
    const { error: setsError } = await supabase.from('workout_set_results').insert(setsToInsert)
    if (setsError) {
      console.error('Error saving individual sets:', setsError)
      // Don't throw here, at least the main result was saved
    }
  }

  revalidatePath('/dashboard/athlete')
  revalidatePath('/dashboard/athlete/profile')
  revalidatePath('/dashboard/athlete/progress')
  revalidatePath('/dashboard/coach/reviews')
  
  return { success: true }
}

export async function submitReadiness(sleep: number, stress: number, soreness: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const today = new Date().toISOString().split('T')[0]

  const { error } = await supabase
    .from('daily_readiness')
    .upsert({
      athlete_id: user.id,
      date: today,
      sleep_quality: sleep,
      stress_level: stress,
      soreness: soreness
    }, {
      onConflict: 'athlete_id, date'
    })

  if (error) {
    console.error('Error saving readiness:', error)
    throw new Error('Failed to save readiness')
  }

  revalidatePath('/dashboard/athlete')
  return { success: true }
}

export async function updateProfile(data: {
  fullName: string,
  phone: string,
  bio: string,
  weight: number | null,
  height: number | null,
  snatchRm: number | null,
  shirtSize: string,
  birthDate: string | null,
  emoji?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('profiles')
    .update({ 
      full_name: data.fullName,
      phone_number: data.phone,
      bio: data.bio,
      weight_kg: data.weight,
      height_cm: data.height,
      snatch_rm: data.snatchRm,
      shirt_size: data.shirtSize,
      birth_date: data.birthDate,
      emoji: data.emoji
    })
    .eq('id', user.id)

  if (error) {
    console.error('Error updating profile:', error)
    throw new Error('Failed to update profile')
  }

  revalidatePath('/dashboard/athlete', 'layout')
  revalidatePath('/dashboard/athlete/ranking')
  return { success: true }
}
