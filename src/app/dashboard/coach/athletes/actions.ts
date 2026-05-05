'use server'

import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

async function assertCoachOrAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'coach' && profile?.role !== 'admin') throw new Error('Not authorized')
  return { user, role: profile.role as 'coach' | 'admin' }
}

export async function createAthlete(formData: FormData) {
  await assertCoachOrAdmin()

  const email    = formData.get('email')     as string
  const fullName = formData.get('full_name') as string
  const password = (formData.get('password') as string) || 'LDRFIT2026!'

  const admin = getSupabaseAdmin()
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (authError) throw new Error(authError.message)

  // The trigger creates the profile; enforce athlete role
  await admin.from('profiles').update({ role: 'athlete', full_name: fullName }).eq('id', authData.user.id)

  revalidatePath('/dashboard/coach/athletes')
  redirect('/dashboard/coach/athletes')
}

/**
 * Toggle athlete access: is_archived = true → suspended (sees suspension screen)
 * is_archived = false → active
 */
export async function toggleAthleteAccess(athleteId: string, suspended: boolean) {
  await assertCoachOrAdmin()

  const admin = getSupabaseAdmin()
  const { error } = await admin
    .from('profiles')
    .update({ is_archived: suspended })
    .eq('id', athleteId)

  if (error) throw new Error('Failed to update athlete access')

  revalidatePath('/dashboard/coach/athletes')
  revalidatePath(`/dashboard/coach/athletes/${athleteId}`)
}

/**
 * Soft-delete: hides athlete from all coach views (deleted_at set).
 * Athlete loses access because deleted_at rows are excluded from queries.
 */
export async function deleteAthlete(athleteId: string) {
  await assertCoachOrAdmin()

  const admin = getSupabaseAdmin()
  const { error } = await admin
    .from('profiles')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', athleteId)

  if (error) throw new Error('Failed to archive athlete')
  revalidatePath('/dashboard/coach/athletes')
}

/**
 * Permanently delete athlete from auth (cascades to profiles via FK).
 */
export async function hardDeleteAthlete(athleteId: string) {
  await assertCoachOrAdmin()

  const admin = getSupabaseAdmin()
  const { error } = await admin.auth.admin.deleteUser(athleteId)
  if (error) throw new Error('Failed to permanently delete athlete')
  revalidatePath('/dashboard/coach/athletes')
}

/**
 * Assign a workout plan to an athlete.
 * Replaces any previous assignment to keep one active plan at a time.
 */
export async function assignWorkoutPlan(athleteId: string, planId: string | null) {
  const { user } = await assertCoachOrAdmin()

  const admin = getSupabaseAdmin()

  // Remove existing assignments for this athlete
  await admin.from('assigned_plans').delete().eq('athlete_id', athleteId)

  if (planId && planId !== 'no-plan') {
    const { error } = await admin.from('assigned_plans').insert({
      athlete_id: athleteId,
      plan_id: planId,
      assigned_by: user.id,
      start_date: new Date().toISOString().split('T')[0],
    })
    if (error) throw new Error('Failed to assign plan')
  }

  revalidatePath(`/dashboard/coach/athletes/${athleteId}`)
  revalidatePath('/dashboard/coach/athletes')
  revalidatePath('/dashboard/athlete')
  return { success: true }
}

/**
 * Update athlete role (coach only or admin action).
 */
export async function updateAthleteRole(athleteId: string, role: 'athlete' | 'coach') {
  const { role: callerRole } = await assertCoachOrAdmin()
  if (callerRole !== 'admin') throw new Error('Only admins can change roles')

  const admin = getSupabaseAdmin()
  const { error } = await admin.from('profiles').update({ role }).eq('id', athleteId)
  if (error) throw new Error('Failed to update role')
  revalidatePath('/dashboard/coach/athletes')
  revalidatePath('/dashboard/coach/staff')
}
