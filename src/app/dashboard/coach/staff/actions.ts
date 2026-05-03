'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// We create an admin client using the service role key to manage users
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function registerCoach(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  if (!email || !password || !fullName) {
    throw new Error('Missing fields')
  }

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
  // Logic to delete or deactivate a coach
  // This would require deleting from auth.users too
  const { error } = await supabaseAdmin.auth.admin.deleteUser(coachId)
  if (error) throw error
  
  revalidatePath('/dashboard/coach/staff')
}
