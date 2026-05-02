'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createExercise(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const newExercise = {
    name: formData.get('name') as string,
    category: formData.get('category') as string,
    difficulty_level: formData.get('difficulty_level') as string,
    instructions: formData.get('instructions') as string,
    video_url: formData.get('video_url') as string,
    created_by: user.id
  }

  const { error } = await supabase
    .from('exercises')
    .insert(newExercise)

  if (error) {
    console.error('Error creating exercise:', error)
    throw new Error('Failed to create exercise')
  }

  revalidatePath('/dashboard/coach/library')
  redirect('/dashboard/coach/library')
}

export async function updateExercise(id: string, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const updatedExercise = {
    name: formData.get('name') as string,
    category: formData.get('category') as string,
    difficulty_level: formData.get('difficulty_level') as string,
    instructions: formData.get('instructions') as string,
    video_url: formData.get('video_url') as string,
  }

  const { error } = await supabase
    .from('exercises')
    .update(updatedExercise)
    .eq('id', id)

  if (error) {
    console.error('Error updating exercise:', error)
    throw new Error('Failed to update exercise')
  }

  revalidatePath('/dashboard/coach/library')
  redirect('/dashboard/coach/library')
}

export async function archiveExercise(exerciseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('exercises')
    .update({ is_archived: true })
    .eq('id', exerciseId)

  if (error) {
    console.error('Error archiving exercise:', error)
    throw new Error('Failed to archive exercise')
  }

  revalidatePath('/dashboard/coach/library')
}
