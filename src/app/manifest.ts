import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LDRFIT',
    short_name: 'LDRFIT',
    description: 'Plataforma de entrenamiento CrossFit',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#8A0000', // Un rojo vibrante por defecto basado en los colores dark
    icons: [
      {
        src: '/images/isotipo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/images/isotipo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
