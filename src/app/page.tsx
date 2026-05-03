'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight, Zap, Target, TrendingUp, Users, Shield, MessageCircle } from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'WOD Dinámico',
    desc: 'Registra series, pesos y repeticiones al instante. Diseñado para manos sudadas.',
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  },
  {
    icon: Target,
    title: 'Insights del Coach',
    desc: 'Tu coach te fija metas, benchmarks y correcciones personalizadas directamente en tu app.',
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
  },
  {
    icon: TrendingUp,
    title: 'Progreso Real',
    desc: 'Visualiza tu evolución de fuerza, rachas y RPE a lo largo del tiempo.',
    color: 'text-green-500 bg-green-500/10 border-green-500/20',
  },
  {
    icon: Users,
    title: 'Box Feed',
    desc: 'Mira los logros de tus compañeros y dales un 👊 fist bump para motivarse.',
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  },
  {
    icon: MessageCircle,
    title: 'Feedback Técnico',
    desc: 'Sube tu video de técnica y recibe correcciones detalladas de tu coach.',
    color: 'text-primary bg-primary/10 border-primary/20',
  },
  {
    icon: Shield,
    title: 'Tu Historial, Seguro',
    desc: 'Todos tus entrenos guardados en la nube. Nunca más perderás un registro.',
    color: 'text-muted-foreground bg-secondary/40 border-border/30',
  },
]

export default function LandingPage() {
  return (
    <main
      className="min-h-[100dvh] bg-background text-foreground flex flex-col overflow-x-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* ── Fixed Nav ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 md:px-10 bg-background/80 backdrop-blur-xl border-b border-border/20"
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 0px)',
          height: 'calc(3.5rem + env(safe-area-inset-top))',
        }}
      >
        <Link href="/" className="flex items-center">
          <Image
            src="/images/logo.png"
            alt="Jimi.coach"
            width={140}
            height={38}
            className="object-contain"
          />
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-widest h-9 px-4 rounded-xl hidden md:flex">
              Iniciar Sesión
            </Button>
          </Link>
          <Link href="/login?tab=register">
            <Button size="sm" className="text-xs font-black uppercase tracking-widest h-9 px-5 rounded-xl shadow-[0_4px_14px_rgba(var(--primary),0.4)]">
              Empezar Gratis
            </Button>
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden">
        {/* Hero background image */}
        <div className="absolute inset-0">
          <Image
            src="/images/hero.png"
            alt="Atleta CrossFit"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-background/70" />
          {/* Gradient fade to background at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background to-transparent" />
        </div>

        {/* Ambient glows on top of image */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-primary/20 blur-[120px]" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto pt-24">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Plataforma CrossFit Premium</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] uppercase mb-8">
            Entrena<br />
            <span className="text-primary">Sin</span><br />
            Límites.
          </h1>

          <p className="text-muted-foreground text-base md:text-xl leading-relaxed mb-10 max-w-lg mx-auto">
            Tu coach y tu WOD siempre en el bolsillo. Registra cada serie, sigue tu progreso y mantén la racha.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
            <Link href="/login">
              <Button className="h-14 px-8 text-base font-black uppercase tracking-widest rounded-2xl gap-2 shadow-[0_8px_30px_rgba(var(--primary),0.5)] active:scale-95 transition-transform">
                Acceder Ahora
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" className="h-14 px-8 text-base font-bold uppercase tracking-widest rounded-2xl backdrop-blur-sm border-border/40 hover:bg-white/5">
                Ver Cómo Funciona
              </Button>
            </a>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40">
          <div className="w-px h-10 bg-gradient-to-b from-transparent to-foreground/60 animate-pulse" />
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="px-5 md:px-10 py-16">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4">
          {[
            { value: '100+', label: 'Atletas activos' },
            { value: '5K+', label: 'WODs completados' },
            { value: '98%', label: 'Asistencia media' },
          ].map(stat => (
            <div key={stat.label} className="glass rounded-2xl p-4 md:p-6 text-center">
              <p className="text-2xl md:text-4xl font-black text-primary leading-none">{stat.value}</p>
              <p className="text-[10px] md:text-xs text-muted-foreground font-bold uppercase tracking-widest mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="px-5 md:px-10 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary mb-3">Funcionalidades</p>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">
              Todo lo que necesitas
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(feature => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="glass rounded-2xl p-5 md:p-6 flex gap-4 border-border/40 hover:border-primary/20 transition-colors">
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${feature.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-tight">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CTA Footer ── */}
      <section
        className="px-5 md:px-10 pb-16"
        style={{ paddingBottom: 'max(4rem, env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-3xl mx-auto glass rounded-3xl p-10 md:p-16 text-center border-primary/20 bg-gradient-to-br from-primary/10 to-transparent relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-transparent pointer-events-none rounded-3xl" />
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-4">Únete hoy</p>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-tight mb-3">
              ¿Listo para<br />entrenar distinto?
            </h2>
            <p className="text-muted-foreground text-sm mb-8 max-w-sm mx-auto">
              Habla con tu coach para que te active el acceso y empieza a registrar tu progreso.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
              <Link href="/login">
                <Button className="h-14 px-10 text-base font-black uppercase tracking-widest rounded-2xl shadow-[0_8px_30px_rgba(var(--primary),0.5)] active:scale-95 transition-transform">
                  Entrar a Jimi.coach
                </Button>
              </Link>
              <a href="http://wa.me/56972878295" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="h-14 px-8 text-sm font-bold uppercase tracking-widest rounded-2xl border-border/40">
                  Contactar al Coach
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
