'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { ChatBox } from '@/components/chat/chat-box'
import { PromptTips } from '@/components/chat/prompt-tips'
import { UserMessage, AIMessage, ZeroEditsMessage } from '@/components/chat/message'
import { ZeroCreditsSlideUp } from '@/components/modals/continue-chat-slideup'
import { ContinueChatRegistered, ContinueChatAnon } from '@/components/modals/continue-chat-slideup'
import { AccountPromptModal } from '@/components/modals/confirm-modals'
import type { MockUser, MockMessage, MockChat } from '@/lib/mock-data'

interface ChatViewProps {
  user: MockUser
  credits: number
  edits: number
  messages: MockMessage[]
  onMessagesChange: (messages: MockMessage[] | ((prev: MockMessage[]) => MockMessage[])) => void
  onInputChange: (v: string) => void
  inputValue: string
  onOpenPurchase: () => void
  anonymousAllowed?: boolean
  onLogin?: () => void
  onGenerate?: () => void
  isMobile?: boolean
  // Phase 2: real generation
  identityId?: string | null
  anonymousId?: string | null
  activeChatId?: string
  onChatCreated?: (chat: MockChat) => void
}

type ActiveSlideUp = 'none' | 'zero_credits' | 'zero_edits' | 'anon_limit' | 'account_prompt'

