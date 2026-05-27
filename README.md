```
██████╗ ██╗     ██╗   ██╗███████╗██████╗ ██████╗ ███╗   ██╗████████╗
██╔══██╗██║     ██║   ██║██╔════╝██╔══██╗██╔══██╗████╗  ██║╚══██╔══╝
██████╔╝██║     ██║   ██║█████╗  ██████╔╝██████╔╝██╔██╗ ██║   ██║
██╔══██╗██║     ██║   ██║██╔══╝  ██╔═══╝ ██╔══██╗██║╚██╗██║   ██║
██████╔╝███████╗╚██████╔╝███████╗██║     ██║  ██║██║ ╚████║   ██║
╚═════╝ ╚══════╝ ╚═════╝ ╚══════╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝
```

<div align="center">

**Describe an app idea. Get a production-ready technical blueprint.**

</div>

Blueprnt is an AI-powered technical planning tool that converts a plain-English app idea into a detailed, opinionated 5-section technical specification — the kind a senior engineer would hand to their team on day one of a build.

It runs as a **Farcaster miniapp** and a **standalone web app**, with onchain micropayments on Base. Every hard piece — AES-256 encrypted chat history, streaming AI with silent retry, Farcaster identity, onchain USDC payment verification, and a two-pool credit system — is already built and production-ready.

> **P.S.** — although this is a technical blueprint generator, the foundation is deliberately generic and can be easily repurposed into: a **private AI chatbot** (swap the system prompt, keep the encrypted storage and credit gating), a **domain-specific document generator** (legal drafts, business plans, RFP responses, medical summaries), a **niche AI advisor** (startup coach, code reviewer, pitch critic, architecture auditor), a **Farcaster miniapp shell** (auth, Base payments, wallet integration, and cast-verified rewards already wired), or any **onchain-gated content or API product** built on USDC micropayments on Base.

<br>

```
╔══════════════════════════════════════════════════════════════════════╗
║                        WHAT IT GENERATES                            ║
╚══════════════════════════════════════════════════════════════════════╝
```

Every blueprint contains exactly **five sections**, streamed live in the browser:

| # | Section | What's inside |
|:-:|---------|---------------|
| `01` | **Product overview** | Target user, problem, market differentiation, v1 success criteria, scope boundary |
| `02` | **Technical inventory** | Full stack table with rationale, auth flow, database schema, client-state architecture, external API list |
| `03` | **Resilience & security** | Data flows, edge case matrix, race condition handling, payment idempotency, secret handling |
| `04` | **UX & screen flows** | Every screen, every state (loading / empty / error / success), every transition numbered step-by-step |
| `05` | **Cost & build order** | Pricing table for every service, cost drivers, revenue model with real numbers, three-phase build plan |

<br>

```
╔══════════════════════════════════════════════════════════════════════╗
║                             STACK                                   ║
╚══════════════════════════════════════════════════════════════════════╝
```

```
┌─────────────────┬────────────────────────────────────────────────────┐
│  FRONTEND       │  Next.js 16 (App Router) · React 19 · TypeScript   │
│  STYLING        │  Tailwind CSS 4 · custom design tokens (light/dark) │
│  UI             │  Radix UI · shadcn/ui                              │
├─────────────────┼────────────────────────────────────────────────────┤
│  AUTH           │  Privy (email + Google, embedded wallets)          │
│                 │  Farcaster miniapp SDK (FID identity)              │
├─────────────────┼────────────────────────────────────────────────────┤
│  DATABASE       │  PostgreSQL via Neon · Drizzle ORM                 │
├─────────────────┼────────────────────────────────────────────────────┤
│  AI             │  OpenAI gpt-4o-mini          ← primary             │
│                 │  Groq llama-3.3-70b          ← auto-failover       │
│                 │  Groq llama-3.1-8b-instant   ← secondary fallback  │
├─────────────────┼────────────────────────────────────────────────────┤
│  PAYMENTS       │  USDC on Base (chain 8453)                        │
│                 │  BlueprnCheckout.sol · viem · Alchemy RPC          │
├─────────────────┼────────────────────────────────────────────────────┤
│  ENCRYPTION     │  AES-256-GCM · per-value IV + auth tag             │
│  CAST VERIFY    │  Neynar API  (share-to-earn, Farcaster-only)       │
├─────────────────┼────────────────────────────────────────────────────┤
│  DEPLOYMENT     │  Vercel · 120s max function timeout (streaming)    │
│                 │  Vercel Analytics                                  │
│  ADMIN ALERTS   │  Telegram Bot API                                  │
└─────────────────┴────────────────────────────────────────────────────┘
```

<br>

