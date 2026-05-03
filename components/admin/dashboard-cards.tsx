'use client'

import { useState } from 'react'
import { MOCK_ADMIN_STATS } from '@/lib/mock-data'

function StatCard({ label, value, sub, progress }: {
  label: string
  value: string
  sub?: string
  progress?: { value: number; max: number }
}) {
  const pct = progress ? (progress.value / progress.max) * 100 : 0
  const barColor = pct >= 100 ? 'var(--danger)' : pct >= 80 ? 'var(--warning)' : 'var(--accent)'

  return (
    <div
      className="p-6 rounded-2xl border-[0.5px] border-[var(--border)] transition-all duration-300 hover:-translate-y-0.5"
      style={{ backgroundColor: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="text-[12px] mb-2" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="font-mono text-[28px] font-normal" style={{ color: 'var(--text-primary)' }}>
        {value}
        {sub && (
          <span className="text-[18px] ml-1" style={{ color: 'var(--text-muted)' }}>{sub}</span>
        )}
      </div>
      {progress && (
        <>
          <div
            className="mt-4 h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--bg-raised)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }}
            />
          </div>
          <div className="mt-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {pct.toFixed(0)}% of daily cap
          </div>
        </>
      )}
    </div>
  )
}

export function AnonymousToggleCard({ initialState }: { initialState: boolean }) {
  const [enabled, setEnabled] = useState(initialState)

  return (
    <div
      className="p-6 rounded-2xl border-[0.5px] border-[var(--border)] transition-all duration-300 hover:-translate-y-0.5"
      style={{ backgroundColor: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="text-[12px] mb-2" style={{ color: 'var(--text-muted)' }}>Anonymous access</div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-[16px] font-medium" style={{ color: 'var(--text-primary)' }}>
            {enabled ? 'On' : 'Off'}
          </p>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {enabled
              ? 'Web users can use without signing in'
              : 'Web users must sign in before using'}
          </p>
        </div>

        {/* Toggle switch */}
        <button
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled((v) => !v)}
          className="relative w-12 h-6 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] shrink-0"
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

export function UsageStatsCard() {
  const { requestsToday, dailyCap, totalUsers } = MOCK_ADMIN_STATS
  return (
    <div className="grid gap-4">
      <StatCard
        label="Requests today"
        value={requestsToday.toLocaleString()}
        sub={`/ ${dailyCap.toLocaleString()}`}
        progress={{ value: requestsToday, max: dailyCap }}
      />
      <StatCard
        label="Total users"
        value={totalUsers.toLocaleString()}
      />
    </div>
  )
}

export function RecentEventsCard() {
  const { recentEvents } = MOCK_ADMIN_STATS

  const eventLabels: Record<string, string> = {
    generation_completed: 'Blueprint generated',
    edit_completed: 'Edit completed',
    credits_purchased: 'Credits purchased',
    share_verified: 'Share verified',
    ticket_submitted: 'Ticket submitted',
  }

  const eventColors: Record<string, string> = {
    generation_completed: 'var(--accent)',
    edit_completed: 'var(--success)',
    credits_purchased: 'var(--warning)',
    share_verified: 'var(--success)',
    ticket_submitted: 'var(--text-muted)',
  }

  return (
    <div
      className="p-6 rounded-2xl border-[0.5px] border-[var(--border)] col-span-1 lg:col-span-1 transition-all duration-300 hover:-translate-y-0.5"
      style={{ backgroundColor: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="text-[12px] mb-4" style={{ color: 'var(--text-muted)' }}>Recent events</div>
      <div className="space-y-3 overflow-hidden">
        {recentEvents.slice(0, 8).map((event, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
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
    </div>
  )
}
