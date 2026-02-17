# Feature Research

**Domain:** LLM-powered painting contractor quoting tool
**Researched:** 2026-02-17
**Confidence:** MEDIUM (competitive features from multiple verified sources; EU market specifics LOW confidence due to limited dedicated sources)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features painters assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Quote/estimate creation with line items | Core product function — without it there is no product | LOW | Must support rooms, surfaces, labor, materials as distinct line items |
| Room-by-room breakdown | Painters think in rooms and surfaces, not total job; all competitors do this | MEDIUM | Each room needs: walls, ceiling, trim, doors, windows; user dictates, LLM structures |
| Labor and material cost calculation | Painters need to know profitability before submitting; table stakes in all reviewed tools | MEDIUM | Requires configurable production rates (sq ft/hr) and material cost defaults |
| Configurable price defaults and overrides | Every painter has their own rates; one-size pricing kills trust | MEDIUM | System defaults + per-quote overrides + user-level defaults; three-tier price hierarchy |
| Professional PDF quote generation | Customers expect a polished document; e-mailing a spreadsheet is unprofessional | MEDIUM | Branded PDF with company logo, itemized breakdown, total, terms; must look better than a Word doc |
| Quote delivery to customer (email/SMS) | Painters deliver quotes remotely after site visit; manual printing is dead for modern ops | LOW | Email with PDF attachment is minimum; SMS link is a differentiator now becoming expected |
| Customer e-signature / digital approval | Replaces paper signatures; all major competitors (PaintScout, Jobber, Housecall Pro, Knowify) include this | MEDIUM | Legally binding in EU under eIDAS regulation; must store signed document |
| Quote status tracking (sent/viewed/approved) | Painters need to know if a quote was seen; drives follow-up timing | LOW | Webhook/read receipt on email open + explicit accept/decline action from customer |
| Quote editing / revision workflow | First quote is rarely final; painters adjust after customer feedback | LOW | Full edit with version history; re-send to customer |
| Basic customer (contact) record | Painters need to know who they quoted; CRM-lite is expected even in focused tools | LOW | Name, email, phone, address, quote history — nothing more for v1 |
| Mobile-optimized interface | Painters use phones on-site, not laptops; field-first is non-negotiable | HIGH | PWA or native app; iOS + Android; works offline or in low-connectivity; all core flows must work on mobile |
| Quote history / archive | Painters need to reference past quotes for repeat customers and benchmarking | LOW | Searchable list of quotes with filter by status, customer, date |
| Multi-user / team access | Solo painters grow into teams; any team needs shared access to quotes | MEDIUM | Role-based: owner sees all, crew member sees assigned jobs; EU GDPR access control implications |
| VAT-aware pricing (EU) | EU market requires VAT on invoices; quoting without VAT handling is legally incomplete | MEDIUM | Configurable VAT rates per line item or per country; VAT shown separately on quote and invoice |
| Invoice generation from approved quote | Painters invoice after job completion; converting a quote to invoice must be one action | LOW | Pre-fills from approved quote; adds payment terms, bank details |

### Differentiators (Competitive Advantage)

