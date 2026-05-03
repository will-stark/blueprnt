interface LogoMarkProps {
  size?: number
}

export function LogoMark({ size = 22 }: LogoMarkProps) {
  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: 'var(--accent)',
        borderRadius: size * 0.23,
      }}
    >
      <svg
        width={size * 0.64}
        height={size * 0.64}
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden="true"
      >
        <rect x="1" y="1" width="5" height="5" rx="1" fill="white" />
        <rect x="8" y="1" width="5" height="5" rx="1" fill="white" />
        <rect x="1" y="8" width="5" height="5" rx="1" fill="white" />
        <rect x="8" y="8" width="5" height="5" rx="1" fill="white" />
      </svg>
    </div>
  )
}

interface LogoProps {
  size?: 'header' | 'sidebar' | 'large' | 'splash'
}

const sizeMap = {
  header:  { mark: 22, text: 15 },
  sidebar: { mark: 24, text: 16 },
  large:   { mark: 48, text: 24 },
  splash:  { mark: 64, text: 28 },
}

export function Logo({ size = 'header' }: LogoProps) {
  const { mark, text } = sizeMap[size]
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Blueprnt'

  return (
    <div className="flex items-center gap-2">
      <LogoMark size={mark} />
      <span
        className="font-heading font-medium"
        style={{
          fontSize: text,
          color: 'var(--text-primary)',
          letterSpacing: '0.02em',
        }}
      >
        {appName}
      </span>
    </div>
  )
}
