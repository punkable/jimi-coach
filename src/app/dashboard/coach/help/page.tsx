import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { HelpCircle, Users, Dumbbell, Crown, Video, Trash2, Calendar } from 'lucide-react'

export default function HelpCenterPage() {
  return (
    <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto">
      <header>
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <HelpCircle className="w-8 h-8 text-primary" />
              Centro de Ayuda
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Aprende a sacarle el máximo provecho a la plataforma LDRFIT con Rex, tu asistente.
            </p>
          </div>
          <Image src="/images/support.png" alt="Rex Support" width={80} height={80} className="rex-art" />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <Card className="glass border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" /> Modalidades y Planes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong>¿Para qué sirve?</strong> Aquí creas los servicios que vendes (ej. Small Groups, Presencial Full).</p>
            <p><strong>Clases por defecto:</strong> Cuando le asignas un plan a un alumno, se le cargará este número de clases automáticamente para que puedas ir descontándoselas a medida que asiste.</p>
          </CardContent>
        </Card>

        <Card className="glass border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Alumnos (Soft Delete)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong>No más errores:</strong> Si haces click en "Archivar Alumno", este no se borra de la base de datos, sino que se oculta para no estorbar en tu lista principal.</p>
            <p><strong>¿Cómo lo recupero?</strong> Ve a la <span className="font-bold text-foreground">Papelera</span> y dale click en "Restaurar". Volverá con todos sus datos y progresos intactos.</p>
          </CardContent>
        </Card>

        <Card className="glass border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-primary" /> Creador de Rutinas (Drag & Drop)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Añadir ejercicios:</strong> Haz click en "Añadir al último bloque" desde la librería de la derecha.</p>
            <p><strong>Reordenar:</strong> Mantén presionado el icono de los 6 puntitos al lado del nombre del ejercicio y arrástralo arriba o abajo para cambiar el orden. Funciona tanto en tu celular como en la computadora.</p>
            <p className="text-destructive font-bold">Importante: Siempre recuerda darle al botón "Guardar Plan" arriba a la derecha.</p>
          </CardContent>
        </Card>

        <Card className="glass border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Bloqueo de Alumnos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong>¿Qué pasa si un alumno no paga?</strong> Si su contador de clases llega a 0 (Cero), la aplicación se bloqueará y le mostrará un aviso grande para que se comunique contigo por WhatsApp para renovar su plan.</p>
            <p><strong>¿Cómo evitarlo?</strong> Ve a su perfil y súmale las clases o renueva su modalidad en el "Control de Clases".</p>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
