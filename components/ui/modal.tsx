'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  title?: string
  onClose?: () => void
  children: React.ReactNode
  maxWidth?: string
}

export function Modal({ title, onClose, children, maxWidth = 'max-w-md' }: ModalProps) {
  // Close on Escape (only when onClose is provided)
  useEffect(() => {
    if (!onClose) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      {/* Modal panel */}
      <div
        className={`relative w-full ${maxWidth} bg-[var(--bg-surface)] border-[0.5px] border-[var(--border)] rounded-2xl animate-[modalIn_250ms_ease-out] flex flex-col max-h-[90dvh]`}
        style={{ boxShadow: 'var(--shadow-modal)' }}
      >
        {title && (
          <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b-[0.5px] border-[var(--border)]">
            <h2 className="text-[16px] font-medium" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h2>
            {onClose && (
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors duration-200 hover:bg-[var(--bg-raised)]"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        <div className="overflow-y-auto flex-1 min-h-0">
          {children}
        </div>
      </div>
    </div>
  )
}
