'use client'

import { useState } from 'react'
import { StatusBadge, type TicketStatus } from '@/components/ui/status-badge'
import type { MockTicket } from '@/lib/mock-data'

type Filter = 'all' | TicketStatus

interface TicketListProps {
  tickets: MockTicket[]
  onSelectTicket: (ticket: MockTicket) => void
  selectedId?: string
}

export function TicketList({ tickets, onSelectTicket, selectedId }: TicketListProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(1)
  const perPage = 10

  const filtered = filter === 'all' ? tickets : tickets.filter((t) => t.status === filter)
  const totalPages = Math.ceil(filtered.length / perPage)
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  const filters: { label: string; value: Filter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Open', value: 'open' },
    { label: 'In progress', value: 'in_progress' },
    { label: 'Resolved', value: 'resolved' },
  ]

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-1">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setPage(1) }}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150"
            style={{
              backgroundColor: filter === f.value ? 'var(--accent-light)' : 'transparent',
              color: filter === f.value ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div
        className="rounded-2xl border-[0.5px] border-[var(--border)] overflow-hidden"
        style={{ backgroundColor: 'var(--bg-surface)' }}
      >
        {paged.length === 0 ? (
          <div className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>
            <p className="text-[14px]">
              {filter === 'all' ? 'No tickets yet' : `No ${filter.replace('_', ' ')} tickets`}
            </p>
          </div>
        ) : (
          <>
            {/* Header row */}
            <div
              className="grid grid-cols-[1fr_auto_auto] md:grid-cols-[80px_1fr_160px_auto_120px] gap-4 px-4 py-3 border-b-[0.5px] border-[var(--border)] text-[11px] uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              <span className="hidden md:block">ID</span>
              <span>Title</span>
              <span className="hidden md:block">User</span>
              <span>Status</span>
              <span className="hidden md:block">Submitted</span>
            </div>

            {paged.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => onSelectTicket(ticket)}
                className="w-full grid grid-cols-[1fr_auto_auto] md:grid-cols-[80px_1fr_160px_auto_120px] gap-4 px-4 py-3.5 text-left border-b-[0.5px] border-[var(--border)] last:border-b-0 transition-colors duration-150 hover:bg-[var(--bg-raised)]"
                style={{
                  backgroundColor: selectedId === ticket.id ? 'var(--accent-light)' : undefined,
                }}
              >
                <span className="hidden md:block font-mono text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
                  #{ticket.shortId.slice(0, 6)}
                </span>
                <span className="text-[13px] truncate" style={{ color: 'var(--text-primary)' }}>
                  {ticket.title}
                </span>
                <span className="hidden md:block text-[12px] truncate" style={{ color: 'var(--text-muted)' }}>
                  {ticket.userDisplay}
                </span>
                <StatusBadge status={ticket.status} />
                <span className="hidden md:block text-[11px] font-mono" style={{ color: 'var(--text-faint)' }}>
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </span>
              </button>
            ))}
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-[12px] border-[0.5px] border-[var(--border)] transition-colors hover:bg-[var(--bg-raised)] disabled:opacity-40"
            style={{ color: 'var(--text-secondary)' }}
          >
            Previous
          </button>
          <span className="text-[12px] font-mono" style={{ color: 'var(--text-muted)' }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg text-[12px] border-[0.5px] border-[var(--border)] transition-colors hover:bg-[var(--bg-raised)] disabled:opacity-40"
            style={{ color: 'var(--text-secondary)' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
