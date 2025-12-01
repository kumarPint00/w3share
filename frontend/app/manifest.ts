import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DogeGiFty - Send Kindness, Onchain',
    short_name: 'DogeGiFty',
    description: 'Send Onchain gifts in seconds. DogeGiFty makes it easy to spread kind gestures. Powered by DogeGF.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fff7fb',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon',
      },
    ],
  }
}
