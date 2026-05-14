import type { Metadata } from 'next'
import { AppShell } from '@/components/views/app-shell'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://blueprnt.app'
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'Blueprnt'

export const metadata: Metadata = {
  other: {
    'fc:miniapp': JSON.stringify({
      version: '1',
      name: APP_NAME,
      iconUrl: `${APP_URL}/icon.png`,
      homeUrl: APP_URL,
      splashImageUrl: `${APP_URL}/splash.png`,
      splashBackgroundColor: '#FAFAF7',
    }),
  },
}

export default function HomePage() {
  return <AppShell />
}
