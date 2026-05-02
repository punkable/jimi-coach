'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight, Video, Target, TrendingUp, MessageCircle, ChevronRight, Zap, Trophy, Shield } from 'lucide-react'
import { motion } from 'framer-motion'

export default function LandingPage() {
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" as const }
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/30 text-foreground overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between max-w-7xl">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/logo.png" alt="Jimi.coach Logo" width={140} height={40} className="object-contain" priority />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="hidden md:flex font-bold uppercase tracking-widest text-[10px]">
                Acceso Atletas
              </Button>
            </Link>
            <Link href="/login">
              <Button className="font-black border-none bg-primary hover:bg-primary/90 text-white uppercase tracking-widest text-[10px] px-6 h-9 rounded-full shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                Entrar
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 relative w-full pt-16">
        {/* Background Visuals */}
        <div className="absolute inset-0 z-0 w-full h-[100vh] pointer-events-none overflow-hidden">
          <Image 
            src="/images/hero.png" 
            alt="CrossFit Athlete" 
            fill 
            className="object-cover object-top opacity-40 mix-blend-screen"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/80 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
          {/* Accent glow */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 animate-pulse" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-20 md:pt-40 md:pb-32">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-[10px] text-primary font-black uppercase tracking-[0.2em] mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(var(--primary),0.2)]"
          >
            <Zap className="w-3 h-3 mr-2 fill-primary" />
            Performance Coaching Hub
          </motion.div>
          
          <motion.h1 
            {...fadeInUp}
            className="text-5xl md:text-8xl lg:text-9xl font-black tracking-tighter uppercase leading-[0.8] text-white"
          >
            Forge <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-rose-500 drop-shadow-[0_0_30px_rgba(var(--primary),0.3)]">
              Your Path
            </span>
          </motion.h1>
          
          <motion.p 
            {...fadeInUp}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-8 text-lg md:text-xl text-muted-foreground max-w-xl font-medium leading-relaxed"
          >
            No somos una app más de fitness. Somos tu plataforma de alto rendimiento. 
            Planificación de élite, corrección técnica y seguimiento real.
          </motion.p>
          
          <motion.div 
            {...fadeInUp}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 pt-10 w-full sm:w-auto"
          >
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-sm h-14 px-10 font-black uppercase tracking-widest shadow-[0_0_30px_rgba(var(--primary),0.4)] hover:shadow-[0_0_50px_rgba(var(--primary),0.6)] hover:scale-105 transition-all duration-300 rounded-2xl">
                Empezar Ahora <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <a href="#features" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-sm h-14 px-10 font-black uppercase tracking-widest rounded-2xl border-white/10 hover:bg-white/5">
                Ver Metodología
              </Button>
            </a>
          </motion.div>
        </div>

        {/* Stats Strip */}
        <div className="relative z-10 border-y border-white/5 bg-white/[0.02] backdrop-blur-sm py-10 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-3xl font-black text-white">500+</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Atletas Activos</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-primary">100%</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Planificación Personalizada</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-white">24/7</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Soporte Coach</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-black text-white">∞</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Evolución Constante</p>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-32 space-y-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              whileHover={{ y: -10 }}
              className="p-8 rounded-3xl bg-card/40 backdrop-blur-md border border-white/5 hover:border-primary/50 transition-all duration-500 shadow-2xl group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                <Target className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black mb-3 uppercase tracking-tight text-white flex items-center justify-between">
                Planificación
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">Mesociclos estructurados milimétricamente para fuerza, potencia y resistencia específica.</p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -10 }}
              className="p-8 rounded-3xl bg-card/40 backdrop-blur-md border border-white/5 hover:border-primary/50 transition-all duration-500 shadow-2xl group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                <Video className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black mb-3 uppercase tracking-tight text-white flex items-center justify-between">
                Video Feedback
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">Análisis técnico directo. Sube tus levantamientos y recibe correcciones precisas de tu coach.</p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -10 }}
              className="p-8 rounded-3xl bg-card/40 backdrop-blur-md border border-white/5 hover:border-primary/50 transition-all duration-500 shadow-2xl group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                <TrendingUp className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black mb-3 uppercase tracking-tight text-white flex items-center justify-between">
                Analytics
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">Visualiza tus PRs, volumen de carga y RPE. Datos reales para progresos exponenciales.</p>
            </motion.div>
          </div>

          {/* Social Proof / Why Us */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center py-10">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">
                La ciencia del <br/>
                <span className="text-primary">entrenamiento de élite</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Nuestra metodología combina principios de entrenamiento de fuerza con la intensidad del CrossFit, adaptada individualmente a tus capacidades y objetivos.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                    <Trophy className="w-3 h-3 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-white uppercase tracking-tight text-sm">Mentalidad Competitiva</p>
                    <p className="text-xs text-muted-foreground">Entrena como los mejores del mundo, sin importar tu nivel inicial.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                    <Shield className="w-3 h-3 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-white uppercase tracking-tight text-sm">Seguridad y Técnica</p>
                    <p className="text-xs text-muted-foreground">Priorizamos la longevidad y la forma perfecta sobre la carga vacía.</p>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative aspect-square md:aspect-video rounded-3xl overflow-hidden border border-white/10"
            >
              <Image 
                src="/images/hero.png" 
                alt="Training Session" 
                fill 
                className="object-cover grayscale hover:grayscale-0 transition-all duration-1000"
              />
              <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
            </motion.div>
          </div>
        </div>
      </main>

      {/* WhatsApp CTA */}
      <section className="relative py-32 text-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 -skew-y-3 origin-right scale-110" />
        <div className="relative z-10 max-w-3xl mx-auto space-y-10">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white leading-none"
          >
            ¿Listo para <br/> elevar tu nivel?
          </motion.h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto font-medium">
            Únete a la comunidad de Jimi.coach y empieza a ver resultados reales desde la primera semana.
          </p>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <a href="http://wa.me/56972878295" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-[#25D366] hover:bg-[#128C7E] text-white gap-3 font-black uppercase tracking-widest text-sm h-16 px-10 rounded-2xl shadow-[0_15px_35px_rgba(37,211,102,0.3)]">
                <MessageCircle className="w-6 h-6" />
                Contactar al Coach
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-16 text-center text-muted-foreground bg-background relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
          <Image src="/images/isotipo.png" alt="Isotipo" width={32} height={32} className="opacity-40 grayscale mb-8" />
          <div className="flex gap-8 mb-10 text-[10px] font-bold uppercase tracking-widest">
            <Link href="/login" className="hover:text-primary transition-colors">Login</Link>
            <Link href="#" className="hover:text-primary transition-colors">Instagram</Link>
            <Link href="#" className="hover:text-primary transition-colors">TikTok</Link>
          </div>
          <p className="uppercase tracking-[0.3em] font-black text-[9px] opacity-30">
            © {new Date().getFullYear()} Jimi.coach · Built for High Performance
          </p>
        </div>
      </footer>
    </div>
  )
}
