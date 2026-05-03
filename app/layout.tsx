import type { Metadata, Viewport } from 'next'
import { Inter, Nunito, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/theme-provider'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-heading-var',
})

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-body',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono-var',
})

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME ?? 'Blueprnt',
  description:
    'Turn any app idea into a full technical blueprint — ready to build, ready to hand off.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#FAFAF7',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="light" className={`${inter.variable} ${nunito.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased bg-[var(--bg-canvas)] text-[var(--text-primary)]">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
