import { login } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Zap, Target, Users, TrendingUp } from 'lucide-react'
import { MultiStepSignup } from './multi-step-signup'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const highlights = [
  { icon: Zap, text: 'Cronómetros avanzados (AMRAP, EMOM, Tabata)' },
  { icon: Target, text: 'Cálculo automático de RM y progresión' },
  { icon: Users, text: 'Gestión multi-box y comunidad activa' },
  { icon: TrendingUp, text: 'Rex: Tu asistente inteligente de entrenamiento' },
]

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; tab?: string }>
}) {
  const { error, message, tab } = await searchParams

  return (
    <div
      className="min-h-[100dvh] flex flex-col md:flex-row bg-background relative overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* ── Background atmosphere ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-primary/12 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-primary/8 blur-[100px]" />
        <div className="absolute top-1/3 left-0 w-48 h-48 rounded-full bg-primary/6 blur-[80px]" />
      </div>

      {/* ── Left Panel (desktop only) ── */}
      <div className="hidden md:flex md:w-[45%] flex-col justify-between p-12 relative border-r border-border/20">
        {/* Logo + back */}
          <Link href="/">
            <Image src="/images/logotipo.png" alt="LDRFIT" width={160} height={44} className="object-contain" />
          </Link>
          <div className="flex flex-col items-center gap-2">
            <Image src="/images/happy.png" alt="Rex Happy" width={60} height={60} className="object-contain" />
            <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">¡Hola! Soy Rex</p>
          </div>

        {/* Value prop */}
        <div className="space-y-8">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary mb-3">Plataforma CrossFit</p>
            <h1 className="text-5xl font-black tracking-tight leading-[0.95] uppercase">
              Entrena.<br />
              Mejora.<br />
              <span className="text-primary">Supérate.</span>
            </h1>
          </div>

          <div className="space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4">
          {[{ v: '10K+', l: 'Atletas' }, { v: '50K+', l: 'Marcas' }, { v: '99.9%', l: 'Uptime' }].map(s => (
            <div key={s.l} className="bg-white/5 backdrop-blur-md rounded-3xl p-4 border border-white/10 text-center shadow-xl">
              <p className="text-2xl font-black text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.3)]">{s.v}</p>
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel / Form ── */}
      <div className="flex-1 flex flex-col min-h-[100dvh] md:min-h-0 relative z-10">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-5 h-14 border-b border-border/20 bg-background/60 backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Volver</span>
          </Link>
          <Link href="/">
            <Image src="/images/isotipo.png" alt="LDRFIT" width={40} height={40} className="object-contain opacity-60 grayscale" />
          </Link>
          <div className="w-16" /> {/* spacer */}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-5 py-10">
          <div className="w-full max-w-[360px] space-y-8">
            {/* Header */}
            <div className="space-y-1">
              <h2 className="text-2xl font-black uppercase tracking-tight">Bienvenido de vuelta</h2>
              <p className="text-sm text-muted-foreground">Accede a tu panel de entrenamiento.</p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue={tab === 'register' ? 'register' : 'login'} className="w-full">
              <TabsList className="w-full h-11 rounded-2xl bg-secondary/50 p-1">
                <TabsTrigger
                  value="login"
                  className="flex-1 rounded-xl font-bold uppercase tracking-widest text-[11px] data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                >
                  Entrar
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="flex-1 rounded-xl font-bold uppercase tracking-widest text-[11px] data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                >
                  Registro
                </TabsTrigger>
              </TabsList>

              {/* Success message */}
              {message && (
                <div className="mt-4 p-4 text-sm text-green-400 bg-green-500/10 rounded-2xl border border-green-500/20 font-medium">
                  {message}
                </div>
              )}

              {/* Login Tab */}
              <TabsContent value="login" className="mt-6">
                <form action={login} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email</label>
                    <Input
                      id="email" name="email" type="email"
                      placeholder="atleta@ejemplo.com"
                      required
                      className="h-12 rounded-2xl bg-secondary/40 border-border/40 focus:border-primary/50 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contraseña</label>
                    <Input
                      id="password" name="password" type="password"
                      required
                      placeholder="••••••••"
                      className="h-12 rounded-2xl bg-secondary/40 border-border/40 focus:border-primary/50 text-sm"
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-destructive font-semibold bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-2">
                      {error}
                    </p>
                  )}
                  <Button
                    type="submit"
                    className="w-full h-14 text-sm font-black uppercase tracking-widest rounded-2xl bg-white text-black hover:bg-white/90 shadow-[0_12px_30px_rgba(255,255,255,0.15)] active:scale-95 transition-all mt-4 border-none"
                  >
                    Iniciar Sesión
                  </Button>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register" className="mt-6">
                <MultiStepSignup error={error} />
              </TabsContent>
            </Tabs>

            {/* Back link (desktop) */}
            <div className="hidden md:flex items-center justify-center">
              <Link href="/" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-semibold">
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver a la página principal
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile: mini highlights */}
        <div className="md:hidden px-5 pb-6 space-y-3"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
          <div className="grid grid-cols-2 gap-2">
            {highlights.map(({ icon: Icon, text }) => (
              <div key={text} className="glass rounded-2xl p-3 flex items-center gap-2 border-border/30">
                <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                <p className="text-[10px] font-semibold text-muted-foreground leading-tight">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