export function ChatView({
  user,
  credits,
  edits,
  messages,
  onMessagesChange,
  onInputChange,
  inputValue,
  onOpenPurchase,
  anonymousAllowed = true,
  onLogin,
  onGenerate,
  isMobile = false,
  identityId,
  anonymousId,
  activeChatId,
  onChatCreated,
}: ChatViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [slideUp, setSlideUp] = useState<ActiveSlideUp>('none')
  const editsRef = useRef(edits)
  const creditsRef = useRef(credits)
  editsRef.current = edits
  creditsRef.current = credits

  const hasMessages = messages.length > 0
  const zeroEdits = edits === 0 && hasMessages
  const isFarcaster = user.type === 'farcaster'
  const isAnonymous = user.type === 'anonymous'

  // Scroll to bottom on new message / stream update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isStreaming) return

    // Anonymous checks
    if (isAnonymous) {
      if (!anonymousAllowed) {
        setSlideUp('account_prompt')
        return
      }
      if (creditsRef.current === 0 || hasMessages) {
        setSlideUp('anon_limit')
        return
      }
    }

    // Registered: zero credits
    if (!isAnonymous && creditsRef.current === 0) {
      setSlideUp('zero_credits')
      return
    }

    // Registered: zero edits on follow-up
    if (!isAnonymous && hasMessages && editsRef.current === 0) {
      setSlideUp('zero_edits')
      return
    }

    const currentInput = inputValue
    const userMsg: MockMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: currentInput,
      createdAt: new Date().toISOString(),
    }
    onMessagesChange([...messages, userMsg])
    onInputChange('')
    setIsStreaming(true)
    setStreamingContent('')

    try {
      const body: Record<string, unknown> = {
        userType: user.type,
        message: currentInput,
      }

      if (isAnonymous) {
        body.anonymousId = anonymousId
      } else {
        body.identityId = identityId
        // Only include chatId for real DB chats (UUIDs). Pending new chats use a
        // local "chat_TIMESTAMP" placeholder that isn't in the DB yet — omitting
        // it signals the server to create a new chat row.
        if (activeChatId && !activeChatId.startsWith('chat_')) {
          body.chatId = activeChatId
        }
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        if (isAnonymous) setSlideUp('anon_limit')
        else if (err.error === 'no_credits') setSlideUp('zero_credits')
        else if (err.error === 'no_edits') setSlideUp('zero_edits')
        setIsStreaming(false)
        setStreamingContent('')
        return
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? '' // keep incomplete line for next chunk

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          let data: Record<string, unknown>
          try {
            data = JSON.parse(line.slice(6))
          } catch {
            continue
          }

          if (data.text) {
            accumulated += data.text as string
            setStreamingContent(accumulated)
          }

          if (data.error) {
            console.error('[CHAT] Generation error from server:', data.error)
            setIsStreaming(false)
            setStreamingContent('')
            return
          }

          if (data.done) {
            // Commit the streamed content into the messages array
            const assistantMsg: MockMessage = {
              id: (Date.now() + 1).toString(),
              role: 'assistant',
              content: accumulated,
              createdAt: new Date().toISOString(),
            }
            onMessagesChange((prev: MockMessage[]) => [...prev, assistantMsg])
            setStreamingContent('')

            if (isAnonymous) {
              const anonChat: MockChat = {
                id: `anon_${Date.now()}`,
                title: currentInput.slice(0, 60).trim() + (currentInput.length > 60 ? '...' : ''),
                updatedAt: new Date().toISOString(),
                editsRemaining: 0,
              }
              try {
                const stored = JSON.parse(localStorage.getItem('blueprnt-anon-state') || '{"chats":[]}')
                stored.chats = [anonChat, ...(stored.chats || [])]
                localStorage.setItem('blueprnt-anon-state', JSON.stringify(stored))
              } catch { /* ignore */ }
              onChatCreated?.(anonChat)
              onGenerate?.()
            } else if (data.chatId && data.title) {
              // Registered: notify app-shell so it can update sidebar + URL
              onChatCreated?.({
                id: data.chatId as string,
                title: data.title as string,
                updatedAt: new Date().toISOString(),
                editsRemaining: editsRef.current,
              })
            }
          }
        }
      }
    } catch (err) {
      console.error('[CHAT] Fetch error:', err)
    } finally {
      setIsStreaming(false)
    }
  }, [
    inputValue, isStreaming, hasMessages, isAnonymous, anonymousAllowed,
    messages, onMessagesChange, onInputChange, onGenerate, onChatCreated,
    identityId, anonymousId, activeChatId, user.type,
  ])

  // TODO Phase 2.1: replace with real edit API call
  const handleRegenerate = useCallback(() => {
    console.log('[CHAT] Regenerate not yet wired to real API — Phase 2.1')
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Scroll area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 pt-6 pb-4">
        {!hasMessages && !isStreaming ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full gap-6 max-w-xl mx-auto">
            <h1
              className="text-[32px] font-medium text-center text-balance"
              style={{ color: 'var(--text-primary)' }}
            >
              What will you build?
            </h1>
            <PromptTips />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            {messages.map((msg) =>
              msg.role === 'user' ? (
                <UserMessage key={msg.id} content={msg.content} />
              ) : (
                <AIMessage key={msg.id} content={msg.content} onRegenerate={handleRegenerate} />
              )
            )}

            {/* Streaming AI message */}
            {isStreaming && streamingContent && (
              <AIMessage content={streamingContent} isStreaming />
            )}

            {/* Zero edits nudge */}
            {zeroEdits && !isStreaming && <ZeroEditsMessage />}
          </div>
        )}
      </div>

      {/* Input area */}
      <div
        className="shrink-0 px-4 md:px-8 pt-4 border-t-[0.5px] border-[var(--border)]"
        style={{
          backgroundColor: 'var(--bg-canvas)',
          paddingBottom: isMobile
            ? 'max(1rem, env(safe-area-inset-bottom))'
            : '1rem',
        }}
      >
        <div className="max-w-2xl mx-auto">
          <ChatBox
            value={inputValue}
            onChange={onInputChange}
            onSend={handleSend}
            isStreaming={isStreaming}
            disabled={zeroEdits}
            placeholder={
              hasMessages
                ? 'Follow up or refine your blueprint...'
                : undefined
            }
          />
        </div>
      </div>

      {/* SlideUps */}
      {slideUp === 'zero_credits' && (
        <ZeroCreditsSlideUp
          onClose={() => setSlideUp('none')}
          onPurchase={() => { onOpenPurchase(); setSlideUp('none') }}
          isFarcaster={isFarcaster}
        />
      )}
      {slideUp === 'zero_edits' && (
        <ContinueChatRegistered
          onClose={() => setSlideUp('none')}
          onPurchase={() => { onOpenPurchase(); setSlideUp('none') }}
        />
      )}
      {slideUp === 'anon_limit' && (
        <ContinueChatAnon
          onClose={() => setSlideUp('none')}
          onCreateAccount={() => setSlideUp('account_prompt')}
        />
      )}
      {slideUp === 'account_prompt' && (
        <AccountPromptModal onClose={() => setSlideUp('none')} onLogin={onLogin} />
      )}
    </div>
  )
}
