# Branch Review — `feature/permit-validation` vs `main`

**Purpose:** A complete, engineering-facing summary of everything this branch changes relative to `main`, for team review.

| | |
|---|---|
| **Branch** | `feature/permit-validation` (identical tip on `feature/onboarding-improvements`) |
| **Base / merge-base** | `main` @ `7765343` — the branch is a **linear descendant** of main (fast-forwardable; 0 commits on main are missing here) |
| **Tip** | `5050324` |
| **Size** | **27 commits · 65 files · +6328 / −1462** |
| **Build status** | `tsc --noEmit` clean · `vite build` green · all unit tests green (last verified at tip) |
| **Not committed** | Only local tooling files (`.claude/settings*.json`) — no product code |

> This branch is a prototype (React SPA + Vite, in-memory stores, seed data — no DB, no backend). "Store" below means an in-memory `useSyncExternalStore` module, not a database.

---

## 1. What this branch does, in one paragraph

It replaces several ad-hoc, string-based or manually-maintained parts of the onboarding flow with **structured data models, single-source derivation logic, and shared UI components**. The five big themes are: (1) a **residence-law rule engine** that decides permit/notification requirements; (2) a **structured insurance model** replacing five flat fields on the patient; (3) a **relationship/contact ("Bezugsteam") model** replacing eleven flat contact fields; (4) a **structured address** with a single shared capture component and a search-resolution seam; (5) **withholding-tax (Quellensteuer)** made traceable with a structured deviation. Plus children's-allowance derivation, case-history fixes, and a uniform phone-field split. Every derivation ("which permit?", "which allowance?", "which political municipality?") is implemented as a **pure function in one place** with unit tests, and the read sites go through a single accessor rather than each caller re-deciding.

---

## 2. Themes

### 2.1 Residence-law rule engine (Ausländerrecht)
*Commits: `170f575`, `eacf53d`, `570a3ab`, `b599c1e`, `5164cc6`, `2acae3d`, `5050324` · docs `Regelwerk_Auslaenderrecht_DE.md`, `Regelwerk_Auslaenderrecht_EN.md`*

The largest theme. Before: hard-coded, partly false hints (a promised renewal Pendenz nobody created; a "Meldepflicht" banner for Ausweis B; SEM canton hard-wired to "Zürich"; a special-permit step that blocked contract signing for the wrong cases).

**Now:**
- **`lib/regeln/auslaenderrecht.ts` — `pruefeAuslaenderrecht(eingabe)`**: a pure function (no store, no side effects, no `new Date()`) implementing the Regelwerk (R01–R14, sperren S1–S4, zusatz Z1–Z3, six cantons). Order is fixed in one place: **sperren → matrix → zusatz**. The result object carries exactly the spec's section-4 fields (regime, responsible office, clarifications, notes, confidence). All display strings live in one Textzuordnung; the canton table is a separate module (`lib/regeln/kantone-auslaenderrecht.ts`).
- **Regimes:** `frei` / `meldung` / `bewilligung` / `unzulaessig` / `nicht_bestimmbar`.
- **`lib/regeln/freigabe.ts` — gate logic (Regelwerk 7a)**, also one place: contract step is released **per regime** (frei immediately; meldung once a Meldedatum exists; bewilligung once an Einreichungsdatum exists; unzulaessig stays locked; nicht_bestimmbar is free but raises a workflow task at conversion). Also owns **per-field visibility** of the residence block (each field has its own condition — e.g. Germany + B now shows only the optional Ablaufdatum, not three mandatory fields) and the **single merged warning** (`aufenthaltWarnung`).
- **New inputs captured (not evaluated by the UI, only fed to the engine):** `staatsangehoerigkeitsgruppe` (ternary schweiz/eu_efta/drittstaat), `aufenthaltsgrund` (erwerbstaetigkeit/familiennachzug/asyl_anerkannt/andere), Ausweis `keiner`, `asylgesuchDatum` + `bundesasylzentrumVerlassen` (Ausweis N), `meldungDatum` + `meldungBestaetigung`.
- **Behavioural replacements:** SEM button shows only for regime `meldung`; the special-permit step is a **Nachweisschritt** for meldung+bewilligung and documents rather than blocks; contract lock hangs solely on regime `unzulaessig`; the work-canton is reused from `patientData.kanton` and (when absent) a banner canton picker feeds both engine and SEM form.
- **`Regelwerk` docs** (DE governs, EN is a translation): at `5050324` bumped to **v1.4** — **R06** (third-state · B · family reunification) reclassified `zu_bestaetigen → belegt` (Art. 46 AIG / Art. 27 VZAE), so the "unverified rules" count drops from six to one (only **R08** remains `zu_bestaetigen`).