Features that set Paintr apart. Not universally expected, but create switching intent.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Voice-to-structured-quote (LLM core) | Painter speaks room descriptions on-site in natural language; LLM extracts rooms, surfaces, tasks, measurements into structured JSON — no form-filling | HIGH | The central differentiator; replaces manual form entry that competitors require; must handle ambiguity gracefully (flag unclear inputs rather than guess wrong); needs domain-tuned prompt engineering for painting vocabulary |
| Natural language input (text + voice) | Painters dictate on-site while hands may be occupied; text fallback for noisy environments | HIGH | STT (speech-to-text) → LLM parsing → structured review; painter corrects extracted data, not raw text |
| LLM-generated risk flags | LLM identifies potential scope risks from description (e.g., "popcorn ceiling" → asbestos risk flag; "water stains" → prep work flag) | HIGH | High value because it catches margin-eroding surprises before quote is submitted; competitors don't do this |
| Inline quote review and edit on mobile | After LLM parses dictation, painter sees structured quote and taps to correct field-by-field — not a wall of JSON | HIGH | UX is critical: must feel like reviewing a summary, not debugging data; line-item level granularity |
| LLM provider-agnostic architecture | Avoids vendor lock-in; can switch between OpenAI, Anthropic, Mistral, local models | HIGH | Implement via adapter/strategy pattern behind a provider interface; allows cost optimization and EU data residency options |
| Repeat-job templates from past quotes | LLM can suggest a new quote based on similar past jobs ("this looks like the Johnson apartment from March") | MEDIUM | Requires embeddings or similarity search on past quotes; saves time on repeat customer types |
| Automatic material quantity calculation | From sq footage in dictation, calculate paint cans needed; reduces under-ordering mistakes | MEDIUM | Production rate × surface area → material quantity; configurable by paint type and coat count |
| Change order capture on-site | Painter adds scope changes during job; LLM parses additions; customer approves instantly | HIGH | Extends voice-to-quote into job execution phase; competitors offer this but without voice input |
| Quote acceptance "good/better/best" tiers | Present three pricing options automatically from one dictation (basic vs premium paint, one vs two coats) | HIGH | PaintScout does this manually; LLM can generate variants from a single description; increases average job value |
| Accounting export (Xero, QuickBooks, Exact, DATEV) | EU painters use various accounting tools; one-click export eliminates double entry | MEDIUM | DATEV is dominant in Germany/Austria; Exact Online dominant in Netherlands; Xero/QuickBooks cross-EU; build as pluggable export adapters |
| Team notes and crew instructions from quote | Auto-generate crew briefing from the quote details; painter sends to team before job starts | MEDIUM | Reduces verbal handoff errors; LLM can generate from structured quote data |
| Quote analytics / win-rate tracking | Shows which quote types win, average deal size, quote-to-win ratio — helps painters price better | MEDIUM | Requires sufficient quote volume; useful from day one only if metrics are lightweight |
| Offline-first mobile experience | Painters work in buildings with poor connectivity; quote must be capturable without internet | HIGH | IndexedDB / service worker sync; complex but critical for field use |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create scope creep, complexity without value, or damage focus.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Full project management (Gantt, scheduling, dispatch) | "We need to schedule crews" | Turns a focused quoting tool into a generic FSM platform; competes with ServiceTitan, Jobber on their home turf; painters have existing scheduling tools | Keep to quote + invoice lifecycle only; offer integration hooks (webhook/calendar export) so painters connect to scheduling tools they already use |
| Built-in payment processing | "Take payment in the app" | Requires payment service provider licensing, PCI-DSS compliance, EU PSD2/SCA compliance, significant trust-building; diverts engineering from core LLM features | Invoice with bank transfer details (standard in EU); link to Stripe payment link as optional add-on in v2 |
| Photo/video takeoff measurement | "Measure from photos automatically" | Computer vision for accurate dimensional takeoff is a separate hard problem; scope explosion | Let painter dictate measurements verbally; LLM extracts from natural language ("twelve by fifteen room"); add photo attachment for context only |
| Full inventory / stock management | "Track how much paint we have" | Inventory management is a warehouse problem, not a quoting problem; painters don't stock large inventories | Material quantity estimates per quote are sufficient; link to supplier ordering is v3+ |
| Timesheet / payroll | "Track crew hours" | Labor compliance, country-specific payroll rules, tax deductions — a separate regulated domain | Out of scope; integrate with dedicated time-tracking tools |
| Customer portal / real-time job updates | "Customers want to see job progress" | Project management feature, not quoting; high UX complexity for marginal value at launch | Digital quote acceptance and e-signature satisfy the customer interaction need for v1 |
| AI pricing optimization (market-rate benchmarking) | "Tell me if I'm pricing too low" | Requires aggregated market data Paintr won't have at launch; training-data freshness becomes a liability | Focus on accurate cost-up pricing with painter's own rates; market benchmarking is a v3 feature once dataset exists |
| Multi-language quote templates (auto-translated) | "My customers speak different languages" | LLM translation of legal-adjacent documents is risky; incorrect translation creates legal exposure | Painter selects template language at account level; EU market typically one language per country |
| Built-in video calls for remote estimates | "Do estimates without site visit" | Adds WebRTC infrastructure, dramatically increases surface area; remote estimating is a different workflow | Not a painting-specific problem; painters who want this can use Facetime/Teams and then dictate into Paintr |

