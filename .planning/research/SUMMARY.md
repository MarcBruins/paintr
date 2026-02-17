# Project Research Summary

**Project:** Paintr
**Domain:** LLM-powered painting contractor quoting SaaS (mobile-first, EU market)
**Researched:** 2026-02-17
**Confidence:** MEDIUM-HIGH (stack HIGH, architecture HIGH, pitfalls MEDIUM, features MEDIUM)

## Executive Summary

Paintr is a mobile-first SaaS tool for painting contractors that replaces manual form-based quoting with voice dictation processed by an LLM. The painter speaks a job description on-site; the system transcribes it, extracts structured quote data (rooms, surfaces, measurements, prep requirements), applies configurable pricing rules in application code, and produces a professional PDF quote ready to email. No competitor currently offers voice-to-quote with LLM parsing — this is a genuine whitespace in the EU painting contractor market where incumbents (PaintScout, Jobber, Housecall Pro) are all US-focused and form-based.

The recommended approach is a Next.js 16 monolith with Supabase (EU Frankfurt region) for Postgres and auth, Better Auth for multi-tenant organization management, and the Vercel AI SDK for provider-agnostic LLM orchestration. The entire quoting pipeline flows as: Web Speech API (or Whisper fallback) for STT, Vercel AI SDK generateObject() with a Zod schema for structured extraction, a deterministic pricing engine in TypeScript for cost calculation, and @react-pdf/renderer for PDF generation. This stack is edge-compatible, GDPR-compliant by construction (data stays in EU, user PII in own Postgres), and allows switching LLM providers with a single environment variable change.

The dominant risk category is LLM reliability in the field: Whisper hallucinates on silence (confirmed 1% rate), LLMs invent measurements when none are provided, and multi-room dictations frequently collapse into a single merged room object. All three failure modes corrupt quotes without obvious errors — painters trust the output and send wrong numbers to customers. These pitfalls must be addressed in the architecture from day one (VAD pre-processing, null-first schema design, chain-of-thought room enumeration, all pricing in application code) rather than patched after launch. A second major risk is EU regulatory completeness: VAT handling, GDPR audio data retention, and eIDAS-compliant e-signatures must be designed in from Phase 1, not bolted on.

## Key Findings

### Recommended Stack

The stack is optimized for a small EU-focused team delivering a mobile-first SaaS product with LLM at its core. Next.js 16 with App Router and Server Actions handles full-stack without a separate API layer. Better Auth (not Clerk) is mandatory for EU GDPR compliance — user PII must stay in Paintr's own Postgres, not on US-hosted infrastructure. Supabase Frankfurt gives EU data residency with built-in Row Level Security for tenant isolation. The Vercel AI SDK 6 provides the LLM abstraction layer; switching between Anthropic and OpenAI is one environment variable. A two-tier STT approach (Web Speech API free + instant, Whisper paid fallback for noisy environments) balances cost and field reliability.

**Core technologies:**
- Next.js 16.1: Full-stack framework — App Router + Server Actions eliminate separate API layer; edge-native deployment on Vercel
- Vercel AI SDK 6 + Zod 4: LLM orchestration + schema validation — provider-agnostic, generateObject() with Zod schema enforces structured output contracts
- Better Auth 1.4: Auth + multi-tenant organizations — open-source, self-hosted, EU GDPR compliant, organization plugin with RBAC included
- Supabase (EU Frankfurt): Postgres + RLS + storage — tenant isolation via Row Level Security, signed DPA for GDPR, EU data residency
- Drizzle ORM 0.45: Type-safe query builder — edge-native, no Rust binary, Better Auth Drizzle adapter included
- Web Speech API + OpenAI Whisper: Two-tier STT — free/instant primary, paid/accurate fallback for noisy job sites
- @react-pdf/renderer 4.3: PDF generation — React component API, server-side renderToBuffer for email attachments
- Tailwind CSS 4 + shadcn/ui: UI layer — mobile-first utilities, copy-owned components, Tailwind v4 branch
- Resend + React Email: Transactional email — EU-compliant, PDF attachment support, React template model

**Avoid:** Clerk (US data residency), LangChain (overkill for structured extraction), Redux (Zustand + TanStack Query sufficient), Puppeteer for PDF (deploy complexity), generateObject() deprecated API pattern (use Output.object()), client-side LLM calls (exposes API keys).

### Expected Features

The core differentiator — voice/text to structured quote via LLM — has no equivalent in any current competitor. Every other major feature (PDF generation, e-signature, invoice conversion, VAT handling, accounting export) is table stakes that competitors already offer and that EU painters legally require.

