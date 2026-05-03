'use client'

import { useState } from 'react'
import { Shield } from 'lucide-react'
import { TicketList } from '@/components/admin/ticket-list'
import { TicketDetail } from '@/components/admin/ticket-detail'
import { UsageStatsCard, AnonymousToggleCard, RecentEventsCard } from '@/components/admin/dashboard-cards'
import { MOCK_TICKETS, MOCK_ADMIN_STATS } from '@/lib/mock-data'
import type { MockTicket } from '@/lib/mock-data'
import type { TicketStatus } from '@/components/ui/status-badge'

type AdminTab = 'dashboard' | 'tickets'

export function AdminView() {
  const [tab, setTab] = useState<AdminTab>('dashboard')
  const [tickets, setTickets] = useState<MockTicket[]>(MOCK_TICKETS)
  const [selectedTicket, setSelectedTicket] = useState<MockTicket | null>(null)

  const handleUpdateStatus = (id: string, status: TicketStatus) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
    setSelectedTicket((prev) => (prev?.id === id ? { ...prev, status } : prev))
  }

  const handleAddNote = (id: string, text: string) => {
    const note = { text, createdAt: new Date().toISOString() }
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, notes: [...(t.notes ?? []), note] } : t))
    )
    setSelectedTicket((prev) =>
      prev?.id === id ? { ...prev, notes: [...(prev.notes ?? []), note] } : prev
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-6 pb-12">
        {/* Admin Header */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--accent-light)' }}
          >
            <Shield className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 className="text-[20px] font-medium" style={{ color: 'var(--text-primary)' }}>
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
            </button>
          ))}
        </div>

        {tab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats row */}
            <div className="grid gap-4 md:grid-cols-3">
              <div
                className="p-6 rounded-2xl border-[0.5px] border-[var(--border)]"
                style={{ backgroundColor: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)' }}
              >
                <div className="text-[12px] mb-2" style={{ color: 'var(--text-muted)' }}>Requests today</div>
                <div className="font-mono text-[28px]" style={{ color: 'var(--text-primary)' }}>
                  {MOCK_ADMIN_STATS.requestsToday.toLocaleString()}
                  <span className="text-[16px] ml-1" style={{ color: 'var(--text-muted)' }}>
                    / {MOCK_ADMIN_STATS.dailyCap.toLocaleString()}
                  </span>
                </div>
                <div
                  className="mt-3 h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--bg-raised)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(MOCK_ADMIN_STATS.requestsToday / MOCK_ADMIN_STATS.dailyCap) * 100}%`,
                      backgroundColor: 'var(--accent)',
                    }}
                  />
                </div>
              </div>

              <div
                className="p-6 rounded-2xl border-[0.5px] border-[var(--border)]"
                style={{ backgroundColor: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)' }}
              >
                <div className="text-[12px] mb-2" style={{ color: 'var(--text-muted)' }}>Total users</div>
                <div className="font-mono text-[28px]" style={{ color: 'var(--text-primary)' }}>
                  {MOCK_ADMIN_STATS.totalUsers.toLocaleString()}
                </div>
              </div>

              <AnonymousToggleCard initialState={MOCK_ADMIN_STATS.anonymousEnabled} />
            </div>

            {/* Recent events */}
            <RecentEventsCard />
          </div>
        )}

        {tab === 'tickets' && (
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
        )}
      </div>
    </div>
  )
}
