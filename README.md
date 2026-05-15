```
██████╗ ██╗     ██╗   ██╗███████╗██████╗ ██████╗ ███╗   ██╗████████╗
██╔══██╗██║     ██║   ██║██╔════╝██╔══██╗██╔══██╗████╗  ██║╚══██╔══╝
██████╔╝██║     ██║   ██║█████╗  ██████╔╝██████╔╝██╔██╗ ██║   ██║
██╔══██╗██║     ██║   ██║██╔══╝  ██╔═══╝ ██╔══██╗██║╚██╗██║   ██║
██████╔╝███████╗╚██████╔╝███████╗██║     ██║  ██║██║ ╚████║   ██║
╚═════╝ ╚══════╝ ╚═════╝ ╚══════╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝
```

> **Describe an app idea. Get a production-ready technical blueprint.**

Blueprnt is an AI-powered technical planning tool that converts a plain-English app idea into a detailed, opinionated 5-section technical specification — the kind a senior engineer would hand to their team on day one of a build.

It runs as a **Farcaster miniapp** and a **standalone web app**, with onchain micropayments on Base.

---

## What it generates

Every blueprint contains exactly five sections, streamed live in the browser:

| # | Section | What's inside |
|---|---------|---------------|
| 1 | **Product overview** | Target user, problem, market differentiation, v1 success criteria, scope boundary |
| 2 | **Technical inventory** | Full stack table with rationale, auth flow, database schema, client-state architecture, external API list |
| 3 | **Resilience & security** | Data flows, edge case matrix, race condition handling, payment idempotency, secret handling |
| 4 | **UX & screen flows** | Every screen, every state (loading / empty / error / success), every transition numbered step-by-step |
| 5 | **Cost & build order** | Pricing table for every service, cost drivers, revenue model with real numbers, three-phase build plan |

---

## Stack

```
┌──────────────────────────────────────────────────────────────────┐
│  Frontend       Next.js 16 (App Router) · React 19 · TypeScript  │
│  Styling        Tailwind CSS 4 · custom design tokens (light/dark)│
│  Auth           Privy (embedded wallets) · Farcaster miniapp SDK  │
│  Database       PostgreSQL via Neon · Drizzle ORM                 │
│  AI             Gemini 1.5 Flash  →  Groq (auto-failover)        │
│  Payments       USDC on Base · BlueprnCheckout.sol · viem         │
│  Deployment     Vercel · Vercel Analytics                         │
│  Admin alerts   Telegram Bot API                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Features

### Core
- **AI blueprint generation** — structured 5-section spec from a single prompt
- **Iterative editing** — refine any section of a blueprint in-chat
- **Branch & regenerate** — produce an alternative architecture from the same idea, with genuinely different stack and tradeoff choices
- **Multi-chat history** — all conversations saved per account with sidebar navigation
- **Farcaster miniapp** — runs natively inside Warpcast using FID as the primary identity

### Security & Privacy
- **Chats encrypted at rest** — all message content is AES-256 encrypted before being written to the database; the server decrypts on read, nothing is stored in plaintext
- **Server-side credit enforcement** — balances are never trusted from the client; all credit and edit checks are enforced server-side before any generation runs
- **Onchain payment verification** — every purchase is verified against the Base blockchain before credits are applied; client-reported success is ignored entirely

### Credit & edit system
```
Free tier  ── every new account (Farcaster or Privy)
│
├─ 3 free credits
│   └─ each generates 1 blueprint
│       └─ each blueprint starts with 3 edits
│
└─ gifted cycle  ── granted when free credits run out
    └─ 7-day window where depleted chats auto-refill with 3 edits


Purchased credits  ── onchain USDC on Base
│
├─ Single    $0.50  →  1  blueprint · 5 edits each
├─ Pack      $1.00  →  2  blueprints · 5 edits each
├─ Pack      $5.00  →  12 blueprints · 5 edits each  · $0.42/gen
└─ Pack     $10.00  →  25 blueprints · 5 edits each  · $0.40/gen


