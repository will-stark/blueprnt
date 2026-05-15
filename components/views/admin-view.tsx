'use client'

import { useState, useEffect, useCallback } from 'react'
import { Shield, Loader2 } from 'lucide-react'
import { TicketList } from '@/components/admin/ticket-list'
import { TicketDetail } from '@/components/admin/ticket-detail'
import {
  AnonymousToggleCard,
  RecentEventsCard,
  ActivityBarChart,
  PlatformSplitCard,
  TicketStatsCard,
} from '@/components/admin/dashboard-cards'
import type { Ticket } from '@/lib/mock-data'
import type { TicketStatus } from '@/components/ui/status-badge'

type AdminTab = 'dashboard' | 'tickets'

interface AdminStats {
  requestsToday: number
  dailyCap: number
  totalUsers: number
  newUsersThisWeek: number
  activeUsersToday: number
  anonymousEnabled: boolean
  recentEvents: Array<{ type: string; username: string; timestamp: string }>
  ticketStats: { open: number; in_progress: number; resolved: number; total: number }
  platformSplit: { farcaster: number; privy: number }
  last7Days: Array<{ day: string; count: number }>
}

interface AdminViewProps {
  identityType: string | null
  identityId: string | null
  email?: string | null
}

function StatCard({
  label,
  value,
  sub,
  progress,
  highlight,
}: {
  label: string
  value: string
  sub?: string
  progress?: { value: number; max: number }
  highlight?: boolean
}) {
  const pct = progress ? (progress.value / progress.max) * 100 : 0
  const barColor = pct >= 100 ? 'var(--danger)' : pct >= 80 ? 'var(--warning)' : 'var(--accent)'

  return (
    <div
      className="p-5 rounded-2xl border-[0.5px] border-[var(--border)]"
      style={{ backgroundColor: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
      <div
        className="font-mono text-[22px] md:text-[28px]"
        style={{ color: highlight ? 'var(--accent)' : 'var(--text-primary)' }}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</div>
      )}
      {progress && (
        <>
          <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-raised)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }}
            />
          </div>
          <div className="mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {pct.toFixed(0)}% of daily cap
          </div>
        </>
      )}
    </div>
  )
}

export function AdminView({ identityType, identityId, email }: AdminViewProps) {
  const [tab, setTab] = useState<AdminTab>('dashboard')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)

  const authParams = `identityType=${encodeURIComponent(identityType ?? '')}&identityId=${encodeURIComponent(identityId ?? '')}&email=${encodeURIComponent(email ?? '')}`

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, ticketsRes] = await Promise.all([
        fetch(`/api/admin/stats?${authParams}`),
        fetch(`/api/admin/tickets?${authParams}`),
      ])
      if (statsRes.ok) setStats(await statsRes.json())
      if (ticketsRes.ok) {
        const data = await ticketsRes.json()
        setTickets(data.tickets ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [authParams])

  useEffect(() => { fetchData() }, [fetchData])

  const handleUpdateStatus = async (id: string, status: TicketStatus) => {
    const res = await fetch(`/api/admin/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identityType, identityId, email, status }),
    })
    if (res.ok) {
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
      setSelectedTicket((prev) => (prev?.id === id ? { ...prev, status } : prev))
    }
  }

  const handleAddNote = async (id: string, text: string) => {
    const res = await fetch(`/api/admin/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identityType, identityId, email, note: text }),
    })
    if (res.ok) {
      const data = await res.json()
      const notes: Ticket['notes'] = data.notes ?? []
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, notes } : t)))
      setSelectedTicket((prev) => (prev?.id === id ? { ...prev, notes } : prev))
    }
  }

  const handleAnonToggle = async (enabled: boolean) => {
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identityType, identityId, email, anonymousEnabled: enabled }),
    })
  }

  const openTicketsTab = () => setTab('tickets')

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 pb-12">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--accent-light)' }}
          >
            <Shield className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 className="text-[17px] md:text-[20px] font-medium" style={{ color: 'var(--text-primary)' }}>
              Admin
            </h1>
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
              Blueprnt control panel
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6">
          {(['dashboard', 'tickets'] as AdminTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 capitalize"
              style={{
                backgroundColor: tab === t ? 'var(--accent-light)' : 'transparent',
                color: tab === t ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              {t}
              {t === 'tickets' && (stats?.ticketStats?.open ?? 0) > 0 && (
                <span
                  className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ backgroundColor: 'var(--warning)', color: '#000' }}
                >
                  {stats!.ticketStats.open}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-muted)' }} />
          </div>
        ) : tab === 'dashboard' && stats ? (
          <div className="space-y-4">

            {/* Row 1: KPI stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Blueprints today"
                value={stats.requestsToday.toLocaleString()}
                sub={`cap: ${stats.dailyCap.toLocaleString()}`}
                progress={{ value: stats.requestsToday, max: stats.dailyCap }}
              />
              <StatCard
                label="Total users"
                value={stats.totalUsers.toLocaleString()}
                sub={stats.newUsersThisWeek > 0 ? `+${stats.newUsersThisWeek} this week` : undefined}
              />
              <StatCard
                label="Active today"
                value={stats.activeUsersToday.toLocaleString()}
                highlight={stats.activeUsersToday > 0}
              />
              <StatCard
                label="Open tickets"
                value={stats.ticketStats.open.toLocaleString()}
                highlight={stats.ticketStats.open > 0}
              />
            </div>

            {/* Row 2: Activity chart + Platform split */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ActivityBarChart data={stats.last7Days} />
              <PlatformSplitCard
                farcaster={stats.platformSplit.farcaster}
                privy={stats.platformSplit.privy}
              />
            </div>

            {/* Row 3: Ticket breakdown + Anon toggle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TicketStatsCard stats={stats.ticketStats} onViewTickets={openTicketsTab} />
              <AnonymousToggleCard
                initialState={stats.anonymousEnabled}
                onToggle={handleAnonToggle}
              />
            </div>

            {/* Row 4: Recent events */}
            <RecentEventsCard events={stats.recentEvents} />
          </div>

        ) : tab === 'tickets' ? (
          <div className={`grid gap-6 ${selectedTicket ? 'md:grid-cols-[1fr_480px]' : ''}`}>
            <TicketList
              tickets={tickets}
              onSelectTicket={setSelectedTicket}
              selectedId={selectedTicket?.id}
            />
            {selectedTicket && (
              <div className="md:sticky md:top-6 self-start">
                <TicketDetail
                  ticket={selectedTicket}
                  onClose={() => setSelectedTicket(null)}
                  onUpdateStatus={handleUpdateStatus}
                  onAddNote={handleAddNote}
                />
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
