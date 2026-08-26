# Spitex Cockpit — Product Designer Onboarding

Welcome. This document brings you up to speed on **what we are building, for whom, why it matters, and where it is going.** It is written for a product designer joining to help rework the application. It stays at the level of *concepts, workflows and design principles* — not individual form fields. Once you have read this, you will understand the business, the people, the problems, our approach, and what is already built versus planned.

Two documents are the binding references once you start designing:

- **`styleguide.md`** (repo root) — the visual and interaction system. Authoritative for anything visual: colour, type, spacing, components, patterns.
- **`CLAUDE.md`** (repo root) — architecture, domain model, naming, and product rules. Authoritative for anything structural or domain-related.

This onboarding doc is the *map*; those two are the *territory*.

For the **care setup process** (Onboarding → InterRAI → care plan → KLV → go-live) and the **first project brief** (the caregiver mobile app, Phase 1), see the companion doc: [`care-process-and-caregiver-app-phase-1.md`](care-process-and-caregiver-app-phase-1.md).

---

## 1 · The business, in plain terms

### What Spitex is

**Spitex** (short for *spitalexterne Hilfe und Pflege* — "care and help outside the hospital") is the Swiss system of **home care**. Instead of a patient staying in a hospital or moving into a nursing home, care professionals come to the person's home: wound care, medication, hygiene support, household help, monitoring of chronic conditions. It is a large, regulated, everyday part of Swiss healthcare.

There are two flavours of care this product touches:

1. **Professional care ("normal" Spitex care)** — a trained nurse (*Pflegefachkraft*) visits clients and delivers care. This is the classic model.
2. **Angehörigenpflege (family / relative caregiving)** — this is the distinctive, growing model and the heart of our product.

### Angehörigenpflege — the model that makes this product special

In Angehörigenpflege, **a family member or close relative does the caregiving** — a daughter caring for her mother, a husband for his wife. The twist that makes it a *business* and not just family life: **the relative is formally employed by the Spitex organisation, paid by the hour**, and the care they provide is billed to the healthcare system like any professional service.

That employment relationship is what generates most of the operational complexity:

- The caregiver is an **employee**, so the organisation needs full HR data: withholding tax (*Quellensteuer*), child allowances (*Kinderzulagen*), partner and family details, bank account, residence/work-permit status.
- Care quality must still be assured, so the caregiver must complete a **mandatory Red Cross course (SRK-Kurs)**. If it is not done within one year of signing the contract, services are paused.
- Because a relative-employee is a real person with a real immigration and tax situation, **compliance rules** kick in automatically (more on this below).

Our specific customer context is **Spitex Kaufmann**, an organisation running this Angehörigenpflege model at scale.

### Why this is hard today

Right now, this whole operation runs on **Excel lists, Word documents, and manual notes.** That means:

- No single source of truth. The same patient or caregiver lives in five spreadsheets.
- Deadlines (SRK course expiry, permit submissions, re-assessments) are tracked by memory or by luck.
- Compliance obligations are easy to miss — and missing them has legal and financial consequences.
- Onboarding a new patient + caregiver is a long, error-prone chain of steps with no guardrails.
- Coordinators cannot see the state of the operation at a glance; nurses cannot see their own workload cleanly.

The work is real and important; the tooling is from a different era.

---

## 2 · The people (roles)

The product serves **three roles**, each looking at the *same data* from a different angle:

| Role | German term | What they care about |
|---|---|---|
| **Nurse** | Pflegefachkraft | Their assigned clients and caregivers, their tasks, reading and uploading documents. |
| **Coordination / Team lead** | Koordination / Teamleitung | Assignments, workflow overviews, steering the operation day to day. |
| **HR / Admin** | HR / Admin | Contract generation, master-data upkeep, SRK compliance, user management. |

Roles are enforced at the route and data level, not only visually. When you design a screen, ask: *which of these three is looking at it, and what do they need to decide?*

---

## 3 · Our approach — the Spitex Cockpit

### What it is

A **modern, operational cockpit** for the administrative side of Angehörigenpflege. It replaces the spreadsheets and Word docs and steers the processes around patients, family caregivers, onboarding, documents, workflow tasks, nurse assignment, and HR/compliance.

