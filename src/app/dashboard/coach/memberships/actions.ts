'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createMembership(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const benefitsString = formData.get('benefits') as string
  const benefits = benefitsString ? benefitsString.split(',').map(b => b.trim()).filter(b => b) : []

  const newMembership = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    benefits: benefits,
    default_classes: parseInt(formData.get('default_classes') as string) || 12,
    price: parseFloat(formData.get('price') as string) || 0,
  }

  const { error } = await supabase.from('memberships').insert(newMembership)

  if (error) {
    console.error('Error creating membership:', error)
    throw new Error('Failed to create membership')
  }

  revalidatePath('/dashboard/coach/memberships')
}

export async function deleteMembership(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Soft delete
  const { error } = await supabase
    .from('memberships')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error soft deleting membership:', error)
    throw new Error('Failed to delete membership')
  }

  revalidatePath('/dashboard/coach/memberships')
}
