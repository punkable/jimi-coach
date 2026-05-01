import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, CheckCircle2, Crown, Info } from 'lucide-react'
import { createMembership, deleteMembership } from './actions'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export default async function MembershipsPage() {
  const supabase = await createClient()

  // Fetch active memberships
  const { data: memberships } = await supabase
    .from('memberships')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Crown className="w-8 h-8 text-primary" />
            Modalidades y Planes
          </h1>
          <p className="text-muted-foreground mt-1">
            Crea los planes que ofreces en tu academia para asignarlos a tus alumnos.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form to Create New */}
        <div className="lg:col-span-1">
          <Card className="border-primary/20 sticky top-24">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Nuevo Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createMembership} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Plan</Label>
                  <Input id="name" name="name" placeholder="Ej: Small Groups 12 Clases" required className="bg-background/50 border-white/10 focus-visible:ring-primary" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="default_classes" className="flex items-center gap-1">
                    Clases Mensuales
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[200px] text-xs">Clases que se le asignarán por defecto al alumno cuando elijas este plan.</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input id="default_classes" name="default_classes" type="number" defaultValue="12" required className="bg-background/50 border-white/10" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Precio Mensual ($) - Opcional</Label>
                  <Input id="price" name="price" type="number" placeholder="Ej: 59990" className="bg-background/50 border-white/10" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción Corta</Label>
                  <textarea 
                    id="description" 
                    name="description" 
                    className="flex min-h-[60px] w-full rounded-md border border-white/10 bg-background/50 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none"
                    placeholder="Entrenamiento guiado presencial..."
                  ></textarea>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="benefits" className="flex items-center gap-1">
                    Beneficios (separados por coma)
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="w-[200px] text-xs">Escribe beneficios separados por comas. Ej: Uso de App, Correcciones, Comunidad.</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <textarea 
                    id="benefits" 
                    name="benefits" 
                    className="flex min-h-[60px] w-full rounded-md border border-white/10 bg-background/50 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none"
                    placeholder="Acceso a la app, Coach presencial, Comunidad..."
                  ></textarea>
                </div>

                <Button type="submit" className="w-full font-bold uppercase tracking-widest mt-4">Crear Plan</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* List of Active Memberships */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memberships && memberships.length > 0 ? (
              memberships.map((plan) => (
                <Card key={plan.id} className="flex flex-col bg-card/40 backdrop-blur-sm border-white/5 hover:border-primary/30 transition-colors">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl font-bold uppercase tracking-wide">{plan.name}</CardTitle>
                        <CardDescription className="mt-1">{plan.description || 'Sin descripción'}</CardDescription>
                      </div>
                      {plan.price > 0 && (
                        <span className="font-black text-lg text-primary">${plan.price.toLocaleString('es-CL')}</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 text-sm space-y-3">
                    <div className="inline-flex items-center rounded-sm bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {plan.default_classes} Clases incluidas
                    </div>
                    
                    {plan.benefits && plan.benefits.length > 0 && (
                      <ul className="space-y-2 mt-4 border-t border-white/5 pt-4">
                        {plan.benefits.map((benefit: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-muted-foreground">
                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                  <CardFooter className="pt-4 border-t border-white/5 mt-auto bg-black/10 flex justify-end">
                    <form action={async () => {
                      'use server'
                      await deleteMembership(plan.id)
                    }}>
                      <Tooltip>
                        <TooltipTrigger>
                          <Button variant="ghost" size="icon" type="submit" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">Enviar a la papelera</p>
                        </TooltipContent>
                      </Tooltip>
                    </form>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-16 text-center border-2 border-dashed border-white/10 rounded-xl">
                <Crown className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-muted-foreground">No tienes planes creados</h3>
                <p className="text-sm text-muted-foreground/70 mt-1 max-w-sm mx-auto">
                  Crea tu primer plan a la izquierda para poder asignárselo a tus alumnos.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
