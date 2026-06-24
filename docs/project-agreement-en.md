# Project Agreement — Spitex Cockpit

**Between**
Wondercode GmbH, Zurich ("Provider")
and
Spitex Kaufmann AG, Zurich ("Client")

**Date:** June 10, 2026
**Document version:** 1.0

---

## A. Subject and Purpose

The Provider develops and delivers the **Spitex Cockpit** — an operational management platform for home care that replaces the Client's existing Excel, Word and paper-based processes for patient onboarding, caregiver administration, document management, workflow tracking and task management.

The platform is delivered in two phases:

| Phase | Scope | Go-Live |
|-------|-------|---------|
| **Phase 1** | Operational core — capture and manage mandates (onboarding, patients, caregivers, tasks, documents, workflows) | **September 30, 2026** |
| **Phase 2** | Clinical intelligence — InterRAI assessments, care planning (NANDA), KLV prescriptions, AI assistant (Anna), conversation recording, physician request automation, allocation matching | **January 4, 2027** |

---

## B. Requirements Catalog

The attached **Requirements Catalog (Appendix 1)** defines the binding functional scope per phase. Each requirement has:

- **ID** — unique identifier for traceability
- **Phase** — 1 or 2
- **Requirement** — short title
- **Description** — detailed specification of the delivered functionality
- **Status** — "Committed" (scope commitment by the Provider)
- **Acceptance** — to be filled at go-live (Accepted / Not Accepted)

The catalog contains **96 requirements** organized in **23 thematic sections**:

- Phase 1: **50 requirements** (operational core)
- Phase 2: **46 requirements** (clinical intelligence)

---

## C. Refinement Period

Within **14 calendar days** from the signing of this agreement (the "Refinement Period", ending on **[date to be inserted]**), the requirements will be jointly specified at field level. This includes:

1. **Concrete data fields per object** (Patient, Caregiver, Onboarding Case, Ticket)
2. **Mandatory vs. optional field classification** per object
3. **Validation rules and dependencies** (e.g. conditional fields based on residence permit status)
4. **Adjustments to existing requirements** (rewording, merging, splitting for clarity)

The result of the Refinement Period will be delivered as an **updated Appendix 1 (Version 2)** to both parties and replaces the original appendix.

**Scope boundary:** New requirements that go beyond the existing catalog (i.e. functionality not covered by any of the 96 requirements) are treated as a **Change Request** and are subject to separate estimation and agreement.

---

## D. Delivery and Acceptance

### D.1 Phase 1 — Go-Live September 30, 2026

**Delivery criteria:**
- All Phase 1 requirements in the catalog are implemented and deployed to the production environment
- The application is accessible via web browser (desktop, tablet, mobile)
- SharePoint integration is operational for document storage
- User accounts are provisioned for the Client's staff

**Acceptance process:**
1. The Provider conducts a **guided demo walkthrough** with the Client, covering all Phase 1 requirements
2. The Client has **5 business days** from the demo to test the system and report defects
3. A defect is defined as: a Phase 1 requirement that does not function as described in the catalog
4. Critical defects (blocking daily operations) are resolved before go-live; non-critical defects are resolved within 10 business days after go-live
5. The Client marks each requirement in the catalog as **"Accepted"** or **"Not Accepted"** (with defect description)
6. Phase 1 is accepted when all Phase 1 requirements are marked "Accepted"

### D.2 Phase 2 — Go-Live January 4, 2027

Same acceptance process as Phase 1, applied to Phase 2 requirements.

---

## E. Exclusions

The following are **explicitly not part** of this agreement:

| Exclusion | Reason |
|-----------|--------|
| MedLink integration (billing, service recording) | Separate system; interface specification not yet defined |
| Shift planning and scheduling | Not in scope of the Cockpit |
| Reporting / BI dashboards beyond Phase 1 KPIs | Deferred to a potential Phase 3 |
| Data migration from existing Excel/Word files | To be scoped separately if needed |
| On-premise hosting | The application is cloud-hosted |
| Training materials and end-user training | To be scoped separately |

---

## F. Technical Assumptions

| Assumption | Detail |
|------------|--------|
| Hosting | Cloud-hosted (Provider-managed), HTTPS |
| Browser support | Latest versions of Chrome, Safari, Edge, Firefox |
| Device support | Desktop, iPad (landscape + portrait), smartphone |
| SharePoint | Client provides a SharePoint environment with API access credentials |
| Authentication | The Provider implements authentication; the Client provides the user list and role assignments |
| Data protection | Sensitive data (AHV, ZEMIS, IBAN, medical data) is encrypted at rest and in transit |

---

## G. Responsibilities

### Provider (Wondercode GmbH)
- Design, development and deployment of the Spitex Cockpit
- Bug fixes during acceptance periods
- Technical documentation for API and data model
- Production environment setup and maintenance

### Client (Spitex Kaufmann AG)
- Participation in the Refinement Period (field-level specification)
- Timely feedback during acceptance periods (5 business days)
- Provision of SharePoint environment and credentials
- Provision of user list with roles
- Designation of a primary contact person for project decisions
- Domain-specific validation (e.g. correctness of InterRAI items, KLV catalog, compliance rules)

---

## H. Change Requests

Any functionality not covered by the 96 requirements in Appendix 1 is a Change Request. Change Requests follow this process:

1. The Client describes the desired functionality in writing
2. The Provider estimates effort and timeline within 5 business days
3. Both parties agree on scope, timeline and cost before implementation begins
4. Approved Change Requests are added to Appendix 1 with a new ID and phase assignment

---

## I. Intellectual Property

- The **source code** of the Spitex Cockpit is owned by the Provider
- The Client receives a **perpetual, non-exclusive license** to use the software for their operations
- **Client data** (patient records, caregiver records, documents) remains the property of the Client at all times
- Upon termination, the Provider exports all Client data in a standard format (CSV/JSON) within 30 days

---

## J. Confidentiality

Both parties agree to treat all project-related information as confidential. In particular:

- Patient and caregiver data is subject to Swiss data protection law (DSG/nDSG)
- The Provider does not access Client data for purposes other than development, testing and support
- Test environments use anonymized or synthetic data wherever possible

---

## Signatures

| | Provider | Client |
|---|----------|--------|
| **Company** | Wondercode GmbH | Spitex Kaufmann AG |
| **Name** | _________________________ | _________________________ |
| **Role** | _________________________ | _________________________ |
| **Date** | _________________________ | _________________________ |
| **Signature** | _________________________ | _________________________ |

---

**Appendices:**
- **Appendix 1:** Requirements Catalog (requirements-catalog-client-en.csv) — 96 requirements, 23 sections, Phase 1 + Phase 2
- **Appendix 2:** Field-Level Specification (to be delivered at the end of the Refinement Period)