**Open items:** R08 confidence `zu_bestaetigen`; notification-procedure competence for `SO`/`BS`/`BL` still `ungeklaert`. **The DE version was not re-synced to 1.4 in this branch — only the EN file was edited; verify DE/EN parity.**

### 2.2 Insurance model (Versicherungen)
*Commits: `95ad941`, `d1c44db`, `27400f0`*

Before: five flat insurance fields on the patient. Now: a proper model in **`lib/versicherung/store.ts`** — `Versicherer` (KRANKENKASSEN + gln/art, UVG/IVG/MVG cost carriers) and `Versicherungsverhaeltnis` (`istAktiv`/`aktiveVersicherung`, Kassenwechsel handling, `abrechnungsart` = tiers_payant | tiers_garant | null, `bemerkung`). The patient loses its five insurance fields; the pipeline, mandate (`versichererId`), WZW and CHA7a/b/c read the **active** insurer. A shared **`VersicherungenAbschnitt`** renders in both onboarding and Patient360. `gln` is split into `glnVersicherung`/`glnEmpfaenger`; `versicherungsmodell` dropped.
`abrechnungsart` defaults to `null` (a billing agreement, not an assumption); a single mandate may deviate. §6 gap-hint strips were removed (they described gaps, not consequences). **Open:** MVG `verfuegungsdatum` deliberately left unset with a documented reason ("MVG trägt kein Datum") — reported, not decided.

### 2.3 Relationships / care team (Bezugsteam)
*Commits: `95ad941`, `c49c015`, `95fdcee`, `2aa7f9c`, `310f398`, `41528ea`, `e3d822b`, `83036a7`*

Before: eleven flat contact fields on the patient (hausarztEmail, spezialAerzte, sozialamtKontakt, …). Now: everything runs over the existing **Beziehung/Kontakt** structure via a shared **`BezugsteamAbschnitt`** (onboarding + Patient360).

- **Grouping by category, one source:** `kategorieFuerRolle` (in `lib/beziehungen/beziehungen.ts`) derives the person category; `rolleSeite` is display-only now. `personentypFuerRolle` fixes Person vs Organisation per role (single source alongside `kategorieFuerRolle`).
- **Roles:** added `therapie`, `apotheke`, `spital` (Fachpersonal). `apotheke`/`spital` use the Organisation feldsatz (no Anrede/Vorname) and carry a GLN.
- **Kontakt gains** (all optional/nullable — no forced migration of KontaktePage): `anrede`, academic `titel`, `fachgebiet`, `gln`, `organisation`, `mobil`, and a **four-field address** (strasse/plz/ort/land).
- **Beistandschaft** `{administrativ, gesundheit, vorsorgeauftrag}` (three simultaneous merkmale) replaces the single-valued `vertretungsart` (mapping `beistandschaftAusVertretungsart`, **PROVISIONAL pending Person B**).
- **Dialog / KontaktWahl:** one search field over Kontakte (and, for Bezugsperson, Angehörige); category-first flow; labels/placeholders from one feldsatz mapping (no data-model terms in the UI); phone/mobil formatting on blur (**`lib/telefon.ts`**, unit-tested — Swiss +41 form, foreign numbers pass through, invalid shows a non-blocking hint); GLN 13-digit format check (non-blocking); `fachgebiet` free text with datalist suggestions.
- **Hausarzt uniqueness:** `sichereEindeutigenHausarzt` ends any other open Hausarzt (like Kassenwechsel); only Hausarzt is unique, multiple Spezialärzte/Therapien/Apotheken/Spitäler stay allowed. Relations can be removed (`beziehungEntfernen`), except the pflegende Angehörige (managed in the Angehörigen tab).
- **`83036a7`** restored the plain **yes/no** "Sozialamt involviert?" and "Gesetzliche Vertretung besteht?" toggles (the contact details moved to Bezugsteam, but the indicators should have stayed).

