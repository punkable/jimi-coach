'use strict'
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateCoachProfile(fullName: string) {
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

  revalidatePath('/dashboard/coach', 'layout')
  return { success: true }
}
