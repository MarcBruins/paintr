# Architecture Research

**Domain:** LLM-powered field service quoting SaaS (painter/contractor vertical)
**Researched:** 2026-02-17
**Confidence:** HIGH (core patterns from official docs and multiple verified sources)

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│                  (Next.js App Router / React)                    │
├──────────────────┬───────────────────┬───────────────────────────┤
│  Mobile Web UI   │   Quote Editor    │   CRM-lite Views          │
│  (record audio)  │   (review/edit)   │   (customers, jobs)       │
└────────┬─────────┴────────┬──────────┴───────────────────────────┘
         │ audio blob        │ form mutations
         ▼                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                     SERVER LAYER                                 │
│            (Next.js Route Handlers + Server Actions)             │
├──────────────┬────────────────┬────────────────┬─────────────────┤
│  STT Service │  LLM Service   │  Quote Service │  PDF Service    │
│  (Whisper)   │  (AI SDK +     │  (price calc)  │  (generation)   │
│              │   Zod schema)  │                │                 │
└──────┬───────┴────────┬───────┴────────┬───────┴────────┬────────┘
       │                │                │                │
       ▼                ▼                ▼                ▼
┌──────────────────────────────────────────────────────────────────┐
│                     DATA LAYER                                   │
│                        (Supabase)                                │
├──────────────┬────────────────┬────────────────┬─────────────────┤
│  PostgreSQL  │   Auth + JWT   │  Storage       │   RLS Policies  │
│  (org-scoped │   (users,      │  (audio files, │  (tenant        │
│   tables)    │    teams)      │   PDFs)        │   isolation)    │
└──────────────┴────────────────┴────────────────┴─────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| Mobile Web UI | Capture audio via MediaRecorder API; display quote forms; manage job/customer lists | Server Actions, Route Handlers |
| Quote Editor | Let user review/edit LLM-generated quote fields before saving; show line items | Server Actions, Price Calc Engine |
| STT Service | Receive audio blob; call Whisper (OpenAI or self-hosted); return transcript text | LLM Service |
| LLM Service | Consume transcript; run prompt; return Zod-validated structured quote JSON | STT Service, Quote Service |
| Price Calc Engine | Apply material costs, labour rates, markup rules to line items; re-compute totals | Quote Service, Quote Editor |
| Quote Service | Persist quote record; manage state machine (draft → sent → accepted → invoiced) | Database, PDF Service |
| PDF Service | Render quote to PDF using React template; store in Supabase Storage | Quote Service, Storage |
| Auth/Tenant Layer | Verify JWT; inject org_id into request context; enforce RLS | All services |
| CRM-lite | Store customer, site, and job records; link to quotes | Quote Service, Database |
| Accounting Export | Format accepted quotes as accounting package import (e-VerFact, CSV) | Quote Service |

