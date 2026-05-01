'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

export async function restoreItem(table: string, id: string) {
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabaseAdmin
    .from(table)
    .update({ deleted_at: null })
    .eq('id', id)

  if (error) {
    console.error(`Error restoring item in ${table}:`, error)
    throw new Error('Failed to restore item')
  }

  revalidatePath('/dashboard/coach/trash')
  revalidatePath(`/dashboard/coach/${table === 'profiles' ? 'athletes' : table === 'workout_plans' ? 'plans' : table === 'exercises' ? 'library' : 'memberships'}`)
}

export async function permanentlyDeleteItem(table: string, id: string) {
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Use delete instead of soft delete
  const { error } = await supabaseAdmin
    .from(table)
    .delete()
    .eq('id', id)

  if (error) {
    console.error(`Error deleting item in ${table}:`, error)
    throw new Error('Failed to permanently delete item')
  }

  revalidatePath('/dashboard/coach/trash')
}
