'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Zap, Target, TrendingUp, MessageCircle, Shield, Users } from 'lucide-react'

export default function LandingPage() {
  return (
    <main className="min-h-[100dvh] bg-background text-foreground flex flex-col overflow-x-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 h-14 bg-background/80 backdrop-blur-xl border-b border-border/30"
        style={{ paddingTop: 'env(safe-area-inset-top)', height: 'calc(3.5rem + env(safe-area-inset-top))' }}>
        <div className="font-black text-lg tracking-tight uppercase text-foreground">
          Jimi<span className="text-primary">.</span>coach
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-widest h-9 px-4 rounded-xl">
              Entrar
            </Button>
          </Link>
          <Link href="/login">
            <Button size="sm" className="text-xs font-black uppercase tracking-widest h-9 px-4 rounded-xl shadow-[0_4px_14px_rgba(var(--primary),0.4)]">
              Empezar
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-32 pb-16 relative">
        {/* Background glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/15 blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-primary/8 blur-[80px]" />
        </div>

        <div className="relative z-10 max-w-sm mx-auto">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Plataforma CrossFit</span>
          </div>

          <h1 className="text-5xl font-black tracking-tight leading-[0.95] uppercase mb-6">
            Entrena<br />
            <span className="text-primary">Sin</span><br />
            Límites.
          </h1>

          <p className="text-muted-foreground text-base leading-relaxed mb-10 max-w-[280px] mx-auto">
            Tu coach y tu WOD en el bolsillo. Registra series, sigue tu progreso y mantén la racha.
          </p>

          <div className="flex flex-col gap-3 items-center">
            <Link href="/login" className="w-full max-w-[260px]">
              <Button className="w-full h-14 text-base font-black uppercase tracking-widest rounded-2xl gap-2 shadow-[0_8px_30px_rgba(var(--primary),0.5)] active:scale-95 transition-transform">
                Acceder a la App
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <a href="#features" className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest hover:text-foreground transition-colors">
              Ver cómo funciona ↓
            </a>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="px-4 pb-12">
        <div className="max-w-sm mx-auto grid grid-cols-3 gap-3">
          {[
            { value: '100+', label: 'Atletas' },
            { value: '5K+', label: 'WODs' },
            { value: '98%', label: 'Asistencia' },
          ].map(stat => (
            <div key={stat.label} className="glass rounded-2xl p-4 text-center">
              <p className="text-2xl font-black text-primary leading-none">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 pb-16 space-y-4 max-w-sm mx-auto w-full">
        <h2 className="text-2xl font-black uppercase tracking-tight text-center mb-8">
          Todo lo que necesitas
        </h2>

        {[
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
        ].map(feature => {
          const Icon = feature.icon
          return (
            <div key={feature.title} className="glass rounded-2xl p-5 flex gap-4 border-border/40">
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${feature.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-tight">{feature.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          )
        })}
      </section>

      {/* CTA Footer */}
      <section className="px-4 pb-12 max-w-sm mx-auto w-full"
        style={{ paddingBottom: 'max(3rem, env(safe-area-inset-bottom))' }}>
        <div className="glass rounded-3xl p-8 text-center border-primary/20 bg-gradient-to-br from-primary/10 to-transparent relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent pointer-events-none rounded-3xl" />
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-primary mb-3">Únete hoy</p>
            <h2 className="text-3xl font-black uppercase tracking-tight leading-tight mb-4">
              ¿Listo para<br />entrenar distinto?
            </h2>
            <Link href="/login">
              <Button className="w-full h-14 text-base font-black uppercase tracking-widest rounded-2xl shadow-[0_8px_30px_rgba(var(--primary),0.5)] active:scale-95 transition-transform">
                Entrar a Jimi.coach
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
