'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Home, TrendingUp, User, Users, LogOut } from 'lucide-react'
import { signout } from '@/app/login/actions'

const navItems = [
  { href: '/dashboard/athlete', icon: Home, label: 'Hoy', exact: true },
  { href: '/dashboard/athlete/feed', icon: Users, label: 'Actividad', exact: false },
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
              <Image src="/images/logotipo.png" alt="LDRFIT" width={140} height={40} className="object-contain hidden md:block" />
              <Image src="/images/isotipo.png" alt="L" width={32} height={32} className="object-contain md:hidden" />
            </Link>
          </div>
          <nav className="flex-1 px-4 space-y-1">
            {navItems.map(({ href, icon: Icon, label, exact }) => {
              const isActive = exact ? pathname === href : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-semibold ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              )
            })}
          </nav>
          
          <div className="p-4 border-t border-border/40">
            <form action={signout}>
              <button
                type="submit"
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10 transition-all"
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </button>
            </form>
          </div>
        </aside>
      )}

      <main className={`flex-1 flex flex-col relative overflow-hidden ${isWorkout ? '' : 'pb-16 md:pb-0'}`}>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>

      {/* Bottom Nav — hidden during workout or on desktop */}
      {!isWorkout && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border/30"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="h-16 flex items-center justify-around px-2">
            {navItems.map(({ href, icon: Icon, label, exact }) => {
              const isActive = exact ? pathname === href : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-300 min-w-[64px] nav-glow ${
                    isActive ? 'text-primary active' : 'text-muted-foreground'
                  }`}
                >
                  <Icon className={`h-6 w-6 transition-all duration-300 ${isActive ? 'stroke-[2.5] scale-110' : 'stroke-[1.75]'}`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest mt-1 transition-all ${isActive ? 'opacity-100 scale-90' : 'opacity-40'}`}>
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