**ArztAnfrage** now reads the hausarzt beziehung; `konvertierung` no longer derives beziehungen from fields; dead `BeziehungFormular`/`BeziehungsZeile` removed from Patient360.

### 2.4 Address & contactability
*Commits: `fa64370`, `0d123d8`, `a140d12`, `b0cec11`, `b185632`, `ac9f259`*

- **Structured address on the patient** (`fa64370`): `strasse/plz/ort/gemeinde/bfsNummer/land` (+ `kanton`) replace the composite `adresse` string — the display string is **built** (`patientAdresse`/`adresseAnzeige`), not stored. Differing **Pflegeort** (`pflegeortAbweichend` + fields); `pflegeAdresse(patientId)` returns Pflegeort when set else Wohnsitz — no caller decides. Kanton becomes a **select over the 26 cantons** (`lib/stammdaten/kantone.ts`) so the string matches `pflegetarife.ts`.
- **Political municipality** (`0d123d8`, later simplified): originally a `gemeindeAbweichend` toggle; **`ac9f259` removed the toggle** — `gemeinde` now always holds the name (migration: not-abweichend → `gemeinde = ort`). `patientGemeinde(p) = p.gemeinde` is the single read site.
- **One `AdressBlock` everywhere** (`a140d12`): renamed from `AdressFelder`, used by every real form; each form is split into "Adresse" (AdressBlock) + "Erreichbarkeit" (E-Mail/Telefon/Mobil). Ordering aligned Personalien → Erreichbarkeit → Adresse (`b0cec11`).
- **Search-resolution seam** (`ac9f259`): **`lib/adresse/adresssuche.ts`** — `sucheAdresse → []` (no backend yet, never derives gemeinde from PLZ), `kantonNameZuCode`, `trefferAnwenden`, `braucheGemeindeHinweis`. `AdressBlock` gets an always-visible search field and **three depth variants via one param**: `anschrift` (Strasse/PLZ/Ort), `mitKanton` (+ Kanton/Land, Angehörige), `voll` (+ Politische Gemeinde/BFS/Kanton/Land, Patient).
- **Phone split** (`b185632`): single Telefon → **Telefon (Festnetz) + Mobil** across both data models, all Erreichbarkeit surfaces, store pipelines and seeds. Mobil optional; Telefon stays required.

**Open items:** Kanton is a **text field** in `AdressBlock`; `tarifgrundlage` compares canton codes with `===` **without normalisation**, so a free-typed canton would not match a tariff — the search fills the code to stay compatible, but normalising the tariff lookup is flagged as a **separate lauf with regression comparison**. Also: Wohnsitz vs Pflegeort for `iA10` noted as open.

### 2.5 Withholding tax (Quellensteuer)
*Commit: `4f51ec4`*

