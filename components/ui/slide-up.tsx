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
        className="relative w-full md:max-w-md bg-[var(--bg-surface)] border-[0.5px] border-[var(--border)] rounded-t-3xl md:rounded-2xl animate-[slideUp_300ms_ease-out] flex flex-col max-h-[90dvh]"
        style={{
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Drag handle (mobile only) — sticky at top */}
        <div className="shrink-0 pt-4 pb-1 md:hidden">
          <div className="mx-auto h-1 w-10 rounded-full bg-[var(--border)]" />
        </div>
        {/* Scrollable content */}
        <div
          className="overflow-y-auto flex-1 min-h-0 px-5 pt-3 pb-5 md:p-6"
          style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))' }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
