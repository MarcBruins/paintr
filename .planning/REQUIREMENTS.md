# Requirements: Paintr

**Defined:** 2026-02-17
**Core Value:** Voice/text input transformed into a structured, accurate painting job quote via LLM

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Voice Input & LLM Processing

- [ ] **VOICE-01**: User can record voice dictation on mobile and have it transcribed to text
- [ ] **VOICE-02**: User can type a job description as alternative to voice input
- [ ] **VOICE-03**: System extracts multiple rooms from a single dictation or text input
- [ ] **VOICE-04**: System extracts per-room details: surfaces, elements (doors, windows, stairs), and tasks from natural language
- [ ] **VOICE-05**: System estimates measurements using sensible defaults when not explicitly stated
- [ ] **VOICE-06**: System asks minimal clarification questions when input is ambiguous
- [ ] **VOICE-07**: System supports switching between LLM providers (Claude, GPT) without code changes
- [ ] **VOICE-08**: System outputs strictly parseable JSON matching the defined quote schema

### Quote Management

- [ ] **QUOT-01**: User can create a new quote from LLM-generated structured data
- [ ] **QUOT-02**: User can review and edit any field of a generated quote before sending
- [ ] **QUOT-03**: User can add, remove, or modify rooms and tasks in a quote
- [ ] **QUOT-04**: Quote transitions through lifecycle states: draft → ready → sent → accepted → declined
- [ ] **QUOT-05**: User can view a searchable list of all past quotes with status filters
- [ ] **QUOT-06**: User can duplicate an existing quote as a starting point for a new one

### Pricing & Estimation

- [ ] **PRICE-01**: System calculates total price from labor hours × hourly rate + material costs + margin
- [ ] **PRICE-02**: System provides sensible default production rates and material costs (EU painter standards)
- [ ] **PRICE-03**: User can override default rates at account level (personal defaults)
- [ ] **PRICE-04**: User can override rates per individual quote
- [ ] **PRICE-05**: System automatically calculates material quantities from surface area and task type
- [ ] **PRICE-06**: User can configure VAT rate at account level
- [ ] **PRICE-07**: Quotes display VAT amount separately from net total

### PDF & Delivery

- [ ] **DELIV-01**: User can generate a branded PDF quote with company logo, itemized breakdown, and totals
- [ ] **DELIV-02**: User can send PDF quote to customer via email directly from the app
- [ ] **DELIV-03**: Quote status updates to "sent" after email delivery

### Customer Management

- [ ] **CUST-01**: User can create and manage customer records (name, email, phone, address)
- [ ] **CUST-02**: User can link quotes to a customer
- [ ] **CUST-03**: User can view all quotes for a specific customer

### Authentication & Teams

- [ ] **AUTH-01**: User can create an account with email and password
- [ ] **AUTH-02**: User session persists across browser refresh
- [ ] **AUTH-03**: User can create or join a team (organization)
- [ ] **AUTH-04**: Team owner can invite members via email
- [ ] **AUTH-05**: Team members see shared quotes within their organization
- [ ] **AUTH-06**: Role-based access: owner (full access) and estimator (create/edit quotes)

### Invoicing & Accounting

- [ ] **INV-01**: User can generate an invoice from an accepted quote with one action
- [ ] **INV-02**: Invoice pre-fills from quote data with payment terms and bank details
- [ ] **INV-03**: Invoice displays VAT correctly per EU requirements
- [ ] **INV-04**: User can export quote/invoice data as CSV for accounting software
- [ ] **INV-05**: User can export in EU-native formats (Exact Online / DATEV compatible)

### Mobile UX

- [ ] **UX-01**: All core flows (record, review, edit, send) work on mobile phone screens
- [ ] **UX-02**: UI is responsive and mobile-first in design
- [ ] **UX-03**: Voice recording interface provides clear feedback (recording state, processing state)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### AI Enhancements

