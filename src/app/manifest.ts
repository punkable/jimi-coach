import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'LDRFIT',
    short_name: 'LDRFIT',
    description: 'Plataforma de entrenamiento CrossFit',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#93d500',
    icons: [
      {
        src: '/images/isotipo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/images/isotipo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/images/isotipo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