---

## Feature Dependencies

```
[STT / voice input]
    └──feeds──> [LLM quote parsing]
                    └──outputs──> [Structured quote JSON]
                                      └──requires──> [Quote review + edit UI (mobile)]
                                                          └──enables──> [PDF generation]
                                                                            └──enables──> [Quote delivery (email/SMS)]
                                                                                              └──enables──> [E-signature / customer approval]
                                                                                                                └──enables──> [Invoice generation]
                                                                                                                                  └──enables──> [Accounting export]

[Customer (contact) record]
    └──required by──> [Quote] (quote must belong to a customer)
    └──required by──> [Quote history]
    └──required by──> [CRM follow-up]

[Multi-user auth]
    └──required by──> [Team access to quotes]
    └──required by──> [Role-based permissions]

[Price defaults (production rates, material costs)]
    └──required by──> [LLM quote parsing] (LLM needs cost context to calculate totals)
    └──required by──> [Material quantity calculation]

[VAT configuration]
    └──required by──> [Invoice generation] (EU legal requirement)
    └──required by──> [PDF quote] (VAT must be shown on formal quotes in many EU jurisdictions)

[Past quote data]
    └──enables──> [Repeat-job templates]
    └──enables──> [Quote analytics / win-rate]
    └──enables──> [Good/better/best tier suggestions]

[Structured quote JSON]
    └──enables──> [Risk flag generation] (LLM reads structured data + raw description)
    └──enables──> [Change order capture]
    └──enables──> [Crew instruction generation]
```

### Dependency Notes

- **LLM quote parsing requires price defaults:** The LLM cannot calculate totals without knowing the painter's production rates and material costs. Price defaults must be configurable before the LLM parsing feature is meaningful.
- **E-signature requires quote delivery:** You can't sign what hasn't been sent. The delivery mechanism (email/SMS) must be built before e-signature is added.
- **Invoice generation requires VAT configuration:** EU invoices must show VAT. Invoicing before VAT is configured produces legally non-compliant documents — ship VAT setup before invoice generation.
- **Accounting export requires structured invoice data:** The export adapter reads from invoice records; invoice generation must be stable before accounting export is built.
- **Offline-first conflicts with real-time quote status tracking:** Syncing offline-created quotes with server-side status events is complex. Ship online-only first, add offline capability once sync architecture is proven.
- **Good/better/best tiers enhance LLM parsing:** Generating three variants requires the base structured quote to be accurate first. Tier generation is a layer on top, not a foundation.

---

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the core LLM quoting concept with real painters.

- [ ] Voice + text input captured on mobile and sent to LLM — core differentiator; validates the product hypothesis
- [ ] LLM parses input into structured quote (rooms, tasks, surfaces, area, labor hours, material quantities, line-item totals) — the engine everything else depends on
- [ ] Quote review and field-level editing on mobile — painter must be able to correct LLM output before sending; non-negotiable for trust
- [ ] Risk flag output from LLM (displayed inline in quote) — high-value, low-UI-complexity; validates AI helpfulness beyond parsing
- [ ] Configurable price defaults (production rates, material unit costs, default margin) — without these, LLM output is useless
- [ ] Basic customer record (name, email, phone, address) — minimum CRM so quotes attach to real people
- [ ] VAT rate configuration (at account level) — EU legal requirement; ship from day one
- [ ] PDF generation from approved quote — professional output is the deliverable painters send customers
- [ ] Quote delivery via email — how the PDF gets to the customer
- [ ] Quote status (sent / viewed / approved / declined) — painter needs to know what to follow up on
- [ ] Multi-user auth with team roles (owner + estimator) — needed from day one for small teams
- [ ] Quote history and search — painters reference past quotes constantly

