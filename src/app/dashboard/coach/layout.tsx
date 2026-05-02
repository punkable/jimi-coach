import Link from 'next/link'
import Image from 'next/image'
import { Users, Library, Calendar, LayoutDashboard, Settings, Dumbbell, LogOut, Video, Crown, Trash2, HelpCircle } from 'lucide-react'
import { signout } from '@/app/login/actions'
import { NotificationsBell } from '@/components/notifications-bell'

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar for Desktop / Hidden on Mobile */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card">
        <div className="p-6">
          <Link href="/dashboard/coach">
            <Image src="/images/logo.png" alt="Jimi.coach Logo" width={160} height={50} className="object-contain mb-2 hover:opacity-80 transition-opacity" />
          </Link>
          <p className="text-sm text-muted-foreground font-medium">Panel de Entrenador</p>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Link href="/dashboard/coach" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary/50 text-foreground transition-colors">
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </Link>
          <Link href="/dashboard/coach/athletes" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <Users className="h-5 w-5" />
            Alumnos
          </Link>
          <Link href="/dashboard/coach/memberships" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <Crown className="h-5 w-5" />
            Planes & Modalidades
          </Link>
          <Link href="/dashboard/coach/reviews" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <Video className="h-5 w-5" />
            Revisiones
          </Link>
          <Link href="/dashboard/coach/plans" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <Calendar className="h-5 w-5" />
            Planificaciones
          </Link>
          <Link href="/dashboard/coach/library" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <Library className="h-5 w-5" />
            Biblioteca
          </Link>
        </nav>
        <div className="p-4 border-t border-border space-y-2">
          <Link href="/dashboard/coach/help" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <HelpCircle className="h-5 w-5" />
            Ayuda y Guías
          </Link>
          <Link href="/dashboard/coach/trash" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <Trash2 className="h-5 w-5" />
            Papelera
          </Link>
          <Link href="/dashboard/coach/settings" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <Settings className="h-5 w-5" />
            Ajustes
          </Link>
          <form action={signout}>
            <button type="submit" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors w-full text-left">
              <LogOut className="h-5 w-5" />
              Salir
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Navbar for Notifications and Actions */}
        <div className="h-16 w-full flex items-center justify-end px-4 md:px-8 border-b border-border/50 shrink-0 bg-background/50 backdrop-blur-sm z-40">
          <NotificationsBell />
        </div>
        
        <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-16 px-4 flex items-center justify-around z-50">
        <Link href="/dashboard/coach" className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors">
          <LayoutDashboard className="h-5 w-5 mb-1" />
          <span className="text-[10px] font-medium">Inicio</span>
        </Link>
        <Link href="/dashboard/coach/athletes" className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors">
          <Users className="h-5 w-5 mb-1" />
          <span className="text-[10px] font-medium">Alumnos</span>
        </Link>
        <Link href="/dashboard/coach/plans" className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors">
          <Calendar className="h-5 w-5 mb-1" />
          <span className="text-[10px] font-medium">Planes</span>
        </Link>
        <Link href="/dashboard/coach/reviews" className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors">
          <Video className="h-5 w-5 mb-1" />
          <span className="text-[10px] font-medium">Review</span>
        </Link>
        <Link href="/dashboard/coach/library" className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors">
          <Library className="h-5 w-5 mb-1" />
          <span className="text-[10px] font-medium">Librería</span>
        </Link>
      </nav>
    </div>
  )
}
