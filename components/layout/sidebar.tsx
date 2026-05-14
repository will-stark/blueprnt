'use client'

import { SquarePen, Coins, Gift, HeartHandshake, Trash2, Shield, MoreVertical, X, LogIn, LogOut } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { UserPFP } from '@/components/ui/user-pfp'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { formatTimeUntilReset } from '@/lib/share'
import type { MockUser, MockChat } from '@/lib/mock-data'

interface SidebarProps {
  user: MockUser
  chats: MockChat[]
  activeChatId?: string
  isOpen: boolean
  onClose: () => void
  onNewChat: () => void
  onSelectChat: (id: string) => void
  onRenameChat: (id: string, title: string) => void
  onDeleteChat: (id: string) => void
  onClearAll: () => void
  onOpenPurchase: () => void
  onOpenSupport: () => void
  onOpenShare?: () => void
  onOpenAdmin?: () => void
  chatMenuOpenId: string | null
  onToggleChatMenu: (id: string | null) => void
  shareClaimedUntil?: Date | null
  onSignIn?: () => void
  onSignOut?: () => void
}

function SidebarItem({
  icon: Icon,
  label,
  sublabel,
  variant = 'default',
  disabled = false,
  onClick,
}: {
  icon: React.ElementType
  label: string
  sublabel?: string
  variant?: 'default' | 'danger'
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors duration-150 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed"
      style={{
        color: disabled
          ? 'var(--text-faint)'
          : variant === 'danger'
          ? 'var(--danger)'
          : 'var(--text-secondary)',
        opacity: disabled ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--bg-surface)'
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = ''
      }}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1 min-w-0">
        {label}
        {sublabel && (
          <span className="block text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-faint)' }}>
            {sublabel}
          </span>
        )}
      </span>
    </button>
  )
}

interface ChatListItemProps {
  chat: MockChat
  isActive: boolean
  isAnonymous: boolean
  menuOpen: boolean
  onSelect: () => void
  onToggleMenu: () => void
  onRename: () => void
  onDelete: () => void
}

