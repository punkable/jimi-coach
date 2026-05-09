'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import {
  ArrowRight, CheckCircle2, MessageCircle, Target,
  TrendingUp, Users, Shield, Timer as TimerIcon,
  Video, Dumbbell, Activity, Layers3, Smartphone,
  ChevronRight, Zap, BarChart3, Star, Calendar,
} from 'lucide-react'

const whatsappUrl = 'https://api.whatsapp.com/send?phone=56972878295&text=Hola%2C%20quiero%20m%C3%A1s%20informaci%C3%B3n%20sobre%20LDRFIT'

/* ── data ───────────────────────────────────────────────────── */

const roles = [
  {
    label: 'Coach',
    headline: 'Crea, asigna y haz seguimiento',
    body: 'Diseña planificaciones semanales, asigna planes a cada alumno y revisa su progreso en tiempo real sin depender de mensajes.',
    bullets: ['Builder de WODs con bloques y timers', 'Asigna planes a cada alumno individualmente', 'Revisa RPE, notas y marcas históricas'],
    accent: 'var(--gymnastics)',
    icon: Users,
    rex: '/images/list.png',
  },
  {
    label: 'Atleta',
    headline: 'Entrena con estructura y propósito',
    body: 'Abre la app, ve exactamente qué toca hoy, activa el timer, mira el video técnico y registra tus resultados.',
    bullets: ['Plan diario claro y sin ruido', 'Videos técnicos integrados por ejercicio', 'Registro de series, carga y RPE'],
    accent: 'var(--metcon)',
    icon: Zap,
    rex: '/images/push.png',
  },
  {
    label: 'Alumno online',
    headline: 'Recibe coaching real a distancia',
    body: 'Tu coach te asigna el plan, tú entrenas desde donde estás. Feedback, ajustes y seguimiento sin importar la distancia.',
    bullets: ['Plan remoto idéntico al presencial', 'Comunicación directa con tu coach', 'Progreso visible para ambos'],
    accent: 'var(--strength)',
    icon: Smartphone,
    rex: '/images/happy.png',
  },
]

const steps = [
  { n: '01', title: 'Coach crea el plan', body: 'Diseña semanas, bloques, ejercicios, timers y carga técnica.', icon: Calendar },
  { n: '02', title: 'Asigna al alumno', body: 'Un click para vincular plan con atleta. Cada uno ve solo lo suyo.', icon: Users },
  { n: '03', title: 'El alumno entrena', body: 'Ve el WOD, activa timers, abre videos y registra sus resultados.', icon: Dumbbell },
  { n: '04', title: 'Coach hace seguimiento', body: 'Revisa RPE, notas y marcas para ajustar el proceso.', icon: BarChart3 },
]

const features = [
  { icon: Smartphone,  title: 'Plan en el bolsillo',      desc: 'El alumno entra y sabe exactamente qué hacer sin PDFs ni capturas de pantalla.',   color: 'var(--coach)'      },
  { icon: Video,       title: 'Videos técnicos',           desc: 'Cada ejercicio puede abrir su video para entrenar con mejor técnica y menos dudas.', color: 'var(--gymnastics)' },
  { icon: TimerIcon,   title: 'Timers WOD integrados',     desc: 'AMRAP, EMOM, For Time y Tabata. El foco está en moverse, no en buscar una app.',    color: 'var(--warmup)'     },
  { icon: Dumbbell,    title: 'Fuerza con intención',      desc: 'Cargas, porcentajes y series quedan claros antes de empezar cada bloque.',           color: 'var(--strength)'   },
  { icon: TrendingUp,  title: 'Seguimiento real',          desc: 'El atleta registra progreso y RPE para que el coach ajuste con contexto real.',       color: 'var(--metcon)'     },
  { icon: Layers3,     title: 'Flexible por modalidad',    desc: 'Funciona para 1:1, online, presencial, híbrido, box y grupos reducidos.',             color: 'var(--review)'     },
]