**Must have at launch (v1 table stakes):**
- Voice + text input captured on mobile sent to LLM — the product hypothesis to validate
- LLM parsing to structured quote (rooms, surfaces, measurements, labor hours, material quantities) — the engine
- Quote review and field-level edit on mobile — painter must correct LLM output before sending
- LLM-generated risk flags inline in quote — high value, low UI complexity
- Configurable price defaults (production rates, material costs, margin) — LLM output is meaningless without these
- Basic customer record (name, email, phone, address) — quotes must attach to people
- VAT rate configuration — EU legal requirement from day one
- PDF generation from approved quote — professional deliverable
- Email delivery with PDF attachment — how quotes reach customers
- Quote status tracking (sent/viewed/approved/declined) — painter follow-up driver
- Multi-user auth with team roles (owner + estimator) — required for small teams from day one
- Quote history and search — painters reference past quotes constantly

**Should have after core validation (v1.x):**
- E-signature / digital customer approval — eIDAS compliant for EU
- Invoice generation from approved quote — natural next step post-acceptance
- Accounting export (Xero + EU-native: Exact Online for NL, DATEV for DE/AT)
- SMS delivery of quote link
- Offline-first mobile quote capture (IndexedDB + service worker sync)
- Automatic material quantity calculation from area measurements

**Defer to v2+:**
- Good/better/best quote tier generation — needs reliable base parsing first
- Repeat-job template suggestions — needs 50+ quote history per account
- Change order capture on-site — extends into job execution phase
- Crew instruction generation from quote
- Quote analytics and win-rate dashboard
- Full offline-first architecture

**Anti-features to reject outright:** full project management/scheduling, built-in payment processing, photo/video-based measurement takeoff, inventory management, timesheet/payroll, customer real-time job portal, AI pricing benchmarking.

### Architecture Approach

The architecture is a Next.js monolith with clear module boundaries, deployed to Vercel, backed by Supabase in EU Frankfurt. Every table carries an org_id enforced by Supabase Row Level Security — tenant isolation is at the database level, not the application level. The LLM pipeline is strictly sequential (STT then LLM parsing) rather than combined, so failures can be diagnosed and each stage can be replaced independently. Pricing lives exclusively in deterministic TypeScript code; the LLM outputs quantities and classifications only, never dollar amounts. Quote lifecycle is a formal state machine (draft → ready → sent → accepted → invoiced → archived) with explicit transitions that trigger side effects (PDF generation, email send, accounting export).

**Major components:**
1. Mobile Web UI — audio capture via MediaRecorder API, quote review/edit on mobile, customer and job lists
2. STT Service — Web Speech API primary, Whisper API fallback, VAD pre-processing before Whisper to eliminate hallucination on silence
3. LLM Service — Vercel AI SDK generateObject() with QuoteSchema (Zod), provider-agnostic via env var, prompt versioned in source control
4. Price Calc Engine — pure deterministic TypeScript function: lineItems + configuredRates → totals. No LLM involvement in dollar calculations
5. Quote State Machine — explicit transitions, side effects triggered on transition events, not on direct field updates
6. PDF Service — @react-pdf/renderer server-side, result stored in Supabase Storage with signed URL
7. Auth/Tenant Layer — Better Auth + JWT org_id claim, Supabase RLS enforces tenant scope on all queries
8. CRM-lite — customers, sites, quote history; minimal scope
9. Accounting Export — pluggable adapter per format (CSV, Exact Online, DATEV)

### Critical Pitfalls

1. **Whisper hallucinates on silence and low-speech audio** — Implement VAD (Voice Activity Detection) pre-processing to strip silent segments before sending to Whisper. Set condition_on_previous_text: false for chunked audio. Never process unfiltered field recordings directly.

2. **LLM invents measurements when none are provided** — Schema design: every numeric field must be nullable. Add measurement_source: "provided" | "default" | "inferred" on each measurement field. Instruct the LLM to return null for unknown values. Apply defaults in application code, not in the prompt. Test with 50 measurement-free transcripts before launch.

3. **Multi-room dictations parsed as a single merged room** — Use chain-of-thought prompting: "First count rooms mentioned, then extract each separately." Add a room-segmentation pre-processing step on transition words. Always show parsed room list to painter for confirmation before generating the quote. Include 5-room dictation tests in the eval suite from day one.

4. **Prompt brittleness across LLM providers and model versions** — Pin to snapshot model versions in production (never rolling aliases like gpt-4o). Build a 30+ transcript eval suite before first deployment. Run the eval suite on every model update and every provider switch. Version all prompts in source control with PR review.

