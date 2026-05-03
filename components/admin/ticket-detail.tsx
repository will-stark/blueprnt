'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { StatusBadge, type TicketStatus } from '@/components/ui/status-badge'
import type { MockTicket } from '@/lib/mock-data'

interface TicketDetailProps {
  ticket: MockTicket
  onClose: () => void
  onUpdateStatus: (id: string, status: TicketStatus) => void
  onAddNote: (id: string, note: string) => void
}

const STATUS_OPTIONS: TicketStatus[] = ['open', 'in_progress', 'resolved']

export function TicketDetail({ ticket, onClose, onUpdateStatus, onAddNote }: TicketDetailProps) {
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveDone, setSaveDone] = useState(false)

  const handleSaveNote = () => {
    if (!note.trim()) return
    setSaving(true)
    setTimeout(() => {
      onAddNote(ticket.id, note.trim())
      setNote('')
      setSaving(false)
      setSaveDone(true)
      setTimeout(() => setSaveDone(false), 2000)
    }, 800)
  }

  return (
    <div
      className="flex flex-col h-full rounded-2xl border-[0.5px] border-[var(--border)] overflow-hidden"
      style={{ backgroundColor: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b-[0.5px] border-[var(--border)]">
        <div>
          <h3 className="text-[15px] font-medium" style={{ color: 'var(--text-primary)' }}>
            {ticket.title}
          </h3>
          <p className="text-[12px] mt-0.5 font-mono" style={{ color: 'var(--text-muted)' }}>
            #{ticket.shortId}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close ticket"
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--bg-raised)]"
          style={{ color: 'var(--text-muted)' }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Meta */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>User</span>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-primary)' }}>
              {ticket.userDisplay}
            </p>
          </div>
          <div>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Submitted</span>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-primary)' }}>
              {new Date(ticket.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Status selector */}
        <div>
          <span className="text-[11px] block mb-2" style={{ color: 'var(--text-muted)' }}>Status</span>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => onUpdateStatus(ticket.id, s)}
                className="transition-all duration-150"
                style={{ opacity: ticket.status === s ? 1 : 0.5 }}
              >
                <StatusBadge status={s} />
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <span className="text-[11px] block mb-2" style={{ color: 'var(--text-muted)' }}>Description</span>
          <div
            className="p-4 rounded-xl border-[0.5px] border-[var(--border)] text-[13px] leading-relaxed whitespace-pre-wrap"
            style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-secondary)' }}
          >
            {ticket.description}
          </div>
        </div>

        {/* Admin notes */}
        {ticket.notes && ticket.notes.length > 0 && (
          <div>
            <span className="text-[11px] block mb-2" style={{ color: 'var(--text-muted)' }}>Admin notes</span>
            <div className="space-y-2">
              {ticket.notes.map((n, i) => (
                <div
                  key={i}
                  className="px-4 py-3 rounded-xl border-[0.5px] border-[var(--border)] text-[13px]"
                  style={{ backgroundColor: 'var(--accent-light)', color: 'var(--text-secondary)' }}
                >
                  <p>{n.text}</p>
                  <p className="text-[11px] mt-1.5 font-mono" style={{ color: 'var(--text-faint)' }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add note footer */}
      <div className="p-4 border-t-[0.5px] border-[var(--border)]" style={{ backgroundColor: 'var(--bg-raised)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !saving && handleSaveNote()}
            placeholder="Add a note..."
            className="flex-1 px-3 py-2 bg-[var(--bg-surface)] border-[0.5px] border-[var(--border)] rounded-lg text-[13px] placeholder:text-[var(--text-muted)] transition-colors focus:outline-none focus:border-[var(--accent)]"
            style={{ color: 'var(--text-primary)' }}
          />
          <button
            onClick={handleSaveNote}
            disabled={!note.trim() || saving}
            className="px-3 py-2 rounded-lg text-[12px] font-medium text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saveDone ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
