# Paintr

## What This Is

An LLM-powered quoting tool for painters. Painters walk through a house, dictate what needs doing room by room via voice or text, and the system turns that natural language into a structured, accurate quote they can review, edit, and send as a professional PDF — all from their phone on-site.

## Core Value

Voice/text input transformed into a structured, accurate painting job quote via LLM — the painter speaks, the system produces a professional quote ready to send.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] LLM-powered natural language → structured JSON quote generation
- [ ] Speech-to-text input for hands-free dictation on-site
- [ ] Text input as alternative to voice
- [ ] Multi-room identification from free-form input
- [ ] Per-room breakdown: measurements, surfaces, elements, tasks
- [ ] Labor hour estimation using conservative painter-expert logic
- [ ] Material quantity estimation per task
- [ ] Risk flag detection (high ceilings, stairs, unusual complexity)
- [ ] Default pricing with painter-configurable overrides (hourly rate, material prices, markup)
- [ ] Auto price calculation from labor + materials + margin
- [ ] Editable quote review UI (painter adjusts before sending)
- [ ] PDF quote generation for customers
- [ ] Mobile-first responsive UI for on-site use
- [ ] Multi-user authentication (painters with own accounts)
- [ ] Team support (painters in companies sharing jobs)
- [ ] Customer management (CRM-lite: customer list, job history)
- [ ] Quote status tracking (draft, sent, accepted, rejected)
- [ ] Accounting export (CSV, UBL)
- [ ] Flexible LLM backend (support multiple providers: Claude, GPT, etc.)
- [ ] Strictly parseable JSON output matching defined schema

### Out of Scope

- Native mobile apps — web-first, responsive PWA approach
- Video/photo input for room scanning — voice and text only for v1
- Real-time collaboration between team members on same quote
- Integration with specific paint brand catalogs or suppliers
- Multi-language UI — English first, localization later

## Context

- Target market is EU painters, with estimation logic modeled on Dutch/Belgian painting conventions
- Painters dictating jobs want speed and minimal typing — the UX must prioritize fast capture
- Painting jobs are often interior and involve multiple rooms with different tasks per room
- Tasks include: sanding, priming, painting, lacquering, repair across walls, ceilings, woodwork, doors, window frames, stairs
- The structured JSON schema includes: job_type, rooms (with measurements, elements, tasks, risk_flags), and overall_risk_flags
- System must handle ambiguous input gracefully — use sensible defaults for missing measurements, ask minimal clarification questions
- Output must be usable for: automated quote generation, accounting export, and UI consumption

## Constraints

- **LLM Provider**: Must be provider-agnostic — no hard dependency on a single LLM vendor
- **Output Format**: JSON must be strictly parseable with no explanatory text outside the structure
- **Estimation Logic**: Conservative estimates aligned with experienced EU painter standards
- **Mobile-first**: UI must work well on phone screens for on-site use
- **Privacy**: Customer and job data must be handled securely (multi-tenant isolation)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| LLM provider-agnostic design | Avoid vendor lock-in, allow cost optimization | — Pending |
| Mobile-first responsive web (not native) | Faster to ship, single codebase, works everywhere | — Pending |
| Default + override pricing model | Sensible out-of-box experience, but every painter's rates differ | — Pending |
| Conservative estimation logic | Better to over-estimate than under-quote — protects painter margin | — Pending |
| EU market focus | Dutch/Belgian painting conventions as baseline, generalizable to EU | — Pending |

---
*Last updated: 2026-02-17 after initialization*
