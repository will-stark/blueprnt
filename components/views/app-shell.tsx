'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { ChatView } from '@/components/views/chat-view'
import { AdminView } from '@/components/views/admin-view'
import { PurchaseModal } from '@/components/modals/purchase-modal'
import { TipModal, SupportPopup } from '@/components/modals/tip-modal'
import { TicketModal } from '@/components/modals/ticket-modal'
import { ShareVerificationModal } from '@/components/modals/share-verification-modal'
import {
  ClearAllModal,
  DeleteChatModal,
  RenameChatModal,
  NewChatWarningModal,
} from '@/components/modals/confirm-modals'
import { OnboardingSlideshow } from '@/components/onboarding/onboarding-slideshow'
import { WalletFundingSlideshow } from '@/components/onboarding/wallet-funding-slideshow'
import { SplashScreen } from '@/components/ui/splash-screen'
import { getNextResetTime } from '@/lib/share'
import { shouldShowOnboarding } from '@/lib/onboarding'
import { isReturningUser } from '@/lib/user-detection'
import { generateGradient } from '@/lib/pfp-gradient'
import { useEnvironment } from '@/components/providers/environment-provider'
import { usePrivy } from '@privy-io/react-auth'
import {
  MOCK_CHATS,
  type MockChat,
  type MockUser,
  type MockMessage,
} from '@/lib/mock-data'

type ActiveModal =
  | 'none'
  | 'purchase'
  | 'tip'
  | 'ticket'
  | 'share'
  | 'clear_all'
  | 'delete_chat'
  | 'rename_chat'
  | 'new_chat_warn'
  | 'onboarding'
  | 'wallet_funding'

interface AppShellProps {
  initialChatId?: string
  skipSplash?: boolean
}

