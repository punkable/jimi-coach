'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Not authorized')
  }
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

  // 1. Create the user in Auth
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
    // 2. Update the profile with the 'coach' role
    // (The handle_new_user trigger might have already created a profile, so we upsert/update)
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

export async function assignAthleteToCoach(formData: FormData) {
  await assertAdmin()

  const coachId = formData.get('coachId') as string
  const athleteId = formData.get('athleteId') as string

  if (!coachId || !athleteId) {
    throw new Error('Missing fields')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const supabaseAdmin = getSupabaseAdmin()
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({ managed_by: coachId })
    .eq('id', athleteId)
    .eq('role', 'athlete')

  if (profileError) throw profileError

  const { error: relationshipError } = await supabaseAdmin
    .from('coach_athletes')
    .upsert({
      coach_id: coachId,
      athlete_id: athleteId,
      assigned_by: user.id,
    })

  if (relationshipError) throw relationshipError

  revalidatePath('/dashboard/coach/staff')
  revalidatePath('/dashboard/coach/athletes')
}
