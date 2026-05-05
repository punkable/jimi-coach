'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Home, TrendingUp, User, LogOut, BookOpen, MessageSquareText } from 'lucide-react'
import { signout } from '@/app/login/actions'

const navItems = [
  { href: '/dashboard/athlete',           icon: Home,              label: 'Hoy',      exact: true  },
  { href: '/dashboard/athlete/library',   icon: BookOpen,          label: 'Técnica',  exact: false },
  { href: '/dashboard/athlete/feedback',  icon: MessageSquareText, label: 'Feedback', exact: false },
  { href: '/dashboard/athlete/progress',  icon: TrendingUp,        label: 'Progreso', exact: false },
  { href: '/dashboard/athlete/profile',   icon: User,              label: 'Perfil',   exact: false },
]

export default function AthleteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isWorkout = pathname.includes('/athlete/workout')

  return (
    <div className={`flex bg-background ${isWorkout ? 'h-[100dvh]' : 'min-h-[100dvh]'}`}>

      {/* ── Desktop Sidebar ── */}
      {!isWorkout && (
        <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-border bg-card">
          <div className="px-5 pt-6 pb-5">
            <Link href="/dashboard/athlete">
              <Image src="/images/logofinal.svg" alt="LDRFIT" width={128} height={36} className="brand-logo" />
            </Link>
            <p className="mt-2 text-[9px] font-black uppercase tracking-[0.3em] text-primary">Athlete Zone</p>
          </div>

          <nav className="flex-1 px-3 space-y-0.5 mt-2">
            {navItems.map(({ href, icon: Icon, label, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 group ${
                    active
                      ? 'bg-primary/12 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                    active ? 'bg-primary/20' : 'group-hover:bg-secondary'
                  }`}>
                    <Icon className={`w-4 h-4 ${active ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                  </div>
                  <span>{label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="px-3 pb-5 pt-3 border-t border-border">
            <form action={signout}>
              <button
                type="submit"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-all w-full"
              >
                <LogOut className="w-4 h-4 stroke-[1.8]" />
                Cerrar sesión
              </button>
            </form>
          </div>
        </aside>
      )}

      {/* ── Content ── */}
      <main className={`flex-1 flex flex-col overflow-hidden ${isWorkout ? '' : 'pb-16 md:pb-0'}`}>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      {!isWorkout && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-2xl border-t border-border"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="h-16 flex items-center justify-around px-1">
            {navItems.map(({ href, icon: Icon, label, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center justify-center gap-1 min-w-[56px] py-1 rounded-xl transition-all duration-200 ${
                    active ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    active ? 'bg-primary/15' : ''
                  }`}>
                    <Icon className={`w-5 h-5 transition-all ${active ? 'stroke-[2.5]' : 'stroke-[1.6]'}`} />
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-wider transition-all ${active ? 'opacity-100' : 'opacity-35'}`}>
                    {label}
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
