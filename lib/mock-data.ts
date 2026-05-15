// Mock data for Blueprnt UI — Claude Code will replace with real data

export type UserType = 'farcaster' | 'privy' | 'anonymous'

export interface MockUser {
  type: UserType
  username: string
  email?: string
  pfpUrl: string | null
  pfpGradient?: string
  credits: number
  edits: number
  isAdmin: boolean
}

export interface MockChat {
  id: string
  title: string
  updatedAt: string
  editsRemaining: number
}

export interface MockMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  branches?: Array<{ content: string; timestamp: string }>
}

export interface MockTicketNote {
  text: string
  createdAt: string
}

export interface MockTicket {
  id: string
  shortId: string
  userId: string
  identityType: 'farcaster' | 'privy'
  userDisplay: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved'
  createdAt: string
  notes?: MockTicketNote[]
}

// Real ticket type used by API responses and admin components
export interface TicketNote {
  text: string
  createdAt: string
}

export interface Ticket {
  id: string
  shortId: string
  userId?: string
  identityType: string | null
  identityId?: string | null
  userDisplay: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved'
  createdAt: string
  notes: TicketNote[]
}

// Mock users
export const MOCK_FARCASTER_USER: MockUser = {
  type: 'farcaster',
  username: 'zane.eth',
  pfpUrl: null,
  pfpGradient: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
  credits: 7,
  edits: 8,
  isAdmin: true,
}

export const MOCK_PRIVY_USER: MockUser = {
  type: 'privy',
  username: 'zane@example.com',
  pfpUrl: null,
  pfpGradient: 'linear-gradient(135deg, #059669 0%, #0EA5E9 100%)',
  credits: 3,
  edits: 3,
  isAdmin: false,
}

export const MOCK_ANON_USER: MockUser = {
  type: 'anonymous',
  username: 'Anon',
  pfpUrl: null,
  pfpGradient: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
  credits: 0,
  edits: 3,
  isAdmin: false,
}

// Aliases for backward compatibility
export const MOCK_USER_FARCASTER = MOCK_FARCASTER_USER
export const MOCK_USER_PRIVY = MOCK_PRIVY_USER
export const MOCK_USER_ANON = MOCK_ANON_USER

// Mock chats
export const MOCK_CHATS: MockChat[] = [
  { id: 'chat-1', title: 'Farcaster analytics dashboard', updatedAt: '2026-05-02T14:22:00Z', editsRemaining: 8 },
  { id: 'chat-2', title: 'On-chain voting app for DAOs', updatedAt: '2026-05-01T10:05:00Z', editsRemaining: 3 },
  { id: 'chat-3', title: 'AI recipe generator with meal planning', updatedAt: '2026-04-30T18:44:00Z', editsRemaining: 10 },
  { id: 'chat-4', title: 'Decentralized freelance marketplace', updatedAt: '2026-04-29T09:12:00Z', editsRemaining: 0 },
  { id: 'chat-5', title: 'Real-time collaborative whiteboard', updatedAt: '2026-04-28T16:30:00Z', editsRemaining: 5 },
  { id: 'chat-6', title: 'NFT portfolio tracker with alerts', updatedAt: '2026-04-27T11:00:00Z', editsRemaining: 10 },
]

