import Link from 'next/link'
import { Calendar, Home, Medal, User, MessageSquare, LibraryBig } from 'lucide-react'

export default function AthleteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen pb-16 bg-background">
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      
      <nav className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-16 px-2 sm:px-4 flex items-center justify-around z-50">
        <Link href="/dashboard/athlete" className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors">
          <Home className="h-5 w-5 mb-1" />
          <span className="text-[10px] font-medium hidden sm:block">Hoy</span>
        </Link>
        <Link href="/dashboard/athlete/week" className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors">
          <Calendar className="h-5 w-5 mb-1" />
          <span className="text-[10px] font-medium hidden sm:block">Semana</span>
        </Link>
        <Link href="/dashboard/athlete/library" className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors">
          <LibraryBig className="h-5 w-5 mb-1" />
          <span className="text-[10px] font-medium hidden sm:block">Técnica</span>
        </Link>
        <Link href="/dashboard/athlete/progress" className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors">
          <Medal className="h-5 w-5 mb-1" />
          <span className="text-[10px] font-medium hidden sm:block">Progreso</span>
        </Link>
        <a href="http://wa.me/56972878295" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center text-muted-foreground hover:text-[#25D366] transition-colors">
          <MessageSquare className="h-5 w-5 mb-1" />
          <span className="text-[10px] font-medium hidden sm:block">Coach</span>
        </a>
        <Link href="/dashboard/athlete/profile" className="flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-colors">
          <User className="h-5 w-5 mb-1" />
          <span className="text-[10px] font-medium hidden sm:block">Perfil</span>
        </Link>
      </nav>
    </div>
  )
}
