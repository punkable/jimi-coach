'use server'

import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Not authorized: admin only')
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
    user_metadata: { full_name: fullName }
  })

  if (authError) {
    console.error('Auth Error:', authError)
    throw new Error(authError.message)
  }

  const userId = authData.user?.id

  if (userId) {
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        role: 'coach',
        full_name: fullName
      })
      .eq('id', userId)

    if (profileError) {
      console.error('Profile Error:', profileError)
      throw new Error(profileError.message)
    }
  }

  revalidatePath('/dashboard/coach/staff')
  redirect('/dashboard/coach/staff?success=true')
}

export async function deleteCoach(coachId: string) {
  await assertAdmin()

  const supabaseAdmin = getSupabaseAdmin()
  const { error } = await supabaseAdmin.auth.admin.deleteUser(coachId)
  if (error) throw error

  revalidatePath('/dashboard/coach/staff')
}
