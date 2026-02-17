# Stack Research

**Domain:** LLM-powered SaaS quoting tool (Paintr — mobile-first, EU market)
**Researched:** 2026-02-17
**Confidence:** HIGH (most choices verified via official docs/npm; versions confirmed February 2026)

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.1 | Full-stack React framework | App Router + Server Actions eliminate need for a separate API layer. Edge-native. File-system routing maps cleanly to multi-tenant org context. Turbopack now stable in dev. Largest SaaS ecosystem of any React meta-framework. |
| React | 19.x | UI runtime | Ships with Next.js 16. Server Components reduce bundle size sent to mobile. |
| TypeScript | 5.7+ | Language | Mandatory for LLM schema safety. Zod schemas double as runtime validators and TypeScript types — this pattern only pays off with strict TS. |
| Tailwind CSS | 4.x | Styling | v4 drops `tailwind.config.js` for CSS-first `@theme` config. Significantly faster build. Works with shadcn/ui. Mobile-first utilities are the default. |
| shadcn/ui | latest (Tailwind v4 branch) | Component library | Not a dependency — copy-paste components you own. Paired with Tailwind v4 and React 19. shadcn/ui is the de-facto standard for Next.js SaaS UIs in 2025–2026. |

### AI / LLM Layer

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Vercel AI SDK (`ai`) | 6.x (6.0.86 as of Feb 2026) | LLM orchestration, structured output, streaming | Provider-agnostic: switch Claude ↔ GPT-4o ↔ Gemini by changing one import. `generateText` + `Output.object({ schema })` replaces the now-deprecated `generateObject`. Native streaming to React. 25+ provider integrations. Best DX for Next.js. |
| `@ai-sdk/anthropic` | latest | Anthropic (Claude) provider | Default provider for initial build. Swap to `@ai-sdk/openai` with one line. |
| `@ai-sdk/openai` | latest | OpenAI (GPT-4o) provider | Secondary provider / fallback. Install alongside anthropic adapter from day one so switching is trivial. |
| Zod | 4.x | Schema definition for LLM output + API validation | v4 ships 57% smaller core, 14x faster string parsing. Schemas define the quote JSON shape, serve as LLM output contracts, and validate API inputs. Single source of truth for types. |

### Authentication

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Better Auth | 1.4.x (1.4.18 as of Feb 2026) | Auth + multi-tenant organizations | Open-source, self-hosted — user data stays in your own Postgres (critical for EU/GDPR). Organization plugin provides teams, roles, invites, RBAC out of the box. Adapters for Drizzle included. TypeScript-first. No per-seat pricing unlike Clerk. |

Why not Clerk: Per-MAU pricing creates unpredictable costs at scale. User data lives on Clerk's servers (complicates GDPR DPA). For EU-focused SaaS with multi-tenant teams, Better Auth + own Postgres is the correct choice.

Why not Auth.js/NextAuth.js: The multi-tenant/organization flow requires significant custom work. Documentation gaps are a known pain point. Better Auth ships this as a first-class plugin.

### Database

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Supabase (hosted Postgres) | — | Primary database, EU Frankfurt region | Postgres with built-in auth storage, Row Level Security (RLS) for tenant isolation, realtime subscriptions, and EU (Frankfurt) deployment for GDPR data residency. Free tier for dev; predictable pricing for scale. Has a signed DPA for GDPR. |
| Drizzle ORM | 0.45.x | Type-safe query builder + schema migrations | Edge-native (no Rust binary), tiny bundle, SQL-transparent queries. Better Auth ships a Drizzle adapter. Performance advantage over Prisma 6 at edge, comparable after Prisma 7 Rust removal. Choose Drizzle because: edge-runtime safe, excellent Next.js App Router integration, active community. |

