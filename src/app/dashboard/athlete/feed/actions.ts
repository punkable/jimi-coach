'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleFistBump(feedEntryId: string, currentlyBumped: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  if (currentlyBumped) {
    await supabase
      .from('fist_bumps')
      .delete()
      .eq('from_athlete_id', user.id)
      .eq('feed_entry_id', feedEntryId)
  } else {
    await supabase
      .from('fist_bumps')
      .insert({ from_athlete_id: user.id, feed_entry_id: feedEntryId })
  }

  revalidatePath('/dashboard/athlete/feed')
}
