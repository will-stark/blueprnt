'use client'

import { useRef, useEffect, useState, useCallback } from 'react'

// Reveal stream content gradually at ~1000 chars/sec instead of dumping full chunks
const CHARS_PER_FRAME = 18

function useStreamReveal() {
  const [content, setContent] = useState('')
  const pendingRef = useRef('')
  const displayedRef = useRef('')
  const rafRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null)

  const tick = useCallback(() => {
    if (!pendingRef.current) {
      rafRef.current = null
      return
    }
    const slice = pendingRef.current.slice(0, CHARS_PER_FRAME)
    pendingRef.current = pendingRef.current.slice(CHARS_PER_FRAME)
    displayedRef.current += slice
    setContent(displayedRef.current)
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const addChunk = useCallback((chunk: string) => {
    pendingRef.current += chunk
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(tick)
    }
  }, [tick])

  const reset = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    pendingRef.current = ''
    displayedRef.current = ''
    setContent('')
  }, [])

  return { content, addChunk, reset }
}
import { AlertTriangle } from 'lucide-react'
import { ChatBox } from '@/components/chat/chat-box'
import { PromptTips } from '@/components/chat/prompt-tips'
import { UserMessage, AIMessage, AILoadingMessage, ZeroEditsMessage } from '@/components/chat/message'
import { ZeroCreditsSlideUp, ContinueChatRegistered } from '@/components/modals/continue-chat-slideup'
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
  onEditsUpdate?: (edits: number) => void
  onOpenEditRefill?: () => void
}

