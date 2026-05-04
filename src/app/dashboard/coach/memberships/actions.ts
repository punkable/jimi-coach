'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createMembership(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string || '0')
  const defaultClasses = parseInt(formData.get('defaultClasses') as string || '12')

  const { error } = await supabase.from('memberships').insert({
    name,
    description,
    price
  })

  if (error) throw error

  revalidatePath('/dashboard/coach/memberships')
}

export async function updateMembership(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string || '0')

  const { error } = await supabase
    .from('memberships')
    .update({
      name,
      description,
      price,
    })
    .eq('id', id)

  if (error) throw error

  revalidatePath('/dashboard/coach/memberships')
  revalidatePath('/dashboard/coach/athletes')
}

export async function deleteMembership(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('memberships').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
  revalidatePath('/dashboard/coach/memberships')
}