- **AI-01**: LLM generates risk flags for unusual complexity (high ceilings, stairs, water damage)
- **AI-02**: System suggests good/better/best quote tiers from a single dictation
- **AI-03**: System suggests similar past quotes as templates for new jobs

### Approval & Delivery

- **APRV-01**: Customer can digitally accept or decline a quote (e-signature, eIDAS compliant)
- **APRV-02**: User can send quote link via SMS
- **APRV-03**: System tracks when customer views the quote

### Advanced Mobile

- **MOB-01**: App works offline — audio recordings queued locally and sync when connected
- **MOB-02**: Draft quotes persist locally when offline

### Workflow

- **WORK-01**: User can capture change orders on-site via voice during job execution
- **WORK-02**: System auto-generates crew instruction briefing from quote details
- **WORK-03**: Dashboard shows quote analytics (win rate, average deal size)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Full project management (Gantt, scheduling, dispatch) | Competes with Jobber/ServiceTitan; painters have existing scheduling tools |
| Built-in payment processing | PCI-DSS + EU PSD2/SCA compliance; defer to Stripe payment link in v2+ |
| Photo/video measurement takeoff | Computer vision dimensional takeoff is a separate hard problem |
| Inventory / stock management | Warehouse problem, not a quoting problem |
| Timesheet / payroll | Country-specific labor compliance; separate regulated domain |
| Customer portal / real-time job updates | Project management feature, not quoting |
| AI pricing optimization / market benchmarking | Requires aggregated market data not available at launch |
| Multi-language quote templates | LLM translation of legal-adjacent documents is risky |
| Built-in video calls | Not painting-specific; painters can use FaceTime/Teams |
| Native mobile apps | Web-first responsive PWA approach |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| AUTH-05 | Phase 1 | Pending |
| AUTH-06 | Phase 1 | Pending |
| VOICE-01 | Phase 2 | Pending |
| VOICE-02 | Phase 2 | Pending |
| VOICE-03 | Phase 2 | Pending |
| VOICE-04 | Phase 2 | Pending |
| VOICE-05 | Phase 2 | Pending |
| VOICE-06 | Phase 2 | Pending |
| VOICE-07 | Phase 2 | Pending |
| VOICE-08 | Phase 2 | Pending |
| QUOT-01 | Phase 3 | Pending |
| QUOT-02 | Phase 3 | Pending |
| QUOT-03 | Phase 3 | Pending |
| QUOT-04 | Phase 3 | Pending |
| QUOT-05 | Phase 3 | Pending |
| QUOT-06 | Phase 3 | Pending |
| PRICE-01 | Phase 3 | Pending |
| PRICE-02 | Phase 3 | Pending |
| PRICE-03 | Phase 3 | Pending |
| PRICE-04 | Phase 3 | Pending |
| PRICE-05 | Phase 3 | Pending |
| PRICE-06 | Phase 3 | Pending |
| PRICE-07 | Phase 3 | Pending |
| UX-01 | Phase 3 | Pending |
| UX-02 | Phase 3 | Pending |
| UX-03 | Phase 3 | Pending |
| DELIV-01 | Phase 4 | Pending |
| DELIV-02 | Phase 4 | Pending |
| DELIV-03 | Phase 4 | Pending |
| CUST-01 | Phase 4 | Pending |
| CUST-02 | Phase 4 | Pending |
| CUST-03 | Phase 4 | Pending |
| INV-01 | Phase 5 | Pending |
| INV-02 | Phase 5 | Pending |
| INV-03 | Phase 5 | Pending |
| INV-04 | Phase 5 | Pending |
| INV-05 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 41 total
- Mapped to phases: 41
- Unmapped: 0 ✓

*Note: The previous coverage count of 38 was a miscalculation. The actual count is 41 (8 VOICE + 6 QUOT + 7 PRICE + 3 DELIV + 3 CUST + 6 AUTH + 5 INV + 3 UX).*

---
*Requirements defined: 2026-02-17*
*Last updated: 2026-02-17 — traceability completed after roadmap creation*
