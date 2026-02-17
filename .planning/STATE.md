# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-17)

**Core value:** Voice/text input transformed into a structured, accurate painting job quote via LLM — the painter speaks, the system produces a professional quote ready to send
**Current focus:** Phase 1 - Foundation

## Current Position

Phase: 1 of 5 (Foundation)
Plan: 4 of 4 in current phase
Status: Executing — Plans 01-04 in progress — CI committed, Vercel deployment blocked by human-action auth gate
Last activity: 2026-02-17 — Plan 04 executing (CI pipeline committed, Vercel deployment pending user auth)

Progress: [████░░░░░░] 35%

## Performance Metrics

**Velocity:**
- Total plans completed: 3
- Average duration: 12.7 min
- Total execution time: 38 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 3/4 | 38 min | 12.7 min |

**Recent Trend:**
- Last 5 plans: 14 min, 9 min, 15 min
- Trend: Stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: LLM provider-agnostic design via Vercel AI SDK — env var switches between Claude and GPT
- [Roadmap]: Mobile-first responsive web (not native) — Next.js 16 + Tailwind v4
- [Roadmap]: Pricing in application code only — LLM outputs quantities, never dollar amounts
- [Roadmap]: Better Auth (not Clerk) for GDPR compliance — user PII stays in own Postgres
- [Roadmap]: Supabase Frankfurt for EU data residency + RLS tenant isolation
- [01-01]: Biome 2.4.2 requires tailwindDirectives=true in CSS parser and files.includes for exclusions (not files.ignore)
- [01-01]: Drizzle uses prepare:false with postgres.js — mandatory for Supabase Transaction pool mode
- [01-01]: DATABASE_URL (port 6543 pooler) for runtime, DATABASE_URL_DIRECT (port 5432) for drizzle-kit migrations
- [01-01]: RLS tenant isolation via pgPolicy with app.current_org_id session variable set in withOrgContext transaction
- [01-02]: Better Auth CLI timed out — auth schema created manually from @better-auth/core source; equivalent output verified via pnpm db:generate
- [01-02]: proxy.ts (not middleware.ts) is the Next.js 16 route guard entry point; function must be named proxy
- [01-02]: headers() must be awaited in Next.js 16 server components — sync shim removed
- [01-02]: nextCookies() must be last plugin in Better Auth plugins array for session cookies to work
- [01-02]: Database migration deferred — .env.local has placeholder credentials; user must fill in real values and run pnpm db:migrate
- [01-03]: Custom roles (owner/estimator) via createAccessControl — built-in inviteMember type requires `as any` cast; runtime accepts custom roles correctly
- [01-03]: proxy.ts must allow /accept-invitation routes — page handles its own auth redirect to preserve the redirect query param
- [01-03]: Migration deferred again — DATABASE_URL_DIRECT still placeholder; both 0000 and 0001 migrations ready to apply
- [Phase 01-foundation]: Vercel deployment requires human action — Vercel CLI needs interactive browser authentication that cannot be automated; user must run vercel login before deployment
- [Phase 01-foundation]: No vercel.json needed — Next.js 16 is auto-detected by Vercel framework detection without custom config

### Pending Todos

- User must create GitHub repository and run: git remote add origin https://github.com/YOUR_USERNAME/paintr.git && git push -u origin main
- User must install and authenticate Vercel CLI: npm install -g vercel && vercel login && vercel --yes
- User must add environment variables to Vercel (DATABASE_URL, DATABASE_URL_DIRECT, BETTER_AUTH_SECRET, BETTER_AUTH_URL, NEXT_PUBLIC_APP_URL, RESEND_API_KEY, EMAIL_FROM)
- User must run vercel --prod for production deployment
- User must add same env vars as GitHub repository secrets for CI pipeline
- User must verify all 6 AUTH requirements on production URL (Task 2 checkpoint)

### Blockers/Concerns

- [Research]: VAD library for browser audio not yet selected (WebRTC VAD, Silero ONNX, or Web Audio API analyser — must resolve in Phase 2 planning)
- [Research]: eIDAS-compliant e-signature approach not yet selected — relevant when Phase 5 is planned (INV requirements do not cover e-signature; it is deferred to v2 APRV requirements)
- [Research]: Exact Online API vs DATEV CSV priority depends on launch country (NL vs DE/AT) — resolve before Phase 5 planning

## Session Continuity

Last session: 2026-02-17
Stopped at: Plan 01-04 partial — CI workflow committed (6590e7a), checkpoint reached at Vercel deployment (human-action auth gate: Vercel CLI auth + git remote required)
Resume file: None