// Mock blueprint output (realistic 5-section document)
export const MOCK_BLUEPRINT = `## Section 1 — Expanded overview

**Target users:** Indie developers and small teams building on Farcaster who need quick visibility into cast performance, follower growth, and channel engagement.

**Problem:** Farcaster lacks a native analytics layer. Builders flying blind can't iterate on content strategy or measure protocol traction without manually querying Neynar or writing custom scripts.

**Success criteria:** A user can open the dashboard, see 30-day trends across all key metrics, and export a CSV report in under 60 seconds — without writing a single line of code.

---

## Section 2 — Core elements

**Authentication:** Farcaster Mini App SDK for primary auth. FID is the user identifier. No username/password.

**Key features:**
- Cast performance feed (impressions, reactions, recasts, replies per cast)
- Follower growth chart (daily delta, net change, top followers by influence)
- Channel analytics (per-channel engagement rate, top-performing casts)
- Notification alerts (Telegram or email when a cast exceeds a threshold)
- CSV / JSON export for any time window

**Database schema:**
- \`users\` — FID, connected_at, last_seen
- \`casts\` — cast_hash, fid, text, published_at, impressions, reactions, recasts, replies
- \`follows\` — fid, target_fid, followed_at, unfollowed_at
- \`snapshots\` — fid, date, follower_count, following_count, cast_count

**APIs used:**
- Neynar REST API — cast data, follower data, channel data
- Neon (PostgreSQL) — persistent storage of all snapshots
- Resend — email alerts

---

## Section 3 — Basic + extended logic

**Data sync flow:**
1. Cron job runs every 6 hours — fetches latest cast metrics from Neynar
2. Diff against last snapshot — stores only deltas to minimize row growth
3. On first login — backfills last 30 days of data (Neynar allows up to 90 days)

**Edge cases:**
- Neynar 429: exponential backoff (2s, 4s, 8s), max 3 retries. Cache last known data and show stale indicator.
- FID not found: show empty state with onboarding prompt — "Connect your Farcaster account to get started."
- Cast deleted after tracking: mark \`deleted_at\`, exclude from performance averages but show in timeline.

**Rate limiting:**
- Per-user Neynar requests capped at 50/day on free plan
- Batch processing: group all active users and sync in a single pass

---

## Section 4 — Full workflow

1. **App load** → SDK init → FID detected → load dashboard
2. **Dashboard** → header (username + PFP) + 4 stat cards + cast feed
3. **Cast feed** → sorted by impressions desc → click row → cast detail slide-up
4. **Follower chart** → 30-day line chart → hover tooltip shows exact delta
5. **Channel view** → tabbed: All / Per Channel → sort by engagement rate
6. **Alert setup** → modal: metric selector + threshold + delivery method → save to Neon
7. **Export** → date range picker + format (CSV / JSON) → download triggers instantly
8. **Settings** → notification preferences + connected accounts + data retention policy

---

## Section 5 — Cost of development

| Tier | Monthly Cost | Services |
|---|---|---|
| Free / OSS | $0 | Neynar free (50 req/day), Neon free (0.5GB), Vercel hobby |
| Indie Builder | ~$25/mo | Neynar starter ($19), Neon pro ($19), Vercel hobby |
| At Scale (1,000+ users) | ~$150/mo | Neynar growth ($99), Neon scale ($69), Vercel pro ($20) |

**One-time costs:** Domain (~$12/yr), smart contract deployment (negligible on Base).
`

// Mock onboarding slides
export const ONBOARDING_SLIDES = [
  {
    id: 1,
    title: 'Welcome to Blueprnt',
    body: 'Turn any app idea into a full technical blueprint — ready to build, ready to hand off.',
    visual: 'logo',
  },
  {
    id: 2,
    title: 'Describe, generate, build',
    body: 'Type your app idea in plain language. Get a detailed technical document that outlines the architecture, logic, workflow, and costs.',
    visual: 'generate',
  },
  {
    id: 3,
    title: 'Refine your blueprint',
    body: 'You can ask the agent to update sections, expand details, or regenerate entirely.\n\nNote: Every blueprint comes with a set number of edits. You can always purchase more edits if you run out of them.',
    visual: 'edit',
  },
  {
    id: 4,
    title: 'Start building',
    body_farcaster: 'All payments in USDC on Base. You get 3 free blueprints to start. After that, a single blueprint costs just $0.50.',
    body_privy: 'You get 3 free blueprints to start. After that, a single blueprint costs just $0.50.\n\nAll payments in USDC on Base.',
    body_anonymous: 'Create a free account and get 3 blueprints instantly — no payment required.\n\nAfter that, a single blueprint costs just $0.50 in USDC on Base.',
    // body_web kept for backward compatibility
    body_web: 'You get 3 free blueprints to start. After that, a single blueprint costs just $0.50.\n\nAll payments in USDC on Base.',
    visual: 'build',
  },
  {
    id: 5,
    title: 'Before you start',
    body: 'Blueprnt generates AI-powered technical blueprints as a planning aid, not professional engineering advice. Payments are onchain and non-refundable.',
    visual: 'terms',
  },
]