### Speech-to-Text

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Web Speech API (browser native) | Web standard | Primary STT — zero cost, zero latency, works offline | Chrome and Safari on mobile support it. Painters dictating on-site get instant feedback without API round-trips. Set `SpeechRecognition.lang = 'nl-NL'` (or locale of painter) explicitly. Use `interimResults: true` for real-time feedback. |
| OpenAI Whisper API (`/audio/transcriptions`) | — | Fallback STT for unsupported browsers or high-accuracy mode | Whisper outperforms Web Speech API in noisy environments (outdoor job sites). 25MB file size cap; chunk audio if needed. Add as opt-in "Retry with Whisper" button rather than default path. Supports Dutch natively. |

The two-tier STT approach (Web Speech API first, Whisper fallback) maximizes speed and minimizes cost while handling the realistic job-site scenario (wind, traffic noise).

### PDF Generation

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `@react-pdf/renderer` | 4.3.x (4.3.2 as of Feb 2026, actively maintained) | Server-side + client-side PDF quote generation | React component API — quotes are already React data structures. `PDFDownloadLink` for client download, `renderToBuffer` for server-side generation (e-mail attachments). 469+ npm dependents. Ideal for structured documents like invoices and quotes. Use server-side rendering for e-mail delivery; client-side for instant preview. |

Why not Puppeteer: Requires headless Chrome, complex Docker setup, not edge-compatible. Overkill for a quote document with known layout. Puppeteer shines for pixel-perfect web-page capture, not structured document generation.

### Forms

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| react-hook-form | 7.x | Form state management | Minimal re-renders (critical for mobile). Integrates with shadcn/ui `<Form>` components out of the box. |
| `@hookform/resolvers` | 3.x | Zod integration for react-hook-form | Single Zod schema = client validation + server action validation + TypeScript type. No duplication. |

### State Management

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Zustand | 5.x | Client-side UI state (quote editing, multi-step flows) | Tiny (< 1 KB), no Provider needed, hooks-based. Recommended pattern: TanStack Query for server state (cache, refetch), Zustand for ephemeral UI state (current editing step, form dirty state). Do NOT use for server-synced data. |
| TanStack Query (React Query) | 5.x | Server state caching and synchronisation | Handles quote list, customer list with caching, background refresh, and optimistic updates. Works alongside Zustand without overlap. |

### Email

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Resend | latest | Transactional email (quote delivery to customers) | EU-compliant (GDPR), React Email integration, generous free tier, simple API. Alternative: Postmark. |
| React Email | latest | Email template rendering | Same JSX/component model as the rest of the app. Pairs with Resend. |

---

## Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@ai-sdk/anthropic` | latest | Claude provider | Primary LLM (best instruction-following for structured extraction) |
| `@ai-sdk/openai` | latest | GPT-4o provider | Fallback/alternative — install alongside anthropic from day one |
| `date-fns` | 4.x | Date formatting for quotes/invoices | Lighter than `dayjs`, tree-shakable, locale support for EU formats (nl, de, fr) |
| `papaparse` | 5.x | CSV generation for accounting exports | Generates DATEV-compatible CSV for EU accounting (German DATEV is standard format). Simple but reliable. |
| `lucide-react` | latest | Icon library | shadcn/ui default. Tree-shakable SVG icons. |
| `nuqs` | latest | URL state management (search params) | For quote filters, pagination — keeps UI bookmarkable. |

---

## Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Biome | Linting + formatting | Replaces ESLint + Prettier in one tool. 10–35x faster. Single config file. Growing adoption in 2025–2026 Next.js projects. |
| Vitest | Unit + integration testing | Faster than Jest. First-class TypeScript support. |
| Playwright | E2E testing | Test quote generation flows end-to-end across mobile viewports. |
| Turbopack | Dev bundler | Now stable in Next.js 16. Significantly faster HMR on large codebases. |
| `dotenv-vault` or Vercel env | Secrets management | Manage LLM API keys, Supabase connection strings. Never hardcode. |

---

## Installation

