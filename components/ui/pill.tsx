interface PillProps {
  value: number
  label: string
  isZero?: boolean
  timerText?: string
}

export function Pill({ value, label, isZero, timerText }: PillProps) {
  const zero = isZero ?? value === 0

  return (
    <div className="inline-flex items-center gap-1.5">
      <div
        className="inline-flex items-center px-2 py-1 rounded-md font-mono text-[11px] whitespace-nowrap border-[0.5px]"
        style={{
          backgroundColor: zero ? 'var(--danger-light)' : 'var(--bg-raised)',
          borderColor: zero ? 'var(--danger)' : 'var(--border)',
          color: zero ? 'var(--danger)' : 'var(--mono-text)',
        }}
      >
        {value} {label}
      </div>
      {zero && timerText && (
        <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {timerText}
        </span>
      )}
    </div>
  )
}
