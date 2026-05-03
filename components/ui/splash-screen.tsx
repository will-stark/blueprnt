import { Logo } from '@/components/ui/logo'

export function SplashScreen() {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ backgroundColor: 'var(--bg-canvas)' }}
    >
      <div className="animate-[logoPulse_2s_ease-in-out_infinite]">
        <Logo size="splash" />
      </div>
    </div>
  )
}
