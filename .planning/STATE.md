# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-17)

**Core value:** Voice/text input transformed into a structured, accurate painting job quote via LLM — the painter speaks, the system produces a professional quote ready to send
**Current focus:** Phase 1 - Foundation

## Current Position

Phase: 1 of 5 (Foundation)
Plan: 2 of 4 in current phase
Status: Executing — Plans 01-02 complete, Plans 03-04 pending
Last activity: 2026-02-17 — Plan 02 executed (Better Auth configuration + auth UI)

Progress: [███░░░░░░░] 20%

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: 11.5 min
- Total execution time: 23 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 2/4 | 23 min | 11.5 min |

**Recent Trend:**
- Last 5 plans: 14 min, 9 min
- Trend: Faster

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

### Pending Todos

- User must configure .env.local with real Supabase credentials and run pnpm db:migrate before Plan 03

### Blockers/Concerns

- [Research]: VAD library for browser audio not yet selected (WebRTC VAD, Silero ONNX, or Web Audio API analyser — must resolve in Phase 2 planning)
- [Research]: eIDAS-compliant e-signature approach not yet selected — relevant when Phase 5 is planned (INV requirements do not cover e-signature; it is deferred to v2 APRV requirements)
- [Research]: Exact Online API vs DATEV CSV priority depends on launch country (NL vs DE/AT) — resolve before Phase 5 planning

## Session Continuity

Last session: 2026-02-17
Stopped at: Plan 01-02 complete — Better Auth configured, auth schema + migration SQL generated, sign-in/sign-up pages and protected layout created
Resume file: None
