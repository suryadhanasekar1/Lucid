# Compass

> Navigating the unknown for the everyday investor.

A stock + mutual-fund portfolio companion built for **non-market-savvy
individuals** — beginners who panic during uncertainty and lack confidence with
traditional brokerage UIs.

This repository is the hackathon submission for *"Empowering the Everyday
Investor"*. The single source of truth for the build is
[`COMPASS_MASTER_SPEC.md`](./COMPASS_MASTER_SPEC.md).

## What's different about Compass

- **Adaptive dashboard** — every widget is gated by survey answers; two users
  with different worries see meaningfully different layouts.
- **Sleep Test onboarding** — a visceral risk-capture slider instead of a quiz.
  The dollar value where you said "stop" is treated as sacred everywhere else.
- **Worry Translator** — type any fear in plain English; get a calm reframing
  grounded in today's real macro data (CPI, Fed funds, 10y, 30y mortgage from
  FRED). Never "buy/sell" advice.
- **Headline Decoder** — trending business headlines auto-classified as
  *Noise*, *Watch*, or *Act* with a one-paragraph translation.
- **Behavioral Circuit Breaker** — every sell attempt opens a 60-second pause
  with a typed-reason gate (≥12 chars). Cancellations are the encouraged
  outcome and feed the Anti-Panic Streak.
- **Mutual Fund X-Ray** — pulls real top holdings from SEC EDGAR N-PORT
  filings and cites the filing date.
- **Show me the math** on every numeric widget — because trust requires
  receipts.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind · Framer Motion · Zustand ·
React Hook Form · Recharts · Anthropic Claude (`@anthropic-ai/sdk` 0.30) ·
SnapTrade · yahoo-finance2 · SEC EDGAR · FRED · NewsAPI

## Setup (cold start)

```bash
# 1. Clone and install
git clone <this repo>
cd compass
npm install

# 2. Configure env
cp .env.example .env.local
#    Required keys (see .env.example for sources):
#      ANTHROPIC_API_KEY      → console.anthropic.com/settings/keys
#      SNAPTRADE_CLIENT_ID    → snaptrade.com (free dev tier)
#      SNAPTRADE_CONSUMER_KEY
#      SNAPTRADE_REDIRECT_URI = http://localhost:3000/connect/callback
#      SEC_EDGAR_USER_AGENT   = "Compass Hackathon you@example.com"
#    Optional but unlocks live paths:
#      FRED_API_KEY           → fred.stlouisfed.org/docs/api/api_key.html
#      NEWSAPI_KEY            → newsapi.org/register

# 3. Install the pre-commit secret-scanner
npm run setup:hooks

# 4. (Optional) refresh the seeded EDGAR + FRED + news caches
npm run seed

# 5. Run
npm run dev      # → http://localhost:3000
```

The app degrades gracefully when keys are missing:
- No `ANTHROPIC_API_KEY` → AI endpoints return a deterministic, macro-grounded
  fallback. The UI still works.
- No `FRED_API_KEY` → macro snapshot is served from `public/data/macro.json`.
- No `NEWSAPI_KEY` → headline list is served from `public/data/news.json`
  (8 seeded items).
- No SnapTrade keys → SnapTrade routes 502 silently and the UI falls back to
  the sample portfolio in `public/data/sample-portfolio.json`.

## Verifying the build

```bash
npm run typecheck                  # tsc --noEmit
npm run lint                       # next lint
npm run build                      # next build (must be clean)
npx tsx scripts/phase3-test.ts     # 28 macro/scenario/EDGAR checks
npx tsx scripts/phase4-test.ts     # 20 AI endpoint + fallback checks
npx tsx scripts/phase5-test.ts     # 17 Circuit Breaker store checks
npx tsx scripts/phase6-test.ts     # 26 cost/tax + recommender checks
npx tsx scripts/phase7-test.ts     # 15 a11y + reduced-motion checks
npx tsx scripts/phase8-test.ts     # error boundary + skeleton + empty states
```

## Architecture

Three layers, strictly enforced:

1. **UI layer** (`src/components/**`, `src/app/**/page.tsx`) — components only
   read state via hooks. Never call `fetch()`. Never import `src/lib/portfolio`
   or `src/lib/claude`.
2. **Hook layer** (`src/hooks/**`) — fixed at 11 hooks. Each hook returns
   `{ state, actions, status }`. Hook signatures do not change after v1.
   See Section 4 of the master spec for the contract.
3. **Logic layer** (`src/lib/**`, `src/stores/**`, `src/app/api/**`) — math,
   external API calls, prompt construction. All API keys live here.

This split means the entire UI can be swapped (`v1` → `v2`) without touching
the hook signatures or the API routes.

## Project map

```
src/
├── app/
│   ├── api/
│   │   ├── claude/{explain,translate-worry,decode-headline}/  ← server-only AI
│   │   ├── snaptrade/{register,connect,holdings,webhook}/     ← HMAC-verified
│   │   ├── macro/conditions, news/trending, market/prices     ← cached APIs
│   │   ├── portfolio/{scenarios,rebalance}, funds/holdings    ← deterministic
│   ├── dashboard/, onboarding/, connect/                       ← pages
├── components/{shared,widgets,survey,connect,ui}/v1/           ← swappable UI
├── hooks/                                                       ← 11 hooks, fixed
├── lib/{claude,macro,funds,market,news,portfolio,widgets}/     ← logic
├── stores/{userStore,portfolioStore,breakerStore}.ts           ← Zustand
└── types/index.ts                                               ← contract
```

## Phases

The build runs in seven phases, each with a hard gate. Phase 0–6 follow the
master-spec phasing; phases 7–8 layer on the spec's "polish" deliverables
(accessibility, error boundaries, skeletons, mobile reflow, demo-flow framing).
Status: see [`PHASE_LOG.md`](./PHASE_LOG.md). Out-of-scope ideas:
see [`BACKLOG.md`](./BACKLOG.md).

## Security

See [`SECURITY.md`](./SECURITY.md). Hard rules:

- All API keys are server-side. The frontend talks only to `/api/*` proxies.
- `src/lib/env.ts` Zod-validates required env at startup; the process exits 1
  if any required key is missing or malformed.
- Rate limiting (20 rpm/IP, configurable via `RATE_LIMIT_AI_RPM`) on every
  paid AI route + the news/macro endpoints.
- SnapTrade webhooks verify HMAC-SHA256 in constant time; mismatches → 401.
- SEC EDGAR requires a `User-Agent` header on every request — refuses to
  proceed without one.
- Pre-commit hook (`scripts/pre-commit.sh`) blocks commits containing the
  Anthropic, SnapTrade, FRED, or NewsAPI key patterns and any staged `.env`.

## Demo

The 4-minute demo path is in master-spec Section 10. The repo is structured to
make every cited number auditable: every widget exposes a "Show me the math"
disclosure, AI responses ship FRED citations, and `/api/funds/holdings`
returns the original SEC filing date.
