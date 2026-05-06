'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Users, Library, Calendar, LayoutDashboard,
  Settings, LogOut, Video, Crown, HelpCircle,
  Target, Activity, ShieldCheck, ChevronRight, Wrench,
} from 'lucide-react'
import { signout } from '@/app/login/actions'
import { NotificationsBell } from '@/components/notifications-bell'

const mainNav = [
  { href: '/dashboard/coach',            icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/dashboard/coach/athletes',   icon: Users,           label: 'Alumnos'   },
  { href: '/dashboard/coach/plans',      icon: Calendar,        label: 'Programación' },
  { href: '/dashboard/coach/insights',   icon: Target,          label: 'Insights'  },
  { href: '/dashboard/coach/library',    icon: Library,         label: 'Biblioteca'},
  { href: '/dashboard/coach/memberships',icon: Crown,           label: 'Modalidades'},
  { href: '/dashboard/coach/reviews',    icon: Video,           label: 'Revisiones'},
  { href: '/dashboard/coach/feed',       icon: Activity,        label: 'Box Feed'  },
  { href: '/dashboard/coach/tools',      icon: Wrench,          label: 'Herramientas'},
]

const bottomNav = [
  { href: '/dashboard/coach',          icon: LayoutDashboard, label: 'Inicio',   exact: true },
  { href: '/dashboard/coach/athletes', icon: Users,           label: 'Alumnos'   },
  { href: '/dashboard/coach/plans',    icon: Calendar,        label: 'Programa'  },
  { href: '/dashboard/coach/feed',     icon: Activity,        label: 'Feed'      },
]

export function CoachLayoutClient({ children, isAdmin }: { children: React.ReactNode; isAdmin: boolean }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen bg-background">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-border bg-card">

        {/* Brand */}
        <div className="px-5 pt-6 pb-5">
          <Link href="/dashboard/coach" className="flex items-center gap-2 group">
            <Image src="/images/logofinal.svg" alt="LDRFIT" width={130} height={37} className="brand-logo" />
          </Link>
          <div className="mt-2.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Coach Studio</span>
          </div>
        </div>

        {/* Main nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {mainNav.map(({ href, icon: Icon, label, exact }) => {
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
                {active && <ChevronRight className="ml-auto w-3.5 h-3.5 opacity-40" />}
              </Link>
            )
          })}

          {isAdmin && (
            <>
              <div className="pt-4 pb-1 px-3">
                <span className="section-title">Administración</span>
              </div>
              <Link
                href="/dashboard/coach/staff"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 group ${
                  pathname.startsWith('/dashboard/coach/staff')
                    ? 'bg-primary/12 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  pathname.startsWith('/dashboard/coach/staff') ? 'bg-primary/20' : ''
                }`}>
                  <ShieldCheck className="w-4 h-4 stroke-[1.8]" />
                </div>
                <span>Gestionar Staff</span>
              </Link>
            </>
          )}
        </nav>

        {/* Bottom links */}
        <div className="px-3 pb-4 pt-3 border-t border-border space-y-0.5">
          {[
            { href: '/dashboard/coach/settings', icon: Settings,    label: 'Ajustes' },
            { href: '/dashboard/coach/help',      icon: HelpCircle,  label: 'Ayuda'   },
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <Icon className="w-4 h-4 stroke-[1.8] shrink-0" />
              {label}
            </Link>
          ))}
          <form action={signout}>
            <button
              type="submit"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-all w-full"
            >
              <LogOut className="w-4 h-4 stroke-[1.8] shrink-0" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">

        {/* Topbar */}
        <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-border bg-card/80 backdrop-blur-xl shrink-0 z-40">
          {/* Mobile logo */}
          <div className="md:hidden">
            <Image src="/images/isotipoblanco.svg" alt="LDRFIT" width={26} height={26} className="brand-logo" />
          </div>
          {/* Desktop breadcrumb placeholder */}
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            <NotificationsBell />
            <form action={signout} className="md:hidden">
              <button type="submit" className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-all">
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </form>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-safe-nav md:pb-0">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-2xl border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="h-16 flex items-center justify-around px-2">
          {bottomNav.map(({ href, icon: Icon, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-1 min-w-[60px] py-1 rounded-xl transition-all duration-200 ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  active ? 'bg-primary/15' : 'hover:bg-secondary'
                }`}>
                  <Icon className={`w-5 h-5 transition-all ${active ? 'stroke-[2.5]' : 'stroke-[1.6]'}`} />
                </div>
                <span className={`text-[9px] font-black uppercase tracking-wider transition-all ${active ? 'opacity-100' : 'opacity-40'}`}>
                  {label}
                </span>
              </Link>
            )
          })}
          {isAdmin && (
            <Link
              href="/dashboard/coach/staff"
              className={`flex flex-col items-center justify-center gap-1 min-w-[60px] py-1 rounded-xl transition-all duration-200 ${
                pathname.startsWith('/dashboard/coach/staff') ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                pathname.startsWith('/dashboard/coach/staff') ? 'bg-primary/15' : 'hover:bg-secondary'
              }`}>
                <ShieldCheck className="w-5 h-5 stroke-[1.6]" />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-wider ${pathname.startsWith('/dashboard/coach/staff') ? 'opacity-100' : 'opacity-40'}`}>Staff</span>
            </Link>
          )}
        </div>
      </nav>
    </div>
  )
}
