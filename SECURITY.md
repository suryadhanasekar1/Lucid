# Security

Compass handles real brokerage data and four paid/credentialed API keys
(Anthropic, SnapTrade, FRED, NewsAPI) plus a required SEC EDGAR User-Agent.
The rules below are non-negotiable.

## Hard rules (master-spec Section 6)

1. **Never commit `.env.local`.** Listed in `.gitignore` from commit 1. The
   pre-commit hook (`scripts/pre-commit.sh`) blocks any staged `.env*` file.
2. **All API keys are server-side only.** `ANTHROPIC_API_KEY`,
   `SNAPTRADE_CONSUMER_KEY`, `FRED_API_KEY`, `NEWSAPI_KEY` must never be
   imported by `src/components/**` or any file referenced from a client
   component. The proxy pattern (`/api/{service}/...`) is the only way the
   browser interacts with paid services.
3. **Zod-sanitize all user input before AI calls.** Worry/headline routes
   enforce length limits (worry ≤ 500, topic ≤ 200, headline title required)
   and reject empty input with 400 before any external request.
4. **Rate limiting.** Every paid AI route uses the in-memory token bucket in
   `src/lib/rate-limit.ts` keyed by `x-forwarded-for | x-real-ip | 127.0.0.1`.
   Default 20 rpm via `RATE_LIMIT_AI_RPM`. SnapTrade routes get a separate
   bucket. Excess returns 429 with `retryAfter`.
5. **Startup validation.** `src/lib/env.ts` Zod-parses `process.env`; the
   process exits 1 with a field-level error map if any required variable is
   missing or malformed.
6. **SnapTrade webhooks** (`/api/snaptrade/webhook`): HMAC-SHA256 over the raw
   body using `SNAPTRADE_CONSUMER_KEY`, compared in constant time
   (`crypto.timingSafeEqual`). Mismatches → 401. Length-mismatched buffers are
   rejected before the constant-time compare.
7. **SEC EDGAR** (`src/lib/funds/edgar.ts`): every request includes the
   `SEC_EDGAR_USER_AGENT` header. The client refuses to call EDGAR if the var
   is missing or shorter than 10 characters.
8. **Pre-commit hook** runs key-pattern checks for `sk-ant-`,
   `SNAPTRADE_CONSUMER_KEY=`, `NEWSAPI_KEY=`, `FRED_API_KEY=` plus
   `gitleaks protect --staged` when available.
9. **Graceful key-failure paths.** Each external integration has a
   deterministic fallback: missing/invalid Anthropic key → seeded copy with
   real macro citations; missing FRED key → `public/data/macro.json`; missing
   NewsAPI key → `public/data/news.json`; flaky SnapTrade → 502 +
   sample-portfolio. The client never sees a key, even on failure.

## Verifying the audit

```bash
git log -p | grep -i "sk-ant-"            # must return nothing
git log -p | grep -i "SNAPTRADE_CONSUMER" # must return nothing
git log -p | grep -i "FRED_API_KEY"       # must return nothing
git log -p | grep -i "NEWSAPI_KEY"        # must return nothing
```

## What is NOT in scope for v1

- No user accounts, no auth, no PII persistence beyond `localStorage`.
- No persistent server-side database — Zustand + `localStorage` only.
- No financial transactions are executed. SnapTrade integration is read-only;
  the Circuit Breaker logs sell *attempts* but never sends them anywhere.

These constraints exist to minimise the attack surface during the hackathon.
The proxy pattern, env validation, and pre-commit secret scanner together
prevent the only realistic vectors: a key landing in client bundle output, a
key landing in git history, or an unauthenticated webhook spoofed inbound.

## Reporting

If you find a leaked key in the git history: rotate it at the provider
immediately, scrub the history with `git filter-repo`, force-push, and open
an issue tagged `security`.
