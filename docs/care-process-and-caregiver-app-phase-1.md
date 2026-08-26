# Care Setup Process & Caregiver App — Phase 1 Brief

This document does two things:

- **Part A** defines the end-to-end process that turns a new case into a running, billable care arrangement: **Onboarding → InterRAI → Pflegediagnosen (care plan) → KLV → Vertragsstart (go-live).**
- **Part B** is the brief for the designer's **first project**: the **Angehörigen (caregiver) Mobile App, Phase 1** — the app the relative uses on each visit to write/speak the care report, tick off the day's KLV positions, and record absence.

Read Part A first: the mobile app in Part B only makes sense as the *daily execution* of the plan that Part A produces. Background on the business, roles, terminology and the design system is in [`product-designer-onboarding.md`](product-designer-onboarding.md).

---

# Part A — The care setup process

## The chain at a glance

```
   INTAKE                 ASSESS                PLAN                 AUTHORISE            GO-LIVE
 ┌──────────┐        ┌──────────────┐     ┌───────────────┐      ┌──────────────┐    ┌───────────────┐
 │Onboarding│  ───▶  │   InterRAI   │ ──▶ │ Pflegeplanung │  ──▶ │     KLV      │──▶ │  Vertragsstart│
 │  intake  │        │Bedarfs-      │     │ diagnoses →   │      │ positions +  │    │  services run │
 │          │        │abklärung     │     │ measures →    │      │ prescription │    │  (→ MOBILE    │
 │          │        │ → CAPs/scales│     │ goals         │      │ + cost appr. │    │     APP)      │
 └──────────┘        └──────────────┘     └───────────────┘      └──────────────┘    └───────────────┘
      │                                                                                     │
      └───────────── COMPLIANCE track runs in parallel (permits, SRK course, HR) ──────────┘
```

Two things are being set up **in parallel** and must *both* be green before go-live:

- **The patient's care** — objective need is assessed, a plan is written, and the plan is translated into authorised, billable services.
- **The caregiver's employment & compliance** — the relative is being hired (HR data), and legal gates (residence permit, SRK course, documents) must clear.

They converge at **Vertragsstart**. Missing either side means no valid, billable care.

## Stage 1 — Onboarding (intake)

**What happens:** A new patient plus their family caregiver enter the system. The patient record is created here and keeps its identity forever. Master data is captured on both sides — the patient's personal/insurance details, the caregiver's HR data (withholding tax, allowances, partner, children, bank details, residence status).

**Compliance gates fire here.** Based on the facts entered, the product may:
- **block** contract signing (residence status B + care context → special-permit obligation until the submission confirmation is uploaded),
- **warn** (status G → require the *Ausweis G* upload),
- **inform** (dependent children/allowances → require a family/birth certificate).

**Produces:** a patient in state *in onboarding*, a caregiver record, and the open compliance obligations.

## Stage 2 — InterRAI (Bedarfsabklärung / needs assessment)

**What happens:** A nurse works through the standardised InterRAI HC assessment (sections A–S) about the client's situation. From the answers the system computes **CAPs** (Abklärungshilfen — flags that an area needs attention) and **scales** (summary risk/state measures). The **Abklärungszusammenfassung** shows, at a glance, what is triggered, new, or worsened.

**Why it comes first:** the plan must be grounded in an objective, structured picture of need — not a guess. This is the *evidence* layer.

**Produces:** the assessed needs — the objective basis for the care plan. (Note: the real CAP/scale computation arrives only with the licensed official specification; today it is stubbed and locked.)

## Stage 3 — Pflegeplanung (care plan: diagnoses → measures → goals)

**What happens:** From the assessment (and the doctor's **ärztliche Diagnosen**), the nurse formulates the care plan in three linked layers:
- **Pflegediagnosen** — the nursing diagnoses (what care problems exist),
- **Massnahmen** — the measures/interventions that address each diagnosis,
- **Ziele** — the goals each measure works toward.

**Why here:** the assessment says *what is wrong*; the plan says *what we will do about it and why*. This is the *decision* layer, and it is the professional's responsibility.

**Produces:** a structured care plan — diagnoses, the concrete measures, and their goals.

## Stage 4 — KLV (service positions + authorisation)

**What happens:** The care-plan measures are translated into **KLV positions** — the Swiss catalogue of billable nursing services (KLV Art. 7):
- **KLV A** — Abklärung und Beratung (assessment & advice),
- **KLV B** — Untersuchung und Behandlung (examination & treatment),
- **KLV C** — Grundpflege (basic care).

Each position carries a **time budget** (e.g. hours per week). Before these services can be billed, two authorisations must exist:
- an **ärztliche Verordnung** (medical prescription), and
- a **Kostengutsprache** (cost approval from the insurer).

**Boundary note:** KLV positions are *planned* in the cockpit, but the actual **Leistungserfassung (service recording) and billing live in the external MedLink system.** The cockpit is the operational layer in front of MedLink.

**Produces:** the authorised set of KLV positions and the weekly plan of what care is owed — **this is exactly what the caregiver will execute and tick off daily in the mobile app.**

## Stage 5 — Vertragsstart (go-live)

**What happens:** Once the **compliance gates are cleared** and the **employment contract with the caregiver is signed** (the relative is employed hourly), and the **prescription + cost approval** are in place, the arrangement goes live. The patient flips from *in onboarding* to *active*, and real care begins.

**A live guard remains:** if a required piece lapses (e.g. an expired prescription or missing cost approval), services can be flagged *not billable* (*nicht abrechenbar*) — and the SRK course must still be completed within a year of contract signing, or services are paused.

**Produces:** an active care arrangement — and the moment the caregiver's daily work (and the mobile app) begins.

## How the plan hands off to daily delivery

After go-live, the plan is not a document that sits still — it is executed **every visit**:

- The **KLV positions** (Stage 4) become the caregiver's **daily to-do**: what care is due today.
- Each visit produces a **Pflegebericht** (nursing report) documenting what happened.
- **Absences** (patient or caregiver not present) mean planned care did not happen — which must be recorded, because it affects billing and can trigger follow-up tasks (Pendenzen).

That daily execution loop is precisely what the Phase 1 mobile app covers.

---

# Part B — Phase 1: the Caregiver (Angehörigen) Mobile App

## The idea

Today the caregiving relative has no dedicated tool for the daily work; documentation is informal and disconnected from the plan and from billing. **Phase 1 gives the caregiver a focused mobile app for the three things they must do on every visit** — nothing more.

**Who:** the family caregiver (an hourly employee, often not a software person). **Where:** in the patient's home, on a phone, likely one-handed and sometimes with poor connectivity. **When:** during/right after each visit.

The design north star: **the least possible friction for a non-technical person to truthfully capture what happened** — so the record is complete, the plan stays honest, and billing is correct.

## The three core jobs (Phase 1 scope)

### 1 · Write or **speak** the care report (Pflegebericht)

The caregiver documents the visit. Because typing on a phone in someone's living room is a barrier, **voice is the primary input**: the caregiver *speaks* the report and it is transcribed/structured (this is Anna's dictation capability, central to the app). Typing is the fallback, not the default.