// Wallet funding slides (Privy web users only)
export const WALLET_SLIDES = [
  {
    id: 1,
    title: 'Your wallet',
    body: 'Your embedded wallet was created automatically. Click next to find out how to fund your wallet with USDC.',
    visual: 'wallet',
    mockAddress: '0x3f9e...7a12',
  },
  {
    id: 2,
    title: 'Getting USDC',
    body: 'Purchase USDC on Binance, Coinbase, or Kraken. Transfer to your wallet address on Base.',
    visual: 'usdc',
  },
  {
    id: 3,
    title: 'ETH for gas',
    body: 'You need a small amount of ETH on Base for transaction fees. Even $1 worth is enough to start.',
    visual: 'gas',
  },
]

// Prompt tips for new chat screen
export const PROMPT_TIPS = [
  'Describe any app, tool, or platform and get a full technical blueprint in seconds',
  'Describe who it\'s for, what it does, and key features for the best results',
  'Your blueprint covers architecture, logic, full workflow, and cost of development',
  'Use your blueprint as a plan for building or handing off to a developer',
  "Note: If you're building a Farcaster mini-app, include that in your prompt so the agent can tailor the blueprint accordingly.",
]

// Mock tickets for admin dashboard
export const MOCK_TICKETS: MockTicket[] = [
  {
    id: 'tkt-001a2b3c',
    shortId: '001a2b3c',
    userId: '423871',
    identityType: 'farcaster',
    userDisplay: 'vitalik.eth (FID 423871)',
    title: 'Blueprint generation stopped halfway through section 3',
    description: 'I was generating a blueprint for a DeFi lending protocol. The response cut off mid-sentence in Section 3 — Basic + Extended Logic. I tried regenerating twice but got the same result each time. My credit was still deducted on the second attempt even though the response was incomplete.',
    status: 'open',
    createdAt: '2026-05-02T11:34:00Z',
  },
  {
    id: 'tkt-002d4e5f',
    shortId: '002d4e5f',
    userId: 'privy|alice@example.com',
    identityType: 'privy',
    userDisplay: 'alice@example.com',
    title: 'USDC payment confirmed onchain but credits not added',
    description: 'I purchased the $5 pack (12 blueprints). The transaction is confirmed on Base (tx hash: 0x8f2a...3c91). It\'s been 20 minutes and my credit balance still shows 3. Transaction was on Base.',
    status: 'in_progress',
    createdAt: '2026-05-01T16:22:00Z',
  },
  {
    id: 'tkt-003g6h7i',
    shortId: '003g6h7i',
    userId: '89124',
    identityType: 'farcaster',
    userDisplay: 'horsefacts.eth (FID 89124)',
    title: 'Share-to-unlock never verified despite posting the cast',
    description: 'I posted the share cast and can see it on my profile (cast hash: 0x1c4d...9e82). The app said "Verifying your cast..." for 30 seconds then showed Round 1 fail. I tapped Try Again and Round 2 also failed. The cast is definitely there.',
    status: 'resolved',
    createdAt: '2026-04-30T09:15:00Z',
  },
  {
    id: 'tkt-004j8k9l',
    shortId: '004j8k9l',
    userId: 'privy|bob@example.com',
    identityType: 'privy',
    userDisplay: 'bob@example.com',
    title: 'Dark mode toggle not working on Safari iOS',
    description: 'When I tap the moon icon in the sidebar on my iPhone (Safari, iOS 17.4), the theme doesn\'t change visually. The icon changes to a sun but the background stays white. Tested on Chrome iOS and it works fine.',
    status: 'open',
    createdAt: '2026-04-30T07:50:00Z',
  },
  {
    id: 'tkt-005m1n2o',
    shortId: '005m1n2o',
    userId: '12291',
    identityType: 'farcaster',
    userDisplay: 'dwr.eth (FID 12291)',
    title: 'Chat history not loading after returning to app',
    description: 'I closed Warpcast and reopened it 2 hours later. My previous chats don\'t appear in the sidebar. The sidebar shows "No previous chats" even though I had 4 chats. Refreshing doesn\'t help.',
    status: 'in_progress',
    createdAt: '2026-04-29T14:03:00Z',
  },
  {
    id: 'tkt-006p3q4r',
    shortId: '006p3q4r',
    userId: 'privy|carol@example.com',
    identityType: 'privy',
    userDisplay: 'carol@example.com',
    title: 'Copy button copies HTML instead of markdown',
    description: 'When I tap the Copy button on a blueprint, it seems to copy rendered HTML rather than the raw markdown. When I paste into Notion it includes all the formatting tags. Expected plain markdown.',
    status: 'resolved',
    createdAt: '2026-04-28T21:17:00Z',
  },
  {
    id: 'tkt-007s5t6u',
    shortId: '007s5t6u',
    userId: '198823',
    identityType: 'farcaster',
    userDisplay: 'banteg.eth (FID 198823)',
    title: 'Edit counter shows wrong number after network switch',
    description: 'I had 7 edits remaining. I switched from Base to Arbitrum in my wallet and came back to the app. Now the edit counter shows 10, which is incorrect. Minor but confusing.',
    status: 'open',
    createdAt: '2026-04-28T13:44:00Z',
  },
  {
    id: 'tkt-008v7w8x',
    shortId: '008v7w8x',
    userId: 'privy|dave@example.com',
    identityType: 'privy',
    userDisplay: 'dave@example.com',
    title: 'Chatbox text disappears when purchase modal opens',
    description: 'I typed a detailed prompt (~400 chars), then tapped "Purchase credits" from the sidebar. When the purchase modal closed, my chatbox was empty. I had to retype the entire prompt.',
    status: 'open',
    createdAt: '2026-04-27T10:28:00Z',
  },
  {
    id: 'tkt-009y9z0a',
    shortId: '009y9z0a',
    userId: '304567',
    identityType: 'farcaster',
    userDisplay: 'ccarella.eth (FID 304567)',
    title: 'Regenerate button deducted edit even when generation failed',
    description: 'I tapped Regenerate and got a "Something went wrong" error. My edit count went from 6 to 5. Per the docs, edits should only deduct on successful responses.',
    status: 'in_progress',
    createdAt: '2026-04-26T17:55:00Z',
  },
  {
    id: 'tkt-010b1c2d',
    shortId: '010b1c2d',
    userId: 'privy|eve@example.com',
    identityType: 'privy',
    userDisplay: 'eve@example.com',
    title: 'Privy wallet auto-created on wrong network (Ethereum mainnet)',
    description: 'After signing up with Google, the embedded wallet shows Ethereum mainnet in the funding slideshow instead of Base or Arbitrum. The address looks correct but the network indicator is wrong.',
    status: 'open',
    createdAt: '2026-04-25T08:33:00Z',
  },
  {
    id: 'tkt-011e3f4g',
    shortId: '011e3f4g',
    userId: '71923',
    identityType: 'farcaster',
    userDisplay: 'jacob.eth (FID 71923)',
    title: 'Rename chat fails silently — no error shown',
    description: 'When I try to rename a chat, the modal opens fine. I type the new name and tap Save. The modal closes but the chat title in the sidebar doesn\'t change. No error message is shown. Tried 3 times.',
    status: 'resolved',
    createdAt: '2026-04-24T12:11:00Z',
  },
  {
    id: 'tkt-012h5i6j',
    shortId: '012h5i6j',
    userId: 'privy|frank@example.com',
    identityType: 'privy',
    userDisplay: 'frank@example.com',
    title: 'Continue-chat slide-up appears even with edits remaining',
    description: 'The "Continue chat" slide-up appeared after I sent a message, but I still had 4 edits remaining according to the pill in the header. The slide-up went away on its own after a few seconds but it was confusing.',
    status: 'open',
    createdAt: '2026-04-23T15:49:00Z',
  },
]