## Recommended Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Login, signup, invite flows
│   │   └── login/page.tsx
│   ├── (dashboard)/              # Protected routes (org-scoped)
│   │   ├── layout.tsx            # Auth guard + tenant context
│   │   ├── quotes/               # Quote list, detail, editor
│   │   ├── customers/            # CRM-lite
│   │   ├── jobs/                 # Job tracking
│   │   └── settings/             # Team, billing, integrations
│   └── api/                      # Route Handlers (external APIs)
│       ├── transcribe/route.ts   # Audio → transcript
│       ├── quote/generate/route.ts  # Transcript → structured quote
│       ├── pdf/[quoteId]/route.ts   # PDF generation endpoint
│       └── webhooks/             # Stripe, accounting webhooks
│
├── modules/                      # Feature modules with clear boundaries
│   ├── auth/                     # Supabase Auth wrappers, session helpers
│   ├── quotes/                   # Quote domain: types, mutations, queries
│   │   ├── schema.ts             # Zod schema for LLM output
│   │   ├── pricing.ts            # Price calculation engine
│   │   ├── pdf-template.tsx      # React template for PDF
│   │   └── state-machine.ts      # Quote lifecycle transitions
│   ├── customers/                # Customer/site domain
│   ├── jobs/                     # Job domain
│   ├── llm/                      # LLM abstraction layer
│   │   ├── provider.ts           # Vercel AI SDK provider config
│   │   ├── prompts/              # Prompt templates
│   │   └── transcript.ts         # STT call wrapper
│   └── export/                   # Accounting export formatters
│
├── components/                   # Shared UI components
│   ├── ui/                       # Shadcn/ui primitives
│   ├── quote-editor/             # Quote editing components
│   └── audio-recorder/           # MediaRecorder + upload
│
├── lib/                          # Utilities, db client, helpers
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   └── server.ts             # Server client (cookies)
│   └── pdf/
│       └── generator.ts          # PDF generation wrapper
│
└── types/                        # Global TypeScript types
```

### Structure Rationale

- **app/**: Only routing and page composition — no business logic. Server Actions live co-located with page files for form mutations.
- **modules/**: One module per domain (quotes, customers, llm). Modules own their own types, queries, and mutations. Cross-module calls go through explicit imports — no shared state.
- **modules/llm/**: Isolated LLM abstraction behind a thin interface. Swap providers by changing `provider.ts` only.
- **modules/quotes/schema.ts**: Single source of truth for the Zod schema that constrains LLM output. Re-used for both server validation and TypeScript inference.
- **app/api/**: Route Handlers only for operations that are called externally (webhooks) or require streaming responses (transcription, LLM stream). Internal mutations use Server Actions.

## Architectural Patterns

### Pattern 1: Sequential STT → LLM Pipeline with Structured Output

**What:** Audio blob flows through two sequential API calls: (1) Whisper transcription, (2) LLM structured generation. The LLM receives both the transcript and a Zod schema; its output is guaranteed to match the schema.

**When to use:** This project — the painter describes a job verbally, the pipeline converts that to a validated `QuoteSchema` JSON object ready for the price engine.

**Trade-offs:** Sequential adds ~1-3s latency vs streaming end-to-end. Acceptable because the painter is not waiting for a real-time conversation — they record once and review the result.

```typescript
// modules/llm/provider.ts
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'

export const getModel = () =>
  process.env.LLM_PROVIDER === 'anthropic'
    ? anthropic('claude-3-5-sonnet-20241022')
    : openai('gpt-4o')

// app/api/quote/generate/route.ts
import { generateObject } from 'ai'
import { QuoteSchema } from '@/modules/quotes/schema'
import { getModel } from '@/modules/llm/provider'

export async function POST(req: Request) {
  const { transcript, context } = await req.json()
  const { object } = await generateObject({
    model: getModel(),
    schema: QuoteSchema,
    prompt: buildQuotePrompt(transcript, context),
  })
  return Response.json(object)
}
```

### Pattern 2: Tenant Isolation via RLS + JWT Claims

**What:** Every database table carries an `org_id` column. Supabase Row Level Security policies compare `org_id` against `auth.jwt() -> 'org_id'`. The JWT claim is set during sign-in via a Supabase Auth hook. Application code never needs to filter by tenant — the database enforces it.

**When to use:** Every table in this project. Painters work in team contexts (org = painting company). A user's token embeds their org membership.

**Trade-offs:** Adds complexity to auth setup. Worth it because it prevents the entire class of cross-tenant data leak bugs. Missing an application-level filter no longer exposes another company's quotes.

```sql
-- migrations/001_rls.sql
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY quotes_org_isolation ON quotes
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Composite index required for performance
CREATE INDEX quotes_org_created ON quotes (org_id, created_at DESC);
```

### Pattern 3: Server-Side PDF Generation via Supabase Storage

**What:** PDF generation is a server-only Route Handler. The server renders the quote as HTML (using React SSR), passes it to a headless browser (Playwright/Puppeteer) or a pure-JS renderer (@react-pdf/renderer), uploads the result to Supabase Storage with a signed URL, and returns the signed URL to the client.

**When to use:** On "Generate PDF" action, and automatically when a quote state transitions to `sent`.

**Trade-offs:** Headless browser (Playwright) gives pixel-perfect PDFs matching the web UI but adds deploy complexity (Chromium binary). `@react-pdf/renderer` is simpler to deploy but uses its own PDF layout model. Recommend `@react-pdf/renderer` for a small team — deploy complexity outweighs fidelity gains.

```typescript
// modules/quotes/pdf-template.tsx
import { Document, Page, Text, View } from '@react-pdf/renderer'

