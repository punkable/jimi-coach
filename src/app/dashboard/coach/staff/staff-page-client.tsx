'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  UserPlus, Users, ShieldCheck, ChevronUp, ChevronDown, Crown, Loader2,
  Search, UserCheck,
} from 'lucide-react'
import { changeUserRole, registerCoach } from './actions'
import { toast } from 'sonner'

type UserRow = {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'coach' | 'athlete'
  emoji: string | null
  is_archived: boolean
  created_at: string
}

const ROLE_META: Record<string, { label: string; color: string; icon: any }> = {
  admin:   { label: 'Admin',   color: 'text-amber-400 bg-amber-500/10 border-amber-500/25', icon: Crown },
  coach:   { label: 'Coach',   color: 'text-primary bg-primary/10 border-primary/25',         icon: ShieldCheck },
  athlete: { label: 'Alumno',  color: 'text-muted-foreground bg-secondary border-border',    icon: Users },
}

export function StaffPageClient({ users }: { users: UserRow[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'admin' | 'coach' | 'athlete'>('all')
  const [search, setSearch] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const filtered = users.filter((u) => {
    if (filter !== 'all' && u.role !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return (u.email?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q))
    }
    return true
  })

  const handleRoleChange = async (userId: string, newRole: 'athlete' | 'coach') => {
    setPendingId(userId)
    try {
      await changeUserRole(userId, newRole)
      toast.success(`Rol actualizado a ${newRole === 'coach' ? 'Coach' : 'Alumno'}`)
      startTransition(() => router.refresh())
    } catch (e: any) {
      toast.error(e?.message || 'Error al cambiar rol')
    } finally {
      setPendingId(null)
    }
  }

  const counts = {
    admin: users.filter((u) => u.role === 'admin').length,
    coach: users.filter((u) => u.role === 'coach').length,
    athlete: users.filter((u) => u.role === 'athlete').length,
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {(['admin', 'coach', 'athlete'] as const).map((r) => {
          const meta = ROLE_META[r]
          const Icon = meta.icon
          return (
            <button
              key={r}
              onClick={() => setFilter(filter === r ? 'all' : r)}
              className={`ios-panel p-4 text-center transition-all ${
                filter === r ? 'ring-2 ring-primary/40 border-primary/40' : ''
              }`}
            >
              <Icon className={`w-4 h-4 mx-auto mb-1.5 ${meta.color.split(' ')[0]}`} />
              <p className="text-2xl font-black tabular-nums">{counts[r]}</p>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-wider mt-1">
                {meta.label}{counts[r] !== 1 ? 's' : ''}
              </p>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* Register coach (left) */}
        <div className="ios-panel p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-4 h-4 text-primary" />
            <p className="section-title">Crear Coach nuevo</p>
          </div>
          <form action={registerCoach} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Nombre completo
              </Label>
              <Input id="fullName" name="fullName" placeholder="Juan Pérez" required className="h-10 rounded-xl text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Email
              </Label>
              <Input id="email" name="email" type="email" placeholder="coach@ldrfit.com" required className="h-10 rounded-xl text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Contraseña temporal
              </Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" required className="h-10 rounded-xl text-sm" />
            </div>
            <Button type="submit" className="w-full h-10 rounded-xl font-black uppercase tracking-widest text-xs gap-2">
              <UserPlus className="w-3.5 h-3.5" /> Registrar
            </Button>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Para promover un usuario existente a coach, usa el botón "Hacer coach" en la lista.
            </p>
          </form>
        </div>

        {/* Users list (right) */}
        <div className="lg:col-span-2 space-y-3">
          {/* Search */}
          <div className="ios-panel p-3 flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground ml-2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="flex-1 bg-transparent text-sm font-medium placeholder:text-muted-foreground focus:outline-none"
            />
          </div>

          {/* List */}
          {filtered.length > 0 ? (
            <div className="space-y-2">
              {filtered.map((u) => {
                const meta = ROLE_META[u.role]
                const Icon = meta.icon
                return (
                  <div key={u.id} className="ios-panel p-4 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center text-xl shrink-0">
                      {u.emoji || '👤'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black uppercase text-sm tracking-tight truncate">
                          {u.full_name || u.email.split('@')[0]}
                        </p>
                        <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${meta.color}`}>
                          <Icon className="w-2.5 h-2.5" />
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{u.email}</p>
                    </div>

                    {u.role === 'admin' ? (
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider px-2.5 py-1.5 rounded-lg bg-secondary border border-border shrink-0">
                        Bloqueado
                      </span>
                    ) : u.role === 'athlete' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest gap-1 shrink-0 border-primary/30 text-primary hover:bg-primary/10"
                        disabled={pendingId === u.id}
                        onClick={() => handleRoleChange(u.id, 'coach')}
                      >
                        {pendingId === u.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <ChevronUp className="w-3 h-3" />
                        )}
                        Hacer coach
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest gap-1 shrink-0 hover:border-orange-400/30 hover:text-orange-400"
                        disabled={pendingId === u.id}
                        onClick={() => handleRoleChange(u.id, 'athlete')}
                      >
                        {pendingId === u.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                        Pasar a alumno
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="ios-panel p-10 text-center">
              <UserCheck className="w-8 h-8 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No hay usuarios con este filtro.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
