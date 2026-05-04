'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  Target,
  TrendingUp,
  Users,
  Shield,
  Timer as TimerIcon,
  Video,
  Dumbbell,
  Activity,
  Layers3,
  Smartphone,
  Sparkles,
} from 'lucide-react'

const whatsappUrl = 'https://api.whatsapp.com/send?phone=56972878295&text=Hola%2C%20quiero%20m%C3%A1s%20informaci%C3%B3n%20sobre%20LDRFIT'

const features = [
  {
    icon: Smartphone,
    title: 'Tu plan en el bolsillo',
    desc: 'El alumno entra, ve su entrenamiento del día y sabe exactamente qué hacer sin depender de PDFs, chats o capturas.',
    color: 'text-[var(--coach)] bg-[var(--coach)]/10 border-[var(--coach)]/20',
  },
  {
    icon: Video,
    title: 'Videos técnicos integrados',
    desc: 'Los ejercicios del WOD pueden abrir videos desde la rutina para entrenar con mejor técnica y menos dudas.',
    color: 'text-[var(--gymnastics)] bg-[var(--gymnastics)]/10 border-[var(--gymnastics)]/20',
  },
  {
    icon: TimerIcon,
    title: 'Timers listos para entrenar',
    desc: 'AMRAP, EMOM, Tabata y For Time quedan dentro de la experiencia para que el foco esté en moverse.',
    color: 'text-[var(--warmup)] bg-[var(--warmup)]/10 border-[var(--warmup)]/20',
  },
  {
    icon: Dumbbell,
    title: 'Fuerza con intención',
    desc: 'Cargas, porcentajes, series y notas del coach quedan claros antes de empezar cada bloque.',
    color: 'text-[var(--strength)] bg-[var(--strength)]/10 border-[var(--strength)]/20',
  },
  {
    icon: TrendingUp,
    title: 'Seguimiento real',
    desc: 'El atleta registra progreso, RPE y sensaciones para que su coach ajuste la planificación con contexto.',
    color: 'text-[var(--metcon)] bg-[var(--metcon)]/10 border-[var(--metcon)]/20',
  },
  {
    icon: Layers3,
    title: 'Se adapta a tu modalidad',
    desc: 'Funciona para coaching 1:1, planes online, presencial, híbrido, box, grupos reducidos o seguimiento personalizado.',
    color: 'text-[var(--review)] bg-[var(--review)]/10 border-[var(--review)]/20',
  },
]

const journey = [
  'Recibe tu cuenta o entra con tu coach',
  'Revisa el WOD, videos, cargas y objetivo del día',
  'Entrena con timer y registra tus resultados',
  'Tu coach revisa datos y ajusta tu proceso',
]