export function AppShell({ initialChatId, skipSplash = false }: AppShellProps) {
  const { user: realUser } = useEnvironment()
  const { login, logout } = usePrivy()
  const router = useRouter()

  const handleSignOut = useCallback(async () => {
    // Clear all chat state immediately so previous chats aren't visible after redirect
    setChats([])
    setActiveChatId('')
    setMessages([])
    setInputValue('')
    setPendingChat(null)
    await logout()
    router.push('/')
  }, [logout, router])

  // Debug: log whenever user state changes
  useEffect(() => {
    console.log('[APP-DEBUG] User state changed:', {
      userType: realUser?.type,
      hasFarcasterData: realUser?.type === 'farcaster' ? !!realUser.farcaster : false,
      fid: realUser?.type === 'farcaster' ? realUser.farcaster?.fid : undefined,
    })
  }, [realUser])

  const [showSplash, setShowSplash] = useState(!skipSplash)

  // Debug: log splash screen transitions
  useEffect(() => {
    console.log('[APP-DEBUG] Splash screen state:', {
      showSplash,
      userType: realUser?.type,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSplash])

  // Saved chats — shown in sidebar. New chats are NOT added here until a message is sent.
  const [chats, setChats] = useState<MockChat[]>([])

  // A pending chat exists when the user has clicked "New Chat" but sent no message yet.
  // It is not shown in the sidebar until promoted.
  const [pendingChat, setPendingChat] = useState<MockChat | null>(null)

  const [activeChatId, setActiveChatId] = useState<string>(initialChatId ?? '')
  const [messages, setMessages] = useState<MockMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [credits, setCredits] = useState(0)
  const [edits, setEdits] = useState(10)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatMenuOpenId, setChatMenuOpenId] = useState<string | null>(null)
  const [activeModal, setActiveModal] = useState<ActiveModal>('none')
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const [anonymousAllowed, setAnonymousAllowed] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  // Browser fingerprint for anonymous rate-limiting — generated once per session
  const [anonymousId, setAnonymousId] = useState<string | null>(null)
  useEffect(() => {
    if (realUser?.type !== 'anonymous') return
    import('@fingerprintjs/fingerprintjs').then((FingerprintJS) =>
      FingerprintJS.default.load().then((fp) => fp.get()).then((result) => {
        setAnonymousId(result.visitorId)
      })
    ).catch(() => {})
  }, [realUser?.type])

  // Set anonymous credit count once fingerprint is available
  useEffect(() => {
    if (!anonymousId) return
    fetch(`/api/anon/credits?anonymousId=${encodeURIComponent(anonymousId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.credits === 'number') setCredits(data.credits)
      })
      .catch(() => {})
  }, [anonymousId])
  const [pendingRenameId, setPendingRenameId] = useState<string | null>(null)
  const [showAdmin, setShowAdmin] = useState(false)

  // Share-to-unlock claimed state. When set, the sidebar share button is disabled
  // and shows a countdown. Resets every Monday at 1am UTC.
  const [shareClaimedUntil, setShareClaimedUntil] = useState<Date | null>(null)

  // Fetch anonymous toggle state; ChatView gates generation on this value
  useEffect(() => {
    if (!realUser || realUser.type !== 'anonymous') return
    fetch('/api/state')
      .then((r) => r.json())
      .then((data) => {
        setAnonymousAllowed(data.anonymousAllowed !== false)
      })
      .catch(() => {})
  }, [realUser])

  // Check admin status once when a non-anonymous user is detected
  useEffect(() => {
    if (!realUser || realUser.type === 'anonymous') { setIsAdmin(false); return }

    const identityId =
      realUser.type === 'farcaster'
        ? String(realUser.farcaster!.fid)
        : realUser.privyId!
    const email = realUser.email ?? ''

    fetch(
      `/api/admin/check?identityType=${realUser.type}&identityId=${encodeURIComponent(identityId)}&email=${encodeURIComponent(email)}`
    )
      .then((r) => r.json())
      .then((data) => setIsAdmin(!!data.isAdmin))
      .catch(() => {})
  }, [realUser])

  // Poll /api/state every 10 s; pause when tab is hidden
  useEffect(() => {
    if (!realUser || realUser.type === 'anonymous') return

    const identityId =
      realUser.type === 'farcaster'
        ? String(realUser.farcaster!.fid)
        : realUser.privyId!

    let retries = 0
    let timer: ReturnType<typeof setTimeout>

    async function poll() {
      if (document.hidden) return
      try {
        const res = await fetch(
          `/api/state?identityId=${encodeURIComponent(identityId)}&identityType=${realUser!.type}`
        )
        if (!res.ok) throw new Error('state fetch failed')
        const data = await res.json()
        if (typeof data.creditsRemaining === 'number') setCredits(data.creditsRemaining)
        retries = 0
      } catch {
        retries++
        if (retries < 3) {
          timer = setTimeout(poll, 3000)
          return
        }
        retries = 0
      }
      timer = setTimeout(poll, 10_000)
    }

    const onVisible = () => { if (!document.hidden) poll() }
    document.addEventListener('visibilitychange', onVisible)
    poll()

    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [realUser])

  useEffect(() => {
    if (skipSplash) return
    const t = setTimeout(() => setShowSplash(false), 2500)
    return () => clearTimeout(t)
  }, [skipSplash])

  // Load chats based on user type. Anonymous users start empty (or restore from
  // localStorage if they've generated before). Registered users get mock data
  // until Phase 2 wires real DB chat history.
  useEffect(() => {
    if (!realUser) return

    if (realUser.type === 'anonymous') {
      const raw = typeof window !== 'undefined'
        ? localStorage.getItem('blueprnt-anon-state')
        : null
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          const loaded: MockChat[] = parsed.chats || []
          setChats(loaded)
          setActiveChatId(loaded[0]?.id ?? '')
        } catch {
          setChats([])
          setActiveChatId('')
        }
      } else {
        setChats([])
        setActiveChatId('')
      }
    } else {
      // privy / farcaster — TODO Phase 2: replace with DB fetch
      setChats(MOCK_CHATS)
      setActiveChatId(MOCK_CHATS[0]?.id ?? '')
    }
  }, [realUser?.type])

  // Promote pending chat to saved chats when the first message is sent.
  useEffect(() => {
    if (messages.length > 0 && pendingChat !== null) {
      setChats((prev) => [pendingChat, ...prev])
      setPendingChat(null)
    }
  }, [messages, pendingChat])

  // Show onboarding for first-time users; use a ref so we read current activeModal
  // without adding it to deps (we only want this to fire when realUser changes).
  const activeModalRef = useRef(activeModal)
  activeModalRef.current = activeModal
  useEffect(() => {
    if (!realUser) return
    if (activeModalRef.current !== 'none') return
    if (isReturningUser()) return
    const userId =
      realUser.type === 'farcaster' ? String(realUser.farcaster!.fid)
      : realUser.type === 'privy' ? realUser.privyId
      : undefined
    if (shouldShowOnboarding(realUser.type, userId)) {
      setActiveModal('onboarding')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realUser])

  const close = () => setActiveModal('none')

  const handleShareSuccess = useCallback(() => {
    // Award 2 credits and set the weekly claimed lock.
    setCredits((prev) => prev + 2)
    setShareClaimedUntil(getNextResetTime())
  }, [])

  // TASK 4: "New Chat" — discard pending empty chats instead of adding them to the sidebar.
  const handleNewChat = useCallback(() => {
    if (messages.length > 0 && (realUser?.type ?? 'anonymous') === 'anonymous') {
      setActiveModal('new_chat_warn')
      return
    }

    const id = `chat_${Date.now()}`
    const newPending: MockChat = {
      id,
      title: 'New chat',
      updatedAt: new Date().toISOString(),
      editsRemaining: 10,
    }

    // If already on an unsaved pending chat with no messages, just replace it.
    // This prevents accumulating empty chats in the sidebar on repeated clicks.
    setPendingChat(newPending)
    setActiveChatId(id)
    setMessages([])
    setInputValue('')
    setShowAdmin(false)
  }, [messages.length, realUser?.type])

  const handleSelectChat = useCallback((id: string) => {
    // Discard any unsaved pending chat when switching away.
    setPendingChat(null)
    setActiveChatId(id)
    setMessages([])
    setShowAdmin(false)
    setSidebarOpen(false)
  }, [])

  const handleRenameChat = useCallback((id: string) => {
    setPendingRenameId(id)
    setActiveModal('rename_chat')
  }, [])

  const handleConfirmRename = useCallback((newTitle: string) => {
    if (!pendingRenameId) return
    setChats((prev) => prev.map((c) => (c.id === pendingRenameId ? { ...c, title: newTitle } : c)))
    setPendingRenameId(null)
  }, [pendingRenameId])

  const handleDeleteChat = useCallback((id: string) => {
    setPendingDeleteId(id)
    setActiveModal('delete_chat')
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (!pendingDeleteId) return
    setChats((prev) => prev.filter((c) => c.id !== pendingDeleteId))
    if (activeChatId === pendingDeleteId) {
      const remaining = chats.filter((c) => c.id !== pendingDeleteId)
      setActiveChatId(remaining[0]?.id ?? '')
      setMessages([])
    }
    setPendingDeleteId(null)
  }, [pendingDeleteId, activeChatId, chats])

  const handleClearAll = useCallback(() => {
    setChats([])
    setPendingChat(null)
    setActiveChatId('')
    setMessages([])
  }, [])

  const isMobile = realUser?.type === 'farcaster' && realUser.platformType === 'mobile'

  const user: MockUser = {
    type: realUser?.type ?? 'anonymous',
    username:
      realUser?.type === 'farcaster'
        ? (realUser.farcaster?.username ?? realUser.farcaster?.displayName ?? 'User')
        : realUser?.type === 'privy'
        ? (realUser.email?.split('@')[0] ?? 'User')
        : 'Anon',
    email: realUser?.email,
    pfpUrl: realUser?.farcaster?.pfpUrl ?? null,
    pfpGradient:
      realUser?.type === 'privy'
        ? generateGradient(realUser.privyId ?? realUser.email ?? 'user')
        : undefined,
    credits,
    edits,
    isAdmin,
  }

  const pendingChatObj = chats.find((c) => c.id === pendingDeleteId)
  const pendingRenameChat = chats.find((c) => c.id === pendingRenameId)

  if (showSplash) return <SplashScreen />

  return (
    <div
      className="flex h-dvh overflow-hidden font-sans"
      style={{ backgroundColor: 'var(--bg-canvas)' }}
    >
      <Sidebar
        user={user}
        chats={chats}
        activeChatId={activeChatId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
        onClearAll={() => setActiveModal('clear_all')}
        onOpenPurchase={() => setActiveModal('purchase')}
        onOpenSupport={() => setActiveModal('tip')}
        onOpenShare={() => setActiveModal('share')}
        onOpenAdmin={() => { setShowAdmin(true); setSidebarOpen(false) }}
        chatMenuOpenId={chatMenuOpenId}
        onToggleChatMenu={setChatMenuOpenId}
        shareClaimedUntil={shareClaimedUntil}
        onSignIn={login}
        onSignOut={handleSignOut}
      />

      <div className="flex flex-col flex-1 min-w-0">
        <Header
          user={user}
          credits={credits}
          edits={edits}
          hasFirstMessage={messages.length > 0}
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenPurchase={() => setActiveModal('purchase')}
          onOpenTicket={() => setActiveModal('ticket')}
          onOpenShare={() => setActiveModal('share')}
          onSignIn={login}
        />

        {showAdmin ? (
          <AdminView />
        ) : (
          <ChatView
            user={user}
            credits={credits}
            edits={edits}
            messages={messages}
            onMessagesChange={setMessages as (m: MockMessage[] | ((prev: MockMessage[]) => MockMessage[])) => void}
            onInputChange={setInputValue}
            inputValue={inputValue}
            onOpenPurchase={() => setActiveModal('purchase')}
            anonymousAllowed={anonymousAllowed}
            onLogin={login}
            onGenerate={user.type === 'anonymous' ? () => setCredits(0) : undefined}
            isMobile={isMobile}
          />
        )}
      </div>

      {activeModal === 'purchase' && (
        <PurchaseModal onClose={close} userType={user.type} />
      )}
      {activeModal === 'tip' && (
        user.type === 'anonymous'
          ? <SupportPopup onClose={close} />
          : <TipModal onClose={close} userType={user.type} />
      )}
      {activeModal === 'ticket' && <TicketModal onClose={close} />}
      {activeModal === 'share' && (
        <ShareVerificationModal
          onClose={close}
          onSuccess={handleShareSuccess}
        />
      )}
      {activeModal === 'clear_all' && (
        <ClearAllModal onClose={close} onConfirm={handleClearAll} />
      )}
      {activeModal === 'delete_chat' && pendingChatObj && (
        <DeleteChatModal
          chatTitle={pendingChatObj.title}
          onClose={close}
          onConfirm={handleConfirmDelete}
        />
      )}
      {activeModal === 'rename_chat' && pendingRenameChat && (
        <RenameChatModal
          currentTitle={pendingRenameChat.title}
          onClose={close}
          onSave={handleConfirmRename}
        />
      )}
      {activeModal === 'new_chat_warn' && (
        <NewChatWarningModal
          onClose={close}
          onConfirm={() => {
            const id = `chat_${Date.now()}`
            const newPending: MockChat = { id, title: 'New chat', updatedAt: new Date().toISOString(), editsRemaining: 10 }
            setPendingChat(newPending)
            setActiveChatId(id)
            setMessages([])
            setInputValue('')
          }}
        />
      )}
      {activeModal === 'onboarding' && (
        <OnboardingSlideshow
          userType={user.type}
          userId={
            realUser?.type === 'farcaster' ? String(realUser.farcaster!.fid)
            : realUser?.type === 'privy' ? realUser.privyId
            : undefined
          }
          onDismiss={() => {
            close()
            if (realUser?.type === 'privy') {
              setActiveModal('wallet_funding')
            }
          }}
        />
      )}
      {activeModal === 'wallet_funding' && (
        <WalletFundingSlideshow onDismiss={close} />
      )}
    </div>
  )
}
