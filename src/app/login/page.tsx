import { login } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Zap, Target, Users, TrendingUp, Timer, Video } from 'lucide-react'
import { MultiStepSignup } from './multi-step-signup'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const highlights = [
  { icon: Timer, text: 'Timers CrossFit claros', color: 'warmup' },
  { icon: Target, text: 'Cargas y objetivos', color: 'strength' },
  { icon: Video, text: 'Videos técnicos', color: 'gymnastics' },
  { icon: TrendingUp, text: 'Progreso y feedback', color: 'metcon' },
]

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; tab?: string }>
}) {
  const { error, tab } = await searchParams

  return (
    <div className="min-h-[100dvh] grid lg:grid-cols-[1.05fr_0.95fr] bg-background overflow-hidden">
      <section className="relative hidden lg:flex flex-col justify-between p-10 xl:p-14 border-r border-border/70 overflow-hidden">
        <Image
          src="/images/hero.png"
          alt="Entrenamiento CrossFit"
          fill
          priority
          className="object-cover object-center"
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/86 to-background/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/20" />

        <div className="relative z-10">
          <Link href="/" className="inline-flex">
            <Image src="/images/logofinal.svg" alt="LDRFIT" width={176} height={50} className="brand-logo" />
          </Link>
        </div>

        <div className="relative z-10 max-w-xl">
          <p className="section-title text-primary mb-4">CrossFit coaching platform</p>
          <h1 className="text-6xl xl:text-7xl font-black uppercase tracking-tight leading-[0.88]">
            Entrena con estructura.
          </h1>
          <p className="text-lg text-muted-foreground font-semibold mt-6 max-w-md">
            Una experiencia simple para que coach y atleta sepan qué hacer, cómo hacerlo y cómo progresar.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-3 max-w-xl">
          {highlights.map(({ icon: Icon, text, color }) => (
            <AccessChip key={text} icon={Icon} text={text} color={color} />
          ))}
        </div>
      </section>

      <section className="relative flex flex-col min-h-[100dvh]">
        <div className="lg:hidden flex items-center justify-between px-5 h-16 border-b border-border/60 bg-background/90 backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Volver</span>
          </Link>
          <Image src="/images/logofinal.svg" alt="LDRFIT" width={120} height={34} className="brand-logo" />
          <div className="w-14" />
        </div>

        <div className="flex-1 flex items-center justify-center px-5 py-8 md:py-12">
          <div className="w-full max-w-[430px] ios-panel p-6 md:p-8">
            <div className="text-center mb-7">
              <div className="w-18 h-18 rounded-[24px] bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
                <Image src="/images/happy.png" alt="Rex Happy" width={54} height={54} className="rex-art" />
              </div>
              <p className="section-title text-primary mb-2">Acceso LDRFIT</p>
              <h2 className="text-3xl font-black uppercase tracking-tight">Bienvenido</h2>
              <p className="text-sm text-muted-foreground mt-2">Entra a tu panel o crea tu cuenta de atleta.</p>
            </div>

            <Tabs defaultValue={tab === 'register' ? 'register' : 'login'} className="w-full">
              <TabsList className="w-full h-13 rounded-2xl bg-secondary p-1 mb-7">
                <TabsTrigger value="login" className="flex-1 rounded-xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-background data-[state=active]:text-foreground">
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="register" className="flex-1 rounded-xl font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-background data-[state=active]:text-foreground">
                  Registro
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form action={login} className="space-y-5">
                  <div className="space-y-2">
                    <label className="section-title">Email</label>
                    <Input id="email" name="email" type="email" placeholder="atleta@ejemplo.com" required className="h-13 rounded-2xl bg-secondary/55 border-border/70" />
                  </div>
                  <div className="space-y-2">
                    <label className="section-title">Contraseña</label>
                    <Input id="password" name="password" type="password" required placeholder="••••••••" className="h-13 rounded-2xl bg-secondary/55 border-border/70" />
                  </div>
                  {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl">
                      <p className="text-xs font-black uppercase tracking-widest text-destructive text-center">{error}</p>
                    </div>
                  )}
                  <Button type="submit" className="w-full h-14 text-xs font-black uppercase tracking-[0.18em] rounded-2xl">
                    Acceder ahora
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-3">
                <MultiStepSignup error={error} />
              </TabsContent>
            </Tabs>

            <div className="mt-7 flex items-center justify-center">
              <Link href="/" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-semibold">
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver a la página principal
              </Link>
            </div>
          </div>
        </div>

        <div className="lg:hidden px-5 pb-6 grid grid-cols-2 gap-2">
          {highlights.map(({ icon: Icon, text, color }) => (
            <AccessChip key={text} icon={Icon} text={text} color={color} />
          ))}
        </div>
      </section>
    </div>
  )
}

function AccessChip({ icon: Icon, text, color }: { icon: any, text: string, color: string }) {
  const colorMap: Record<string, string> = {
    warmup: 'text-[var(--warmup)] bg-[var(--warmup)]/10 border-[var(--warmup)]/20',
    strength: 'text-[var(--strength)] bg-[var(--strength)]/10 border-[var(--strength)]/20',
    gymnastics: 'text-[var(--gymnastics)] bg-[var(--gymnastics)]/10 border-[var(--gymnastics)]/20',
    metcon: 'text-[var(--metcon)] bg-[var(--metcon)]/10 border-[var(--metcon)]/20',
  }

  return (
    <div className="ios-panel p-3 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${colorMap[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-tight text-foreground/75 leading-tight">{text}</p>
    </div>
  )
}