### What it is **not**

- **Not a CRM.** We are not managing a sales funnel.
- **Not a ticket system.** Although there is a service desk inside it, the product's spine is *process*, not tickets.
- **Not a reporting/BI tool.** No classic chart dashboards. The cockpit is for *doing operational work*, not admiring metrics.
- **Not the clinical/billing system.** Medical service recording (Leistungserfassung) and billing live in an **external system called MedLink**. The cockpit is the operational layer *in front of* MedLink; the two are deliberately separated.

Think of it as a **process cockpit**: a calm, precise instrument panel that an experienced professional uses to run a complicated administrative operation without dropping anything.

### The core mental model

A few concepts you must internalise, because the whole UI rests on them:

- **A patient exists once. A caregiver (Angehöriger) exists once.** No duplicates.
- **The relationship is n:m.** One patient can have several caregivers; one caregiver can care for several patients.
- That relationship is modelled internally as a **Mandat** (mandate / relationship object). **The user never sees "Mandat" as a thing to manage** — it is clean on the inside, invisible on the outside. Terminology note: in the product, *Mandat* is the umbrella for "patient + caregiver + their relationship."
- **Workflow tasks are generated automatically** by the process (e.g. "SRK course expires in 30 days"). They are *not* created by hand.
- **Service-desk tickets are a separate world** — ad-hoc requests a human raises. Two different mechanisms, deliberately not mixed.

### The process spine: Onboarding → Active

The centre of gravity is **Onboarding** — the guided journey from "a new patient + caregiver arrives" to "everything is set up and services can run." A patient's record is created the moment onboarding begins and keeps the same identity forever; finishing onboarding doesn't copy anything, it just flips a state from *in onboarding* to *active*.

Along the way, the product enforces **compliance gates** automatically.

### Compliance gates (a signature feature)

Certain factual situations trigger hard rules the UI enforces and must never let anyone bypass — not through a new screen, not through Anna, not through an API. There are three severities:

| Severity | Trigger | Effect |
|---|---|---|
| **Hard gate (blocking)** | Residence status **B** + a care context → a special-permit obligation with the migration office. | **Contract signing is blocked** until the submission confirmation is uploaded. A dynamic extra step appears in the onboarding sidebar. |
| **Medium validation** | Residence status **G** (cross-border permit). | Requires upload of the *Ausweis G* document. Not blocking, but a prominent warning with a direct upload action. |
| **Soft validation** | Dependent children or child allowances via Spitex. | Requires a family/birth certificate upload. Not blocking; a neutral, informative prompt. |

For a designer, the takeaway: **the product is not a passive form. It actively steers and sometimes stops the user** when the law requires it. Designing these moments (block, warn, inform) with the right tone is a core craft challenge here.

### Anna — the AI assistant

**Anna** is the built-in assistant, living in a right-hand sidebar, opened from a trigger button in the top bar.

- **Phase 1 (today): read-only.** Search, understanding filter requests, navigation, a daily summary, suggestion chips. No writing, updating or deleting.
- Anna also **respects the compliance gates** — she never routes around them; she points to the correct UI path.
- Later phases add dictation in forms, guided actions, and eventually voice input with explicit confirmation.
- Anna has a distinct visual signature (a malachite-to-cerulean gradient, a sparkle icon) — the *only* place in the product that uses a gradient, so she is instantly recognisable as the AI element.

---

## 4 · A tour of the application (the modules)

The app is organised as a set of domain areas. Most follow a **list → detail** shape.