### Add After Validation (v1.x)

Features to add once core quoting flow is working and painters are using it.

- [ ] E-signature / customer digital approval — add when painters report friction in the approval step; depends on quote delivery being stable
- [ ] Invoice generation from approved quote — natural next step after approval; add when painters ask "now what?"
- [ ] Accounting export (Xero and one EU-native: Exact or DATEV depending on target country) — add when invoicing works and painters complain about double-entry
- [ ] SMS delivery of quote link — add when email open rates show delivery is the bottleneck
- [ ] Offline-first mobile quote capture — add when painters report connectivity problems causing lost work
- [ ] Automatic material quantity calculation — add when painters request it; requires good production rate data from v1

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Good/better/best quote tiers — high value but high prompt engineering complexity; defer until base parsing is reliable
- [ ] Repeat-job template suggestions — needs quote history volume; at least 50+ quotes per account to be useful
- [ ] Change order capture — extends into job execution phase; defer until quoting flow is stable
- [ ] Crew instruction generation from quote — nice-to-have; depends on team workflow adoption
- [ ] Quote analytics / win-rate dashboard — needs data volume; v2 once sufficient quotes exist
- [ ] Full offline-first architecture — complex sync; ship online-first, add offline as a hardening phase

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Voice + text input to LLM | HIGH | MEDIUM | P1 |
| LLM quote parsing → structured JSON | HIGH | HIGH | P1 |
| Quote review + edit on mobile | HIGH | HIGH | P1 |
| Risk flag generation | HIGH | LOW (prompt addition) | P1 |
| Configurable price defaults | HIGH | MEDIUM | P1 |
| Customer record (contact) | HIGH | LOW | P1 |
| VAT configuration | HIGH | LOW | P1 |
| PDF generation | HIGH | MEDIUM | P1 |
| Email delivery | HIGH | LOW | P1 |
| Quote status tracking | MEDIUM | LOW | P1 |
| Multi-user auth + roles | HIGH | MEDIUM | P1 |
| Quote history | MEDIUM | LOW | P1 |
| E-signature | HIGH | MEDIUM | P2 |
| Invoice generation | HIGH | MEDIUM | P2 |
| Accounting export | MEDIUM | MEDIUM | P2 |
| Material quantity calculation | MEDIUM | LOW | P2 |
| SMS delivery | MEDIUM | LOW | P2 |
| Offline-first mobile | HIGH | HIGH | P2 |
| Good/better/best tiers | HIGH | HIGH | P3 |
| Repeat-job templates | MEDIUM | HIGH | P3 |
| Change order capture | MEDIUM | HIGH | P3 |
| Crew instructions | LOW | MEDIUM | P3 |
| Quote analytics | MEDIUM | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch — ship in v1 to validate core concept
- P2: Should have — add after core is stable and validated
- P3: Nice to have — future phases after product-market fit

---

## Competitor Feature Analysis