type ActiveSlideUp = 'none' | 'zero_credits' | 'zero_edits'

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
  onEditsUpdate,
  onOpenEditRefill,
}: ChatViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const { content: streamingContent, addChunk, reset: resetStreamingContent } = useStreamReveal()
  const [slideUp, setSlideUp] = useState<ActiveSlideUp>('none')
  const [activeBranchIndices, setActiveBranchIndices] = useState<Record<string, number>>({})
  const [regeneratingMessageId, setRegeneratingMessageId] = useState<string | null>(null)
  const [showTakingLonger, setShowTakingLonger] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [pendingAutoSend, setPendingAutoSend] = useState(false)

  // Track user type transitions for auto-send after login
  const prevUserTypeRef = useRef(user.type)
  // Stable ref so the login-transition effect can call the latest handleSend
  const handleSendRef = useRef<() => Promise<void>>(async () => {})

  // Auto-clear error toast after 5s
  useEffect(() => {
    if (!errorMsg) return
    const t = setTimeout(() => setErrorMsg(null), 5000)
    return () => clearTimeout(t)
  }, [errorMsg])

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
    onError: (msg?: string) => void,
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
          const msg = typeof data.error === 'string' ? data.error : 'Generation failed. Please try again.'
          console.error('[CHAT] Generation error from server:', msg)
          onError(msg)
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
      // Generation is gated — prompt login and auto-send once they sign in
      console.log('[CHAT] Blocked: anonymous user, prompting login')
      setPendingAutoSend(true)
      onLogin?.()
      return
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
    resetStreamingContent()

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
          // Send which branch the user is viewing so context injection loads the right version
          const lastAIMsg = [...messages].reverse().find((m) => m.role === 'assistant')
          if (lastAIMsg) {
            body.activeBlueprintMessageId = lastAIMsg.id
            body.activeBranchIndex = activeBranchIndices[lastAIMsg.id] ?? 0
          }
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
        setIsStreaming(false)
        resetStreamingContent()

        if (err.error === 'no_credits') {
          setSlideUp('zero_credits')
        } else if (err.error === 'no_edits') {
          setSlideUp('zero_edits')
        } else if (err.error === 'rate_limited') {
          setErrorMsg("You're sending messages too quickly. Please wait a moment.")
        } else if (err.error === 'daily_cap_exceeded') {
          setErrorMsg('Service is temporarily at capacity. Please try again later.')
        } else if (err.error && typeof err.error === 'string' && err.error.length < 200) {
          setErrorMsg(err.error)
        } else {
          setErrorMsg('Something went wrong. Please try again.')
        }
        return
      }

      console.log('[CHAT] Stream started')
      startStallTimer()

      await readStream(
        response,
        (chunk) => addChunk(chunk),
        (accumulated, meta) => {
          console.log('[CHAT] Stream done: chatId=%s title=%s',
            meta.chatId ?? 'anon', meta.title ?? '—')
          setErrorMsg(null)
          resetStreamingContent()

          const assistantMsg: MockMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: accumulated,
            createdAt: new Date().toISOString(),
          }
          onMessagesChange((prev: MockMessage[]) => [...prev, assistantMsg])

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
            const serverEdits = typeof meta.editsRemaining === 'number' ? meta.editsRemaining : editsRef.current
            onChatCreated?.({
              id: meta.chatId as string,
              title: meta.title as string,
              updatedAt: new Date().toISOString(),
              editsRemaining: serverEdits,
            })
            if (typeof meta.editsRemaining === 'number') {
              editsRef.current = meta.editsRemaining as number
              onEditsUpdate?.(meta.editsRemaining as number)
            }
          }
        },
        (msg) => {
          setIsStreaming(false)
          resetStreamingContent()
          if (msg) setErrorMsg(msg)
        },
      )
    } catch (err) {
      console.error('[CHAT] Fetch error: %s', err instanceof Error ? err.message : String(err))
    } finally {
      setIsStreaming(false)
      clearStallTimer()
    }
  }, [
    inputValue, isStreaming, regeneratingMessageId, hasMessages, isAnonymous,
    messages, onMessagesChange, onInputChange, onGenerate, onChatCreated, onEditsUpdate,
    identityId, anonymousId, activeChatId, user.type, activeBranchIndices,
    startStallTimer, clearStallTimer, readStream, pendingAutoSend,
    addChunk, resetStreamingContent,
  ])

  // Keep ref fresh so the effect below can call the latest version without circular deps
  handleSendRef.current = handleSend

  // Fire pending send once an anonymous user successfully logs in
  useEffect(() => {
    const wasAnon = prevUserTypeRef.current === 'anonymous'
    prevUserTypeRef.current = user.type
    if (wasAnon && user.type !== 'anonymous' && identityId && pendingAutoSend) {
      setPendingAutoSend(false)
      setTimeout(() => handleSendRef.current(), 0)
    }
  }, [user.type, identityId, pendingAutoSend])

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
    resetStreamingContent()
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
          activeBlueprintMessageId: messageId,
          activeBranchIndex: activeBranchIndices[messageId] ?? 0,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        console.error('[CHAT] Regenerate API error: status=%d error=%s', response.status, err.error)
        if (err.error === 'no_edits') setSlideUp('zero_edits')
        clearStallTimer()
        setRegeneratingMessageId(null)
        resetStreamingContent()
        return
      }

      await readStream(
        response,
        (chunk) => addChunk(chunk),
        (accumulated, meta) => {
          console.log('[CHAT] Regenerate done: messageId=%s len=%d', messageId.slice(0, 8) + '…', accumulated.length)
          resetStreamingContent()
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
          // Use server-returned editsRemaining if available; otherwise optimistically decrement
          if (typeof meta.editsRemaining === 'number') {
            editsRef.current = meta.editsRemaining as number
            onEditsUpdate?.(meta.editsRemaining as number)
          } else {
            editsRef.current = Math.max(editsRef.current - 1, 0)
          }
        },
        () => {
          setRegeneratingMessageId(null)
          resetStreamingContent()
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
    activeChatId, isStreaming, regeneratingMessageId, isAnonymous, messages, activeBranchIndices,
    identityId, user.type, onMessagesChange, onEditsUpdate,
    startStallTimer, clearStallTimer, readStream,
    addChunk, resetStreamingContent,
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
          <div className="flex flex-col items-center justify-center h-full gap-5 max-w-xl mx-auto">
            <h1
              className="text-[22px] md:text-[32px] font-medium text-center text-balance"
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

      {/* Error toast */}
      {errorMsg && (
        <div className="shrink-0 px-4 md:px-8 pt-3">
          <div className="max-w-2xl mx-auto">
            <div
              className="flex items-start gap-2.5 px-4 py-3 rounded-xl border-[0.5px] border-[var(--danger)] text-[13px]"
              style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          </div>
        </div>
      )}

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
            maxChars={hasMessages ? 500 : 1000}
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
          onPurchaseEdits={() => { setSlideUp('none'); onOpenEditRefill?.() }}
        />
      )}
    </div>
  )
}