function ChatListItem({
  chat,
  isActive,
  isAnonymous,
  menuOpen,
  onSelect,
  onToggleMenu,
  onRename,
  onDelete,
}: ChatListItemProps) {
  return (
    <div className="relative group">
      <div
        onClick={onSelect}
        className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors duration-150"
        style={{
          backgroundColor: isActive ? 'var(--accent-light)' : undefined,
          color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
        }}
        onMouseEnter={(e) => {
          if (!isActive) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--bg-surface)'
        }}
        onMouseLeave={(e) => {
          if (!isActive) (e.currentTarget as HTMLDivElement).style.backgroundColor = ''
        }}
      >
        <span className="text-[13px] truncate flex-1 pr-1">{chat.title}</span>

        {!isAnonymous && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleMenu() }}
            aria-label="Chat options"
            className="opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity hover:bg-[var(--bg-raised)]"
            style={{ color: 'var(--text-muted)' }}
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Context menu */}
      {menuOpen && (
        <div
          className="absolute right-0 top-full mt-1 z-20 bg-[var(--bg-surface)] border-[0.5px] border-[var(--border)] rounded-xl overflow-hidden py-1"
          style={{ boxShadow: 'var(--shadow-md)', minWidth: 140 }}
        >
          <button
            onClick={() => { onRename(); onToggleMenu() }}
            className="w-full text-left px-3 py-2 text-[13px] transition-colors hover:bg-[var(--bg-raised)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            Rename
          </button>
          <button
            onClick={() => { onDelete(); onToggleMenu() }}
            className="w-full text-left px-3 py-2 text-[13px] transition-colors hover:bg-[var(--danger-light)]"
            style={{ color: 'var(--danger)' }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

export function Sidebar({
  user,
  chats,
  activeChatId,
  isOpen,
  onClose,
  onNewChat,
  onSelectChat,
  onRenameChat,
  onDeleteChat,
  onClearAll,
  onOpenPurchase,
  onOpenSupport,
  onOpenShare,
  onOpenAdmin,
  chatMenuOpenId,
  onToggleChatMenu,
  shareClaimedUntil,
  onSignIn,
  onSignOut,
}: SidebarProps) {
  const isFarcaster = user.type === 'farcaster'
  const isAnonymous = user.type === 'anonymous'
  const isRegistered = !isAnonymous
  const shareClaimed = shareClaimedUntil != null

  const sidebarContent = (
    <aside
      className="w-[260px] h-screen flex flex-col overflow-hidden border-r-[0.5px] border-[var(--border)]"
      style={{ backgroundColor: 'var(--bg-raised)' }}
    >
      {/* Logo */}
      <div className="p-4 border-b-[0.5px] border-[var(--border)] flex items-center justify-between">
        <Logo size="sidebar" />
        {/* Close button (mobile only) */}
        <button
          onClick={onClose}
          aria-label="Close sidebar"
          className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--bg-muted)]"
          style={{ color: 'var(--text-muted)' }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* New chat button */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          style={{ backgroundColor: 'var(--accent)' }}
        >
          <SquarePen className="w-4 h-4" />
          New chat
        </button>
      </div>

      {/* Chat list — only shows saved chats (pending new chats are not listed) */}
      <div className="flex-1 overflow-y-auto px-2">
        <div
          className="text-[11px] uppercase tracking-wider px-3 py-2"
          style={{ color: 'var(--text-muted)' }}
        >
          Previous chats
        </div>

        {chats.length === 0 ? (
          <p className="px-3 py-2 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            No previous chats
          </p>
        ) : (
          <div className="space-y-0.5">
            {chats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                isActive={chat.id === activeChatId}
                isAnonymous={isAnonymous}
                menuOpen={chatMenuOpenId === chat.id}
                onSelect={() => onSelectChat(chat.id)}
                onToggleMenu={() => onToggleChatMenu(chatMenuOpenId === chat.id ? null : chat.id)}
                onRename={() => onRenameChat(chat.id, chat.title)}
                onDelete={() => onDeleteChat(chat.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Utility actions */}
      <div className="border-t-[0.5px] border-[var(--border)] p-3 space-y-0.5">
        {isFarcaster && (
          <SidebarItem
            icon={Gift}
            label="Share to unlock 2 credits"
            sublabel={shareClaimed ? `Resets in ${formatTimeUntilReset()}` : undefined}
            disabled={shareClaimed}
            onClick={shareClaimed ? undefined : onOpenShare}
          />
        )}

        <SidebarItem
          icon={Coins}
          label={isAnonymous ? 'Create account to top up' : 'Top-up credits'}
          onClick={onOpenPurchase}
        />

        <SidebarItem
          icon={HeartHandshake}
          label="Support the developer"
          onClick={onOpenSupport}
        />

        {isRegistered && (
          <SidebarItem
            icon={Trash2}
            label="Clear all chats"
            variant="danger"
            onClick={onClearAll}
          />
        )}

        {user.isAdmin && (
          <SidebarItem
            icon={Shield}
            label="Admin"
            onClick={onOpenAdmin}
          />
        )}
      </div>

      {/* User / identity block */}
      <div className="border-t-[0.5px] border-[var(--border)] p-3">
        {isAnonymous ? (
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={onSignIn}
              className="flex flex-1 items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150 text-left"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--bg-surface)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '' }}
            >
              <LogIn className="w-4 h-4 shrink-0" />
              Sign in / Sign up
            </button>
            <ThemeToggle />
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center gap-2 min-w-0">
              <UserPFP user={user} size={32} />
              <div className="flex-1 min-w-0">
                <span className="text-[13px] truncate block" style={{ color: 'var(--text-secondary)' }}>
                  {isFarcaster ? `@${user.username}` : (user.email ?? user.username)}
                </span>
              </div>
              <ThemeToggle />
            </div>
            {user.type === 'privy' && (
              <button
                onClick={onSignOut}
                className="flex items-center gap-2 px-1 py-1 text-[12px] transition-colors hover:underline"
                style={{ color: 'var(--text-muted)' }}
              >
                <LogOut className="w-3 h-3" />
                Sign out
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop: always visible */}
      <div className="hidden md:block shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile: overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />
          {/* Panel slides in */}
          <div className="relative animate-[sidebarIn_250ms_ease-out]" style={{ boxShadow: 'var(--shadow-lg)' }}>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
