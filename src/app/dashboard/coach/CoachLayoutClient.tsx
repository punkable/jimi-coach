'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Users, Library, Calendar, LayoutDashboard, Settings, LogOut, Video, Crown, HelpCircle, Target, Activity, ShieldCheck } from 'lucide-react'
import { signout } from '@/app/login/actions'
import { NotificationsBell } from '@/components/notifications-bell'
import { Button } from '@/components/ui/button'

export function CoachLayoutClient({ children, isAdmin }: { children: React.ReactNode, isAdmin: boolean }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border/40 bg-card/40 backdrop-blur-xl">
        <div className="p-8">
            <Link href="/dashboard/coach" className="flex items-center gap-2">
              <Image src="/images/logotipo.png" alt="LDRFIT" width={140} height={40} className="object-contain" />
            </Link>
          <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-2">Coach Panel</p>
        </div>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <NavItem href="/dashboard/coach" icon={LayoutDashboard} label="Dashboard" pathname={pathname} />
          <NavItem href="/dashboard/coach/athletes" icon={Users} label="Alumnos" pathname={pathname} />
          <NavItem href="/dashboard/coach/plans" icon={Calendar} label="Planificaciones" pathname={pathname} />
          <NavItem href="/dashboard/coach/insights" icon={Target} label="Insights" pathname={pathname} />
          <NavItem href="/dashboard/coach/library" icon={Library} label="Biblioteca" pathname={pathname} />
          <NavItem href="/dashboard/coach/memberships" icon={Crown} label="Modalidades" pathname={pathname} />
          <NavItem href="/dashboard/coach/reviews" icon={Video} label="Revisiones" pathname={pathname} />
          <NavItem href="/dashboard/coach/feed" icon={Activity} label="Box Feed" pathname={pathname} />
          
          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-border/10">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 px-3 mb-2">Administración</p>
              <NavItem href="/dashboard/coach/staff" icon={ShieldCheck} label="Gestionar Staff" pathname={pathname} />
            </div>
          )}
        </nav>
        <div className="p-4 border-t border-border/40 space-y-1">
          <NavItem href="/dashboard/coach/settings" icon={Settings} label="Ajustes" variant="ghost" pathname={pathname} />
          <NavItem href="/dashboard/coach/help" icon={HelpCircle} label="Ayuda" variant="ghost" pathname={pathname} />
          <form action={signout}>
            <button type="submit" className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all w-full text-left text-sm font-semibold">
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="h-14 w-full flex items-center justify-between px-4 md:px-8 border-b border-border/30 shrink-0 bg-background/50 backdrop-blur-xl z-40">
          <div className="md:hidden">
            <Image src="/images/isotipo.png" alt="Logo" width={24} height={24} className="opacity-80" />
          </div>
          <div className="flex items-center gap-4">
            <NotificationsBell />
            <form action={signout} className="md:hidden">
              <Button variant="ghost" size="icon" type="submit" className="text-muted-foreground hover:text-destructive">
                <LogOut className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto pb-safe-nav md:pb-0">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-nav-safe border-t border-border/30 bg-background/90 backdrop-blur-xl px-1 flex items-center justify-around z-50 pb-safe">
        <MobileNavItem href="/dashboard/coach" icon={LayoutDashboard} label="Inicio" pathname={pathname} />
        <MobileNavItem href="/dashboard/coach/athletes" icon={Users} label="Alumnos" pathname={pathname} />
        <MobileNavItem href="/dashboard/coach/feed" icon={Activity} label="Feed" pathname={pathname} />
        <MobileNavItem href="/dashboard/coach/plans" icon={Calendar} label="Planes" pathname={pathname} />
        {isAdmin && <MobileNavItem href="/dashboard/coach/staff" icon={ShieldCheck} label="Staff" pathname={pathname} />}
      </nav>
    </div>
  )
}

function NavItem({ href, icon: Icon, label, variant = 'default', pathname }: { href: string, icon: any, label: string, variant?: 'default' | 'ghost', pathname: string }) {
  const isActive = pathname === href || (href !== '/dashboard/coach' && pathname.startsWith(href))
  
  return (
    <Link href={href} className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-sm font-black uppercase tracking-widest ${
      isActive 
        ? 'bg-primary text-primary-foreground shadow-[0_0_20px_rgba(204,255,0,0.2)] scale-[1.02]' 
        : variant === 'default'
          ? 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          : 'text-muted-foreground/60 hover:text-foreground hover:bg-white/5'
    }`}>
      <Icon className={`h-4 w-4 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
      {label}
    </Link>
  )
}

function MobileNavItem({ href, icon: Icon, label, pathname }: { href: string, icon: any, label: string, pathname: string }) {
  const isActive = pathname === href || (href !== '/dashboard/coach' && pathname.startsWith(href))
  
  return (
    <Link href={href} className={`flex flex-col items-center justify-center gap-1.5 min-w-[64px] py-2 transition-all duration-500 relative ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
      {isActive && (
        <div className="absolute -top-1 w-12 h-1 bg-primary rounded-full shadow-[0_0_15px_rgba(204,255,0,0.8)]" />
      )}
      <Icon className={`h-6 w-6 transition-all duration-300 ${isActive ? 'stroke-[2.5] scale-110 drop-shadow-[0_0_8px_rgba(204,255,0,0.4)]' : 'stroke-[1.5]'}`} />
      <span className={`text-[8px] font-black uppercase tracking-[0.15em] transition-all ${isActive ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
    </Link>
  )
}
