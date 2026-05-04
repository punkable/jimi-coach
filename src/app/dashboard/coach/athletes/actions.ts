'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createAthlete(formData: FormData) {
  const supabase = await createClient()

  // Verify the caller is an authenticated coach
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
    
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'coach' && profile?.role !== 'admin') {
    throw new Error('Not authorized')
  }

  const email = formData.get('email') as string
  const fullName = formData.get('full_name') as string
  const password = formData.get('password') as string || 'JimiCoach2026!' // Default password if not provided

  // Use the admin client to bypass RLS and create a user directly
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  })

  if (authError) {
    console.error('Error creating athlete auth:', authError)
    throw new Error(authError.message)
  }

  // Ensure their profile is explicitly an athlete (the trigger does this, but we enforce it here)
  await supabaseAdmin.from('profiles').update({ role: 'athlete' }).eq('id', authData.user.id)

  revalidatePath('/dashboard/coach/athletes')
  redirect('/dashboard/coach/athletes')
}

export async function updateAthleteSubscription(athleteId: string, plan: string, totalClasses: number, classesUsed: number) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'coach' && profile?.role !== 'admin') {
    throw new Error('Not authorized')
  }

  // Use the admin client to bypass RLS for updating another user's profile
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ 
      subscription_plan: plan,
      total_classes: totalClasses,
      classes_used: classesUsed
    })
    .eq('id', athleteId)

  if (error) {
    console.error('Error updating subscription:', error)
    throw new Error('Failed to update subscription')
  }

  revalidatePath(`/dashboard/coach/athletes/${athleteId}`)
  revalidatePath('/dashboard/coach/athletes')
  return { success: true }
}

export async function deleteAthlete(athleteId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Verify authorization
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'coach' && profile?.role !== 'admin') {
    throw new Error('Not authorized')
  }

  // Use the admin client to bypass RLS for updating another user's profile
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Soft delete athlete
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', athleteId)

  if (error) {
    console.error('Error soft deleting athlete:', error)
    throw new Error('Failed to archive athlete')
  }

  revalidatePath('/dashboard/coach/athletes')
}

export async function hardDeleteAthlete(athleteId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Verify authorization
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'coach' && profile?.role !== 'admin') {
    throw new Error('Not authorized')
  }

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Hard delete from auth.users (cascades to profiles)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(athleteId)

  if (error) {
    console.error('Error hard deleting athlete:', error)
    throw new Error('Failed to permanently delete athlete')
  }

  revalidatePath('/dashboard/coach/athletes')
}

export async function assignWorkoutPlan(athleteId: string, planId: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  if (!planId || planId === 'no-plan') {
    await supabase.from('assigned_plans').delete().eq('athlete_id', athleteId)
    revalidatePath(`/dashboard/coach/athletes/${athleteId}`)
    revalidatePath('/dashboard/athlete')
    return { success: true }
  }

  // Check if already assigned
  const { data: existing } = await supabase
    .from('assigned_plans')
    .select('id')
    .eq('athlete_id', athleteId)
    .eq('plan_id', planId)
    .single()

  if (existing) return { success: true }

  const { error } = await supabase
    .from('assigned_plans')
    .insert({
      athlete_id: athleteId,
      plan_id: planId,
      assigned_by: user.id,
      start_date: new Date().toISOString().split('T')[0]
    })

  if (error) throw error

  revalidatePath(`/dashboard/coach/athletes/${athleteId}`)
  revalidatePath('/dashboard/athlete')
  return { success: true }
}
