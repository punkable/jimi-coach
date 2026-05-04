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
      <div className="absolute inset-0 pointer-events-none overflow-hidden bg-[#050505]">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/15 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute top-[40%] right-[10%] w-40 h-40 rounded-full bg-primary/5 blur-[60px]" />
      </div>

      {/* ── Left Panel (desktop only) ── */}
      <div className="hidden md:flex md:w-[45%] flex-col justify-between p-16 relative border-r border-white/5 bg-black/40 backdrop-blur-3xl">
        <div className="relative z-10 space-y-20">
          {/* Logo */}
          <Link href="/" className="inline-block hover:scale-105 transition-transform">
            <Image src="/images/logotipo.png" alt="LDRFIT" width={180} height={50} className="object-contain" />
          </Link>

          {/* Value prop */}
          <div className="space-y-10">
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.4em] text-primary mb-4">The CrossFit Standard</p>
              <h1 className="text-7xl font-black tracking-tighter leading-[0.85] uppercase">
                Entrena.<br />
                Domina.<br />
                <span className="text-primary drop-shadow-[0_0_25px_rgba(204,255,0,0.4)]">Vence.</span>
              </h1>
            </div>

            <div className="space-y-6">
              {highlights.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-black transition-all duration-500">
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-6 relative z-10">
          {[{ v: '10K+', l: 'Atletas' }, { v: '50K+', l: 'Marcas' }, { v: '99.9%', l: 'Uptime' }].map(s => (
            <div key={s.l} className="bg-white/[0.03] backdrop-blur-2xl rounded-[32px] p-6 border border-white/5 text-center shadow-2xl hover:border-primary/30 transition-colors">
              <p className="text-3xl font-black text-primary">{s.v}</p>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mt-2">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel / Form ── */}
      <div className="flex-1 flex flex-col min-h-[100dvh] md:min-h-0 relative z-10 bg-black/20">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-6 h-20 border-b border-white/5 bg-black/40 backdrop-blur-2xl">
          <Link href="/" className="flex items-center gap-2 text-white/40 hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Volver</span>
          </Link>
          <Link href="/">
            <Image src="/images/logotipo.png" alt="LDRFIT" width={100} height={30} className="object-contain" />
          </Link>
          <div className="w-10" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-[400px] space-y-10 bg-white/[0.02] border border-white/5 p-8 md:p-10 rounded-[40px] backdrop-blur-3xl shadow-2xl">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-[24px] bg-primary/10 border border-primary/20">
                  <Image src="/images/happy.png" alt="Rex Happy" width={50} height={50} className="object-contain" />
                </div>
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Bienvenido</h2>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Panel de Acceso</p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue={tab === 'register' ? 'register' : 'login'} className="w-full">
              <TabsList className="w-full h-14 rounded-[22px] bg-white/5 p-1.5 border border-white/5 mb-8">
                <TabsTrigger
                  value="login"
                  className="flex-1 rounded-[18px] font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:shadow-xl transition-all duration-500"
                >
                  Entrar
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="flex-1 rounded-[18px] font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:shadow-xl transition-all duration-500"
                >
                  Registro
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <form action={login} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Email Corporativo</label>
                    <Input
                      id="email" name="email" type="email"
                      placeholder="atleta@ldrfit.com"
                      required
                      className="h-14 rounded-2xl bg-white/[0.03] border-white/10 focus:border-primary/50 text-sm font-medium px-5 transition-all focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Contraseña</label>
                    <Input
                      id="password" name="password" type="password"
                      required
                      placeholder="••••••••"
                      className="h-14 rounded-2xl bg-white/[0.03] border-white/10 focus:border-primary/50 text-sm font-medium px-5 transition-all focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                  {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl animate-shake">
                      <p className="text-xs font-black uppercase tracking-widest text-destructive text-center">
                        {error}
                      </p>
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="w-full h-16 text-xs font-black uppercase tracking-[0.2em] rounded-2xl bg-primary text-black hover:bg-primary/90 shadow-[0_15px_40px_rgba(204,255,0,0.3)] active:scale-[0.98] transition-all mt-6 border-none"
                  >
                    Acceder Ahora
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