The QSt tariff code stays **derived** (logic unchanged) but becomes **traceable**, and the deviation becomes **structured**:
- `leiteTarifcodeAb` additionally returns `herleitung` (one row per code character: sign, meaning, source field + tab, jump anchor). The Steuer tab shows the code large with a table; each "Ändern" link jumps to the source tab.
- The free-text tariff field is **removed**; deviation is now three fields (Tarif · Kinder · Kirchensteuer) composing the code. The tariff-letter value list lives in **one place** (`TARIF_BUCHSTABEN`), read by both derivation and deviation.
- **Grenzgänger codes L, M, N, P, Q** (↔ A, B, C, H, G) added — **only in the deviation picker, not the derivation** (Grenzgänger status is not captured).
- The **Steuerpflicht hint** is derived from existing data (`steuerpflichtHinweis`, one place: own CH/Ausweis-C → not liable; married to CH/Ausweis-C partner → possibly not liable, clarify before first payroll; else liable with caveat). **The toggle stays manual** — the derivation sets only the text, never the toggle.
- Grammar fix "1 Kind"; canton hint under the derivation.

**Open items:** the marriage exception is **flagged to-be-confirmed** (a wrong withholding is a clawback case, so no automatic toggle). The **child-count semantics** for the tariff digit (minor + dependent children vs the raw `anzahlKinder`) is an open question in the mapping doc.

### 2.6 Children's allowances (Zulagenart)
*Commits: `ab3922d`, `80dbb62`, `09d4cd5`*

Per-child `zulagenart` (K/W) was manually stored; now derived in **`lib/stammdaten/zulagenart.ts`** (kinderzulage / ausbildungszulage / keine) from birthdate, education status and a reference date, with the age limits as **provisional constants in one place**. The model carries `inAusbildung` (boolean|null) and `ausbildungBis` (string|null); the stored `zulagenart`/`ausbildungsbeginn`/`ausbildungsstatus`/override fields are gone. Education confirmations moved into the **Dokumente tab** as a required per-child slot (`80dbb62`); the noisy "keine Kinder" completeness hint was removed (`09d4cd5`).

### 2.7 Case history / assessment (Fallverlauf)
*Commit: `a0bc744`*

