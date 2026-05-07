'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateReviewStatus(feedbackId: string, status: 'pending' | 'done' | 'archived') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await supabase
    .from('workout_feedback')
    .update({
      status,
      reviewed_at: status === 'done' ? new Date().toISOString() : null
    })
    .eq('id', feedbackId)

  revalidatePath('/dashboard/coach/reviews')
}

export async function addPrivateNote(feedbackId: string, notes: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await supabase
    .from('workout_feedback')
    .update({ private_notes: notes })
    .eq('id', feedbackId)

  revalidatePath('/dashboard/coach/reviews')
}

export async function createFeedback(workoutResultId: string, athleteId: string, coachNotes: string = '', status: 'done' | 'archived' = 'done') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await supabase.from('workout_feedback').insert({
    workout_result_id: workoutResultId,
    athlete_id: athleteId,
    coach_id: user.id,
    coach_notes: coachNotes,
    status: status,
    reviewed_at: status === 'done' ? new Date().toISOString() : null
  })

  revalidatePath('/dashboard/coach/reviews')
  revalidatePath('/dashboard/athlete/progress')
}

export async function createInsight(data: {
  athleteId: string | null
  type: string
  title: string
  body: string
  targetValue: number | null
  isPinned: boolean
  expiresAt: string | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await supabase.from('coach_insights').insert({
    coach_id: user.id,
    athlete_id: data.athleteId || null,
    type: data.type,
    title: data.title,
    body: data.body || null,
    target_value: data.targetValue || null,
    is_pinned: data.isPinned,
    expires_at: data.expiresAt || null
  })

  revalidatePath('/dashboard/coach/insights')
  revalidatePath('/dashboard/athlete')
}

export async function archiveInsight(insightId: string) {
  const supabase = await createClient()
  await supabase.from('coach_insights').update({ is_archived: true }).eq('id', insightId)
  revalidatePath('/dashboard/coach/insights')
}

export async function postToFeed(content: string, type: string = 'announcement') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await supabase.from('activity_feed').insert({
    athlete_id: user.id,
    type,
    content
  })

  revalidatePath('/dashboard/athlete/feed')
  revalidatePath('/dashboard/coach')
}

export async function deletePlanDay(dayId: string) {
  const supabase = await createClient()
  await supabase.from('workout_days').delete().eq('id', dayId)
  revalidatePath('/dashboard/coach/plans')
}
