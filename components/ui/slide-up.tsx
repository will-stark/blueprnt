'use client'

import { useEffect } from 'react'

interface SlideUpProps {
  onClose: () => void
  children: React.ReactNode
}

export function SlideUp({ onClose, children }: SlideUpProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* Panel */}
      <div
        className="relative w-full md:max-w-md bg-[var(--bg-surface)] border-[0.5px] border-[var(--border)] rounded-t-3xl md:rounded-2xl p-6 animate-[slideUp_300ms_ease-out]"
        style={{ boxShadow: 'var(--shadow-lg)' }}
      >
        {/* Drag handle (mobile only) */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--border)] md:hidden" />
        {children}
      </div>
    </div>
  )
}
