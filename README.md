# Blueprnt

Turn any app idea into a full technical blueprint — ready to build, ready to hand off.

Blueprnt is an AI-powered Farcaster mini-app that takes a plain-English description of any app idea and produces a structured technical spec: architecture decisions, stack recommendations, data models, API surface, and an implementation roadmap. All streamed live in the browser.

---

## What it does

Describe any app idea in a sentence or two. Blueprnt generates a five-section blueprint covering:

- **Architecture** — system design, component breakdown, deployment model
- **Tech stack** — framework, database, auth, and infrastructure choices with rationale
- **Data models** — key entities, relationships, and schema sketch
- **API surface** — routes, payloads, and integration points
- **Build roadmap** — phased implementation steps from MVP to production

The output is immediately copy-paste-ready for a developer, a no-code builder, or an AI coding assistant.

---

## Using it as a foundation

The codebase is structured so that individual layers can be stripped and repurposed independently. If you want to build your own AI chatbot, Farcaster mini-app, or streaming chat interface, large parts of this work out of the box with minimal changes.

| Layer | Files | What to swap |
|---|---|---|
| AI prompt & output shape | `app/api/generate/route.ts` | Replace the system prompt and response format for your domain |
| Streaming UI | `components/views/chat-view.tsx` | Drop-in SSE consumer — wire to any streaming API endpoint |
| Auth | `components/providers/app-providers.tsx`, `hooks/use-privy-sync.ts` | Privy handles email, Google, and Farcaster — remove providers you don't need |
| Credits / rate limiting | `app/api/generate/route.ts`, `lib/db/users.ts` | Remove credit/edit checks for a fully open chatbot |
| Farcaster mini-app shell | `components/providers/environment-provider.tsx`, `app/page.tsx` | Remove the `fc:miniapp` meta and SDK provider to run as a plain web app |
| Anonymous mode | `components/providers/environment-provider.tsx`, FingerprintJS calls | Remove the fingerprint path to require sign-in from the start |
| Multi-chat sidebar | `components/layout/sidebar.tsx`, `app/api/chats/` | Delete for a single-conversation interface |

The core SSE streaming pattern (`ReadableStream` → line-buffered client consumer) and the three-tier user model (Farcaster / Privy / anonymous) are domain-agnostic and work for any chat-style product.

---

## Stack

- **Next.js 15** — App Router, server route handlers, SSE streaming
- **TypeScript** + Tailwind CSS v4
- **Privy** — email, Google, and embedded wallet auth
- **Farcaster Mini App SDK** — runs natively inside Warpcast
- **Google Gemini** — `gemini-2.0-flash-thinking-exp` with `gemini-2.0-flash` fallback
- **Drizzle ORM** + **Neon** PostgreSQL
- **FingerprintJS** — anonymous user rate limiting

---

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in your keys
pnpm dev
```

Required environment variables: `NEXT_PUBLIC_PRIVY_APP_ID`, `PRIVY_APP_SECRET`, `DATABASE_URL`, `GEMINI_API_KEY`, `NEXT_PUBLIC_APP_URL`.

To run as a Farcaster mini-app, deploy to a public URL and register it at [farcaster.xyz/mini-apps](https://farcaster.xyz/mini-apps). Update the `accountAssociation` block in `public/.well-known/farcaster.json` with your domain verification payload.