5. **LLM arithmetic in pricing / prompt injection via dictation** — Never let the LLM calculate dollar amounts; all pricing in application code. Always inject transcript as a user message, never into system prompt content. Validate all LLM output against Zod schema before it reaches any business logic.

## Implications for Roadmap

Based on research across all four files, the dependency graph from ARCHITECTURE.md and the feature dependencies from FEATURES.md converge on the same build order. The suggested structure below reflects hard dependencies (auth before data, data before LLM, schema before pricing engine) and pitfall mitigation requirements (VAD and schema design must be established before any LLM work begins).

### Phase 1: Foundation and Infrastructure

**Rationale:** Every subsequent phase depends on auth, database schema, and tenant isolation being correct. Building LLM features on top of a misconfigured auth layer causes cross-tenant data leaks — a GDPR violation, not just a bug. VAD pipeline and schema design decisions made here cannot be retrofitted cheaply.

**Delivers:** Working multi-tenant auth, database with RLS policies, project skeleton deployed to Vercel, CI/CD, and the Zod QuoteSchema (the contract between LLM output and application logic).

**Addresses (from FEATURES.md):** Multi-user auth with team roles, VAT configuration groundwork, price defaults configuration structure.

**Avoids (from PITFALLS.md):** Multi-tenant data leakage (RLS from day one), LLM calculates prices (architecture decision: pricing in code), prompt injection (transcript always as user message), measurement defaults in application code (schema design decision).

**Stack elements:** Next.js 16, Better Auth 1.4, Supabase Frankfurt, Drizzle ORM, Tailwind v4 + shadcn/ui skeleton, Biome, Vitest.

**Research flag:** Standard patterns — skip research-phase. Auth + Supabase RLS is well-documented; Better Auth organization plugin covers multi-tenant.

### Phase 2: Voice Input and LLM Quote Parsing

**Rationale:** The core product differentiator and the riskiest technical element. Whisper hallucination, multi-room parsing failure, and token truncation must be addressed here before any UI is built on top. Building the eval suite in this phase prevents regressions in all future phases.

**Delivers:** Working voice capture with VAD pre-processing, Whisper transcription, LLM parsing to validated QuoteSchema JSON, 30+ transcript eval suite with known expected outputs, prompt pinned to model snapshot version.

**Addresses (from FEATURES.md):** Voice + text input, LLM quote parsing, LLM risk flag generation, configurable price defaults (wired to pricing engine, not LLM).

**Avoids (from PITFALLS.md):** Whisper silence hallucination (VAD pre-processing), LLM invents measurements (null-first schema, defaults in app code), multi-room merge bug (chain-of-thought prompting + eval suite), JSON token truncation (max_tokens budget, chunking for long audio), prompt brittleness (pinned model versions, eval suite).

**Stack elements:** Web Speech API, OpenAI Whisper API, Vercel AI SDK 6 generateObject(), Zod 4 QuoteSchema, Price Calc Engine (pure TS functions, TDD).

**Research flag:** Needs research-phase during planning. LLM prompt engineering for painting-domain extraction, VAD library selection (native Web Audio API vs library), and multi-room chain-of-thought strategy benefit from targeted investigation.

### Phase 3: Quote Review, Edit, and Mobile UX

**Rationale:** LLM output is not trusted without a review step. The painter must see parsed rooms, correct errors, and approve before the quote is finalized. This phase translates the validated JSON into a usable mobile interface.

**Delivers:** Mobile-optimized quote editor (room-by-room review, field-level editing, price recalculation on change), quote draft persistence, inline risk flag display, customer record creation and linkage.

**Addresses (from FEATURES.md):** Quote review and edit on mobile, risk flags, basic customer record, configurable price overrides per quote.

**Avoids (from PITFALLS.md):** No review step before quote generated (explicit confirmation screen), raw LLM field names shown to painter (all fields mapped to plain English labels), no immediate feedback after recording (processing state displayed immediately).

**Stack elements:** react-hook-form + @hookform/resolvers, Zustand (ephemeral UI state), TanStack Query (server state), shadcn/ui components, mobile-first Tailwind layout.

**Research flag:** Standard patterns — skip research-phase. Mobile form UX with react-hook-form and shadcn/ui is well-documented.

### Phase 4: PDF Generation and Quote Delivery

**Rationale:** Once the quote is reviewed and approved, the painter needs to send it. PDF generation and email delivery are the output mechanism. These depend on a stable quote data model from Phase 3.

**Delivers:** Branded PDF quote (A4, company logo, line items, VAT breakdown, terms), quote delivery via email with PDF attachment, quote status tracking (sent/viewed/approved/declined).

