'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Home, TrendingUp, User, LogOut, BookOpen, MessageSquareText } from 'lucide-react'
import { signout } from '@/app/login/actions'

const navItems = [
  { href: '/dashboard/athlete', icon: Home, label: 'Hoy', exact: true },
  { href: '/dashboard/athlete/library', icon: BookOpen, label: 'Técnica', exact: false },
  { href: '/dashboard/athlete/feedback', icon: MessageSquareText, label: 'Feedback', exact: false },
  { href: '/dashboard/athlete/progress', icon: TrendingUp, label: 'Progreso', exact: false },
  { href: '/dashboard/athlete/profile', icon: User, label: 'Perfil', exact: false },
]

export default function AthleteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isWorkout = pathname.includes('/athlete/workout')

  return (
    // Use 100dvh for mobile browsers; avoid 100vh which ignores browser chrome
    <div className={`flex bg-background ${isWorkout ? 'h-[100dvh]' : 'min-h-[100dvh]'}`}>
      {/* Sidebar for Desktop — hidden during workout or on mobile */}
      {!isWorkout && (
        <aside className="hidden md:flex flex-col w-64 border-r border-border/40 bg-card/40 backdrop-blur-xl shrink-0">
          <div className="p-8">
            <Link href="/dashboard/athlete" className="flex items-center gap-2">
              <Image src="/images/logofinal.svg" alt="LDRFIT" width={148} height={42} className="brand-logo hidden md:block" />
              <Image src="/images/isotipo.svg" alt="LDRFIT" width={34} height={34} className="brand-logo md:hidden" />
            </Link>
          </div>
          <nav className="flex-1 px-4 space-y-2 mt-4">
            {navItems.map(({ href, icon: Icon, label, exact }) => {
              const isActive = exact ? pathname === href : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-sm font-black uppercase tracking-widest ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-[0_0_20px_rgba(204,255,0,0.2)] scale-[1.02]' 
                      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
                  {label}
                </Link>
              )
            })}
          </nav>
          
          <div className="p-4 border-t border-border/10">
            <form action={signout}>
              <button
                type="submit"
                className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-destructive hover:bg-destructive/10 transition-all"
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </button>
            </form>
          </div>
        </aside>
      )}

      <main className={`flex-1 flex flex-col relative overflow-hidden ${isWorkout ? '' : 'pb-16 md:pb-0'}`}>
        <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_50%_0%,rgba(204,255,0,0.05)_0%,transparent_50%)]">
          {children}
        </div>
      </main>

      {/* Bottom Nav — hidden during workout or on desktop */}
      {!isWorkout && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-2xl border-t border-white/5"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="h-20 flex items-center justify-around px-4">
            {navItems.map(({ href, icon: Icon, label, exact }) => {
              const isActive = exact ? pathname === href : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center justify-center gap-1.5 px-2 py-2 transition-all duration-500 min-w-[58px] relative ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {isActive && (
                    <div className="absolute -top-1 w-12 h-1 bg-primary rounded-full shadow-[0_0_15px_rgba(204,255,0,0.8)]" />
                  )}
                  <Icon className={`h-6 w-6 transition-all duration-300 ${isActive ? 'stroke-[2.5] scale-110 drop-shadow-[0_0_8px_rgba(204,255,0,0.4)]' : 'stroke-[1.5]'}`} />
                  <span className={`text-[7px] font-black uppercase tracking-[0.08em] transition-all ${isActive ? 'opacity-100' : 'opacity-40'}`}>
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
