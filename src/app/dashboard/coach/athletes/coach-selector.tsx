'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { assignCoachToAthlete } from './actions'
import { toast } from 'sonner'

type Coach = {
  id: string
  full_name: string | null
  email: string
  role: 'admin' | 'coach'
}

export function CoachSelector({
  athleteId,
  currentCoachId,
  coaches,
}: {
  athleteId: string
  currentCoachId: string | null
  coaches: Coach[]
}) {
  const router = useRouter()
  const [value, setValue] = useState<string>(currentCoachId || '')
  const [saving, setSaving] = useState(false)
  const [, startTransition] = useTransition()

  const handleChange = async (newCoachId: string) => {
    setValue(newCoachId)
    setSaving(true)
    try {
      await assignCoachToAthlete(athleteId, newCoachId || null)
      toast.success(newCoachId ? 'Coach asignado' : 'Coach removido')
      startTransition(() => router.refresh())
    } catch (e: any) {
      toast.error(e?.message || 'Error al asignar coach')
      setValue(currentCoachId || '')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        disabled={saving}
        className="w-full h-9 rounded-lg border border-border bg-secondary px-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60 appearance-none pr-8"
      >
        <option value="">— Sin coach —</option>
        {coaches.map((c) => (
          <option key={c.id} value={c.id}>
            {c.full_name || c.email}
          </option>
        ))}
      </select>
      {saving && (
        <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />
      )}
    </div>
  )
}
