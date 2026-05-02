'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, Home, Medal, User, MessageSquare, LibraryBig } from 'lucide-react'

const navItems = [
  { href: '/dashboard/athlete', icon: Home, label: 'Hoy' },
  { href: '/dashboard/athlete/week', icon: Calendar, label: 'Semana' },
  { href: '/dashboard/athlete/library', icon: LibraryBig, label: 'Técnica' },
  { href: '/dashboard/athlete/progress', icon: Medal, label: 'Progreso' },
  { href: '/dashboard/athlete/profile', icon: User, label: 'Perfil' },
]

export default function AthleteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const isWorkout = pathname.startsWith('/dashboard/athlete/workout')

  return (
    <div className={`flex flex-col min-h-screen ${isWorkout ? '' : 'pb-20'} bg-background`}>
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {!isWorkout && (<nav className="fixed bottom-0 left-0 right-0 z-50">
        {/* Blur backdrop */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-t border-border/30" />
        <div className="relative flex items-center justify-around h-16 px-1 max-w-lg mx-auto">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = href === '/dashboard/athlete'
              ? pathname === href
              : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[52px] ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className={`relative transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                  <Icon className={`h-5 w-5 transition-all ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.75px]'}`} />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </div>
                <span className={`text-[10px] font-medium transition-all ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>)}
    </div>
  )
}