export default function LandingPage() {
  return (
    <main
      className="min-h-[100dvh] bg-background text-foreground flex flex-col overflow-x-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 md:px-10 bg-background/88 backdrop-blur-xl border-b border-border/60"
        style={{
          paddingTop: 'max(env(safe-area-inset-top), 0px)',
          height: 'calc(3.5rem + env(safe-area-inset-top))',
        }}
      >
        <Link href="/" className="flex items-center">
          <Image src="/images/logofinal.svg" alt="LDRFIT" width={150} height={42} className="brand-logo hidden md:block" />
          <Image src="/images/isotipo.svg" alt="LDRFIT" width={34} height={34} className="brand-logo md:hidden" />
        </Link>
        <div className="flex items-center gap-2">
          <a href={whatsappUrl}>
            <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-widest h-9 px-4 rounded-xl hidden md:flex gap-2">
              <MessageCircle className="w-4 h-4" />
              Información
            </Button>
          </a>
          <Link href="/login">
            <Button size="sm" className="text-xs font-black uppercase tracking-widest h-9 px-5 rounded-xl">
              Ingresar
            </Button>
          </Link>
        </div>
      </nav>

      <section className="relative min-h-[92dvh] flex items-end overflow-hidden pt-24 pb-10 md:pb-14">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero.png"
            alt="Atleta entrenando con LDRFIT"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/6 via-background/42 to-background" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/78 to-background/18" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 md:px-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-card/80 border border-border/70 rounded-full px-4 py-2 mb-7 backdrop-blur-xl shadow-sm">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                Entrena con tu coach, mide tu progreso y entiende cada WOD
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-[72px] font-black tracking-tight leading-[0.92] uppercase mb-5 max-w-4xl">
              Tu coach marca el plan.
              <span className="block mt-1 text-primary">Tú marcas el progreso.</span>
            </h1>

            <p className="text-lg md:text-2xl text-foreground/88 leading-tight mb-5 max-w-2xl font-black tracking-tight">
              Entrena con estructura, registra tus marcas y recibe seguimiento real sin perderte entre chats.
            </p>
            <p className="text-base md:text-xl text-muted-foreground leading-relaxed mb-8 max-w-2xl font-semibold">
              Tu coach carga la planificación, tú entras desde el celular, ves videos, timers, cargas y registras resultados. Todo queda ordenado para progresar con intención.
            </p>

            <div className="mb-8 flex flex-wrap gap-2">
              {['Plan diario', 'Videos técnicos', 'RPE', 'Feedback coach'].map((item) => (
                <span key={item} className="metric-chip bg-card/75 border-border/70 text-foreground/75 backdrop-blur-xl">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  {item}
                </span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <Link href="/login" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto h-14 px-8 text-sm font-black uppercase tracking-widest rounded-2xl gap-3 shadow-[0_12px_32px_rgba(147,213,0,0.25)] active:scale-95 transition-all">
                  Entrar a mi seguimiento
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <a href={whatsappUrl} className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto h-14 px-8 text-sm font-bold uppercase tracking-widest rounded-2xl bg-card/70 backdrop-blur-xl gap-3">
                  <MessageCircle className="w-5 h-5 text-[#25D366]" />
                  Pedir información
                </Button>
              </a>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl">
            <HeroChip icon={Video} label="Aprende" value="Videos técnicos" color="gymnastics" />
            <HeroChip icon={TimerIcon} label="Entrena" value="Timers WOD" color="coach" />
            <HeroChip icon={Dumbbell} label="Registra" value="Cargas y RPE" color="strength" />
            <HeroChip icon={TrendingUp} label="Progresa" value="Feedback coach" color="metcon" />
          </div>
        </div>
      </section>

      <section className="px-5 md:px-10 py-10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {[
            { value: '1:1', label: 'Seguimiento personalizado', text: 'Ideal si entrenas con coach propio y necesitas orden.' },
            { value: 'ONLINE', label: 'Planes remotos', text: 'Recibe rutina, videos y ajustes aunque no estés en el box.' },
            { value: 'BOX', label: 'Modalidades flexibles', text: 'Compatible con presencial, híbrido y grupos reducidos.' },
          ].map(stat => (
            <div key={stat.label} className="ios-panel p-5 md:p-6">
              <p className="text-2xl md:text-3xl font-black text-primary leading-none">{stat.value}</p>
              <p className="text-[11px] text-foreground font-black uppercase tracking-widest mt-3">{stat.label}</p>
              <p className="text-xs text-muted-foreground font-semibold mt-2 leading-relaxed">{stat.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 md:px-10 py-12">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[0.9fr_1.1fr] gap-8 items-center">
          <div>
            <p className="section-title text-primary mb-3">Para alumnos</p>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-none">
              Deja de perseguir rutinas en chats
            </h2>
            <p className="text-muted-foreground text-base md:text-lg font-semibold mt-5 leading-relaxed">
              LDRFIT ordena el proceso completo: qué toca hoy, cómo se hace, qué intensidad buscar y qué datos necesita tu coach para ayudarte a mejorar.
            </p>
          </div>

          <div className="ios-panel p-5 md:p-6">
            <div className="grid gap-3">
              {journey.map((item, index) => (
                <div key={item} className="flex items-center gap-4 rounded-2xl border border-border/60 bg-background/45 p-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black">
                    {index + 1}
                  </div>
                  <p className="text-sm font-black tracking-tight">{item}</p>
                  <CheckCircle2 className="w-5 h-5 text-primary ml-auto shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="px-5 md:px-10 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 md:mb-12 max-w-3xl">
            <p className="section-title text-primary mb-3">Lo que cambia tu experiencia</p>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-none">
              Entrenar con coach se siente más claro, más visual y más medible
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(feature => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="ios-panel p-5 md:p-6 flex gap-4 hover:-translate-y-0.5 transition-all">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${feature.color}`}>
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

      <section className="px-5 md:px-10 py-12">
        <div className="max-w-6xl mx-auto ios-panel p-6 md:p-10 overflow-hidden">
          <div className="grid lg:grid-cols-[1fr_0.8fr] gap-8 items-center">
            <div>
              <p className="section-title text-[var(--gymnastics)] mb-3">Para coaches y boxes</p>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-none">
                Integra tu modalidad sin cambiar tu forma de entrenar
              </h2>
              <p className="text-muted-foreground text-sm md:text-base font-semibold mt-5 leading-relaxed max-w-2xl">
                Si ya tienes alumnos, grupos, asesorías online o planes personalizados, LDRFIT puede funcionar como la capa visual donde ellos ingresan, entrenan y reportan progreso.
              </p>
            </div>
            <div className="grid gap-3">
              {['Coaching individual', 'Planes online', 'Presencial e híbrido', 'Grupos reducidos'].map(item => (
                <div key={item} className="flex items-center gap-3 rounded-2xl bg-background/45 border border-border/60 p-4">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="text-sm font-black uppercase tracking-tight">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        className="px-5 md:px-10 pb-16 pt-8"
        style={{ paddingBottom: 'max(4rem, env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-5xl mx-auto ios-panel p-8 md:p-12 overflow-hidden">
          <div className="grid md:grid-cols-[auto_1fr_auto] gap-6 items-center">
            <Image src="/images/laugh.png" alt="Rex listo para entrenar" width={88} height={88} className="rex-art mx-auto md:mx-0" />
            <div className="text-center md:text-left">
              <p className="section-title text-primary mb-2">Empieza con tu coach</p>
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight leading-tight">
                Más claridad en cada entrenamiento, más progreso semana a semana
              </h2>
              <p className="text-muted-foreground text-sm mt-3 max-w-xl">
                Escríbenos por WhatsApp para ver cómo se integra LDRFIT a tu coach, box o modalidad de seguimiento.
              </p>
            </div>
            <a href={whatsappUrl}>
              <Button className="h-14 px-8 text-sm font-black uppercase tracking-widest rounded-2xl gap-3 bg-[#25D366] text-white hover:bg-[#20b858] shadow-[0_14px_34px_rgba(37,211,102,0.22)]">
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </Button>
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}

function HeroChip({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
  const colorMap: Record<string, string> = {
    coach: 'text-[var(--coach)] bg-[var(--coach)]/10 border-[var(--coach)]/20',
    gymnastics: 'text-[var(--gymnastics)] bg-[var(--gymnastics)]/10 border-[var(--gymnastics)]/20',
    strength: 'text-[var(--strength)] bg-[var(--strength)]/10 border-[var(--strength)]/20',
    metcon: 'text-[var(--metcon)] bg-[var(--metcon)]/10 border-[var(--metcon)]/20',
  }

  return (
    <div className="bg-card/86 border border-border/70 rounded-2xl p-3 md:p-4 backdrop-blur-xl shadow-sm">
      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3 ${colorMap[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-xs md:text-sm font-black uppercase tracking-tight mt-1">{value}</p>
    </div>
  )
}