```
╔══════════════════════════════════════════════════════════════════════╗
║                            FEATURES                                 ║
╚══════════════════════════════════════════════════════════════════════╝
```

### ◈ Core

- **AI blueprint generation** — structured 5-section spec from a single prompt, streamed live character-by-character

- **Iterative editing** — refine any section of a blueprint in-chat without regenerating the whole thing

- **Branch & regenerate** — produce a genuinely different alternative architecture from the same idea with different stack and tradeoff choices; branches stored per message in a JSONB array with `activeBranchIndex` tracking

- **Multi-chat history** — all conversations saved per account with sidebar navigation and rename/delete support

- **Farcaster miniapp** — runs natively inside Warpcast; FID is the primary identity; supports `sdk.actions.composeCast()` share flows

- **Onboarding slideshow** — shown once per user type (anonymous, Privy, Farcaster) with slide content tailored to auth context

<br>

### ◈ Security & Privacy

- **Chats encrypted at rest** — all message content and chat titles are AES-256-GCM encrypted before being written to the database; the server decrypts on read, nothing is stored in plaintext; legacy plaintext rows are detected by regex and handled transparently during migration

- **Server-side credit enforcement** — balances are never trusted from the client; all credit and edit checks happen server-side before any generation starts

- **Onchain payment verification** — every purchase is verified by reading the `Purchase` event from the Base blockchain before credits are applied; client-reported success is never trusted

- **Idempotent purchases** — a unique constraint on `txHash` in `processedEvents` prevents any payment from being applied twice, even on network retries or replayed requests; wrapped in `db.transaction()` for all-or-nothing atomicity

<br>

### ◈ Credit & Edit System

```
┌──────────────────────────────────────────────────────────────────────┐
│  ANONYMOUS (pre-auth)                                                │
│                                                                      │
│  └─ 1 free blueprint · 24-hour limit per browser fingerprint        │
│      └─ Chat state saved to localStorage                            │
│          └─ Migrated to Privy account on sign-in                    │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  FREE TIER  ── every new registered account (Farcaster or Privy)    │
│                                                                      │
│  ├─ 3 free credits                                                   │
│  │   └─ each generates 1 blueprint                                  │
│  │       └─ each blueprint starts with 3 edits                      │
│  │                                                                   │
│  └─ gifted cycle  ── granted when all credits + edits run out       │
│      └─ 7-day window: depleted chats auto-refill with 3 edits       │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  SHARE-TO-EARN  ── Farcaster users only                             │
│                                                                      │
│  └─ Cast about Blueprnt on Farcaster → +2 free credits             │
│      └─ Verified via Neynar API · resets weekly (Monday 1am UTC)    │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  TIPS  ── optional, no credits granted                              │
│                                                                      │
│  └─ $5 / $10 / $15  recorded in transactions table for analytics    │
└──────────────────────────────────────────────────────────────────────┘
```

<br>

### ◈ Reliability

- **AI failover** — OpenAI gpt-4o-mini is primary; Groq llama-3.3-70b-versatile takes over on API failure or timeout (90s); llama-3.1-8b-instant handles secondary Groq failures

- **Silent retry** — if the AI response doesn't parse as a valid 5-section structure, the server retries once silently (non-streaming, full buffer); if the retry also fails, the client sees a plain error message

- **Off-topic classifier** — lightweight server-side filter blocks spam and factual lookups before reaching the model; a two-strike window (10 min) escalates the message on repeat attempts; ambiguous inputs are passed to the AI's own system prompt gate

- **Daily request cap** — configurable global limit (`DAILY_REQUEST_CAP`, default 1400) with a Telegram alert fired exactly when the 80% threshold is crossed

- **Per-user rate limiting** — 30-second window enforced server-side before any DB or AI work

<br>

### ◈ Admin

- **Telegram alerts** — real-time push for new sign-ups, purchases, support tickets, daily cap warnings, and share verification failures

- **Admin settings** — toggle anonymous mode on/off from the dashboard; action logged to `events` table as `admin_toggle_anon`

- **Support ticket system** — in-app submission stored to database and alerted instantly; admins can update status and add structured notes

- **Admin dashboard** — usage stats, user list, generation logs, platform split (Farcaster vs Privy), and full ticket queue — gated by FID, Privy ID, or email via env vars

<br>

```
╔══════════════════════════════════════════════════════════════════════╗
║                        DATABASE SCHEMA                              ║
╚══════════════════════════════════════════════════════════════════════╝
```

Seven tables, all UUID primary keys:

```
┌──────────────────┬──────────────────────────────────────────────────┐
│  users           │  Identity (FID or Privy ID), both credit pools,  │
│                  │  gifted cycle expiry, share reward timestamp      │
├──────────────────┼──────────────────────────────────────────────────┤
│  chats           │  Per-user threads · editsRemaining · enc. title  │
├──────────────────┼──────────────────────────────────────────────────┤
│  messages        │  Encrypted content · branches JSONB array for    │
│                  │  regeneration alternatives                        │
├──────────────────┼──────────────────────────────────────────────────┤
│  transactions    │  Every onchain payment: type, SKU, amount,       │
│                  │  chatId (edit refills only)                       │
├──────────────────┼──────────────────────────────────────────────────┤
│  events          │  Raw onchain events · admin actions · anon       │
│                  │  generation logs · off-topic strikes              │
├──────────────────┼──────────────────────────────────────────────────┤
│  processed_events│  Deduplication ledger · unique txHash constraint │
│                  │  prevents double-spend                           │
├──────────────────┼──────────────────────────────────────────────────┤
│  tickets         │  Support tickets · status · notes JSONB          │
└──────────────────┴──────────────────────────────────────────────────┘
```

<br>

```
╔══════════════════════════════════════════════════════════════════════╗
║                        PROJECT STRUCTURE                            ║
╚══════════════════════════════════════════════════════════════════════╝
```

```
blueprnt_app/
│
├── app/
│   ├── api/
│   │   ├── anon/credits/           # anonymous credit check (browser fingerprint)
│   │   ├── auth/
│   │   │   ├── upsert-user/        # register or update user on login
│   │   │   └── migrate-anon/       # move localStorage chat to Privy account
│   │   ├── chats/                  # list all chats
│   │   │   └── [id]/               # read, rename, delete individual chat
│   │   ├── generate/               # SSE streaming endpoint — main AI route
│   │   ├── purchases/confirm/      # onchain payment verification + credit grant
│   │   ├── share/verify/           # Farcaster cast verification via Neynar
│   │   ├── state/                  # poll credits, edits, gifted cycle expiry
│   │   ├── tickets/                # create support ticket
│   │   └── admin/
│   │       ├── check/              # is-admin gate
│   │       ├── settings/           # toggle anonymous mode
│   │       ├── stats/              # usage stats, user list, generation logs
│   │       └── tickets/            # list tickets; [id]: update status/notes
│   └── page.tsx
│
├── components/
│   ├── admin/                      # DashboardCards, TicketList, TicketDetail
│   ├── chat/                       # ChatBox, Message, PromptTips
│   ├── layout/                     # Header, Sidebar
│   ├── modals/                     # PurchaseModal, EditRefillModal, TipModal,
│   │                               # TicketModal, ShareVerificationModal,
│   │                               # ConfirmModals, ContinueChatSlideup
│   ├── onboarding/                 # OnboardingSlideshow, WalletFundingSlideshow
│   ├── payments/                   # WalletSummary shared panel
│   ├── providers/                  # AppProviders, EnvironmentProvider, ThemeProvider
│   ├── ui/                         # Modal, SlideUp, and all base primitives
│   ├── views/                      # AppShell, ChatView, AdminView
│   └── error-boundary.tsx
│
├── contracts/                      # BlueprnCheckout.sol (self-contained Foundry project)
│
├── hooks/
│   ├── use-payment.ts              # full Privy + Farcaster payment flow
│   ├── use-privy-sync.ts           # Privy auth state → app user + anon migration
│   ├── use-wallet-balances.ts      # USDC + ETH balance reads via viem
│   ├── use-mobile.ts
│   └── use-toast.ts
│
├── lib/
│   ├── ai/
│   │   ├── classify.ts             # off-topic detection, hard filters, two-strike
│   │   ├── context.ts              # load active blueprint + branch for edits/regen
│   │   ├── openai.ts               # gpt-4o-mini streaming + non-streaming
│   │   ├── groq.ts                 # llama-3.3-70b primary, llama-3.1-8b fallback
│   │   ├── stream.ts               # provider abstraction (OpenAI → Groq failover)
│   │   ├── prompt-builder.ts       # assembles payload by kind (new/edit/regenerate)
│   │   ├── prompt-modules.ts       # system prompt text and section rules
│   │   ├── types.ts
│   │   └── validate.ts             # post-generation 5-section structure check
│   ├── auth/is-admin.ts            # checks FID, Privy ID, email against env vars
│   ├── db/
│   │   ├── anonymous-limit.ts      # 24h per-fingerprint generation cap
│   │   ├── generation-log.ts       # rate limiting, off-topic strikes, daily count
│   │   ├── index.ts                # Drizzle client
│   │   ├── schema.ts               # all table definitions
│   │   └── users.ts                # user lookup helpers
│   ├── alerts.ts                   # Telegram alert helpers (cap warning, share fail)
│   ├── anon-migration.ts           # localStorage state save/load/migrate
│   ├── contracts.ts                # SKU definitions, ABIs, chatIdToRef helpers
│   ├── crypto.ts                   # AES-256-GCM encrypt/decrypt
│   ├── errors.ts                   # shared error types
│   ├── logging.ts                  # hashForLogging (identity hashing for logs)
│   ├── neynar.ts                   # Neynar health check, cast requirement validation
│   ├── onboarding.ts               # per-user-type onboarding visibility + slide content
│   ├── pfp-gradient.ts             # deterministic avatar gradient from identity
│   ├── share.ts                    # weekly reset logic, cast composer URL builder
│   ├── telegram.ts                 # low-level Telegram Bot API calls
│   ├── user-detection.ts           # Farcaster vs Privy vs anonymous detection
│   └── utils.ts
│
└── scripts/
    ├── encrypt-existing-data.ts        # one-off: encrypt legacy plaintext rows
    ├── migrate-edits-default.mjs       # one-off: backfill editsRemaining
    ├── migrate-purchased-credits.mjs   # one-off: add purchasedCreditsRemaining
    └── migrate-purchased-credits-flag.mjs
```

