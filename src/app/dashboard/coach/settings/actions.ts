'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateCoachProfile(data: {
  fullName: string
  phone?: string
  bio?: string
  specialty?: string
  certifications?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: data.fullName,
      phone_number: data.phone ?? null,
      bio: data.bio ?? null,
      specialty: data.specialty ?? null,
      certifications: data.certifications ?? null,
    })
    .eq('id', user.id)

  if (error) {
    console.error('Error updating coach profile:', error)
    throw new Error('Failed to update profile')
  }

  revalidatePath('/dashboard/coach', 'layout')
  return { success: true }
}
