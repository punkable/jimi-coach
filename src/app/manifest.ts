import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LDRFIT',
    short_name: 'LDRFIT',
    description: 'Plataforma de entrenamiento CrossFit',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#0f110a',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
