# Test Specification — Residence-Permit Gate in Onboarding

Audience: engineering, for self-testing before handover to product QA.

## 1. Scope

Three pure units (no DB access, no `now()`, deterministic):

```ts
pruefeAuslaenderrecht(input) -> result            // lib/regeln/auslaenderrecht.ts
zeigeNachweisschritt(result.regime) -> boolean    // opens the extra tab
vertragFreigabe(result, proof) -> { gesperrt, grund }   // lib/regeln/freigabe.ts
```

Existing suites:

```
npx tsx src/lib/regeln/auslaenderrecht.test.ts
npx tsx src/lib/regeln/freigabe.test.ts
```

## 2. What the user actually selects

**The nationality group is never picked in the UI.** The form offers a
**nationality**; the group is derived from it
(`staatsangehoerigkeitsgruppe(nationalitaet)`). All scenarios below are therefore
phrased with a selectable nationality.

| Nationality (selectable) | Derived group |
|---|---|
| Schweiz | `schweiz` |
| Deutschland · Frankreich · Italien · Oesterreich · Portugal · Spanien | `eu_efta` |
| **Tuerkei** | `drittstaat` — the only third-state nationality in the list |
| **Andere** | `null` — no group, see scenario D3 |

Permit types offered: **B · C · L · G · F · N · S**.

Other inputs: `ausweisGueltigBis`, `arbeitsbeginnGeplant`, `asylgesuchDatum`
(format `DD.MM.YYYY` or `YYYY-MM-DD`, or empty), `bundesasylzentrumVerlassen`
(yes / no / unanswered), `arbeitsortKanton`.

Malformed dates behave like empty — no exception is thrown.

## 3. Evaluation order (mandatory)

```
1. Blocks   S2 -> S3 -> S4     first match wins, the rest is skipped
2. Matrix   R01 -> R02 -> permit-specific rules
3. Extras   Z1, Z2             add hints only, never change the regime
```

The most common porting mistake is reordering these. Permit N with
"has not left the federal asylum centre" must resolve to **S3**, not R13.

## 4. Decision table

### Stage 1 — Blocks: regime `unzulaessig`, no tab, permanently blocked

| # | Condition |
|---|---|
| S2 | permit expiry is **before** the planned start of work (both dates set) |
| S3 | permit `N` **and** federal asylum centre **not** left (explicit "no") |
| S4 | permit `N` **and** start of work is **before** asylum application + 3 months |

An **unanswered** centre question does not trigger S3.

### Stage 2 — Matrix

| # | Nationality | Permit | Reason for stay | Regime | Tab | Blocked |
|---|---|---|---|---|---|---|
| R01 | Schweiz | any | — | frei | no | no |
| R02 | any | **C** | — | frei | no | no |
| R03 | EU/EFTA | B | — | frei | no | no |
| R04 | EU/EFTA | L | — | frei | no | no |
| R05 | EU/EFTA | G | — | **bewilligung** | **yes** | **yes** |
| R06 | Tuerkei | B | family reunification | frei | no | no |
| R07 | Tuerkei | B | recognised asylum | **meldung** | **yes** | **yes** |
| R08 | Tuerkei | B | gainful employment | **bewilligung** | **yes** | **yes** |
| R09 | Tuerkei | L | — | **bewilligung** | **yes** | **yes** |
| R10 | Tuerkei | G | — | **bewilligung** | **yes** | **yes** |
| R11 | not Schweiz | **F** | — | **meldung** | **yes** | **yes** |
| R12 | not Schweiz | **S** | — | **meldung** | **yes** | **yes** |
| R13 | not Schweiz | **N** | — | **bewilligung** | **yes** | **yes** |
| Z3 | Tuerkei | B | other / not captured | nicht_bestimmbar | no | no |
| — | Andere | B / L / G | — | nicht_bestimmbar | no | no |

R01 and R02 are evaluated **before** the permit matrix.

### Stage 3 — Extras (hints only, regime unchanged)

| # | Condition | Hint key |
|---|---|---|
| Z1 | permit expires **less than 90 days** after the planned start of work | `ablauf_nah` |
| Z2 | working canton is not one of the six configured ones | `kanton_unbekannt` |

## 5. Release of the contract step

| Regime | Condition | Blocked |
|---|---|---|
| `unzulaessig` | always | **yes**, never resolvable |
| `meldung` | notification date empty | **yes** |
| `meldung` | notification date set | no |
| `bewilligung` | submission date empty | **yes** |
| `bewilligung` | submission date set | no |
| `frei` / `nicht_bestimmbar` | — | no |

"Set" means non-empty after trimming — **whitespace counts as empty**.
Only the **date** releases the step; the document upload is optional.

---

# 6. Test scenarios

Baseline for every scenario unless stated otherwise:
working canton `ZH`, planned start of work `01.06.2026`, all other fields empty.

## Group A — Blocking cases

### A1 — Permit expires before work starts
**Given** nationality Deutschland, permit `B`, permit valid until `01.05.2026`
**When** the check runs
**Then** regime `unzulaessig`, rule `S2`, **no tab**, contract step permanently blocked
**And** the reason reads "Der Ausweis läuft vor dem geplanten Arbeitsbeginn ab."
*Covers: a block beats an otherwise free rule (R03).*

### A2 — Still in the federal asylum centre
**Given** nationality Tuerkei, permit `N`, centre left = **no**
**Then** regime `unzulaessig`, rule `S3`, no tab, permanently blocked
*Covers: S3 beats R13.*

