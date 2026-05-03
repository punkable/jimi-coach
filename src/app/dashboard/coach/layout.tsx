'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Users, Library, Calendar, LayoutDashboard, Settings, LogOut, Video, Crown, HelpCircle, Target } from 'lucide-react'
import { signout } from '@/app/login/actions'
import { NotificationsBell } from '@/components/notifications-bell'

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border/40 bg-card/40 backdrop-blur-xl">
        <div className="p-8">
          <Link href="/dashboard/coach">
            <Image src="/images/logo.png" alt="Jimi.coach Logo" width={140} height={40} className="object-contain mb-1 hover:opacity-80 transition-opacity" />
          </Link>
          <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-2">Coach Panel</p>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <NavItem href="/dashboard/coach" icon={LayoutDashboard} label="Dashboard" />
          <NavItem href="/dashboard/coach/athletes" icon={Users} label="Alumnos" />
          <NavItem href="/dashboard/coach/plans" icon={Calendar} label="Planificaciones" />
          <NavItem href="/dashboard/coach/insights" icon={Target} label="Insights" />
          <NavItem href="/dashboard/coach/library" icon={Library} label="Biblioteca" />
          <NavItem href="/dashboard/coach/reviews" icon={Video} label="Revisiones" />
          <NavItem href="/dashboard/coach/feed" icon={Activity} label="Box Feed" />
          <NavItem href="/dashboard/coach/memberships" icon={Crown} label="Membresías" />
        </nav>
        <div className="p-4 border-t border-border/40 space-y-1">
          <NavItem href="/dashboard/coach/settings" icon={Settings} label="Ajustes" variant="ghost" />
          <NavItem href="/dashboard/coach/help" icon={HelpCircle} label="Ayuda" variant="ghost" />
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
        <MobileNavItem href="/dashboard/coach" icon={LayoutDashboard} label="Inicio" />
        <MobileNavItem href="/dashboard/coach/athletes" icon={Users} label="Alumnos" />
        <MobileNavItem href="/dashboard/coach/insights" icon={Target} label="Insights" />
        <MobileNavItem href="/dashboard/coach/feed" icon={Activity} label="Feed" />
        <MobileNavItem href="/dashboard/coach/plans" icon={Calendar} label="Planes" />
      </nav>
    </div>
  )
}

function NavItem({ href, icon: Icon, label, variant = 'default' }: { href: string, icon: any, label: string, variant?: 'default' | 'ghost' }) {
  return (
    <Link href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-semibold ${
      variant === 'default'
        ? 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
        : 'text-muted-foreground/60 hover:text-foreground hover:bg-secondary/30'
    }`}>
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  )
}

function MobileNavItem({ href, icon: Icon, label }: { href: string, icon: any, label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center justify-center gap-0.5 min-w-[50px] py-2 text-muted-foreground hover:text-primary transition-colors">
      <Icon className="h-5 w-5" />
      <span className="text-[9px] font-bold uppercase tracking-tighter">{label}</span>
    </Link>
  )
}
