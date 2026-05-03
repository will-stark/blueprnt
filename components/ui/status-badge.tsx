export type TicketStatus = 'open' | 'in_progress' | 'resolved'

const statusConfig: Record<TicketStatus, { bg: string; text: string; border: string; label: string }> = {
  open: {
    bg: 'var(--accent-light)',
    text: 'var(--accent)',
    border: 'var(--accent)',
    label: 'Open',
  },
  in_progress: {
    bg: 'var(--warning-light)',
    text: 'var(--warning)',
    border: 'var(--warning)',
    label: 'In progress',
  },
  resolved: {
    bg: 'var(--success-light)',
    text: 'var(--success)',
    border: 'var(--success)',
    label: 'Resolved',
  },
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  const config = statusConfig[status]
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border-[0.5px] whitespace-nowrap"
      style={{
        backgroundColor: config.bg,
        color: config.text,
        borderColor: config.border,
      }}
    >
      {config.label}
    </span>
  )
}
