'use client'

import { useRef, useEffect } from 'react'
import { SendHorizonal } from 'lucide-react'

interface ChatBoxProps {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  disabled?: boolean
  isStreaming?: boolean
  placeholder?: string
  maxChars?: number
}

export function ChatBox({
  value,
  onChange,
  onSend,
  disabled = false,
  isStreaming = false,
  placeholder = 'Describe your app — who it\'s for, what it does...',
  maxChars = 1000,
}: ChatBoxProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const MIN_CHARS = 10
  const count = value.length
  const pct = count / maxChars

  // Auto-expand textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }, [value])

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && canSend) {
      e.preventDefault()
      onSend()
    }
  }

  const trimmed = value.trim()
  const canSend = trimmed.length >= MIN_CHARS && !disabled && !isStreaming

  const counterColor =
    pct >= 1
      ? 'var(--danger)'
      : pct >= 0.9
      ? 'var(--warning)'
      : 'var(--text-muted)'

  return (
    <div className="w-full space-y-1.5">
      {/* Character nudge */}
      {trimmed.length > 0 && trimmed.length < MIN_CHARS && (
        <p className="text-[12px] px-1" style={{ color: 'var(--text-muted)' }}>
          Please describe your app idea in more detail.
        </p>
      )}
      {trimmed.length >= MIN_CHARS && trimmed.length < 50 && (
        <p className="text-[12px] px-1" style={{ color: 'var(--text-muted)' }}>
          Adding more detail will improve your blueprint.
        </p>
      )}

      <div
        className="relative flex items-end gap-2 bg-[var(--bg-surface)] border-[0.5px] border-[var(--border)] rounded-2xl px-4 py-3 transition-colors duration-200 focus-within:border-[var(--accent)]"
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          maxLength={maxChars}
          rows={1}
          disabled={disabled || isStreaming}
          className="flex-1 bg-transparent resize-none text-[16px] md:text-[14px] leading-relaxed focus:outline-none disabled:opacity-50"
          style={{
            color: 'var(--text-primary)',
            minHeight: '24px',
            maxHeight: '136px',
          }}
        />

        <button
          onClick={onSend}
          disabled={!canSend}
          aria-label="Send message"
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-white transition-all duration-200 hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: canSend ? 'var(--accent)' : 'var(--text-faint)' }}
        >
          <SendHorizonal className="w-4 h-4" />
        </button>
      </div>

      {/* Counter */}
      {count > 0 && (
        <div
          className="text-right text-[12px] font-mono pr-1"
          style={{ color: counterColor }}
        >
          {count} / {maxChars}
        </div>
      )}
    </div>
  )
}
