import { login } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Timer, Target, Video, TrendingUp } from 'lucide-react'
import { MultiStepSignup } from './multi-step-signup'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const features = [
  { icon: Timer,      text: 'Timers CrossFit integrados',  color: 'warmup'     },
  { icon: Target,     text: 'Cargas y objetivos claros',   color: 'strength'   },
  { icon: Video,      text: 'Videos técnicos en el WOD',   color: 'gymnastics' },
  { icon: TrendingUp, text: 'Progreso y feedback directo',  color: 'metcon'     },
]

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; tab?: string }>
}) {
  const { error, tab } = await searchParams

  return (
    <div className="min-h-[100dvh] grid lg:grid-cols-2 bg-background overflow-hidden">

      {/* ── Left panel: Brand ── */}
      <section className="relative hidden lg:flex flex-col justify-between p-10 xl:p-14 overflow-hidden border-r border-border">
        <Image
          src="/images/hero.png"
          alt="CrossFit training"
          fill priority
          className="object-cover object-center"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

        <div className="relative z-10">
          <Image src="/images/logofinal.svg" alt="LDRFIT" width={160} height={46} className="brand-logo" />
        </div>

        <div className="relative z-10 max-w-lg">
          <p className="section-title text-primary mb-4">CrossFit coaching platform</p>
          <h1 className="text-5xl xl:text-6xl font-black uppercase tracking-tight leading-[0.9]">
            Entrena con<br />estructura.
          </h1>
          <p className="text-base text-muted-foreground font-medium mt-5 max-w-sm leading-relaxed">
            La plataforma que conecta coach y atleta para que sepan qué hacer, cómo hacerlo y cómo progresar.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-2.5 max-w-sm">
          {features.map(({ icon: Icon, text, color }) => (
            <FeatureChip key={text} icon={Icon} text={text} color={color} />
          ))}
        </div>
      </section>

      {/* ── Right panel: Auth ── */}
      <section className="flex flex-col min-h-[100dvh]">

        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-5 h-14 border-b border-border bg-card/80 backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Inicio</span>
          </Link>
          <Image src="/images/logofinal.svg" alt="LDRFIT" width={110} height={32} className="brand-logo" />
          <div className="w-14" />
        </div>

        <div className="flex-1 flex items-center justify-center px-5 py-10">
          <div className="w-full max-w-[400px] space-y-6">

            {/* Card */}
            <div className="ios-panel p-6 md:p-8">
              {/* Icon + title */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Image src="/images/happy.png" alt="LDRFIT" width={48} height={48} className="rex-art" />
                </div>
                <p className="section-title text-primary mb-1.5">Acceso LDRFIT</p>
                <h2 className="text-2xl font-black uppercase tracking-tight">Bienvenido</h2>
                <p className="text-sm text-muted-foreground mt-1.5">Ingresa a tu panel o crea tu cuenta.</p>
              </div>

              {/* Tabs */}
              <Tabs defaultValue={tab === 'register' ? 'register' : 'login'} className="w-full">
                <TabsList className="w-full h-11 rounded-2xl bg-secondary p-1 mb-6">
                  <TabsTrigger
                    value="login"
                    className="flex-1 rounded-xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  >
                    Entrar
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className="flex-1 rounded-xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  >
                    Registro
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form action={login} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="section-title">Email</label>
                      <Input
                        name="email" type="email" placeholder="atleta@ejemplo.com" required
                        className="h-12 rounded-xl bg-secondary/60 border-border/80 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="section-title">Contraseña</label>
                      <Input
                        name="password" type="password" placeholder="••••••••" required
                        className="h-12 rounded-xl bg-secondary/60 border-border/80 text-sm"
                      />
                    </div>
                    {error && (
                      <div className="p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl">
                        <p className="text-xs font-bold text-destructive text-center">{error}</p>
                      </div>
                    )}
                    <Button type="submit" className="w-full h-12 text-xs font-black uppercase tracking-widest rounded-xl mt-1">
                      Acceder ahora
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <MultiStepSignup error={error} />
                </TabsContent>
              </Tabs>
            </div>

            <p className="text-center text-[11px] text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors font-semibold">
                ← Volver a la página principal
              </Link>
            </p>
          </div>
        </div>

        {/* Mobile features */}
        <div className="lg:hidden px-5 pb-6 grid grid-cols-2 gap-2">
          {features.map(({ icon: Icon, text, color }) => (
            <FeatureChip key={text} icon={Icon} text={text} color={color} />
          ))}
        </div>
      </section>
    </div>
  )
}

function FeatureChip({ icon: Icon, text, color }: { icon: any; text: string; color: string }) {
  const colorMap: Record<string, string> = {
    warmup:     'text-[var(--warmup)] bg-[var(--warmup)]/10 border-[var(--warmup)]/20',
    strength:   'text-[var(--strength)] bg-[var(--strength)]/10 border-[var(--strength)]/20',
    gymnastics: 'text-[var(--gymnastics)] bg-[var(--gymnastics)]/10 border-[var(--gymnastics)]/20',
    metcon:     'text-[var(--metcon)] bg-[var(--metcon)]/10 border-[var(--metcon)]/20',
  }
  return (
    <div className="ios-panel p-3 flex items-center gap-2.5">
      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${colorMap[color]}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <p className="text-[11px] font-bold text-foreground/70 leading-tight">{text}</p>
    </div>
  )
}
