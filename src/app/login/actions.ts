'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in a real app you should validate with zod
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const fullName = formData.get('full_name') as string
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: {
        full_name: fullName,
        // Only allow athletes to sign up via the UI for security
        role: 'athlete'
      }
    }
  }

  const { data: authData, error } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message }
  }

  // Update additional profile data immediately using admin client
  if (authData?.user) {
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Auto-confirm email to bypass Supabase strict email confirmation settings
    await supabaseAdmin.auth.admin.updateUserById(authData.user.id, {
      email_confirm: true
    })
    
    await supabaseAdmin.from('profiles').update({
      weight_kg: parseFloat(formData.get('weight_kg') as string) || null,
      height_cm: parseFloat(formData.get('height_cm') as string) || null,
      birth_date: formData.get('birth_date') as string || null,
      snatch_rm: parseFloat(formData.get('snatch_rm') as string) || null,
      shirt_size: formData.get('shirt_size') as string || null,
      bio: formData.get('bio') as string || null,
    }).eq('id', authData.user.id)

    // Log the user in automatically after auto-confirming
    await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    })
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