// Credit purchase options
export const CREDIT_OPTIONS = [
  { tier: 0, label: 'Single', price: '$0.50', blueprints: 1, edits: 3 },
  { tier: 1, label: 'Pack — $1', price: '$1.00', blueprints: 2, edits: 3 },
  { tier: 2, label: 'Pack — $5', price: '$5.00', blueprints: 12, edits: 3, perGen: '$0.42' },
  { tier: 3, label: 'Pack — $10', price: '$10.00', blueprints: 25, edits: 3, perGen: '$0.40' },
]

// Mock AI responses for streaming simulation
export const MOCK_AI_RESPONSES: string[] = [
  MOCK_BLUEPRINT,
  `## Section 1 — Expanded overview

**Target users:** Freelancers, designers, and developers who need a simple way to create and manage project proposals, invoices, and client relationships.

**Problem:** Most invoicing tools are bloated with features small freelancers never use, or are priced for teams. There's a gap for a focused, mobile-first tool that handles the full freelance billing cycle.

**Success criteria:** A freelancer can create an invoice, send it to a client, and receive payment — all from their phone in under 3 minutes.

---

## Section 2 — Core elements

**Authentication:** Email/password via NextAuth. Optional Google OAuth.

**Key features:**
- Client management (name, email, billing address)
- Project tracking (hourly or fixed-price)
- Invoice generation (PDF export, itemized line items)
- Payment tracking (mark as paid, partial payments)
- Dashboard (outstanding, paid, overdue totals)

**Database schema:**
- \`users\` — id, email, name, business_name, created_at
- \`clients\` — id, user_id, name, email, address
- \`projects\` — id, user_id, client_id, name, type, rate
- \`invoices\` — id, project_id, status, total, due_date, sent_at, paid_at
- \`invoice_items\` — id, invoice_id, description, quantity, unit_price

---

## Section 3 — Basic + extended logic

**Invoice flow:**
1. Select client → select or create project → add line items → preview → send via email (Resend)
2. Client receives email with payment link (Stripe Checkout)
3. On payment: webhook updates invoice status to \`paid\`, sends receipt

**Edge cases:**
- Duplicate invoice numbers: auto-increment per user, format INV-0001
- Overdue detection: cron job daily, flags invoices past due_date with status \`overdue\`
- Partial payments: track \`amount_paid\`, show remaining balance

---

## Section 4 — Full workflow

1. **Login** → dashboard with summary cards (outstanding, overdue, paid this month)
2. **Clients** → list view → add/edit/delete client
3. **New invoice** → step 1: select client → step 2: add items → step 3: preview → send
4. **Invoice list** → filter by status → click to view detail
5. **Invoice detail** → status badge, line items, totals, action buttons (send, mark paid, download PDF)
6. **Settings** → business info, payment details, invoice prefix/numbering

---

## Section 5 — Cost of development

| Tier | Monthly Cost | Services |
|---|---|---|
| Free / OSS | $0 | NextAuth free, Neon free, Resend free (3k/mo), Vercel hobby |
| Indie Builder | ~$19/mo | Neon pro, custom domain, Stripe (2.9% + $0.30/txn) |
| At Scale | ~$85/mo | Neon scale, Vercel pro, Stripe volume discounts |
`,
]

