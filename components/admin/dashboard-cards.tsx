'use client'

import { useState } from 'react'

// ── Activity bar chart (7-day blueprints generated) ────────────────────────

export function ActivityBarChart({
  data,
}: {
  data: Array<{ day: string; count: number }>
}) {
  const total = data.reduce((s, d) => s + d.count, 0)
  const max = Math.max(...data.map((d) => d.count), 1)
  const W = 280
  const H = 64
  const barW = (W / data.length) * 0.52
  const gap = W / data.length

  return (
    <div
      className="p-5 rounded-2xl border-[0.5px] border-[var(--border)] md:col-span-2"
      style={{ backgroundColor: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
        Blueprints — last 7 days
      </div>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="font-mono text-[22px] md:text-[28px]" style={{ color: 'var(--text-primary)' }}>
          {total}
        </span>
        <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>this week</span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H + 16}`}
        width="100%"
        style={{ overflow: 'visible' }}
        aria-hidden="true"
      >
        {data.map((d, i) => {
          const bh = Math.max((d.count / max) * H, d.count > 0 ? 3 : 0)
          const x = i * gap + (gap - barW) / 2
          return (
            <g key={i}>
              {/* background slot */}
              <rect
                x={x} y={0} width={barW} height={H} rx={3}
                style={{ fill: 'var(--bg-raised)' }}
              />
              {/* value bar */}
              {d.count > 0 && (
                <rect
                  x={x} y={H - bh} width={barW} height={bh} rx={3}
                  style={{ fill: 'var(--accent)', opacity: 0.85 }}
                />
              )}
              {/* day label */}
              <text
                x={x + barW / 2} y={H + 13}
                textAnchor="middle"
                fontSize={8}
                style={{ fill: 'var(--text-muted)', fontFamily: 'inherit' }}
              >
                {d.day}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Platform split donut ───────────────────────────────────────────────────

export function PlatformSplitCard({
  farcaster,
  privy,
}: {
  farcaster: number
  privy: number
}) {
  const total = farcaster + privy || 1
  const fcPct = Math.round((farcaster / total) * 100)
  const privyPct = 100 - fcPct

  const cx = 28, cy = 28, r = 20, sw = 7
  const circ = 2 * Math.PI * r
  const fcDash = (farcaster / total) * circ

  return (
    <div
      className="p-5 rounded-2xl border-[0.5px] border-[var(--border)]"
      style={{ backgroundColor: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
        User platforms
      </div>
      <div className="font-mono text-[22px] md:text-[28px] mb-4" style={{ color: 'var(--text-primary)' }}>
        {farcaster + privy}
      </div>

      <div className="flex items-center gap-4">
        <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
          {/* background ring */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            strokeWidth={sw}
            style={{ stroke: 'var(--bg-raised)' }}
          />
          {/* farcaster arc */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            strokeWidth={sw}
            strokeLinecap="butt"
            strokeDasharray={`${fcDash} ${circ}`}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ stroke: 'var(--accent)' }}
          />
        </svg>

        <div className="space-y-2 text-[12px]" style={{ color: 'var(--text-secondary)' }}>
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-sm shrink-0"
              style={{ backgroundColor: 'var(--accent)' }}
            />
            <span>Farcaster</span>
            <span className="font-mono ml-auto pl-2" style={{ color: 'var(--text-primary)' }}>
              {farcaster} <span style={{ color: 'var(--text-muted)' }}>({fcPct}%)</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-sm shrink-0"
              style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border)' }}
            />
            <span>Privy</span>
            <span className="font-mono ml-auto pl-2" style={{ color: 'var(--text-primary)' }}>
              {privy} <span style={{ color: 'var(--text-muted)' }}>({privyPct}%)</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Ticket status breakdown ────────────────────────────────────────────────

export function TicketStatsCard({
  stats,
  onViewTickets,
}: {
  stats: { open: number; in_progress: number; resolved: number; total: number }
  onViewTickets?: () => void
}) {
  const rows = [
    { label: 'Open', count: stats.open, color: 'var(--warning)' },
    { label: 'In progress', count: stats.in_progress, color: 'var(--accent)' },
    { label: 'Resolved', count: stats.resolved, color: 'var(--success)' },
  ]

  return (
    <div
      className="p-5 rounded-2xl border-[0.5px] border-[var(--border)]"
      style={{ backgroundColor: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Tickets
        </div>
        {onViewTickets && stats.open > 0 && (
          <button
            onClick={onViewTickets}
            className="text-[11px] transition-colors"
            style={{ color: 'var(--accent)' }}
          >
            View all →
          </button>
        )}
      </div>
      <div className="font-mono text-[22px] md:text-[28px] mb-4" style={{ color: 'var(--text-primary)' }}>
        {stats.total}
        {stats.open > 0 && (
          <span className="text-[12px] ml-2 font-sans font-medium" style={{ color: 'var(--warning)' }}>
            {stats.open} open
          </span>
        )}
      </div>

      {stats.total === 0 ? (
        <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>No tickets yet</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.label}>
              <div className="flex justify-between text-[11px] mb-1">
                <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{row.count}</span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--bg-raised)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${stats.total ? (row.count / stats.total) * 100 : 0}%`,
                    backgroundColor: row.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Anonymous access toggle ────────────────────────────────────────────────

export function AnonymousToggleCard({
  initialState,
  onToggle,
}: {
  initialState: boolean
  onToggle?: (enabled: boolean) => Promise<void>
}) {
  const [enabled, setEnabled] = useState(initialState)
  const [saving, setSaving] = useState(false)

  const handleToggle = async () => {
    const next = !enabled
    setEnabled(next)
    if (onToggle) {
      setSaving(true)
      try {
        await onToggle(next)
      } catch {
        setEnabled(!next)
      } finally {
        setSaving(false)
      }
    }
  }

  return (
    <div
      className="p-5 rounded-2xl border-[0.5px] border-[var(--border)]"
      style={{ backgroundColor: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
        Anonymous access
      </div>

      <div className="flex items-center justify-between mt-3">
        <div>
          <p className="text-[15px] font-medium" style={{ color: 'var(--text-primary)' }}>
            {enabled ? 'Enabled' : 'Disabled'}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {enabled ? 'Unsigned users can use without login' : 'Login required before use'}
          </p>
        </div>
        <button
          role="switch"
          aria-checked={enabled}
          onClick={handleToggle}
          disabled={saving}
          className="relative w-11 h-6 rounded-full transition-all duration-200 shrink-0 disabled:opacity-60 focus-visible:outline-none"
          style={{ backgroundColor: enabled ? 'var(--accent)' : 'var(--bg-muted)' }}
        >
          <span
            className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200"
            style={{ left: enabled ? 'calc(100% - 20px)' : 4 }}
          />
        </button>
      </div>
    </div>
  )
}

// ── Recent events feed ────────────────────────────────────────────────────

export function RecentEventsCard({
  events,
}: {
  events: Array<{ type: string; username: string; timestamp: string }>
}) {
  const eventLabels: Record<string, string> = {
    generation_completed: 'Blueprint generated',
    edit_completed: 'Edit completed',
    generation: 'Blueprint generated',
    credits_purchased: 'Credits purchased',
    share_verified: 'Share verified',
    ticket_submitted: 'Ticket submitted',
    off_topic_strike: 'Off-topic strike',
  }

  const eventColors: Record<string, string> = {
    generation_completed: 'var(--accent)',
    generation: 'var(--accent)',
    edit_completed: 'var(--success)',
    credits_purchased: 'var(--warning)',
    share_verified: 'var(--success)',
    ticket_submitted: 'var(--text-muted)',
    off_topic_strike: 'var(--danger)',
  }

  return (
    <div
      className="p-5 rounded-2xl border-[0.5px] border-[var(--border)]"
      style={{ backgroundColor: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="text-[11px] uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
        Recent events
      </div>
      {events.length === 0 ? (
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>No events yet</p>
      ) : (
        <div className="divide-y divide-[var(--border)]">
          {events.slice(0, 8).map((event, i) => (
            <div key={i} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: eventColors[event.type] ?? 'var(--text-muted)' }}
                />
                <div className="min-w-0">
                  <span className="text-[12px] block truncate" style={{ color: 'var(--text-secondary)' }}>
                    {eventLabels[event.type] ?? event.type}
                  </span>
                  <span className="text-[11px] truncate block" style={{ color: 'var(--text-muted)' }}>
                    {event.username}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-mono shrink-0" style={{ color: 'var(--text-faint)' }}>
                {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
