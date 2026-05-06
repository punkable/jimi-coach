'use server'

import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function assertCoachOrAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'coach' && profile?.role !== 'admin') throw new Error('Not authorized')
  return { user }
}

function cleanVideoUrl(url: string | null): string | null {
  if (!url) return null
  // Remove YouTube tracking suffixes
  return url.split('&pp=')[0].split('&list=')[0].split('&t=')[0]
}

export async function createExercise(formData: FormData) {
  const { user } = await assertCoachOrAdmin()
  const admin = getSupabaseAdmin()

  const newExercise = {
    name: formData.get('name') as string,
    category: formData.get('category') as string,
    difficulty_level: formData.get('difficulty_level') as string,
    instructions: formData.get('instructions') as string || null,
    description: formData.get('description') as string || null,
    video_url: cleanVideoUrl(formData.get('video_url') as string),
    created_by: user.id,
  }

  const { error } = await admin.from('exercises').insert(newExercise)
  if (error) {
    console.error('Error creating exercise:', error)
    throw new Error('Failed to create exercise')
  }

  revalidatePath('/dashboard/coach/library')
  revalidatePath('/dashboard/athlete/library')
  redirect('/dashboard/coach/library')
}

export async function updateExercise(id: string, formData: FormData) {
  await assertCoachOrAdmin()
  const admin = getSupabaseAdmin()

  const updatedExercise = {
    name: formData.get('name') as string,
    category: formData.get('category') as string,
    difficulty_level: formData.get('difficulty_level') as string,
    instructions: formData.get('instructions') as string || null,
    description: formData.get('description') as string || null,
    video_url: cleanVideoUrl(formData.get('video_url') as string),
  }

  const { error } = await admin.from('exercises').update(updatedExercise).eq('id', id)
  if (error) {
    console.error('Error updating exercise:', error)
    throw new Error('Failed to update exercise')
  }

  revalidatePath('/dashboard/coach/library')
  revalidatePath('/dashboard/athlete/library')
  redirect('/dashboard/coach/library')
}

export async function archiveExercise(exerciseId: string) {
  await assertCoachOrAdmin()
  const admin = getSupabaseAdmin()

  const { error } = await admin
    .from('exercises')
    .update({ is_archived: true })
    .eq('id', exerciseId)

  if (error) {
    console.error('Error archiving exercise:', error)
    throw new Error('Failed to archive exercise')
  }

  revalidatePath('/dashboard/coach/library')
  revalidatePath('/dashboard/athlete/library')
}

export async function unarchiveExercise(exerciseId: string) {
  await assertCoachOrAdmin()
  const admin = getSupabaseAdmin()
  const { error } = await admin
    .from('exercises')
    .update({ is_archived: false })
    .eq('id', exerciseId)
  if (error) throw new Error('Failed to unarchive exercise')
  revalidatePath('/dashboard/coach/library')
  revalidatePath('/dashboard/athlete/library')
}

export async function hardDeleteExercise(exerciseId: string) {
  await assertCoachOrAdmin()
  const admin = getSupabaseAdmin()

  // Refuse if the exercise is referenced by any workout movement (preserves training history)
  const { count } = await admin
    .from('workout_movements')
    .select('id', { count: 'exact', head: true })
    .eq('exercise_id', exerciseId)

  if ((count ?? 0) > 0) {
    // Fallback: archive instead of hard delete
    await admin.from('exercises').update({ is_archived: true }).eq('id', exerciseId)
    revalidatePath('/dashboard/coach/library')
    revalidatePath('/dashboard/athlete/library')
    return { archived: true, reason: 'Ejercicio en uso por una rutina; se archivó en su lugar.' }
  }

  const { error } = await admin.from('exercises').delete().eq('id', exerciseId)
  if (error) {
    console.error('Error deleting exercise:', error)
    throw new Error('Failed to delete exercise')
  }

  revalidatePath('/dashboard/coach/library')
  revalidatePath('/dashboard/athlete/library')
  return { deleted: true }
}