```bash
# Core framework
npm install next@latest react@latest react-dom@latest typescript

# AI SDK + providers
npm install ai @ai-sdk/anthropic @ai-sdk/openai

# Schema validation
npm install zod

# Auth
npm install better-auth

# Database
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit

# UI
npm install tailwindcss@next @tailwindcss/postcss
npx shadcn@latest init

# Forms
npm install react-hook-form @hookform/resolvers

# State management
npm install zustand @tanstack/react-query

# PDF generation
npm install @react-pdf/renderer

# Email
npm install resend react-email

# Utilities
npm install date-fns papaparse lucide-react nuqs

# Dev dependencies
npm install -D vitest @vitejs/plugin-react playwright biome
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Next.js 16 | Remix v3 | If you need progressive enhancement and optimistic UI as the primary model — Remix is excellent, but smaller ecosystem and fewer SaaS boilerplates. |
| Better Auth | Clerk | If you're not EU-focused and want zero auth dev work with per-MAU pricing. For Paintr's EU/GDPR requirement and teams model, Better Auth is correct. |
| Drizzle ORM | Prisma 7 | Prisma 7 (pure TS, no Rust) is now acceptable. Choose Prisma if you want auto-migrations and more batteries-included DX. Choose Drizzle for edge-native performance and smaller bundle. |
| Supabase | Neon + separate auth | Neon is pure Postgres compute (acquired by Databricks May 2025), excellent for raw DB. But Supabase bundles storage, auth backend, and realtime — less assembly for a solo/small team. |
| `@react-pdf/renderer` | Puppeteer | Use Puppeteer only if quotes need pixel-perfect HTML layout (custom CSS, webfonts). For structured quote documents with known layout, react-pdf is simpler and edge-compatible. |
| Vercel AI SDK 6 | LangChain | LangChain has broader agent tooling but significantly more complexity and overhead. For this use case (structured extraction + single-model call), Vercel AI SDK is correct. LangChain for complex multi-step agent pipelines. |
| Web Speech API + Whisper fallback | AssemblyAI / Deepgram | AssemblyAI/Deepgram offer higher accuracy for difficult audio but add per-minute cost and latency. The two-tier approach covers 90% of cases without external dependency. |
| Biome | ESLint + Prettier | ESLint + Prettier remains fine but requires separate configs. Biome is the direction the ecosystem is moving in 2025–2026 for speed. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `create-react-app` / Vite SPA | No SSR, no App Router, no Server Actions. LLM streaming + PDF generation needs server-side. | Next.js 16 |
| Redux (for new projects) | Massive boilerplate for the scale of this app. Zustand + TanStack Query covers all use cases. | Zustand + TanStack Query |
| `langchain` (as the primary LLM SDK) | Abstraction leaks, large bundle, frequent breaking changes. Overkill for structured extraction. | Vercel AI SDK 6 |
| `pdfmake` or `jsPDF` | Lower-level API, verbose for structured documents, less React ecosystem support. | `@react-pdf/renderer` |
| Clerk (for EU SaaS) | User PII stored on Clerk servers (US), complicates GDPR data residency. Per-MAU pricing unpredictable. | Better Auth |
| `moment.js` | Deprecated, large bundle. | `date-fns` v4 |
| MySQL / non-Postgres DB | Supabase RLS, Drizzle migrations, and the broader ecosystem are optimized for Postgres. No benefit from switching. | PostgreSQL via Supabase |
| `generateObject` (Vercel AI SDK) | Deprecated as of AI SDK 5/6. Works but removed in future. | `generateText` with `Output.object({ schema })` |

---

## Stack Patterns by Variant

**If running solo or small team (< 3 devs):**
- Use Supabase managed Postgres (no self-hosted infra)
- Use Vercel for hosting (zero-config Next.js deployment)
- Skip Kubernetes / Docker orchestration entirely

**If EU compliance is paramount (likely for Paintr):**
- Deploy Supabase project to Frankfurt (eu-central-1)
- Sign Supabase DPA (available via support ticket)
- Store all audio recordings transiently (delete after transcription)
- Log LLM calls without storing PII in logs

**If needing offline support (painters in no-signal areas):**
- Web Speech API already works offline on device
- Consider PWA manifest + service worker for form caching
- IndexedDB for draft quote persistence

**If LLM costs become prohibitive:**
- Switch from Claude/GPT-4o to Claude Haiku or GPT-4o-mini for extraction
- Vercel AI SDK makes this a single-line change
- Implement prompt caching (Anthropic API supports it)

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Next.js 16.1 | React 19.x | React 19 required for Next.js 16 Server Components features |
| Tailwind CSS 4.x | shadcn/ui (Tailwind v4 branch) | shadcn CLI now initializes with Tailwind v4 by default |
| Better Auth 1.4.x | Drizzle ORM 0.45.x | Official Drizzle adapter shipped with Better Auth |
| Vercel AI SDK 6.x | Zod 4.x | AI SDK 6 accepts Zod 4 schemas via `zodSchema()` helper |
| `@react-pdf/renderer` 4.3.x | React 19.x | v4 supports React 18+; verify React 19 compatibility before go-live |
| react-hook-form 7.x | `@hookform/resolvers` 3.x | Zod v4 resolver support confirmed in resolvers v3 |

---

## Sources

- [Vercel AI SDK 6 — Official release blog](https://vercel.com/blog/ai-sdk-6) — version 6.0.86 confirmed February 2026
- [AI SDK Docs — Structured Data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data) — generateObject deprecation, Output.object() pattern — HIGH confidence
- [Better Auth 1.4 release](https://www.better-auth.com/blog/1-4) — version 1.4.18 confirmed, Organization plugin — HIGH confidence
- [Better Auth Organization Plugin docs](https://www.better-auth.com/docs/plugins/organization) — RBAC, teams, invites — HIGH confidence
- [Next.js blog](https://nextjs.org/blog) — Next.js 16.1 confirmed December 2025 — HIGH confidence
- [Zod v4 — InfoQ](https://www.infoq.com/news/2025/08/zod-v4-available/) — v4 performance improvements, bundle size — MEDIUM confidence (news article, official GitHub confirmed)
- [npm: drizzle-orm](https://www.npmjs.com/package/drizzle-orm) — version 0.45.x confirmed — HIGH confidence
- [npm: @react-pdf/renderer](https://www.npmjs.com/package/@react-pdf/renderer) — version 4.3.2, last published 2 months ago — HIGH confidence
- [Supabase Regions Docs](https://supabase.com/docs/guides/platform/regions) — EU Frankfurt (eu-central-1) available, GDPR DPA available — HIGH confidence
- [Web Speech API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API/Using_the_Web_Speech_API) — lang, interimResults config — HIGH confidence
- [OpenAI Whisper — Speech to text docs](https://platform.openai.com/docs/guides/speech-to-text) — 25MB cap, multilingual — HIGH confidence
- [Drizzle vs Prisma 2025 — Bytebase](https://www.bytebase.com/blog/drizzle-vs-prisma/) — Prisma 7 Rust removal, edge comparison — MEDIUM confidence (analysis site, cross-referenced with Prisma official docs)
- [LangChain vs Vercel AI SDK 2026 — Strapi](https://strapi.io/blog/langchain-vs-vercel-ai-sdk-vs-openai-sdk-comparison-guide) — DX comparison — LOW confidence (single source)
- [shadcn/ui Tailwind v4 docs](https://ui.shadcn.com/docs/tailwind-v4) — CLI support for Tailwind v4, React 19 — HIGH confidence
- [DATEV CSV format — Qualimero](https://qualimero.com/en/blog/datev-interface-csv-exports-ai-integration) — EU accounting export standard — MEDIUM confidence

---
*Stack research for: LLM-powered SaaS quoting tool (Paintr)*
*Researched: 2026-02-17*