`AssessmentStatusView` gains a required `kontext` ('onboarding' | 'patient'): the discharge placeholder no longer appears in onboarding (the case ends at contract signing), but an existing discharge form is still shown (a closed case isn't rendered incomplete). While `Fall.route` is null the assessment row is titled "Bedarfsabklärung" with the condition text, instead of pre-empting the instrument from `getTypLabel`. No change to route logic or the data model.

---

## 3. Consolidated data-model changes

**Patient** (`patientData.ts`)
- **Removed:** composite `adresse` string; five insurance fields; `hausarztEmail`/`spezialAerzte`/`sozialamtKontakt`; `versicherungsmodell`; `gemeindeAbweichend` (`ac9f259`); direct editable `gemeinde` field on the detail surfaces.
- **Added:** structured address (`strasse/plz/ort/gemeinde/bfsNummer/land`), `pflegeortAbweichend` + Pflegeort fields, `mobil`, `sozialamtInvolviert` + `gesetzlicheVertretung` toggles.
- Insurers, care-team and hausarzt now live in the insurance/relationship stores, not on the patient.

**Angehöriger** (`angehoerigeData.ts` / `AngehoerigerErhebung`)
- **Added:** `aufenthaltsgrund`; `mobil`; `asylgesuchDatum`/`bundesasylzentrumVerlassen`/`meldungDatum`/`meldungBestaetigung`; per-child `inAusbildung`/`ausbildungBis`; optional `kanton`/`land` (`ac9f259`, seeds untouched).
- **Removed (per child):** `zulagenart`, `ausbildungsbeginn`, `ausbildungsstatus`, `typQuelle`, `overrideBegruendung`.

**Nationality** (`staatsangehoerigkeit.ts`): gains ternary `gruppe` (schweiz/eu_efta/drittstaat/null) alongside the binary `sdaCode`.

**New stores / models:** `lib/versicherung/store.ts` (Versicherer, Versicherungsverhaeltnis); extended `lib/beziehungen/*` and `lib/kontakte/kontakte.ts` (contact fields, Beistandschaft, new roles).

---

## 4. New shared modules & one-place accessors

| Module | Responsibility |
|---|---|
| `lib/regeln/auslaenderrecht.ts` | `pruefeAuslaenderrecht` — pure permit/notification decision |
| `lib/regeln/freigabe.ts` | contract-step gate, per-field visibility, single warning |
| `lib/regeln/kantone-auslaenderrecht.ts` | cantonal competence table |
| `lib/adresse/adresssuche.ts` | address search-resolution seam (backend pending) |
| `lib/versicherung/store.ts` | insurers + insurance relationships |
| `lib/stammdaten/zulagenart.ts` | per-child allowance derivation (provisional age limits) |
| `lib/stammdaten/kantone.ts` | the 26 cantons (code ↔ name) |
| `lib/stammdaten/aufenthaltsgrund.ts` | residence-reason value list |
| `lib/telefon.ts` | phone formatting/validation |
| `lib/stammdaten/quellensteuer-tarif.ts` | tariff derivation + `TARIF_BUCHSTABEN` + `steuerpflichtHinweis` |
| `components/ui/AdressBlock.tsx` | the single address capture (3 variants) |
| `components/beziehungen/BezugsteamAbschnitt.tsx` | shared care-team section |
| `components/versicherung/VersicherungenAbschnitt.tsx` | shared insurance section |

**Design pattern used throughout:** every derivation lives in one pure function; every read goes through one accessor (`pflegeAdresse`, `patientGemeinde`, `aktiveVersicherung`, `kategorieFuerRolle`, `personentypFuerRolle`, `steuerpflichtHinweis`) rather than each caller re-deciding.

---

## 5. Test coverage (all green)

Unit tests run with `npx tsx <file>.test.ts` (no test runner). Added/extended:

- `lib/regeln/auslaenderrecht.test.ts` (20 cases: 16 Regelwerk + T17–T20)
- `lib/regeln/freigabe.test.ts`
- `lib/adresse/adresssuche.test.ts`
- `lib/versicherung/store.test.ts`
- `lib/beziehungen/beziehungen.test.ts`, `lib/beziehungen/store.test.ts`
- `lib/patienten/store.test.ts` (pflegeAdresse, gemeinde migration)
- `lib/stammdaten/quellensteuer-tarif.test.ts` (6 derivation combos, grammar, 3 liability conditions)
- `lib/stammdaten/zulagenart.test.ts`, `lib/stammdaten/staatsangehoerigkeit.test.ts`
- `lib/telefon.test.ts`
- `lib/interrai/fallverlauf.test.ts` (extended: neutral title, BB16→instrument, discharge visibility)

`tsc --noEmit` clean · `vite build` green.

---

## 6. Open questions for the team ("to be confirmed")

1. **Tariff canton normalisation** — `tarifgrundlage` compares codes without normalisation; the AdressBlock canton is now free text (search fills the code). Normalise the lookup, or return to a select? (separate lauf with regression comparison).
2. **QSt marriage exception** — the "married to a Swiss/settled person → ordinary assessment" exception is derivable from captured partner data but deliberately **not** automated (clawback risk). Confirm the rule, then decide whether to automate the toggle.
3. **QSt child count** — which children count for the tariff digit (minor + dependent) vs the raw `anzahlKinder`.
4. **Beistandschaft mapping** (`beistandschaftAusVertretungsart`) is **PROVISIONAL pending Person B**.
5. **Regelwerk confidences** — R08 `zu_bestaetigen`; SO/BS/BL notification competence `ungeklaert`. And **DE/EN parity**: only the EN Regelwerk was bumped to 1.4 in this branch.
6. **Zulagenart age limits** are provisional constants (one place) awaiting confirmation.
7. **MVG `verfuegungsdatum`** left unset with a documented reason.
8. **iA10 Wohnsitz vs Pflegeort** — which address materialises.

---

## 7. Documentation touched

- `docs/auslaenderrecht/Regelwerk_Auslaenderrecht_DE.md` (new, 310 lines) — the governing rule spec.
- `docs/auslaenderrecht/Regelwerk_Auslaenderrecht_EN.md` (new/updated, 319 lines) — translation, v1.4.
- `docs/datenmodell-mapping.md` (+295) — field-level data-model mapping.
- `docs/standardkatalog-angehoerige.md` (+202) — per-lauf mapping catalogue (address, quellensteuer, etc.).

---

## Appendix A — Commits (oldest → newest)

| Hash | Subject |
|---|---|
| `95ad941` | onboarding: insurances and care-team as lists on their own structures |
| `c49c015` | bezugsteam: group and add persons by category, not by rolleSeite |
| `95fdcee` | bezugsteam: add contacts in the dialog, contact fields, multi-valued Beistandschaft |
| `2aa7f9c` | bezugsteam-dialog: fix person-search labels and placeholders |
| `310f398` | kontaktwahl: put Vorname and Nachname on one row |
| `41528ea` | bezugsteam: drop Benutzer group, hints and the Kontaktdaten block; allow removing relations |
| `d1c44db` | versicherung: add Abrechnungsart, surface Bemerkung |
| `27400f0` | versicherung: remove the gap-hint strips from the list |
| `a0bc744` | fallverlauf: discharge only in the patient view, neutral title while route is open |
| `83036a7` | soziales-tab: restore the Sozialamt and gesetzliche Vertretung yes/no toggles |
| `e3d822b` | bezugsteam: add Spital role, organisations in Fachpersonal, unique Hausarzt |
| `fa64370` | patient-adresse: structure the address, add politische Gemeinde, allow a differing Pflegeort |
| `0d123d8` | patient-gemeinde: toggle for a differing politische Gemeinde, justify BFS-Nummer |
| `a140d12` | adresse: one AdressBlock everywhere, split Adresse from Erreichbarkeit |
| `b0cec11` | onboarding: Erreichbarkeit above Adresse in both patient and angehörige forms |
| `b185632` | onboarding: add uniform Mobil phone field across Patient and Angehoeriger |
| `ab3922d` | angehoerige: derive Zulagenart per child from age and education status |
| `80dbb62` | angehoerige: move Ausbildungsbestätigung upload into the Dokumente tab |
| `170f575` | onboarding: remove four false claims in the residence-permit flow |
| `eacf53d` | onboarding: capture staatsangehoerigkeit group and aufenthaltsgrund |
| `570a3ab` | auslaenderrecht: rule engine replaces the ad-hoc residence-law behaviour |
| `b599c1e` | auslaenderrecht: per-regime contract-step gate and four corrections |
| `5164cc6` | auslaenderrecht: per-field visibility of the residence block, one warning |
| `2acae3d` | onboarding: keep canton picker editable, rename bewilligung proof step |
| `ac9f259` | adressblock: search-resolved address with variants, drop gemeindeAbweichend |
| `4f51ec4` | quellensteuer: derivation visible, structured deviation, three fixes |
| `09d4cd5` | angehoerige: drop the "keine Kinder" completeness hint in the Kinder tab |
| `5050324` | regelwerk-en: bump to 1.4, R06 family reunification now evidenced |

## Appendix B — Files changed (65)

Reproduce locally with:

```
git diff --stat main..feature/permit-validation
```

Largest deltas: `Patient360Page.tsx` (−, big simplification), the two `Regelwerk` docs (new), `datenmodell-mapping.md`, `BezugsteamAbschnitt.tsx` (new, 502), `VersicherungenAbschnitt.tsx` (new, 403), `MigratedAngehoerigerForms.tsx`, `KontaktWahl.tsx`, `patientData.ts`, `auslaenderrecht.ts` (new, 273), `versicherung/store.ts` (new, 252).
