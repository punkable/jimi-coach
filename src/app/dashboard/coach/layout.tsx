import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { CoachLayoutClient } from './CoachLayoutClient'
import { redirect } from 'next/navigation'

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Use admin client for role lookup so RLS issues never break access.
  const admin = getSupabaseAdmin()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin' && profile?.role !== 'coach') {
    redirect('/dashboard/athlete')
  }

  return (
    <CoachLayoutClient isAdmin={profile?.role === 'admin'}>
      {children}
    </CoachLayoutClient>
  )
}