/* ── component ──────────────────────────────────────────────── */

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <main className="min-h-[100dvh] bg-background text-foreground flex flex-col overflow-x-hidden">

      {/* ── NAV ──────────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 md:px-10 transition-all duration-300 ${
          scrolled
            ? 'bg-background/95 backdrop-blur-2xl border-b border-border/60 shadow-[0_2px_20px_rgba(0,0,0,0.15)]'
            : 'bg-transparent'
        }`}
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 0px)',
          height: 'calc(3.5rem + env(safe-area-inset-top))',
        }}
      >
        <Link href="/" className="flex items-center">
          <Image src="/images/logofinal.svg" alt="LDRFIT" width={140} height={40} className="brand-logo hidden md:block" />
          <Image src="/images/isotipoblanco.svg" alt="LDRFIT" width={30} height={30} className="brand-logo md:hidden" />
        </Link>
        <div className="flex items-center gap-2">
          <a href={whatsappUrl} className="hidden md:block">
            <Button variant="ghost" size="sm" className="text-[11px] font-bold uppercase tracking-widest h-9 px-4 rounded-xl gap-2">
              <MessageCircle className="w-3.5 h-3.5" />
              Consultar
            </Button>
          </a>
          <Link href="/login">
            <Button size="sm" className="text-[11px] font-black uppercase tracking-widest h-9 px-5 rounded-xl gap-1.5">
              Ingresar <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-[100dvh] flex items-end overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero.png"
            alt="Atleta entrenando con LDRFIT"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          {/* Gradients: left text legibility + bottom fade */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/10" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background" />
        </div>

        {/* Rex — desktop only, right side */}
        <div className="absolute bottom-0 right-[4vw] z-10 hidden lg:block pointer-events-none">
          <Image
            src="/images/ready.png"
            alt="Rex listo para entrenar"
            width={320}
            height={320}
            className="rex-art drop-shadow-2xl"
            priority
          />
        </div>

        {/* Content */}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-5 md:px-10 pb-14 pt-28">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 border border-primary/30 bg-primary/10 backdrop-blur-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] text-primary">
              Coaching personalizado · CrossFit
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[84px] font-black tracking-tight leading-[0.88] uppercase mb-6 max-w-3xl">
            Tu coach
            <span className="block text-primary ldrfit-glow">marca el plan.</span>
            <span className="block text-foreground/90">Tú marcas el</span>
            <span className="block text-primary ldrfit-glow">progreso.</span>
          </h1>

          {/* Subhead */}
          <p className="text-base md:text-xl text-foreground/75 leading-relaxed mb-8 max-w-xl font-semibold">
            Planificación, seguimiento y coaching 1:1 en un solo lugar.
            Tu coach carga el WOD, tú entras desde el celular, ves videos, timers y registras todo.
          </p>

          {/* Pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {['Plan diario', 'Videos técnicos', 'Timer WOD', 'Registro RPE', 'Feedback coach'].map((item) => (
              <span key={item} className="metric-chip bg-card/70 border-border/60 text-foreground/70 backdrop-blur-xl">
                <CheckCircle2 className="w-3 h-3 text-primary" />
                {item}
              </span>
            ))}
          </div>

          {/* CTAs — WhatsApp primary (new visitors), login secondary (existing users) */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <a href={whatsappUrl} className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto h-14 px-8 text-sm font-black uppercase tracking-widest rounded-2xl gap-3 shadow-[0_16px_40px_rgba(155,219,0,0.3)] hover:shadow-[0_20px_48px_rgba(155,219,0,0.4)] active:scale-95 transition-all">
                <MessageCircle className="w-5 h-5" />
                Quiero empezar
              </Button>
            </a>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto h-14 px-8 text-sm font-bold uppercase tracking-widest rounded-2xl bg-card/60 backdrop-blur-xl gap-3 hover:bg-card/80 transition-all">
                Ya tengo cuenta
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>

          {/* 4 hero stat chips */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl">
            {[
              { icon: Video,      label: 'Técnica', value: 'Videos por ejercicio', color: 'var(--gymnastics)' },
              { icon: TimerIcon,  label: 'Entrena', value: 'Timers integrados',    color: 'var(--coach)'      },
              { icon: Dumbbell,   label: 'Registra', value: 'Cargas y RPE',         color: 'var(--strength)'   },
              { icon: TrendingUp, label: 'Progresa', value: 'Feedback coach',       color: 'var(--metcon)'     },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-card/80 border border-border/60 rounded-2xl p-3 md:p-4 backdrop-blur-xl">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2.5 border"
                  style={{ color, backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`, borderColor: `color-mix(in srgb, ${color} 25%, transparent)` }}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
                <p className="text-[11px] font-black uppercase tracking-tight mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────────── */}
      <section className="px-5 md:px-10 py-6 border-y border-border/40 bg-card/30 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto grid grid-cols-3 divide-x divide-border/40">
          {[
            { value: '1:1', label: 'Coaching personalizado', sub: 'Relación directa coach · alumno' },
            { value: 'WOD', label: 'Plan diario asignado',   sub: 'Sin PDFs, sin capturas, sin chats' },
            { value: '360°', label: 'Seguimiento completo',  sub: 'Desde la planificación al feedback' },
          ].map(stat => (
            <div key={stat.label} className="px-4 md:px-8 first:pl-0 last:pr-0 text-center md:text-left">
              <p className="text-2xl md:text-3xl font-black text-primary leading-none">{stat.value}</p>
              <p className="text-[11px] font-black uppercase tracking-wider mt-1 text-foreground">{stat.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 hidden md:block">{stat.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PARA QUIÉN ───────────────────────────────────────── */}
      <section className="px-5 md:px-10 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5 border border-border/50 bg-card/50">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">Hecho para ti si eres</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-none">
              Coach. Atleta.
              <span className="block text-primary">Alumno.</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto font-semibold text-sm md:text-base leading-relaxed">
              LDRFIT adapta la experiencia al rol de cada usuario en el mismo ecosistema.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {roles.map(role => {
              const Icon = role.icon
              return (
                <div
                  key={role.label}
                  className="ios-panel p-6 flex flex-col gap-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Background glow */}
                  <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20"
                    style={{ background: role.accent }} />

                  {/* Role chip */}
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 border text-[10px] font-black uppercase tracking-widest"
                      style={{
                        color: role.accent,
                        backgroundColor: `color-mix(in srgb, ${role.accent} 12%, transparent)`,
                        borderColor: `color-mix(in srgb, ${role.accent} 25%, transparent)`,
                      }}>
                      <Icon className="w-3.5 h-3.5" />
                      {role.label}
                    </div>
                    <Image src={role.rex} alt={role.label} width={52} height={52} className="rex-art" />
                  </div>

                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight leading-tight mb-2">{role.headline}</h3>
                    <p className="text-sm text-muted-foreground font-semibold leading-relaxed">{role.body}</p>
                  </div>

                  <ul className="space-y-2 mt-auto">
                    {role.bullets.map(b => (
                      <li key={b} className="flex items-start gap-2.5 text-[11px] font-bold text-foreground/80">
                        <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: role.accent }} />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ────────────────────────────────────── */}
      <section className="px-5 md:px-10 py-20 bg-card/20 border-y border-border/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5 border border-primary/25 bg-primary/8">
              <Activity className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Flujo de uso</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-none">
              Cómo funciona
              <span className="block text-primary">LDRFIT</span>
            </h2>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-4 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent pointer-events-none" />

            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={step.n} className="relative flex flex-col items-center text-center gap-4 md:px-2">
                  {/* Number circle */}
                  <div className="relative">
                    <div className="w-20 h-20 rounded-3xl bg-primary/10 border-2 border-primary/25 flex items-center justify-center shadow-[0_0_24px_rgba(155,219,0,0.15)]">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-[9px] font-black flex items-center justify-center shadow-lg">
                      {i + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-black text-sm uppercase tracking-tight leading-tight">{step.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{step.body}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Rex row */}
          <div className="flex justify-center mt-14">
            <div className="flex items-center gap-5 ios-panel px-8 py-5 max-w-md w-full">
              <Image src="/images/looking.png" alt="Rex mirando el plan" width={64} height={64} className="rex-art shrink-0" />
              <div>
                <p className="text-sm font-black uppercase tracking-tight">Todo en un solo lugar</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Sin hojas de cálculo, PDFs sueltos ni capturas de pantalla. El proceso queda limpio y registrado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES GRID ────────────────────────────────────── */}
      <section className="px-5 md:px-10 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5 border border-border/50 bg-card/50">
              <Star className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">Lo que cambia tu experiencia</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-none">
              Entrenar con coach
              <span className="block text-primary">se siente diferente.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(feature => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="ios-panel p-6 flex gap-4 hover:-translate-y-1 transition-all duration-300 group cursor-default"
                >
                  <div
                    className="w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                    style={{
                      color: feature.color,
                      backgroundColor: `color-mix(in srgb, ${feature.color} 12%, transparent)`,
                      borderColor: `color-mix(in srgb, ${feature.color} 25%, transparent)`,
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-sm uppercase tracking-tight">{feature.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── ATHLETE IN ACTION ────────────────────────────────── */}
      <section className="px-5 md:px-10 py-20 bg-card/20 border-y border-border/30 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-14 items-center">
            {/* Images */}
            <div className="grid grid-cols-2 gap-3 md:gap-4 relative">
              <div className="relative rounded-[24px] overflow-hidden aspect-[3/4]">
                <Image
                  src="https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=600&q=80&auto=format&fit=crop"
                  alt="Atleta haciendo peso muerto"
                  fill
                  className="object-cover"
                  sizes="(max-width:768px) 45vw, 280px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              <div className="relative rounded-[24px] overflow-hidden aspect-[3/4] mt-8">
                <Image
                  src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80&auto=format&fit=crop"
                  alt="Atleta CrossFit en box"
                  fill
                  className="object-cover"
                  sizes="(max-width:768px) 45vw, 280px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground rounded-2xl px-4 py-2.5 shadow-[0_8px_32px_rgba(126,196,0,0.4)] text-center whitespace-nowrap">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">Registra</p>
                <p className="text-sm font-black uppercase tracking-tight leading-tight">Tu progreso real</p>
              </div>
            </div>

            {/* Copy */}
            <div className="mt-8 md:mt-0">
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 border border-border/50 bg-card/50">
                <Dumbbell className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">Para el atleta</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-none mb-6">
                Entra.
                <span className="block text-primary">Muévete.</span>
                <span className="block">Registra.</span>
              </h2>
              <p className="text-muted-foreground text-sm md:text-base font-semibold leading-relaxed mb-8">
                Sin mensajes de WhatsApp a las 6am, sin PDFs confusos. Abres la app, ves exactamente qué toca hoy, activas el timer y registras todo al terminar.
              </p>
              <ul className="space-y-3">
                {[
                  { dot: 'var(--strength)', text: 'WOD del día listo cuando llegas al box' },
                  { dot: 'var(--gymnastics)', text: 'Videos técnicos integrados por ejercicio' },
                  { dot: 'var(--metcon)', text: 'Timer AMRAP, EMOM, For Time y Tabata' },
                  { dot: 'var(--warmup)', text: 'Registro de carga, reps, RPE y notas' },
                ].map(item => (
                  <li key={item.text} className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.dot }} />
                    <span className="text-sm font-bold text-foreground/80">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── COACHING 1:1 ─────────────────────────────────────── */}
      <section className="px-5 md:px-10 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="ios-panel p-8 md:p-12 overflow-hidden relative">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, var(--primary) 1px, transparent 1px), radial-gradient(circle at 80% 50%, var(--primary) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="relative grid lg:grid-cols-[1fr_auto] gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 border border-[var(--gymnastics)]/30 bg-[var(--gymnastics)]/10">
                  <Target className="w-3 h-3 text-[var(--gymnastics)]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--gymnastics)]">Coaching 1:1</span>
                </div>

                <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-none mb-6">
                  Relación directa.
                  <span className="block text-primary">Progreso real.</span>
                </h2>

                <p className="text-muted-foreground text-sm md:text-base font-semibold leading-relaxed mb-8 max-w-xl">
                  LDRFIT no reemplaza a tu coach — lo amplifica. Tu coach conoce tu historial, ajusta tu plan y te da feedback. Tú llegas al entrenamiento sabiendo exactamente qué hacer y por qué.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { icon: Target,     text: 'Planes adaptados a tu progreso' },
                    { icon: TrendingUp, text: 'Seguimiento semana a semana' },
                    { icon: Shield,     text: 'Feedback real sobre tu desempeño' },
                    { icon: Zap,        text: 'Entrenamiento con contexto claro' },
                  ].map(item => {
                    const Icon = item.icon
                    return (
                      <div key={item.text} className="flex items-center gap-3 rounded-2xl bg-background/50 border border-border/50 px-4 py-3">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-tight">{item.text}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Rex */}
              <div className="hidden lg:flex flex-col items-center gap-3 shrink-0">
                <Image src="/images/happy.png" alt="Rex feliz entrenando" width={180} height={180} className="rex-art" />
                <div className="bg-primary/10 border border-primary/20 rounded-2xl px-4 py-2 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Tu proceso</p>
                  <p className="text-[11px] font-bold text-foreground/70 mt-0.5">ordenado y medible</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────── */}
      <section
        className="px-5 md:px-10 pb-20 pt-6"
        style={{ paddingBottom: 'max(5rem, calc(env(safe-area-inset-bottom) + 3rem))' }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-card via-card to-primary/8 border border-primary/20 p-8 md:p-14 shadow-[0_24px_80px_rgba(155,219,0,0.12)]">
            {/* Glowing orb */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative grid md:grid-cols-[auto_1fr_auto] gap-8 items-center">
              <Image src="/images/laugh.png" alt="Rex listo" width={100} height={100} className="rex-art mx-auto md:mx-0 shrink-0" />

              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-4 border border-primary/30 bg-primary/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Empieza ahora</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-none mb-3">
                  Más claridad en
                  <span className="block text-primary">cada entrenamiento.</span>
                </h2>
                <p className="text-muted-foreground text-sm md:text-base font-semibold leading-relaxed max-w-lg">
                  Escríbenos por WhatsApp para ver cómo LDRFIT encaja con tu coach, box o modalidad de seguimiento. Sin compromiso.
                </p>
              </div>

              <div className="flex flex-col gap-3 items-center md:items-stretch shrink-0">
                <Link href="/login">
                  <Button className="h-13 px-8 text-[11px] font-black uppercase tracking-widest rounded-2xl gap-2 shadow-[0_12px_32px_rgba(155,219,0,0.3)] w-full">
                    Entrar a LDRFIT
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <a href={whatsappUrl}>
                  <Button variant="outline" className="h-13 px-8 text-[11px] font-black uppercase tracking-widest rounded-2xl gap-2 w-full bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20">
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER MINIMAL ───────────────────────────────────── */}
      <footer className="border-t border-border/30 px-5 md:px-10 py-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <Image src="/images/logofinal.svg" alt="LDRFIT" width={100} height={28} className="brand-logo opacity-50" />
          <p className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-widest text-center">
            © 2026 LDRFIT · Plataforma de coaching CrossFit
          </p>
          <Link href="/login">
            <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest hover:text-primary transition-colors">
              Ingresar →
            </span>
          </Link>
        </div>
      </footer>
    </main>
  )
}
