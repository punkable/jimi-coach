import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { CheckCircle2, ShieldCheck } from 'lucide-react'
import { StaffPageClient } from './staff-page-client'

export const revalidate = 0

export default async function StaffPage(props: { searchParams: Promise<{ success?: string }> }) {
  const searchParams = await props.searchParams
  const isSuccess = searchParams.success === 'true'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use admin client to avoid RLS routing breaks
  const admin = getSupabaseAdmin()
  const { data: meProfile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (meProfile?.role !== 'admin') redirect('/dashboard/coach')

  // Get ALL users (athletes + coaches + admins) so admin can manage all
  const { data: users } = await admin
    .from('profiles')
    .select('id, email, full_name, role, emoji, is_archived, created_at')
    .is('deleted_at', null)
    .order('role', { ascending: true })
    .order('created_at', { ascending: false })

  return (
    <div className="p-4 md:p-6 xl:p-8 space-y-6 max-w-6xl mx-auto">
      <header>
        <p className="section-title text-primary mb-1">Administración</p>
        <h1 className="page-title flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-primary" />
          Gestión de Staff
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Administra coaches, alumnos y promueve usuarios. Solo el admin puede modificar roles.
        </p>
      </header>

      {isSuccess && (
        <div className="ios-panel border-primary/30 bg-primary/10 p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          <p className="text-sm font-bold uppercase tracking-tight text-primary">Coach registrado con éxito.</p>
        </div>
      )}

      <StaffPageClient users={users ?? []} />
    </div>
  )
}