### A3 — Within the three-month waiting period
**Given** nationality Tuerkei, permit `N`, centre left = **yes**, asylum application `01.05.2026`
**Then** regime `unzulaessig`, rule `S4`

### A4 — Waiting period elapsed
**Given** as A3 but asylum application `01.01.2026`
**Then** regime `bewilligung`, rule `R13`, **tab opens**, blocked until a submission date is entered

### A5 — Centre question unanswered (regression) ⚠️
**Given** nationality Tuerkei, permit `N`, centre question **not answered**
**Then** regime `bewilligung`, rule `R13`
*Covers: "unanswered" must not behave like "no". This is the highest-value regression test in the suite.*

## Group B — Free: no tab, no block

| ID | Nationality | Permit | Reason | Expected |
|---|---|---|---|---|
| B1 | Schweiz | none selected | — | `frei`, R01 |
| B2 | **Tuerkei** | **C** | — | `frei`, **R02** — settlement permit beats the third-state matrix |
| B3 | Deutschland | B | — | `frei`, R03 |
| B4 | Italien | L | — | `frei`, R04 |
| B5 | Tuerkei | B | family reunification | `frei`, R06 — free, but a clarification note is shown |

For each: assert **no tab** and **not blocked**.

## Group C — Tab opens and the contract step is blocked

For each: with no proof entered, assert `zeigeNachweisschritt === true` **and**
`gesperrt === true`; then enter the releasing date and assert the block clears.

| ID | Nationality | Permit | Reason | Regime | Rule | Released by |
|---|---|---|---|---|---|---|
| C1 | Tuerkei | B | recognised asylum | meldung | R07 | notification date |
| C2 | Tuerkei | B | gainful employment | bewilligung | R08 | submission date |
| C3 | Tuerkei | L | — | bewilligung | R09 | submission date |
| C4 | Frankreich | G | — | bewilligung | R05 | submission date |
| C5 | Tuerkei | G | — | bewilligung | R10 | submission date |
| C6 | Portugal | F | — | meldung | R11 | notification date |
| C7 | Tuerkei | S | — | meldung | R12 | notification date |

## Group D — Not determinable

### D1 — Reason for stay missing
**Given** nationality Tuerkei, permit `B`, reason for stay **not captured**
**Then** regime `nicht_bestimmbar`, rule `Z3`, hint `aufenthaltsgrund_fehlt`
**And** **no tab**, **not blocked**
**And** a task "Ausländerrechtliches Verfahren ungeklärt" is created, worded
"Der Aufenthaltsgrund bei Ausweis B aus einem Drittstaat ist nicht erfasst."

### D2 — Reason "other"
**Given** as D1 but reason = "other"
**Then** identical result to D1

### D3 — Nationality "Andere"
**Given** nationality **Andere**, permit `B`
**Then** regime `nicht_bestimmbar`, rule number empty, hint `aufenthaltsgrund_fehlt`
**absent**
**And** the task text names the missing nationality group instead
*Covers: "Andere" carries no group, so the permit matrix cannot apply.*

## Group E — Release behaviour

Base: scenario **C2** (regime `bewilligung`).

| ID | Proof entered | Expected |
|---|---|---|
| E1 | nothing | blocked |
| E2 | submission date = two spaces | **blocked** — whitespace is empty |
| E3 | submission date = `15.05.2026` | released |
| E4 | **notification** date = `15.05.2026` | **still blocked** — `bewilligung` reads only the submission date |
| E5 | any date, but scenario A1 | **still blocked** — `unzulaessig` is never resolvable |

## Group F — Hints

| ID | Setup | Expected |
|---|---|---|
| F1 | B3 + permit valid until `01.08.2026` | free, hints contain `ablauf_nah` (61 days) |
| F2 | B3 + permit valid until `01.10.2026` | free, hints **do not** contain `ablauf_nah` (122 days) |
| F3 | B3 + working canton `TI` | hints contain `kanton_unbekannt` |
| F4 | B3 + working canton empty | hints contain `kanton_unbekannt` |

## 7. Invariants — assert across the whole suite

1. Tab shown **if and only if** regime is `meldung` or `bewilligung`; such a case is
   **always** blocked initially. **There is no tab without a block.**
2. `unzulaessig` **never** opens a tab.
3. A Stage-1 block always beats a Stage-2 matrix rule.
4. Stage 3 changes only the hint list — never the regime or the rule number.
5. Same input, same output, regardless of system time.

## 8. Deliberately not checked — do not file as bugs

- Whether the permit was actually **granted**. Only the fact that an application was
  **submitted** is recorded; the step text says so explicitly.
- Whether the actual start of work respects the rule. The result carries a field for
  it (`nach_meldung` / `nach_bewilligung`), but the gate does not evaluate it.
- Cantonal specifics outside the six configured cantons — these surface as
  `kanton_unbekannt`, not as an error.

## 9. Open finding for product

The permit list in `src/lib/stammdaten/aufenthaltsstatus.ts:28` still contains the
value **`keiner` ("Kein gültiger Ausweis")**, and it is part of the options offered
by `AUFENTHALTSSTATUS_OPTIONS`. Product states this value should not exist.

Consequence for testing: as long as the value is selectable, block **S1**
("no valid permit" -> `unzulaessig`, permanently blocked, no tab) is reachable and
untested by this specification. Decide first:

(a) remove the value from the list — then S1 becomes unreachable and the rule can be
retired, or
(b) keep it — then add a scenario A0 mirroring A1 with permit `keiner`.
