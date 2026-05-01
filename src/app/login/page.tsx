import { login, signup } from './actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dumbbell } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string, message?: string }>
}) {
  const resolvedSearchParams = await searchParams;
  const error = resolvedSearchParams?.error;
  const message = resolvedSearchParams?.message;

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <CardTitle className="flex justify-center mb-2">
            <Link href="/">
              <Image src="/images/logo.png" alt="Jimi.coach Logo" width={220} height={60} className="object-contain hover:opacity-80 transition-opacity dark:invert" />
            </Link>
          </CardTitle>
          <CardDescription className="text-base">
            ¡Tu plataforma exclusiva de entrenamiento CrossFit! 🏋️‍♀️✨
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Iniciar Sesión 🔓</TabsTrigger>
              <TabsTrigger value="register">Registrarse 📝</TabsTrigger>
            </TabsList>
            
            {message && <div className="mb-4 p-4 text-sm text-green-800 bg-green-100 dark:bg-green-900/30 dark:text-green-400 rounded-md border border-green-200 dark:border-green-800 font-medium">{message}</div>}
            <TabsContent value="login">
              <form action={login} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="atleta@ejemplo.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" name="password" type="password" required />
                </div>
                {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                <Button className="w-full text-md font-bold h-11" type="submit">Entrar 🚀</Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form action={signup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nombre completo</Label>
                  <Input id="full_name" name="full_name" placeholder="John Doe" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="atleta@ejemplo.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" name="password" type="password" required />
                </div>
                {/* Role is automatically set to 'athlete' in the backend */}
                {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                <Button className="w-full text-md font-bold h-11" type="submit">Crear cuenta ✨</Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