| Feature | PaintScout | Jobber / Tradify | Housecall Pro | Paintr (Our Approach) |
|---------|--------------|--------------|--------------|--------------|
| Quote creation | Form-based with templates and production rates | Form-based line items | Form-based with "good/better/best" | Voice/text → LLM parsing → structured form; no blank form to fill |
| Mobile use | Tablet/phone supported | Mobile-first | Mobile app | Mobile-first; voice capture designed for on-site use |
| CRM | Sales pipeline, follow-up automation | Basic contact management | Customer profiles, review automation | CRM-lite: contact + quote history + follow-up status |
| PDF output | Branded, interactive clickable presentations | Standard PDF invoice/quote | Professional PDF | Branded PDF; less interactive frills, more information clarity |
| E-signature | Yes (core feature) | Yes | Yes | v1.x — after core is validated |
| Invoice | Yes | Yes | Yes | Yes (from approved quote) |
| Accounting integration | QuickBooks, Pipedrive, HubSpot, Zapier | QuickBooks Online | QuickBooks | Xero + EU-native (Exact / DATEV) as pluggable adapters |
| AI / LLM features | None as of early 2026 | None | None | Core differentiator — entire input flow is LLM-powered |
| Voice input | None | None | None | Central feature |
| Risk flags | None | None | None | LLM-generated from dictation content |
| EU VAT | Limited (US-focused) | Partial (Jobber has UK) | US-focused | Native EU VAT from day one |
| Offline | No | Limited | No | Targeted for v1.x |
| Price | ~$99-199/mo | $49-199/mo | $65-199/mo | TBD — research suggests $49-149/mo is the sweet spot for small teams |

---

## Sources

- [PaintScout feature overview — painting-estimates page](https://www.paintscout.com/painting-estimates) — MEDIUM confidence (official site, fetched 2026-02-17)
- [Housecall Pro painting contractor software](https://www.housecallpro.com/industries/painting-contractor-software/) — MEDIUM confidence (official site, fetched 2026-02-17)
- [ServiceTitan top 10 painting contractor software 2025](https://www.servicetitan.com/blog/painting-contractor-software) — LOW-MEDIUM confidence (industry blog, not fetched due to CSS-only response)
- [Workyard 7 best painting contractor software 2025](https://www.workyard.com/compare/painting-contractor-software) — LOW-MEDIUM confidence (comparison site)
- [Buildxact painting estimating software buyer's guide](https://www.buildxact.com/us/blog/painting-estimating-software/) — LOW confidence (not fetched, search result only)
- [Estimate Rocket interior painting item templates](https://support.estimaterocket.com/43828-line-items/interior-painting-item-templates) — MEDIUM confidence (official docs, confirms room-by-room data model)
- [Painting Business Pro — how to estimate paint jobs](https://paintingbusinesspro.com/how-to-estimate-paint-jobs/) — LOW confidence (industry blog)
- [Fieldmotion best invoicing software UK/Ireland 2025](https://fieldmotion.com/blog/the-best-invoicing-software-for-small-businesses/) — MEDIUM confidence (EU-adjacent; confirms Xero/QuickBooks dominance + Sage 50)
- [Chift Unified Accounting API — DATEV integration](https://www.chift.eu/blog/datev-api-integration) — MEDIUM confidence (specialist EU integration vendor)
- [Cognitive Today — structured output AI reliability 2025](https://www.cognitivetoday.com/2025/10/structured-output-ai-reliability/) — MEDIUM confidence (confirms JSON schema reduces parse errors by ~90%)
- [Fulcrum Audio FastFill — voice field data capture](https://www.fulcrumapp.com/blog/audio-fastfill-field-data-capture-using-voice-dictation/) — MEDIUM confidence (confirms 20% faster task completion with voice in field)
- [FieldEZ — voice technology in field service](https://fieldez.com/voice-technology-in-field-service-hands-free-operations-for-mobile-technicians/) — LOW confidence (single source; cites Gartner 75% voice adoption projection for field service by 2026)
- [Knowify painting contractor software](https://knowify.com/painting-contractor-software/) — LOW confidence (site inaccessible; features from search snippet only)
- [Tradify vs Jobber comparison 2025](https://fieldservicesoftware.io/tradify-vs-jobber/) — LOW confidence (third-party comparison)

---

*Feature research for: Paintr — LLM-powered painting contractor quoting tool*
*Researched: 2026-02-17*
