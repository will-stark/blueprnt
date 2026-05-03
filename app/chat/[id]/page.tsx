'use client'

// Per-chat URL page — /chat/[id]
// Claude Code will wire up real data fetching here.
// For now redirects to the main chat interface.
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ChatPage({ params }: { params: { id: string } }) {
  const router = useRouter()

  useEffect(() => {
    // TODO: Claude Code — load chat by params.id and render in ChatView
    router.replace('/')
  }, [router])

  return (
    <div
      className="flex h-screen items-center justify-center"
      style={{ backgroundColor: 'var(--bg-canvas)', color: 'var(--text-muted)' }}
    >
      <p className="text-[14px]">Loading chat...</p>
    </div>
  )
}
