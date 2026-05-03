import { createClient } from '@/lib/supabase/server'
import { CoachLayoutClient } from './CoachLayoutClient'
import { redirect } from 'next/navigation'

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Only admins and coaches can access this layout
  if (profile?.role !== 'admin' && profile?.role !== 'coach') {
    redirect('/dashboard/athlete')
  }

  return (
    <CoachLayoutClient isAdmin={profile?.role === 'admin'}>
      {children}
    </CoachLayoutClient>
  )
}