**Addresses (from FEATURES.md):** Professional PDF quote generation, quote delivery via email, quote status tracking, quote history and search.

**Avoids (from PITFALLS.md):** Quote PDF without access control (all PDF access scoped to org_id), LLM output in billing calculation (PDF renders from deterministic application data, not LLM fields).

**Stack elements:** @react-pdf/renderer 4.3, Supabase Storage (signed URLs, 7-day expiry), Resend + React Email, nuqs for quote list filters.

**Research flag:** Standard patterns — skip research-phase. @react-pdf/renderer is mature and well-documented for structured documents.

### Phase 5: Approval Workflow and Invoice Generation

**Rationale:** After quote delivery, the painter needs a digital acceptance mechanism and a path to invoice. These depend on the email delivery infrastructure from Phase 4 and the quote state machine.

**Delivers:** Customer-facing quote acceptance (e-signature eIDAS compliant for EU), invoice generation from accepted quote (pre-fills from quote data, adds payment terms and bank details), VAT shown correctly on both quote and invoice.

**Addresses (from FEATURES.md):** E-signature/digital approval, invoice generation from approved quote, VAT-aware pricing on invoice.

**Avoids (from PITFALLS.md):** Invoice without VAT configuration (VAT config from Phase 1 is prerequisite), legally non-compliant document output.

**Stack elements:** e-signature library (research needed for eIDAS-compliant option), Resend for invoice delivery, @react-pdf/renderer for invoice PDF.

**Research flag:** Needs research-phase during planning. eIDAS-compliant e-signature libraries for EU web applications have limited standardized options — specific provider/library selection requires targeted research.

### Phase 6: Accounting Export and Integrations

**Rationale:** EU painters use accounting tools and expect one-click export to eliminate double entry. This phase builds pluggable export adapters on top of stable invoice data.

**Delivers:** Accounting export adapters (CSV minimum; Exact Online for NL market, DATEV for DE/AT market), pluggable adapter interface for future integrations.

**Addresses (from FEATURES.md):** Accounting export (Xero, Exact, DATEV), pluggable accounting adapter architecture.

**Avoids (from PITFALLS.md):** Accounting export requires stable invoice data (Phase 5 prerequisite enforced).

**Stack elements:** papaparse for CSV, date-fns for EU date formatting (nl/de/fr locales), Exact Online API or DATEV CSV format.

**Research flag:** Needs research-phase during planning. Exact Online API and DATEV CSV format specifications are niche and require targeted investigation per target market.

### Phase 7: Hardening, Offline, and v1.x Features

**Rationale:** After core quoting flow is validated with real painters, address the reliability and field-use concerns that early adopters report. Offline-first is complex (sync architecture) and belongs after the online flow is stable.

**Delivers:** Offline-first mobile quote capture (IndexedDB + service worker sync), SMS delivery of quote link, automatic material quantity calculation from area measurements, performance hardening (async queue for LLM and PDF if Vercel timeout risk appears).

**Addresses (from FEATURES.md):** Offline-first mobile, SMS delivery, automatic material quantity calculation.

**Avoids (from PITFALLS.md):** No offline support (explicitly deferred to this phase with service worker sync architecture), synchronous LLM call at scale (async job queue introduced here if concurrent usage warrants it).

**Stack elements:** IndexedDB, service worker, PWA manifest, async job queue (Inngest or QStash) if needed.

**Research flag:** Needs research-phase during planning. Offline-first sync architecture for quote data with conflict resolution is complex and has multiple viable approaches — targeted research prevents architectural mistakes.

### Phase Ordering Rationale

- Auth and RLS must precede all feature work: a tenant isolation mistake is a GDPR violation, not a bug.
- QuoteSchema (Zod) must be designed before the LLM pipeline is built — the schema is the contract between all layers.
- Pricing engine must be pure application code before any LLM work touches numbers — this architectural decision cannot be retrofitted.
- PDF generation depends on a stable quote data model, which depends on the LLM pipeline being trustworthy.
- E-signature depends on PDF and email delivery working reliably.
- Accounting export depends on invoice generation being stable.
- Offline mode deliberately deferred: the online sync architecture must be proven before offline complicates it.
- The feature dependency chain from FEATURES.md (STT → LLM → quote JSON → edit UI → PDF → email → e-signature → invoice → accounting) maps exactly onto Phases 2 through 6.

### Research Flags

