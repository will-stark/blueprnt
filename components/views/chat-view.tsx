'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { ChatBox } from '@/components/chat/chat-box'
import { PromptTips } from '@/components/chat/prompt-tips'
import { UserMessage, AIMessage, AILoadingMessage, ZeroEditsMessage } from '@/components/chat/message'
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
  const [activeBranchIndices, setActiveBranchIndices] = useState<Record<string, number>>({})
  const [regeneratingMessageId, setRegeneratingMessageId] = useState<string | null>(null)
  const [showTakingLonger, setShowTakingLonger] = useState(false)

  const editsRef = useRef(edits)
  const creditsRef = useRef(credits)
  editsRef.current = edits
  creditsRef.current = credits

  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasMessages = messages.length > 0
  const zeroEdits = edits === 0 && hasMessages
  const isFarcaster = user.type === 'farcaster'
  const isAnonymous = user.type === 'anonymous'
  const lastAIMsgId = [...messages].reverse().find((m) => m.role === 'assistant')?.id

  // Restore branch indices from sessionStorage when chat changes
  useEffect(() => {
    if (!activeChatId) return
    try {
      const stored = sessionStorage.getItem(`blueprnt-branch-${activeChatId}`)
      setActiveBranchIndices(stored ? JSON.parse(stored) : {})
    } catch {
      setActiveBranchIndices({})
    }
  }, [activeChatId])

  // Persist branch indices to sessionStorage when they change
  useEffect(() => {
    if (!activeChatId || Object.keys(activeBranchIndices).length === 0) return
    try {
      sessionStorage.setItem(`blueprnt-branch-${activeChatId}`, JSON.stringify(activeBranchIndices))
    } catch { /* ignore */ }
  }, [activeBranchIndices, activeChatId])

  // Scroll to bottom on new message / stream update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  const clearStallTimer = useCallback(() => {
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current)
      stallTimerRef.current = null
    }
    setShowTakingLonger(false)
  }, [])

  const startStallTimer = useCallback(() => {
    clearStallTimer()
    stallTimerRef.current = setTimeout(() => setShowTakingLonger(true), 5000)
  }, [clearStallTimer])

  // Shared SSE stream reader — returns accumulated text
  const readStream = useCallback(async (
    response: Response,
    onText: (chunk: string, accumulated: string) => void,
    onDone: (accumulated: string, meta: Record<string, unknown>) => void,
    onError: () => void,
  ) => {
    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let accumulated = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        let data: Record<string, unknown>
        try {
          data = JSON.parse(line.slice(6))
        } catch {
          continue
        }

        if (data.text) {
          if (!accumulated) clearStallTimer()
          accumulated += data.text as string
          onText(data.text as string, accumulated)
        }

        if (data.error) {
          console.error('[CHAT] Generation error from server:', data.error)
          onError()
          return
        }

        if (data.done) {
          onDone(accumulated, data)
        }
      }
    }
  }, [clearStallTimer])

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isStreaming || regeneratingMessageId) return

    console.log('[CHAT] Send: userType=%s credits=%d edits=%d hasMessages=%s activeChatId=%s',
      user.type, creditsRef.current, editsRef.current, hasMessages,
      activeChatId ? activeChatId.slice(0, 10) + '…' : 'none')

    if (isAnonymous) {
      if (!anonymousAllowed) {
        console.log('[CHAT] Blocked: anonymous toggle off')
        setSlideUp('account_prompt')
        return
      }
      if (creditsRef.current === 0 || hasMessages) {
        console.log('[CHAT] Blocked: anon limit (credits=%d hasMessages=%s)',
          creditsRef.current, hasMessages)
        setSlideUp('anon_limit')
        return
      }
    }

    if (!isAnonymous && creditsRef.current === 0) {
      console.log('[CHAT] Blocked: no credits remaining')
      setSlideUp('zero_credits')
      return
    }

    if (!isAnonymous && hasMessages && editsRef.current === 0) {
      console.log('[CHAT] Blocked: no edits remaining')
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
        if (activeChatId && !activeChatId.startsWith('chat_')) {
          body.chatId = activeChatId
        }
      }

      console.log('[CHAT] POST /api/generate: userType=%s hasIdentityId=%s hasChatId=%s msgLen=%d',
        user.type, !!body.identityId, !!body.chatId, currentInput.length)

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        console.error('[CHAT] API error: status=%d error=%s', response.status, err.error)
        if (isAnonymous) setSlideUp('anon_limit')
        else if (err.error === 'no_credits') setSlideUp('zero_credits')
        else if (err.error === 'no_edits') setSlideUp('zero_edits')
        setIsStreaming(false)
        setStreamingContent('')
        return
      }

      console.log('[CHAT] Stream started')
      startStallTimer()

      await readStream(
        response,
        (_chunk, accumulated) => setStreamingContent(accumulated),
        (accumulated, meta) => {
          console.log('[CHAT] Stream done: chatId=%s title=%s',
            meta.chatId ?? 'anon', meta.title ?? '—')

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
          } else if (meta.chatId && meta.title) {
            onChatCreated?.({
              id: meta.chatId as string,
              title: meta.title as string,
              updatedAt: new Date().toISOString(),
              editsRemaining: editsRef.current,
            })
          }
        },
        () => {
          setIsStreaming(false)
          setStreamingContent('')
        },
      )
    } catch (err) {
      console.error('[CHAT] Fetch error: %s', err instanceof Error ? err.message : String(err))
    } finally {
      setIsStreaming(false)
      clearStallTimer()
    }
  }, [
    inputValue, isStreaming, regeneratingMessageId, hasMessages, isAnonymous, anonymousAllowed,
    messages, onMessagesChange, onInputChange, onGenerate, onChatCreated,
    identityId, anonymousId, activeChatId, user.type,
    startStallTimer, clearStallTimer, readStream,
  ])

  const handleRegenerate = useCallback(async (messageId: string) => {
    if (!activeChatId || activeChatId.startsWith('chat_')) return
    if (isStreaming || regeneratingMessageId) return
    if (isAnonymous) return

    if (editsRef.current === 0) {
      setSlideUp('zero_edits')
      return
    }

    const msgIdx = messages.findIndex((m) => m.id === messageId)
    const precedingUserMsg = messages[msgIdx - 1]
    if (!precedingUserMsg || precedingUserMsg.role !== 'user') return

    const message = precedingUserMsg.content

    console.log('[CHAT] Regenerate: messageId=%s chatId=%s',
      messageId.slice(0, 8) + '…', activeChatId.slice(0, 8) + '…')

    setRegeneratingMessageId(messageId)
    setStreamingContent('')
    startStallTimer()

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userType: user.type,
          message,
          isRegenerate: true,
          messageId,
          chatId: activeChatId,
          identityId,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        console.error('[CHAT] Regenerate API error: status=%d error=%s', response.status, err.error)
        if (err.error === 'no_edits') setSlideUp('zero_edits')
        clearStallTimer()
        setRegeneratingMessageId(null)
        setStreamingContent('')
        return
      }

      await readStream(
        response,
        (_chunk, accumulated) => setStreamingContent(accumulated),
        (accumulated) => {
          console.log('[CHAT] Regenerate done: messageId=%s len=%d', messageId.slice(0, 8) + '…', accumulated.length)
          const newBranch = { content: accumulated, timestamp: new Date().toISOString() }
          onMessagesChange((prev: MockMessage[]) =>
            prev.map((m) => {
              if (m.id !== messageId) return m
              return { ...m, branches: [...(m.branches ?? []), newBranch] }
            })
          )
          // Point to the newly added branch
          const currentBranches = messages.find((m) => m.id === messageId)?.branches ?? []
          const newIdx = 1 + currentBranches.length
          setActiveBranchIndices((prev) => ({ ...prev, [messageId]: newIdx }))
          setStreamingContent('')
          // Optimistic edit decrement so gate logic reflects reality before next poll
          editsRef.current = Math.max(editsRef.current - 1, 0)
        },
        () => {
          setRegeneratingMessageId(null)
          setStreamingContent('')
        },
      )
    } catch (err) {
      console.error('[CHAT] Regenerate fetch error: %s', err instanceof Error ? err.message : String(err))
      clearStallTimer()
    } finally {
      setRegeneratingMessageId(null)
      clearStallTimer()
    }
  }, [
    activeChatId, isStreaming, regeneratingMessageId, isAnonymous, messages,
    identityId, user.type, onMessagesChange,
    startStallTimer, clearStallTimer, readStream,
  ])

  const handleBranchNav = useCallback((messageId: string, direction: -1 | 1) => {
    setActiveBranchIndices((prev) => {
      const msg = messages.find((m) => m.id === messageId)
      if (!msg) return prev
      const total = 1 + (msg.branches?.length ?? 0)
      const current = prev[messageId] ?? 0
      const next = Math.max(0, Math.min(total - 1, current + direction))
      return { ...prev, [messageId]: next }
    })
  }, [messages])

  return (
    <div className="flex flex-col h-full">
      {/* Scroll area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 pt-6 pb-4">
        {!hasMessages && !isStreaming ? (
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
            {messages.map((msg) => {
              if (msg.role === 'user') {
                return <UserMessage key={msg.id} content={msg.content} />
              }

              const activeBranchIdx = activeBranchIndices[msg.id] ?? 0
              const branchCount = 1 + (msg.branches?.length ?? 0)
              const displayContent =
                activeBranchIdx === 0
                  ? msg.content
                  : (msg.branches?.[activeBranchIdx - 1]?.content ?? msg.content)
              const isLastAI = msg.id === lastAIMsgId
              const isRegen = regeneratingMessageId === msg.id

              return (
                <div key={msg.id}>
                  <AIMessage
                    content={displayContent}
                    isRegenerating={isRegen}
                    branchCount={branchCount > 1 ? branchCount : undefined}
                    activeBranchIndex={activeBranchIdx}
                    onBranchNav={(dir) => handleBranchNav(msg.id, dir)}
                    onRegenerate={
                      isLastAI && !isStreaming && !regeneratingMessageId && !isAnonymous
                        ? () => handleRegenerate(msg.id)
                        : undefined
                    }
                  />
                  {/* Streaming preview for regeneration */}
                  {isRegen && (
                    streamingContent
                      ? <AIMessage content={streamingContent} isStreaming />
                      : <AILoadingMessage showTakingLonger={showTakingLonger} />
                  )}
                </div>
              )
            })}

            {/* Streaming for initial / follow-up sends */}
            {isStreaming && !regeneratingMessageId && (
              streamingContent
                ? <AIMessage content={streamingContent} isStreaming />
                : <AILoadingMessage showTakingLonger={showTakingLonger} />
            )}

            {/* Zero edits nudge */}
            {zeroEdits && !isStreaming && !regeneratingMessageId && <ZeroEditsMessage />}
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
            isStreaming={isStreaming || !!regeneratingMessageId}
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