// Admin mock stats
export const MOCK_ADMIN_STATS = {
  totalUsers: 1_248,
  requestsToday: 832,
  dailyCap: 1_400,
  anonymousEnabled: true,
  recentEvents: [
    { type: 'generation_completed', fid: '423871', username: 'vitalik.eth', timestamp: '2026-05-02T14:22:00Z' },
    { type: 'credits_purchased', fid: 'privy|alice', username: 'alice@example.com', timestamp: '2026-05-02T14:18:00Z' },
    { type: 'edit_completed', fid: '12291', username: 'dwr.eth', timestamp: '2026-05-02T14:15:00Z' },
    { type: 'generation_completed', fid: '89124', username: 'horsefacts.eth', timestamp: '2026-05-02T14:10:00Z' },
    { type: 'share_verified', fid: '198823', username: 'banteg.eth', timestamp: '2026-05-02T14:05:00Z' },
    { type: 'generation_completed', fid: 'privy|bob', username: 'bob@example.com', timestamp: '2026-05-02T14:01:00Z' },
    { type: 'ticket_submitted', fid: '304567', username: 'ccarella.eth', timestamp: '2026-05-02T13:58:00Z' },
    { type: 'edit_completed', fid: 'privy|carol', username: 'carol@example.com', timestamp: '2026-05-02T13:55:00Z' },
    { type: 'generation_completed', fid: '71923', username: 'jacob.eth', timestamp: '2026-05-02T13:50:00Z' },
    { type: 'credits_purchased', fid: 'privy|dave', username: 'dave@example.com', timestamp: '2026-05-02T13:44:00Z' },
  ],
  anonymousToggle: true,
}