**Needs research-phase during planning:**
- Phase 2: LLM prompt engineering for painting-domain extraction, VAD library selection, multi-room chain-of-thought strategy
- Phase 5: eIDAS-compliant e-signature options for EU web applications
- Phase 6: Exact Online API specification, DATEV CSV format requirements per target country
- Phase 7: Offline-first sync architecture with conflict resolution for quote data

**Standard patterns (skip research-phase):**
- Phase 1: Better Auth + Supabase RLS multi-tenancy is thoroughly documented
- Phase 3: react-hook-form + shadcn/ui mobile form patterns are well-established
- Phase 4: @react-pdf/renderer for structured documents is mature and well-documented

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core choices verified via official docs and npm; versions confirmed February 2026. Version compatibility table cross-checked. |
| Architecture | HIGH | Patterns from official Vercel AI SDK, Supabase, and Next.js documentation. Build order matches feature dependency graph from FEATURES.md. |
| Features | MEDIUM | Competitor feature analysis partially limited by inaccessible sites; EU market specifics have fewer dedicated sources. Core LLM differentiator is validated by absence of voice features in all reviewed competitors. |
| Pitfalls | MEDIUM | Whisper hallucination confirmed by multiple high-confidence sources including peer-reviewed research. LLM measurement invention and multi-room parsing are reasoning from first principles + medium-confidence sources. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **eIDAS e-signature library selection:** No specific EU-compliant e-signature library was identified in research. This must be resolved before Phase 5 begins. Options include DocuSign (EU region), Scrive (EU-native), or a custom implementation against the eIDAS standard.

- **Dutch/Belgian e-VerFact XML format:** The accounting architecture mentions Dutch e-VerFact XML as a stretch target, but no specific library or implementation was researched. If NL/BE is the primary launch market, this needs targeted research before Phase 6.

- **VAD library selection for browser audio:** Voice Activity Detection before Whisper upload is flagged as mandatory but no specific browser-compatible VAD library was identified. Options include WebRTC VAD, Silero VAD (ONNX in browser), or the Web Audio API's built-in analyser node.

- **Exact Online API versus DATEV CSV priority:** Research does not resolve which EU accounting format to prioritize. This depends on the target launch country (NL vs DE/AT vs cross-EU), which is a business decision that must be made before Phase 6 is planned.

- **Offline sync conflict resolution strategy:** The recommended offline-first approach (IndexedDB + service worker) is confirmed, but the specific conflict resolution strategy for quotes edited both offline and by a team member online simultaneously is unresolved. This is a hard architecture decision for Phase 7.

- **LLM pricing optimization point:** Research notes that switching to Claude Haiku or GPT-4o-mini is feasible via Vercel AI SDK, but no eval was done on whether smaller models maintain accuracy for painting domain extraction. This should be tested before any cost-cutting model switch.

## Sources

### Primary (HIGH confidence)
- Vercel AI SDK 6 official docs — generateObject, structured output, provider abstraction
- Next.js 16.1 official blog — App Router, Server Actions, Turbopack stable
- Better Auth 1.4 official docs — organization plugin, Drizzle adapter, RBAC
- Supabase official docs — RLS patterns, EU Frankfurt region, GDPR DPA
- Web Speech API — MDN official documentation
- OpenAI Whisper API official docs — 25MB limit, language parameter, multilingual support
- OWASP LLM01:2025 — prompt injection classification and prevention
- Calm-Whisper arXiv 2025 — Whisper hallucination on non-speech, peer-reviewed
- NDSS 2025 — KV-cache prompt leakage in multi-tenant LLM serving, peer-reviewed
- npm: drizzle-orm, @react-pdf/renderer — version confirmation February 2026

### Secondary (MEDIUM confidence)
- Zod v4 — InfoQ + GitHub (bundle size, performance improvements)
- Supabase multi-tenant patterns — Vladimir Siedykh blog (corroborated against official docs)
- PaintScout official site — competitor feature analysis
- Housecall Pro official site — competitor feature analysis
- Estimate Rocket support docs — room-by-room data model confirmation
- Cognitive Today 2025 — structured output reduces parse errors ~90%
- PDF generation libraries 2025 — pdfnoodle.com (cross-checked with library docs)
- Bytebase Drizzle vs Prisma 2025 — edge compatibility comparison

### Tertiary (LOW confidence)
- LangChain vs Vercel AI SDK 2026 — Strapi blog (single source)
- Workyard painting contractor software comparison — comparison site
- Fieldmotion best invoicing software UK/Ireland — EU accounting tool dominance
- FieldEZ voice technology in field service — Gartner 75% voice adoption projection
- Tradify vs Jobber comparison — third-party comparison site

---
*Research completed: 2026-02-17*
*Ready for roadmap: yes*
