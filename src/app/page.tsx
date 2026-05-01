import { redirect } from 'next/navigation'

export default function Home() {
  // Redirigir a la página principal de la aplicación (el middleware se encargará de enviarlo a /login si no está autenticado)
  redirect('/dashboard')
}