- **Dashboard** — the operational start. Not a BI chart wall; a "what needs me today" surface.
- **Patients (Klienten/Patienten)** — the client list and the **Patient 360** detail page (personal data, insurance, documents, tickets, history).
- **Caregivers (Angehörige)** — the caregiver list and the **Angehörige 360** detail page, including the heavy HR data (tax, allowances, partner, children, bank details) and permit history.
- **Onboarding** — the guided multi-step setup flow with the dynamic compliance steps, plus a list of all onboardings in progress.
- **Tasks (Pendenzen)** — the automatically generated workflow tasks, in an edit-mode list. (*Pendenz* is the product's single word for "task"; we never say "ticket" here.)
- **Service Desk** — the *separate* world of ad-hoc tickets.
- **Assignment (Zuteilung)** — matching patients to nurses. This was recently reworked from a "scoring/rating" panel into a **four-criteria check view** (language, region, qualification, capacity), because assigning a nurse is a *review a professional is accountable for*, not a black-box score to trust.
- **InterRAI** — the structured **needs assessment** (see below). Includes the assessment list, the section-by-section assessment detail (areas A–S), and the new **Abklärungszusammenfassung** (assessment summary of computed CAPs).
- **Care planning (Pflegeplanung)**, **KLV**, **Schulungsnachweis** (training record), **Arbeitskontrolle** (work-control document) — supporting operational areas.

### InterRAI — worth understanding

**InterRAI HC** is an internationally standardised **home-care needs-assessment instrument.** A nurse works through structured sections (A–S) about the client's situation; from the answers, the system computes **CAPs** (*Clinical Assessment Protocols* — in our German UI, "Abklärungshilfen": flags that say "this area needs attention") and **scales** (summary risk/state measures).

Two things a designer must respect here:

1. **Licensing is unresolved.** InterRAI is a trademark. In the prototype, item texts are paraphrased, the official logo is not used, and the real CAP/scale *computation* is deliberately stubbed and locked — it only arrives with the official Swiss specification. We display results; we do not invent clinical logic. A mandatory copyright line (`© interRAI 1994–2022 · interRAI HC Schweiz`) must appear on the summary and in the capture view.
2. **Direction of change is read from the official "traffic-light" (Ampel: green/orange/red), never from the raw number.** Example: for the Dekubitus (pressure-ulcer) CAP, value 1 is the *worst* state and 3 the *mildest* — a naïve numeric comparison would invert reality. The assessment summary shows what's newly triggered or worsened at a glance, so a nurse can read the situation in under ten seconds.

---

## 5 · Design system & principles (the part most relevant to you)

The product has an established, deliberate design language. You will evolve it, not replace it — so understand its stance first. Full detail is in `styleguide.md`; here is the essence.

### Design stance

> A precise, warm instrument for experienced care professionals. Contemporary and confident, without being tech-y. It respects its users by being calm, legible, and free of gimmicks.

The users are mostly diplomaed nurses, largely women aged 25–65, often without heavy daily software routine. So the UI must feel **familiar** (like a good modern phone app) *and* **clear** (like a well-organised desk).

**Deliberately avoided:** SaaS-purple accents, tech-bro aesthetics (black backgrounds, terminal/monospace looks), healthcare-app cuteness (pastels, mascots), clinical sterility, drop shadows and dramatic elevation, distracting micro-animations.

**Deliberately done:** a distinctive brand colour (**Malachit**, a deep green), familiar component patterns (pill buttons, rounded inputs), quiet precise typography, clear functional hierarchy (one primary action per section), high contrast for legibility with low saturation for calm.

### Foundations (tokens)

- **Colour** is always a CSS variable, never a raw hex. Malachite is the brand signature (used sparingly); **Calm Cerulean** is the communicative accent (links, info). Status colours are a controlled set: **danger** (deep red — overdue/error only), **warning** (ochre — blocked/waiting), **success** (muted olive — done/positive), **info** (cerulean — neutral info like "in onboarding"). Olive success and malachite brand are never confused: one means *success*, the other means *brand*.
- **Type**: Söhne (with Inter as the dev fallback). A tight size scale, and crucially **only two weights — regular (400) and medium (500)**. Never 600/700. Note the root font-size is **14px**, so `1rem = 14px` (this matters for spacing/width maths).
- **Radius**: three values only — pill (999px) for anything interactive, card (12px) for anything containing, avatar (50%). No in-between values.
- **Lines**: hair-thin 0.5px borders; hierarchy comes from background changes and lines, **not from shadows** (the one exception is a very subtle overlay shadow on dropdowns/modals).
- **Spacing**: a fixed 4px-based scale; no in-between values.

### Two rules that will catch you out (learn them early)

- **Colour is never the only signal.** Every status carries an icon *and/or* text as well as colour, so it stays legible in greyscale and for colour-blind users. A bare coloured dot with no text is a bug here.
- **Labels are never truncated with ellipsis** (`…`, `truncate`, `line-clamp`). If space runs out, text **wraps**. Containers are sized to the *longest real value*, not to a short mock example. (There is one narrow exception: a data cell in a list that has a simultaneously-visible detail pane.)

### The pattern library (composed patterns, not just primitives)

Beyond buttons/inputs/pills/cards, the system defines **reusable patterns** that capture a recurring *action*, and the rule is strict: **if a screen needs one of these behaviours, use the existing pattern — never build a local look-alike.** A visually identical re-implementation is considered a defect because it breaks shared maintenance.

- **ReviewBlock** — the one canonical "Anna proposes → a human confirms or discards" element. One verb pair everywhere: *Bestätigen* / *Verwerfen*. "Verwerfen" is never destructive-red (rejecting a suggestion deletes nothing).
- **TabHeader + HeaderMeta** — the uniform header for every content tab: title, state, at most one primary action.
- **SectionAccordion + ItemRow** — the uniform collapsible section + smallest capturable row.
- **SidebarNav** — jump navigation for long, many-section captures (e.g. InterRAI).
- **DataTable** — the shared, responsive list table. The five/six main lists (Onboarding, Patients, Caregivers, Tasks, InterRAI, Assignment) are being brought onto **one shared table + one control-bar standard**: search, a segment toggle, combinable checkbox status-chips (with computed counts), multi-select filter dropdowns, an always-visible active-filter row, a flag column for exceptions, and a footer. Columns size themselves to the *longest real value* and fall away by rank rather than clipping. Recent work has been migrating the remaining lists onto this standard.

### Provenance vs. status (a governance-critical idea)

The product must be **auditable across multiple authors** (Anna, the nurse, a relative). So it separates two axes and never mixes them in one element:

- **Provenance (who made it)** — Anna / diplomaed nurse / relative — shown via **icon and shape, never colour.**
- **Status (how binding)** — proposal → confirmed → signed — shown via **colour plus an icon.**

And notably: **Anna's internal confidence is never shown** (no dots, percentages or traffic-lights for confidence). The nurse is legally accountable for every item, so every suggestion is reviewed equally seriously regardless of how sure the model is.

### Mobile

Fully responsive with four breakpoints (mobile / tablet / desktop / wide). Tables become card lists on mobile; modals become bottom sheets; there is a bottom tab bar. Every new screen must work at 375px. Touch targets are at least 44×44px.

### Language

UI language is **Swiss High German** (no "ß"). Domain terms stay German — *Klient, Angehöriger, Pflegefachkraft, Onboarding, Schweregrad, Zuteilung, Pendenz* — and are not translated even inside otherwise-English code. Error messages are friendly and solution-oriented; toasts are short and neutral (no "Success!" celebration).

---

## 6 · What is built vs. what is planned

### Prototype status

What exists today is a **working, clickable prototype** (a React single-page app) running on **realistic mock data** — plausible Swiss names, believable quantities, no Lorem Ipsum. The prototype uses a **fixed "today" (3 March 2026)** so that all deadlines and comparisons are deterministic. There is no real backend, database or auth wired up yet; those are described as the target production stack in `CLAUDE.md` (Next.js, TypeScript, Tailwind, shadcn/ui, Prisma + Postgres, Auth.js).

### Roughly built

- The design system foundations and the pattern library.
- The main lists, being consolidated onto the shared DataTable + control-bar standard.
- Onboarding flow with the dynamic compliance steps; Patient 360 and Caregiver 360 detail pages.
- Tasks (Pendenzen) with an edit-mode list; the Service Desk.
- Assignment (Zuteilung) reworked into the four-criteria check view.
- InterRAI: assessment list, section detail (A–S), and **assessment summary — CAPs (part 1)**.
- Supporting areas: care planning, KLV, training record, work-control document.

### Planned / in flight

- **Finishing the list-standard migration** across every list.
- **InterRAI assessment summary — part 2**: scales, risk forecasts, and the overall MAPLe priority. (Deliberately deferred until the official numeric ranges arrive from Spitex Schweiz — guessing a scale's range would violate the very spec it must satisfy.)
- The **real InterRAI CAP/scale computation**, which arrives only with the licensed official specification.
- **Anna's later phases**: dictation in forms, guided actions, then voice.
- Real backend, auth with role guards on routes and data, and the **MedLink** boundary/integration.
- Ongoing hardening of the **compliance gates** as new create/write paths appear.

### Explicitly out of scope

Service recording (KLV A/B/C) and billing/factoring live in **MedLink**, not here. Shift/roster planning is not in scope. Classic BI dashboards are not the point. And Anna does not write anything in Phase 1.

---

## 7 · Sensitivities to keep in mind while designing

- **Sensitive data is masked by default** — AHV number, ZEMIS number, IBAN/bank details, ID numbers. Revealing them is a deliberate, logged act (an "uncover" icon, not a hover trick). AHV numbers must never sit permanently visible in lists.
- **Accessibility is non-negotiable**: keyboard operability everywhere, a visible focus ring on every interactive element (never removed), semantic HTML, ARIA labels for icon-only buttons, WCAG-AA contrast including muted secondary text.
- **Compliance gates must never be designed around.** If a new flow can create or write something, check whether a gate applies.
- **One primary action per section.** Resist adding a second.

---

## 8 · Mini-glossary (German terms you'll meet)

| Term | Meaning |
|---|---|
| **Spitex** | Swiss home care ("care outside the hospital"). |
| **Angehörigenpflege** | Care given by an employed family member/relative — our core model. |
| **Klient / Patient** | The person receiving care. |
| **Angehöriger** | The relative caregiver (an hourly employee). |
| **Pflegefachkraft** | Professional nurse. |
| **Koordination / Teamleitung** | Coordination / team lead role. |
| **Mandat** | The internal "patient + caregiver + relationship" object (invisible in the UI). |
| **Onboarding** | The guided setup journey for a new mandate. |
| **Pendenz** | A workflow task (never "ticket"). |
| **Service Desk** | The separate world of ad-hoc tickets. |
| **Zuteilung** | Assignment of a nurse to a patient. |
| **Schweregrad** | Severity level of a case. |
| **InterRAI / Bedarfsabklärung** | The structured needs assessment. |
| **CAP / Abklärungshilfe** | A computed flag that an area needs clinical attention. |
| **Skala** | A summary risk/state measure from the assessment. |
| **Ampel** | The green/orange/red traffic-light that carries clinical direction. |
| **Pflegeplanung** | Care planning. |
| **KLV** | Care-service catalogue positions (recorded/billed in MedLink). |
| **SRK-Kurs** | Mandatory Red Cross course for caregivers. |
| **Quellensteuer / Kinderzulage** | Withholding tax / child allowance (HR data). |
| **AHV / ZEMIS** | Swiss social-security number / migration ID (masked). |
| **Aufenthaltsstatus B / G** | Residence permit types that trigger compliance gates. |
| **MedLink** | External clinical service-recording & billing system (out of our scope). |
| **Anna** | The built-in AI assistant (read-only in Phase 1). |
| **Arbeitskontrolle / Schulungsnachweis** | Work-control document / training record. |

---

## 9 · How to get started

1. **Read this document**, then skim **`styleguide.md`** (the design system) and the domain/architecture parts of **`CLAUDE.md`**.
2. **Run the prototype** and click through it — the fastest way to build intuition. It is a React app started with the dev server; ask the team for the local URL. Recommended path:
   - Start at the **Dashboard**, then an **Onboarding** (watch a compliance gate appear), a **Patient 360** and **Caregiver 360**, the **Tasks** list, **Assignment**, and an **InterRAI** assessment with its **summary**.
3. **Adopt the vocabulary** — using *Pendenz*, *Mandat*, *Angehöriger* correctly signals you understand the domain and keeps the product coherent.
4. When in doubt on anything visual, the styleguide's design stance (Section 1) is the tie-breaker: *calm, precise, familiar, confident — and when unsure, less is more.*

Welcome aboard. The core craft challenge here is turning a legally-loaded, spreadsheet-driven operation into a calm instrument that an experienced nurse trusts — without ever letting the calm surface hide a missed obligation.
