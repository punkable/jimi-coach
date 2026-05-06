'use server'

import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const admin = getSupabaseAdmin()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Not authorized: admin only')
  return { user }
}

export async function registerCoach(formData: FormData) {
  await assertAdmin()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  if (!email || !password || !fullName) {
    throw new Error('Missing fields')
  }

  const supabaseAdmin = getSupabaseAdmin()

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (authError) throw new Error(authError.message)

  const userId = authData.user?.id
  if (userId) {
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'coach', full_name: fullName })
      .eq('id', userId)
    if (profileError) throw new Error(profileError.message)
  }

  revalidatePath('/dashboard/coach/staff')
  redirect('/dashboard/coach/staff?success=true')
}

/**
 * Change a user's role between athlete and coach.
 * Admin role cannot be changed via UI (must be set in DB directly).
 */
export async function changeUserRole(userId: string, newRole: 'athlete' | 'coach') {
  await assertAdmin()

  const admin = getSupabaseAdmin()

  // Don't allow changing admin role
  const { data: target } = await admin.from('profiles').select('role').eq('id', userId).single()
  if (target?.role === 'admin') throw new Error('No se puede cambiar el rol de un admin')

  const { error } = await admin.from('profiles').update({ role: newRole }).eq('id', userId)
  if (error) throw new Error('Failed to change role')

  // If demoting coach to athlete, remove their coach_athletes entries (they're no longer a coach)
  if (newRole === 'athlete') {
    await admin.from('coach_athletes').delete().eq('coach_id', userId)
  }

  revalidatePath('/dashboard/coach/staff')
  revalidatePath('/dashboard/coach/athletes')
}

export async function deleteCoach(coachId: string) {
  await assertAdmin()
  const supabaseAdmin = getSupabaseAdmin()
  const { error } = await supabaseAdmin.auth.admin.deleteUser(coachId)
  if (error) throw error
  revalidatePath('/dashboard/coach/staff')
}
