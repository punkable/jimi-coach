import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight, Video, Target, TrendingUp, MessageCircle } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/30 text-foreground overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/60 backdrop-blur-md">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between max-w-7xl">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/logo.png" alt="Jimi.coach Logo" width={160} height={45} className="object-contain" priority />
          </Link>
          <Link href="/login">
            <Button variant="outline" className="font-bold border-white/10 hover:bg-white/5 hover:text-white uppercase tracking-wider text-xs px-6 py-5">
              Iniciar Sesión
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 relative w-full pt-20">
        {/* Massive 16:9 Hero Image Background with Overlays */}
        <div className="absolute inset-0 z-0 w-full h-[90vh] min-h-[600px] pointer-events-none">
          <Image 
            src="/images/hero.png" 
            alt="CrossFit Athlete" 
            fill 
            className="object-cover object-top opacity-60 mix-blend-lighten"
            priority
          />
          {/* Gradient to fade into the deep dark background */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/60 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/50 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24 md:pt-48 md:pb-32 flex flex-col items-start text-left">
          <div className="inline-flex items-center rounded-sm border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs text-primary font-bold uppercase tracking-widest mb-8 backdrop-blur-sm shadow-[0_0_15px_rgba(217,0,76,0.3)]">
            Fase Ultimate Coaching Activa
          </div>
          
          <h1 className="text-6xl md:text-8xl lg:text-[7rem] font-black tracking-tighter uppercase leading-[0.85] text-white drop-shadow-2xl">
            Break <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-rose-500">
              Your Limits
            </span>
          </h1>
          
          <p className="mt-8 text-xl md:text-2xl text-muted-foreground max-w-2xl font-light leading-relaxed border-l-4 border-primary pl-6">
            Entrenamiento de élite con resultados reales. 
            Recibe tu planificación estructurada, registra tu esfuerzo y obtén corrección técnica directa de nivel competitivo.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 pt-12 w-full sm:w-auto">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-lg h-16 px-10 font-black uppercase tracking-widest shadow-[0_0_30px_rgba(217,0,76,0.4)] hover:shadow-[0_0_50px_rgba(217,0,76,0.6)] hover:scale-105 transition-all duration-300">
                Únete al Equipo <ArrowRight className="ml-3 w-6 h-6" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-7xl mx-auto px-6 pb-32">
          <div className="p-8 rounded-xl bg-card/40 backdrop-blur-md border border-white/5 hover:border-primary/50 transition-colors shadow-2xl group">
            <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
              <Target className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-black mb-3 uppercase tracking-tight text-white">Planificación Inteligente</h3>
            <p className="text-muted-foreground leading-relaxed">Mesociclos estructurados por semanas para asegurar que tu progresión en fuerza y gimnasia nunca se detenga.</p>
          </div>
          
          <div className="p-8 rounded-xl bg-card/40 backdrop-blur-md border border-white/5 hover:border-primary/50 transition-colors shadow-2xl group">
            <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
              <Video className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-black mb-3 uppercase tracking-tight text-white">Análisis de Video</h3>
            <p className="text-muted-foreground leading-relaxed">Sube enlaces de tus levantamientos pesados y recibe correcciones técnicas directas para perfeccionar tu forma.</p>
          </div>
          
          <div className="p-8 rounded-xl bg-card/40 backdrop-blur-md border border-white/5 hover:border-primary/50 transition-colors shadow-2xl group">
            <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
              <TrendingUp className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-black mb-3 uppercase tracking-tight text-white">Tracking de Esfuerzo</h3>
            <p className="text-muted-foreground leading-relaxed">Registra tu RPE diario y mantén un historial de tu progreso para ajustar las cargas de manera milimétrica.</p>
          </div>
        </div>
      </main>

      {/* WhatsApp CTA */}
      <section className="relative py-24 text-center px-6 border-t border-white/5 bg-gradient-to-b from-transparent to-background">
        <div className="absolute inset-0 bg-[url('/images/hero.png')] opacity-5 bg-cover bg-center mix-blend-luminosity" />
        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">¿Dudas sobre la planificación?</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Comunícate directamente con Jimi para resolver tus consultas y entender cómo nuestra metodología puede llevarte al siguiente nivel.
          </p>
          <a href="http://wa.me/56972878295" target="_blank" rel="noopener noreferrer" className="inline-block mt-4">
            <Button size="lg" className="bg-[#25D366] hover:bg-[#128C7E] text-white gap-3 font-bold text-lg h-16 px-10 shadow-[0_0_20px_rgba(37,211,102,0.2)] hover:shadow-[0_0_40px_rgba(37,211,102,0.4)] hover:scale-105 transition-all">
              <MessageCircle className="w-6 h-6" />
              Contactar al Coach
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 text-center text-muted-foreground text-sm bg-background">
        <Image src="/images/isotipo.png" alt="Isotipo" width={40} height={40} className="mx-auto mb-6 opacity-30 grayscale hover:grayscale-0 transition-all hover:opacity-100" />
        <p className="uppercase tracking-widest font-semibold text-xs">© {new Date().getFullYear()} Jimi.coach. All rights reserved.</p>
      </footer>
    </div>
  )
}
