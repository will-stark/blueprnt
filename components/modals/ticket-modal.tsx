'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'

interface TicketModalProps {
  onClose: () => void
}

type SubmitState = 'idle' | 'loading' | 'success' | 'error'

export function TicketModal({ onClose }: TicketModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')

  const titlePct = title.length / 100
  const descPct = description.length / 1000

  const titleCounterColor =
    titlePct >= 1 ? 'var(--danger)' : titlePct >= 0.9 ? 'var(--warning)' : 'var(--text-muted)'
  const descCounterColor =
    descPct >= 1 ? 'var(--danger)' : descPct >= 0.9 ? 'var(--warning)' : 'var(--text-muted)'

  const handleSubmit = () => {
    if (!title.trim() || !description.trim()) return
    setSubmitState('loading')
    // Simulate API call
    setTimeout(() => {
      setSubmitState('success')
      setTimeout(onClose, 2000)
    }, 1200)
  }

  return (
    <Modal title="Submit a ticket" onClose={onClose}>
      <div className="p-6 space-y-4">
        {submitState === 'success' ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-[15px] font-medium" style={{ color: 'var(--text-primary)' }}>Ticket submitted</p>
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
              {"Your ticket has been submitted. We'll look into it."}
            </p>
          </div>
        ) : (
          <>
            {submitState === 'error' && (
              <div
                className="px-4 py-3 rounded-xl border-[0.5px] border-[var(--danger)] text-[13px]"
                style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}
              >
                Something went wrong. Please try again.
              </div>
            )}

            {/* Title */}
            <div>
              <label
                className="block text-[12px] font-medium mb-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                placeholder="Short description of your issue..."
                className="w-full px-4 py-3 bg-[var(--bg-surface)] border-[0.5px] border-[var(--border)] rounded-lg text-[14px] placeholder:text-[var(--text-muted)] transition-colors duration-200 focus:outline-none focus:border-[var(--accent)]"
                style={{ color: 'var(--text-primary)' }}
              />
              <div
                className="text-right text-[11px] font-mono mt-1"
                style={{ color: titleCounterColor }}
              >
                {title.length} / 100
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                className="block text-[12px] font-medium mb-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                placeholder="Describe what happened in detail..."
                rows={5}
                className="w-full px-4 py-3 bg-[var(--bg-surface)] border-[0.5px] border-[var(--border)] rounded-lg text-[14px] placeholder:text-[var(--text-muted)] resize-none transition-colors duration-200 focus:outline-none focus:border-[var(--accent)]"
                style={{ color: 'var(--text-primary)' }}
              />
              <div
                className="text-right text-[11px] font-mono mt-1"
                style={{ color: descCounterColor }}
              >
                {description.length} / 1000
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!title.trim() || !description.trim() || submitState === 'loading'}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {submitState === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitState === 'loading' ? 'Submitting...' : 'Submit ticket'}
            </button>
          </>
        )}
      </div>
    </Modal>
  )
}
