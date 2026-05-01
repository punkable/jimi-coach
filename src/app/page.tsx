import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight, Video, Target, TrendingUp, MessageCircle } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/logo.png" alt="Jimi.coach Logo" width={140} height={40} className="object-contain dark:invert" />
          </Link>
          <Link href="/login">
            <Button variant="outline" className="font-medium hover:bg-primary hover:text-primary-foreground transition-colors">Iniciar Sesión 🏋️‍♂️</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 bg-grid-white/[0.02] relative overflow-hidden">
        {/* Abstract background blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s' }} />

        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary font-medium mb-4 shadow-sm">
            🚀 Bienvenido a la experiencia Ultimate Coaching
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-foreground drop-shadow-sm">
            Entrenamiento de élite, <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
              resultados reales. 🔥
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Jimi.coach es tu casa de entrenamiento CrossFit. 
            Recibe tu planificación estructurada, registra tu esfuerzo real (RPE) y sube videos para obtener feedback técnico directo del Coach Jimi. 💪✨
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                Entrar a mi cuenta <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 max-w-5xl mx-auto w-full text-left relative z-10">
          <div className="p-6 rounded-2xl glass border border-border/50 hover:border-primary/50 transition-colors shadow-lg">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 text-primary">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Planificación Inteligente 🧠</h3>
            <p className="text-muted-foreground">Mesociclos estructurados por semanas para asegurar que tu progresión nunca se detenga.</p>
          </div>
          <div className="p-6 rounded-2xl glass border border-border/50 hover:border-primary/50 transition-colors shadow-lg">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 text-primary">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Análisis de Video 📹</h3>
            <p className="text-muted-foreground">Sube enlaces de tus levantamientos pesados y recibe correcciones técnicas directas para mejorar tu forma.</p>
          </div>
          <div className="p-6 rounded-2xl glass border border-border/50 hover:border-primary/50 transition-colors shadow-lg">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4 text-primary">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-2">Tracking de Esfuerzo 📈</h3>
            <p className="text-muted-foreground">Registra tu RPE diario y mantén un historial de tu progreso para ajustar las cargas perfectamente.</p>
          </div>
        </div>
      </main>

      {/* WhatsApp CTA */}
      <section className="border-t border-border/50 bg-secondary/30 py-16 text-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#25D366]/5" />
        <h2 className="text-2xl font-bold mb-6 relative z-10">¿Tienes alguna duda que aclarar con el Coach Jimi? 🤔</h2>
        <a href="http://wa.me/56972878295" target="_blank" rel="noopener noreferrer" className="relative z-10 inline-block">
          <Button size="lg" className="bg-[#25D366] hover:bg-[#128C7E] text-white gap-2 font-bold h-14 px-8 shadow-[0_0_20px_rgba(37,211,102,0.3)] hover:shadow-[0_0_30px_rgba(37,211,102,0.5)] hover:scale-105 transition-all">
            <MessageCircle className="w-5 h-5" />
            Hablemos por WhatsApp
          </Button>
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 text-center text-muted-foreground text-sm">
        <Image src="/images/isotipo.png" alt="Isotipo" width={32} height={32} className="mx-auto mb-4 opacity-50 grayscale hover:grayscale-0 transition-all dark:invert" />
        <p>© {new Date().getFullYear()} Jimi.coach. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
