'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, Home, Medal, User, Users } from 'lucide-react'

const navItems = [
  { href: '/dashboard/athlete', icon: Home, label: 'Hoy', exact: true },
  { href: '/dashboard/athlete/week', icon: Calendar, label: 'Semana', exact: false },
  { href: '/dashboard/athlete/feed', icon: Users, label: 'Box', exact: false },
  { href: '/dashboard/athlete/progress', icon: Medal, label: 'Progreso', exact: false },
  { href: '/dashboard/athlete/profile', icon: User, label: 'Perfil', exact: false },
]

export default function AthleteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isWorkout = pathname.includes('/athlete/workout')

  return (
    // Use 100dvh for mobile browsers; avoid 100vh which ignores browser chrome
    <div className={`flex flex-col bg-background ${isWorkout ? 'h-[100dvh]' : 'min-h-[100dvh] pb-nav-safe'}`}>
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Bottom Nav — hidden during workout */}
      {!isWorkout && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-border/30"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="h-16 flex items-center justify-around px-2 max-w-lg mx-auto">
            {navItems.map(({ href, icon: Icon, label, exact }) => {
              const isActive = exact ? pathname === href : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 min-w-[52px] ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <div className="relative">
                    <Icon className={`h-[22px] w-[22px] transition-all duration-200 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
                    {isActive && (
                      <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold mt-1 transition-opacity ${isActive ? 'opacity-100' : 'opacity-50'}`}>
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