Edit refill  ── per chat, onchain
│
└─ $0.25  →  +10 edits added to that specific blueprint
```

> Purchased credits are spent before free credits. Free and purchased pools are tracked separately.

### Reliability
- **AI failover** — Gemini 1.5 Flash is primary; Groq takes over automatically on failure with no user-facing interruption
- **Off-topic classifier** — lightweight server-side filter blocks spam and factual lookups before they reach the model; all ambiguous inputs are passed to the AI's own system prompt for contextual handling
- **Daily request cap** — configurable global limit with a Telegram alert at the 80% threshold
- **Per-user rate limiting** — 30-second window prevents burst abuse

### Admin
- **Telegram alerts** — real-time push for new sign-ups, purchases, support tickets, and daily cap warnings
- **Support ticket system** — in-app submission stored to database and alerted instantly
- **Admin dashboard** — usage stats, user list, and generation logs (gated by FID or Privy ID)

---

## Project structure

```
blueprnt_app/
│
├── app/
│   ├── api/
│   │   ├── auth/           # upsert-user, migrate-anon
│   │   ├── chats/          # list, rename, delete
│   │   ├── generate/       # AI streaming endpoint (SSE)
│   │   ├── purchases/      # onchain purchase confirmation
│   │   ├── state/          # credits, edits, gifted cycle polling
│   │   └── tickets/        # support tickets
│   └── page.tsx
│
├── components/
│   ├── modals/             # purchase, edit-refill, tip, onboarding
│   ├── payments/           # WalletSummary shared panel
│   ├── ui/                 # Modal, SlideUp, base primitives
│   └── views/              # AppShell, ChatView
│
├── contracts/              # BlueprnCheckout.sol (Foundry)
│
├── hooks/
│   ├── use-payment.ts      # full Privy + Farcaster payment flow
│   └── use-wallet-balances.ts
│
├── lib/
│   ├── ai/                 # classify, prompt-builder, stream, validate
│   ├── auth/               # is-admin
│   ├── crypto.ts           # AES-256 encrypt/decrypt
│   ├── db/                 # schema, drizzle client, generation-log
│   └── telegram.ts         # admin alert helpers
│
└── scripts/                # one-off DB migration scripts
```

---

## Environment variables

```bash
# Database
DATABASE_URL=

# Auth
NEXT_PUBLIC_PRIVY_APP_ID=
PRIVY_APP_SECRET=

# AI
GEMINI_API_KEY=
GROQ_API_KEY=

# Onchain  (Base mainnet)
NEXT_PUBLIC_CHECKOUT_ADDRESS=    # deployed BlueprnCheckout.sol
NEXT_PUBLIC_TREASURY_ADDRESS=    # USDC recipient wallet
NEXT_PUBLIC_BASE_RPC_URL=        # Alchemy or public RPC

# Encryption  — never commit this value
ENCRYPTION_KEY=                  # 32-byte hex string

# Farcaster
NEYNAR_API_KEY=

# Admin alerts
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Optional
DAILY_REQUEST_CAP=1400
ADMIN_FIDS=                      # comma-separated Farcaster FIDs
ADMIN_PRIVY_IDS=                 # comma-separated Privy IDs
NEXT_PUBLIC_APP_NAME=Blueprnt
```

---

## Getting started

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

**Smart contract** — the `contracts/` folder is a self-contained Foundry project for `BlueprnCheckout.sol`. For local development you can skip deployment entirely by leaving `NEXT_PUBLIC_CHECKOUT_ADDRESS` empty; payment flows will gracefully disable themselves.

**Farcaster registration** — deploy to a public URL, then register the miniapp at [farcaster.xyz/mini-apps](https://farcaster.xyz/mini-apps). Update the `accountAssociation` block in `public/.well-known/farcaster.json` with your domain verification payload.

---

## Contributing

Pull requests are welcome. For significant changes open an issue first. The highest-value areas:

- `lib/ai/prompt-modules.ts` — blueprint prompt quality and section depth
- `lib/ai/validate.ts` — post-generation structure verification
- `lib/ai/classify.ts` — classifier tuning, false-positive reduction
- `contracts/src/BlueprnCheckout.sol` — new SKUs or payment logic

---

## License

MIT — see `LICENSE`.

---

```
─────────────────────────────────────────────────────────────────────
  P.S. — this codebase is a foundation, not just a product
─────────────────────────────────────────────────────────────────────
```

Blueprnt is MIT-licensed and deliberately layered so each part can be extracted and repurposed. The hardest pieces — AES-256 encrypted storage, onchain USDC payment verification, Farcaster identity, streaming AI with failover, and a two-pool credit system — are already built and generic. Here are some directions the codebase naturally fits:

**Personal AI assistant**
Swap the system prompt in `lib/ai/prompt-modules.ts` and you have a private, encrypted, credit-gated chatbot. The encryption key is yours alone; nothing is stored in plaintext.

**Domain-specific document generator**
Replace the blueprint prompt with instructions for legal drafting, business plans, medical summaries, RFP responses, or any structured-output use case. The 5-section format is just a prompt — change it to 3 sections, 10 sections, or a freeform report.

**Farcaster miniapp shell**
The Farcaster auth, FID-based identity, `sdk.actions.composeCast()` share flows, and Base payment integration form a complete miniapp starter. Swap the AI layer for whatever your miniapp does.

**Niche AI advisor**
Point it at a domain — "startup advisor", "code reviewer", "pitch deck critic", "architecture auditor" — and you have a paid, gated AI consultant with persistent chat history and per-session edit budgets.

**Onchain gated content**
The `BlueprnCheckout.sol` contract and the two-pool credit system (free tier + paid tier with different entitlements) are generic. Gate access to any content, API call, or feature behind USDC micropayments on Base with a few prompt changes.

The structure is there. The rest is imagination.