Design considerations:
- Make speaking the obvious first action; keep the written path available.
- The report is authored by a **relative** — in the product's provenance model that is a distinct origin (never colour-coded), and such content is typically **reviewed/confirmed later by a diplomaed nurse**, who stays accountable. Reflect that the caregiver *captures*, and the record carries its origin.
- Reports feed the patient's documentation/history in the cockpit.

### 2 · Check the day's **KLV positions**

The app shows the **KLV positions that were due today** (derived from the authorised plan, Stage 4) and lets the caregiver **tick off what was actually performed** — and flag anything that could not be done.

Design considerations:
- This is a checklist, not a planning screen: the caregiver **executes** the plan, they do not edit it (editing the plan/KLV is the nurse's job in the cockpit).
- The checked positions are the raw material for **Leistungserfassung**, which is billed in **MedLink** — so the app is the *capture front-end* that feeds MedLink; respect that boundary (the app does not do billing).
- Deviations (a position due but not performed) matter for accuracy and can generate a follow-up task.

### 3 · Record **absence** (patient or caregiver)

If the **patient** is absent (in hospital, on holiday) or the **caregiver** is absent, the planned care did not happen. The app lets the caregiver record that cleanly.

Design considerations:
- Absence is a first-class, low-friction action — not buried, because an unrecorded absence corrupts both the record and the billing.
- It connects to the KLV check (services not delivered) and can trigger a **Pendenz** for coordination.
- Consider the distinction between the two subjects (patient vs. caregiver absent) and simple, honest reason categories.

## What is explicitly **not** in Phase 1

- Creating or editing the care plan, diagnoses, or KLV positions (nurse-only, in the cockpit).
- Billing, cost approvals, prescriptions.
- Scheduling / rostering / route planning.
- HR, contracts, compliance handling.
- Anything the nurse or coordinator does in the desktop cockpit. The app is the caregiver's *daily execution* surface only.

## Constraints & principles carried over from the product

- **Field-first, low-literacy-friendly UX**: big touch targets (≥44×44px), minimal typing, voice-first, familiar app patterns, calm and legible. Assume one-handed use and interruptions.
- **Offline resilience**: visits happen where connectivity is unreliable; capture must survive a dropout and sync later. (The exact sync model is an open question — see below.)
- **Colour is never the only signal; labels wrap, never truncate.** The two hard rules from the design system apply on mobile too.
- **Sensitive data stays masked** by default; the app shows only what the caregiver needs.
- **Language**: Swiss High German, simple and warm, solution-oriented; no "ß", no celebratory toasts.
- **Provenance vs. status**: caregiver-authored content is marked by origin (icon/shape), and its binding status (proposal → confirmed) is a separate axis shown with colour + icon.

## Open questions to settle with the team before/while designing

1. **Offline/sync model** — what must work fully offline, and how do we show sync state and conflicts?
2. **Review loop** — are caregiver reports and KLV check-offs *proposals* a nurse confirms in the cockpit, or are they authoritative on capture? This shapes the whole trust model.
3. **"Today's KLV positions"** — how are they derived: a fixed daily schedule, or a weekly budget the caregiver draws from? This drives the checklist UX.
4. **Absence taxonomy** — which reason categories, and what downstream effects (billing adjustment, Pendenz) should the caregiver see or not see?
5. **Auth & identity for caregivers** — how do relatives sign in, and how does one caregiver with several patients switch context?
6. **MedLink hand-off** — what exactly crosses the boundary from the app's capture into MedLink, and when?

---

*Use Part A to speak the language of the operation, and Part B as the frame for the first design sprint. When a Phase-1 scope question is ambiguous, the safe default is: capture faithfully, keep the caregiver's surface tiny, and leave planning and billing where they belong.*