<br>

```
╔══════════════════════════════════════════════════════════════════════╗
║                      ENVIRONMENT VARIABLES                          ║
╚══════════════════════════════════════════════════════════════════════╝
```

See `.env.example` for the full list. The key groups are:

| Group | Variables |
|-------|-----------|
| Database | `DATABASE_URL` |
| Auth | `NEXT_PUBLIC_PRIVY_APP_ID`, `PRIVY_APP_SECRET` |
| AI | `OPENAI_API_KEY`, `GROQ_API_KEY` |
| Onchain | `NEXT_PUBLIC_CHECKOUT_ADDRESS`, `NEXT_PUBLIC_TREASURY_ADDRESS`, `NEXT_PUBLIC_BASE_RPC_URL` |
| Encryption | `ENCRYPTION_KEY` — **never commit this** |
| Cast verify | `NEYNAR_API_KEY` — required for share-to-earn |
| Admin alerts | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` |
| Admin access | `ADMIN_FIDS`, `ADMIN_PRIVY_IDS` |
| Optional | `DAILY_REQUEST_CAP`, `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_URL` |

<br>

```
╔══════════════════════════════════════════════════════════════════════╗
║                         GETTING STARTED                             ║
╚══════════════════════════════════════════════════════════════════════╝
```

```bash
# 1. Clone and install
git clone https://github.com/will-stark/blueprnt.git
cd blueprnt_app
pnpm install

# 2. Fill in environment variables
cp .env.example .env.local

# 3. Push the database schema
pnpm db:push

# 4. Run locally
pnpm dev
```

**Smart contract** — the `contracts/` folder is a self-contained Foundry project for `BlueprnCheckout.sol`. For local development you can skip deployment entirely by leaving `NEXT_PUBLIC_CHECKOUT_ADDRESS` empty — payment flows will gracefully disable themselves.

**Farcaster registration** — deploy to a public URL, then register the miniapp at [farcaster.xyz/mini-apps](https://farcaster.xyz/mini-apps). Update the `accountAssociation` block in `public/.well-known/farcaster.json` with your domain verification payload.

**Share-to-earn** — requires a valid `NEYNAR_API_KEY`. If the key is absent the verify endpoint returns `null` and the share modal surfaces a "service unavailable" state gracefully.

<br>

```
╔══════════════════════════════════════════════════════════════════════╗
║                          CONTRIBUTING                               ║
╚══════════════════════════════════════════════════════════════════════╝
```

Pull requests are welcome. For significant changes open an issue first. The highest-value areas:

| File | Area |
|------|------|
| `lib/ai/prompt-modules.ts` | Blueprint prompt quality and section depth |
| `lib/ai/validate.ts` | Post-generation structure verification |
| `lib/ai/classify.ts` | Classifier tuning, false-positive reduction |
| `contracts/src/BlueprnCheckout.sol` | New SKUs or payment logic |
| `lib/share.ts` + `app/api/share/verify/` | Cast verification requirements |

<br>

```
╔══════════════════════════════════════════════════════════════════════╗
║                            LICENSE                                  ║
╚══════════════════════════════════════════════════════════════════════╝
```

MIT — see `LICENSE`.

This codebase is free to use, fork, and build on. The only requirement is that you keep the original copyright notice and license file in any distribution — that's it, that's the deal.

That said: if you build something real on top of this, a shoutout goes a long way. A mention in your README, a cast, or just a DM — not required, but genuinely appreciated. This took a while to build, and knowing it helped someone ship something is the whole point.