export const QuotePdf = ({ quote }: { quote: Quote }) => (
  <Document>
    <Page size="A4">
      <View><Text>{quote.companyName}</Text></View>
      {/* ... line items, totals, terms */}
    </Page>
  </Document>
)

// lib/pdf/generator.ts
import { renderToBuffer } from '@react-pdf/renderer'
import { QuotePdf } from '@/modules/quotes/pdf-template'

export async function generatePdf(quote: Quote): Promise<Buffer> {
  return renderToBuffer(<QuotePdf quote={quote} />)
}
```

### Pattern 4: Quote State Machine

**What:** Quotes transition through explicit states: `draft → ready → sent → accepted → invoiced → archived`. State transitions are the only way to update status — no direct status field updates. Each transition may trigger side effects (send email, generate PDF, create accounting export).

**When to use:** Whenever a user or system event changes quote status.

**Trade-offs:** More upfront design than free-form status field. Prevents invalid transitions (e.g., invoicing a draft) and makes side-effect logic predictable.

```typescript
// modules/quotes/state-machine.ts
type QuoteState = 'draft' | 'ready' | 'sent' | 'accepted' | 'invoiced' | 'archived'

const TRANSITIONS: Record<QuoteState, QuoteState[]> = {
  draft:    ['ready'],
  ready:    ['sent', 'draft'],
  sent:     ['accepted', 'ready'],
  accepted: ['invoiced'],
  invoiced: ['archived'],
  archived: [],
}

export function canTransition(from: QuoteState, to: QuoteState): boolean {
  return TRANSITIONS[from].includes(to)
}
```

## Data Flow

### Primary Flow: Voice to Quote

```
[Painter presses Record on mobile]
         ↓
[Browser MediaRecorder captures audio (WebM/Ogg)]
         ↓
[POST /api/transcribe — audio blob uploaded]
         ↓
[STT Service → Whisper API → returns transcript text]
         ↓
[POST /api/quote/generate — transcript + job context sent]
         ↓
[LLM Service → generateObject() with QuoteSchema]
         ↓
[Validated QuoteSchema JSON returned]
         ↓
[Price Calc Engine applies rates + markup]
         ↓
[Draft quote persisted to DB (org-scoped)]
         ↓
[Quote Editor displayed — painter reviews/edits]
         ↓
[Painter approves → state: ready → sent]
         ↓
[PDF generated → stored in Supabase Storage]
         ↓
[Signed PDF URL emailed/shared to customer]
```

### Quote Acceptance Flow

```
[Customer accepts quote]
         ↓
[Quote state: accepted]
         ↓
[Job record created/updated]
         ↓
[Accounting export triggered (CSV / e-VerFact)]
         ↓
[Invoice created in accounting system]
```

### Auth Flow (per request)

```
[Request arrives with session cookie]
         ↓
[Next.js middleware verifies Supabase JWT]
         ↓
[org_id extracted from JWT app_metadata]
         ↓
