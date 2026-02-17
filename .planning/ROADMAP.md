# Roadmap: Paintr

## Overview

Paintr is built in five phases that follow the natural dependency chain of the product: secure multi-tenant accounts must exist before data can be stored, the LLM parsing engine must work before it can be reviewed, a reviewed quote must exist before it can be delivered as a PDF, and a delivered quote must exist before it can become an invoice. Each phase completes a coherent, independently verifiable capability. The final result is a painter who can walk into a job site, dictate what needs doing, and send a professional quote — all from their phone.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Multi-tenant auth, database with RLS, and project skeleton deployed to production
- [ ] **Phase 2: Voice Input and LLM Parsing** - Core differentiator — voice/text to validated structured quote JSON via LLM
- [ ] **Phase 3: Quote Review, Pricing, and Mobile UX** - Painter reviews, edits, and approves LLM output in a mobile-first UI with live price calculation
- [ ] **Phase 4: PDF Generation, Delivery, and Customer Management** - Professional PDF sent to customers via email; customer records linked to quotes
- [ ] **Phase 5: Invoicing and Accounting Export** - Accepted quote becomes invoice; accounting export for EU software

## Phase Details

### Phase 1: Foundation
**Goal**: Painters can create accounts, belong to organizations, and have their data isolated from other tenants — the secure foundation every subsequent feature builds on
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06
**Success Criteria** (what must be TRUE):
  1. A painter can register with email and password, log in, and stay logged in across browser refresh without re-entering credentials
  2. A painter can create a new organization or join an existing one via an invitation link sent to their email
  3. The team owner can invite additional painters and assign them the estimator role, and those estimators can only see quotes belonging to their own organization
  4. Data written by one organization is invisible to users of any other organization — row-level isolation is enforced at the database level
  5. The application deploys successfully to a production URL and CI runs on every commit
**Plans**: TBD

### Phase 2: Voice Input and LLM Parsing
**Goal**: A painter can speak or type a job description on their phone and receive a validated, structured JSON quote with rooms, tasks, measurements, and risk flags — ready for review
**Depends on**: Phase 1
**Requirements**: VOICE-01, VOICE-02, VOICE-03, VOICE-04, VOICE-05, VOICE-06, VOICE-07, VOICE-08
**Success Criteria** (what must be TRUE):
  1. A painter can tap a record button on their phone, dictate a multi-room job description, and see the transcription appear in a text field within seconds of stopping
  2. A painter can type a job description as an alternative to voice and receive the same structured extraction result
  3. The system correctly identifies and separately structures each room mentioned in a single dictation — a three-room dictation produces three room objects, not one merged room
  4. Each room in the output contains identified surfaces, elements (doors, windows, stairs), tasks, and either an explicit measurement or a clearly flagged default/inferred measurement
  5. The system produces a JSON output that passes Zod schema validation with no extra text outside the structure, and the LLM provider can be switched from Claude to GPT (or back) by changing a single environment variable
**Plans**: TBD

### Phase 3: Quote Review, Pricing, and Mobile UX
**Goal**: A painter can review the LLM-parsed quote on their phone, correct any errors, configure pricing, and produce a finalized quote ready to send — with an accurate, automatically calculated total
**Depends on**: Phase 2
**Requirements**: QUOT-01, QUOT-02, QUOT-03, QUOT-04, QUOT-05, QUOT-06, PRICE-01, PRICE-02, PRICE-03, PRICE-04, PRICE-05, PRICE-06, PRICE-07, UX-01, UX-02, UX-03
**Success Criteria** (what must be TRUE):
  1. A painter can open a parsed quote on their phone, edit any room, task, measurement, or price field inline, and see the total update immediately to reflect the change
  2. The system calculates the quote total from labor hours times hourly rate plus material costs plus margin — the LLM never produces a dollar amount; all arithmetic is in application code
  3. A painter can configure their default hourly rate, material costs, and VAT rate at account level, and can override any of these on a per-quote basis without affecting other quotes
  4. Material quantities are calculated automatically from surface area and task type; VAT is displayed as a separate line item distinct from the net total
  5. A painter can view a searchable list of all past quotes filterable by status (draft, ready, sent, accepted, declined), and can duplicate any quote as a starting point for a new job
**Plans**: TBD

### Phase 4: PDF Generation, Delivery, and Customer Management
**Goal**: A painter can send a professional PDF quote to a customer directly from the app, and link that quote to a customer record for future reference
**Depends on**: Phase 3
**Requirements**: DELIV-01, DELIV-02, DELIV-03, CUST-01, CUST-02, CUST-03
**Success Criteria** (what must be TRUE):
  1. A painter can generate a PDF quote that includes their company logo, an itemized line-item breakdown per room, a VAT-split total, and optional terms — and can download or preview the PDF before sending
  2. A painter can enter a customer email address and send the PDF quote directly from the app; the quote status automatically changes to "sent" after confirmed email delivery
  3. A painter can create a customer record (name, email, phone, address) and link it to a quote so that the customer name appears on the PDF and in the quote list
  4. A painter can open a specific customer and see all quotes associated with that customer, including their current status
**Plans**: TBD

### Phase 5: Invoicing and Accounting Export
**Goal**: An accepted quote can be converted to a compliant EU invoice with one action, and that invoice can be exported to accounting software
**Depends on**: Phase 4
**Requirements**: INV-01, INV-02, INV-03, INV-04, INV-05
**Success Criteria** (what must be TRUE):
  1. A painter can click a single button on an accepted quote to generate an invoice that pre-fills from the quote data and includes payment terms and bank details
  2. The generated invoice displays VAT correctly per EU requirements: net amount, VAT amount, and gross total as separate line items with the applicable VAT rate shown
  3. A painter can export any quote or invoice as a CSV file that imports cleanly into standard accounting software
  4. A painter can export invoice data in a format compatible with Exact Online (NL market) or DATEV (DE/AT market) to eliminate manual data entry in their accounting tool
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/TBD | Not started | - |
| 2. Voice Input and LLM Parsing | 0/TBD | Not started | - |
| 3. Quote Review, Pricing, and Mobile UX | 0/TBD | Not started | - |
| 4. PDF Generation, Delivery, and Customer Management | 0/TBD | Not started | - |
| 5. Invoicing and Accounting Export | 0/TBD | Not started | - |
