import type { MockUser } from '@/lib/mock-data'

interface UserPFPProps {
  user: Pick<MockUser, 'username' | 'pfpUrl' | 'pfpGradient'>
  size?: number
}

export function UserPFP({ user, size = 28 }: UserPFPProps) {
  const initials = user.username.slice(0, 2).toUpperCase()

  if (user.pfpUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.pfpUrl}
        alt={user.username}
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0 select-none"
      style={{
        width: size,
        height: size,
        background: user.pfpGradient ?? 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
        fontSize: size * 0.36,
        color: '#fff',
        fontWeight: 500,
      }}
      aria-label={user.username}
    >
      {initials}
    </div>
  )
}