[Supabase server client created with user's auth token]
         ↓
[All DB queries automatically scoped by RLS]
```

### Key Data Flows

1. **Audio → Transcript:** Browser → `/api/transcribe` Route Handler → Whisper API. Audio file is never stored long-term (privacy). Transcript is stored on the quote record for audit.
2. **Transcript → Structured Quote:** Transcript + painter's known rates/materials → LLM with Zod schema → validated `QuoteLineItems[]` with quantities and descriptions.
3. **Quote → PDF:** Quote DB record → React SSR template → `@react-pdf/renderer` → Supabase Storage → signed URL.
4. **Quote → Accounting:** Quote accepted event → formatter module → CSV or Dutch e-VerFact XML → user download or push to accounting API.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–200 painters | Monolith Next.js on Vercel + Supabase free/pro. No queue needed — synchronous PDF and LLM calls fit within Vercel's 60s timeout (PDF generation typically 2–5s, LLM 3–10s). |
| 200–2,000 painters | Add async job queue (Inngest or QStash) for PDF generation. Move STT to dedicated endpoint with streaming. Add DB connection pooling (Supabase's PgBouncer). |
| 2,000+ painters | Extract LLM service to separate microservice with rate limiting per org. Separate PDF worker. CDN for static PDF delivery. Consider dedicated DB schemas per large org. |

### Scaling Priorities

1. **First bottleneck — LLM rate limits:** OpenAI/Anthropic per-org rate limits will bite before infrastructure does. Mitigation: queue LLM requests per org, add retry with exponential backoff from day one.
2. **Second bottleneck — Vercel function timeouts:** PDF generation + LLM chained in one request approaches timeout limit. Mitigation: split into two requests or use async job queue when hitting the limit.

## Anti-Patterns

### Anti-Pattern 1: Client-Side LLM Calls

**What people do:** Call OpenAI API directly from the browser to avoid building a backend route.
**Why it's wrong:** Exposes API key in client bundle. No tenant-scoped prompt injection protection. No rate limiting per org.
**Do this instead:** All LLM calls go through Next.js Route Handlers that verify the user's session and org before forwarding to the provider.

### Anti-Pattern 2: Freeform LLM Output Without Schema Validation

**What people do:** Call LLM with a prompt that says "return JSON", parse the response string, hope for the best.
**Why it's wrong:** LLMs occasionally deviate. Parsing failures silently corrupt quote data. Price calculation engine receives malformed input and produces wrong totals.
**Do this instead:** Use `generateObject()` with a Zod schema. The SDK enforces schema compliance; the type system catches mismatches at compile time. Zero runtime parsing errors.

### Anti-Pattern 3: Application-Level Tenant Filtering Only

**What people do:** Add `WHERE org_id = $orgId` in every query manually. Skip it once. Cross-tenant data leak.
**Why it's wrong:** Single missed filter exposes one painter company's quotes to another. One bug = GDPR violation.
**Do this instead:** Enable RLS on every table from day one. Application filtering is optional defense-in-depth, not the primary gate.

### Anti-Pattern 4: Storing Audio Files Long-Term

**What people do:** Save audio recordings to storage for "later review". Users record sensitive site visit conversations.
**Why it's wrong:** Audio recordings of on-site conversations are personal data under GDPR. Unnecessary retention creates legal exposure and storage cost.
**Do this instead:** Process audio → transcript, delete the audio blob. Store only the transcript text. Make this explicit in the privacy policy.

### Anti-Pattern 5: Monolithic Price Calculation in the Prompt

**What people do:** Ask the LLM to calculate final prices in the prompt itself.
**Why it's wrong:** LLM arithmetic is unreliable. Prices can be wrong by silent rounding errors. Auditability is impossible.
**Do this instead:** LLM outputs *quantities and descriptions only*. A deterministic `pricing.ts` module applies rates, materials, and markup. Prices are always calculated in code.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| OpenAI Whisper | HTTP POST to `/v1/audio/transcriptions` via Vercel AI SDK | Fallback: AssemblyAI. Audio size limit 25MB per Whisper API docs. |
| OpenAI / Anthropic (LLM) | `generateObject()` via Vercel AI SDK provider abstraction | Swap provider in one env var change. |
| Supabase Auth | Supabase Auth SSR package with Next.js cookie-based sessions | Use `@supabase/ssr` not legacy `@supabase/auth-helpers`. |
| Supabase Storage | PDF and (temporarily) audio blob storage | PDFs use public bucket + signed URL with 7-day expiry. |
| Stripe | Webhook Route Handler for subscription events | Multi-seat pricing: per-team subscription, not per-user. |
| Accounting (EU) | Outbound: CSV export minimum. Stretch: Dutch e-VerFact XML, Belgian Codabox | Build generic export interface; add formatters per locale. |
| Email (transactional) | Resend or Postmark for quote delivery emails with PDF attached | GDPR note: store consent before sending marketing. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| UI ↔ Quote Service | Server Actions (mutations), React Query (reads) | Server Actions for create/update/delete. SWR/React Query for lists. |
| Quote Service ↔ LLM Service | Direct function import (same process) | If extracted to microservice later, replace with HTTP call behind same interface. |
| Quote Service ↔ Price Calc Engine | Pure function call — no side effects | `calculateTotals(lineItems, rates)` is a pure function. Easy to test. |
| Quote Service ↔ PDF Service | Async: queue job → callback URL OR sync: await render | Sync is simpler at MVP scale. Queue when timeout risk appears. |
| LLM Service ↔ STT Service | Sequential await — transcript must arrive before LLM call | Consider Promise.race with timeout to handle Whisper latency spikes. |

## Suggested Build Order (Dependency Graph)

Phase dependencies flow from infrastructure inward to features:

```
1. Auth + Multi-Tenant Foundation
   └── Supabase project, RLS policies, org/user tables, JWT claims
       └── All other phases depend on this being correct

2. Core Data Schema
   └── customers, jobs, quotes, line_items tables with org_id + RLS
       └── Required before any feature can read/write data

3. STT Pipeline
   └── Audio capture (browser) → /api/transcribe → Whisper
       └── Can be built and tested in isolation with a simple test UI

4. LLM Quote Generation
   └── Requires STT output (transcript) + QuoteSchema (Zod)
       └── Build QuoteSchema first; test with hardcoded transcript

5. Price Calculation Engine
   └── Pure functions on top of LLM output — no external dependencies
       └── TDD: write tests before implementation

6. Quote Editor UI
   └── Requires quote schema (from step 4) and price engine (step 5)
       └── Displays LLM output, allows edits, recalculates on change

7. PDF Generation
   └── Requires quote data model (step 2) and final quote state (step 6)
       └── React template → @react-pdf/renderer → Supabase Storage

8. CRM-lite (Customers + Jobs)
   └── Requires auth (step 1) and quote linkage (step 2)
       └── Can be built in parallel with steps 3-7

9. Quote State Machine + Email Delivery
   └── Requires PDF (step 7) and CRM (step 8)
       └── State transitions trigger PDF generation and email send

10. Accounting Export
    └── Requires accepted quote data (step 9)
        └── Start with CSV; add e-VerFact XML for NL/BE market
```

## Sources

- Vercel AI SDK providers and models: https://ai-sdk.dev/docs/foundations/providers-and-models (HIGH confidence, official docs)
- Vercel AI SDK structured output with Zod: https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data (HIGH confidence, official docs)
- AI SDK 5 release notes: https://vercel.com/blog/ai-sdk-5 (HIGH confidence, official)
- Supabase RLS multi-tenant patterns: https://supabase.com/docs/guides/database/postgres/row-level-security (HIGH confidence, official docs)
- Multi-tenant Next.js SaaS architecture: https://vladimirsiedykh.com/blog/saas-architecture-patterns-nextjs (MEDIUM confidence, verified against official Next.js and Supabase docs)
- Next.js Server Actions vs Route Handlers: https://makerkit.dev/blog/tutorials/server-actions-vs-route-handlers (MEDIUM confidence, corroborated by Next.js official docs)
- PDF generation approaches for Node.js 2025: https://pdfnoodle.com/blog/popular-libraries-2025-for-pdf-generation-using-node-js (MEDIUM confidence, cross-checked with library docs)
- Voice AI stack architecture: https://www.assemblyai.com/blog/the-voice-ai-stack-for-building-agents (MEDIUM confidence, vendor but technically accurate)
- Background jobs on Vercel — Inngest pattern: https://www.inngest.com/blog/run-nextjs-functions-in-the-background (MEDIUM confidence)

---
*Architecture research for: LLM-powered painting quote tool (Paintr)*
*Researched: 2026-02-17*
