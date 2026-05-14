'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'

// Clear All Chats
interface ClearAllModalProps {
  onClose: () => void
  onConfirm: () => void
}

export function ClearAllModal({ onClose, onConfirm }: ClearAllModalProps) {
  return (
    <Modal title="Clear all chats" onClose={onClose}>
      <div className="p-6 space-y-5">
        <p className="text-[14px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          This will permanently delete all your chats and blueprints. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border-[0.5px] border-[var(--border)] text-[13px] font-medium transition-all duration-200 hover:bg-[var(--bg-raised)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            className="flex-1 py-2.5 rounded-lg text-[13px] font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: 'var(--danger)' }}
          >
            Clear all
          </button>
        </div>
      </div>
    </Modal>
  )
}

// Delete Chat
interface DeleteChatModalProps {
  chatTitle: string
  onClose: () => void
  onConfirm: () => void
}

export function DeleteChatModal({ chatTitle, onClose, onConfirm }: DeleteChatModalProps) {
  return (
    <Modal title="Delete chat" onClose={onClose}>
      <div className="p-6 space-y-5">
        <p className="text-[14px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Delete{' '}
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
            &ldquo;{chatTitle}&rdquo;
          </span>
          ? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border-[0.5px] border-[var(--border)] text-[13px] font-medium transition-all duration-200 hover:bg-[var(--bg-raised)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            className="flex-1 py-2.5 rounded-lg text-[13px] font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: 'var(--danger)' }}
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  )
}

// Rename Chat
interface RenameChatModalProps {
  currentTitle: string
  onClose: () => void
  onSave: (newTitle: string) => void
}

export function RenameChatModal({ currentTitle, onClose, onSave }: RenameChatModalProps) {
  const [value, setValue] = useState(currentTitle)

  const handleSave = () => {
    if (value.trim()) {
      onSave(value.trim())
      onClose()
    }
  }

  return (
    <Modal title="Rename chat" onClose={onClose}>
      <div className="p-6 space-y-4">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoFocus
          className="w-full px-4 py-3 bg-[var(--bg-surface)] border-[0.5px] border-[var(--border)] rounded-lg text-[14px] transition-colors duration-200 focus:outline-none focus:border-[var(--accent)]"
          style={{ color: 'var(--text-primary)' }}
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border-[0.5px] border-[var(--border)] text-[13px] font-medium transition-all duration-200 hover:bg-[var(--bg-raised)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!value.trim()}
            className="flex-1 py-2.5 rounded-lg text-[13px] font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  )
}

// New Chat Warning (anonymous user has messages)
interface NewChatWarningModalProps {
  onClose: () => void
  onConfirm: () => void
}

export function NewChatWarningModal({ onClose, onConfirm }: NewChatWarningModalProps) {
  return (
    <Modal title="Start a new chat?" onClose={onClose}>
      <div className="p-6 space-y-5">
        <p className="text-[14px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Your current chat will be lost. Sign in to save chats permanently.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border-[0.5px] border-[var(--border)] text-[13px] font-medium transition-all duration-200 hover:bg-[var(--bg-raised)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            className="flex-1 py-2.5 rounded-lg text-[13px] font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            Proceed
          </button>
        </div>
      </div>
    </Modal>
  )
}

// Account Creation Prompt (anonymous pushed to sign up)
interface AccountPromptModalProps {
  onClose: () => void
  onLogin?: () => void
}

export function AccountPromptModal({ onClose, onLogin }: AccountPromptModalProps) {
  const handleLogin = () => {
    onClose()
    onLogin?.()
  }

  return (
    <Modal title="Create an account" onClose={onClose}>
      <div className="p-6 space-y-4">
        <p className="text-[14px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Sign up to get 3 free blueprints, save your chats, and access all features.
        </p>
        <div className="space-y-2">
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-2.5 py-3 rounded-lg border-[0.5px] border-[var(--border)] text-[13px] font-medium transition-all duration-200 hover:bg-[var(--bg-raised)]"
            style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-surface)' }}
          >
            {/* Google icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </button>
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-2.5 py-3 rounded-lg border-[0.5px] border-[var(--border)] text-[13px] font-medium transition-all duration-200 hover:bg-[var(--bg-raised)]"
            style={{ color: 'var(--text-primary)', backgroundColor: 'var(--bg-surface)' }}
          >
            {/* Email icon */}
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            Sign up with email
          </button>
        </div>
        <button
          onClick={onClose}
          className="w-full py-2 text-[12px] transition-colors hover:underline"
          style={{ color: 'var(--text-muted)' }}
        >
          Continue as guest
        </button>
      </div>
    </Modal>
  )
}
