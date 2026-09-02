# Rule set: Immigration-law check on employment

**Purpose:** Machine-readable specification. When a caring relative is entered, the system evaluates in the background whether a permit or a notification is required, and displays the result.

**Version:** 1 September 2026 · 1.4 · Cantons BS, BL, AG, SO, BE, ZH
**Draft, subject to legal review.** The rule set supports a decision; it does not make one.

> **The German version governs.** This English version is a translation for explanation. In case of divergence the German version `regelwerk.de.md` prevails. Keys, value lists, display strings and authority names are identical in both versions and remain in German.

> ⚠️ **One of the fourteen rules is not conclusively evidenced.** R08 carries confidence `zu_bestaetigen`; for `SO`, `BS` and `BL` competence in the notification procedure is `ungeklaert`. The rule set is implementable but not yet reliable. The confidence level belongs visibly in the user interface.


---

## 0. Terminology

**Keys stay German, explanations are English.** Both versions share the same identifiers, so code written from either one compiles against the same values.

| Do not translate | Reason |
|---|---|
| `frei`, `meldung`, `bewilligung`, `unzulaessig`, `nicht_bestimmbar` | regime keys, used in code and stored data |
| `belegt`, `zu_bestaetigen`, `ungeklaert` | confidence keys |
| `sofort`, `nach_meldung`, `nach_bewilligung`, `nie` | start-of-work keys |
| `eu_efta`, `drittstaat`, `schweiz` | nationality group keys |
| `erwerbstaetigkeit`, `familiennachzug`, `asyl_anerkannt`, `andere` | ground-of-residence keys |
| Display strings in section 6 | shown to Swiss users in German |
| `Amt für Wirtschaft (AWI)`, `KIGA Baselland`, `Migrationsdienst (MIDI)` and the like | proper names; an English rendering is useless on the telephone |
| `Tiers payant`, `Tiers garant` | established Swiss billing terms with no German or English equivalent in use |
| `Meldeverfahren`, `Bewilligung`, `Grenzgänger` | legal terms of art; the English words carry different meanings |

**Confidence values are German keys** — `belegt`, `zu_bestaetigen`, `ungeklaert`. Do not render them as `evidenced`, `to_confirm` or `unresolved`. Earlier drafts did so; that was an error.

---

## 1. Input fields

All values are keys, not display text. Display strings are kept separately.

### 1.1 `staatsangehoerigkeitsgruppe` — nationality group

| Key | Meaning |
|---|---|
| `eu_efta` | EU member state plus Iceland, Norway, Liechtenstein |
| `drittstaat` | all others, including the United Kingdom |
| `schweiz` | Swiss nationality |

### 1.2 `ausweisart` — permit type

| Key | Meaning |
|---|---|
| `C` | Niederlassungsbewilligung, settlement permit |
| `B` | Aufenthaltsbewilligung, residence permit |
| `L` | Kurzaufenthaltsbewilligung, short-term permit |
| `G` | Grenzgängerbewilligung, cross-border commuter permit |
| `F` | vorläufig aufgenommen, temporarily admitted |
| `N` | asylum seeker, procedure pending |
| `S` | Schutzbedürftige, persons in need of protection |
| `keiner` | no valid permit |

### 1.3 `aufenthaltsgrund` — ground of residence

Relevant to the decision only where `ausweisart = B`.

| Key | Meaning |
|---|---|
| `erwerbstaetigkeit` | permit granted for gainful employment |
| `familiennachzug` | permit granted through family reunification |
| `asyl_anerkannt` | recognised refugee, asylum granted |
| `unbekannt` | not recorded |

### 1.4 Further fields

| Field | Type | Required |
|---|---|---|
| `ausweisGueltigBis` | date | for all except `C` and `keiner` |
| `arbeitsortKanton` | canton code | always |
| `asylgesuchDatum` | date | only where `N` |
| `bundesasylzentrumVerlassen` | boolean | only where `N` |
| `arbeitsbeginnGeplant` | date | always |

---

## 2. Order of evaluation

Rules are evaluated in this order. **The first matching rule determines the result.**

### Stage 1 — Blocks

| No. | Condition | Result |
|---|---|---|
| S1 | `ausweisart = keiner` | `unzulaessig`, reason `kein_ausweis` |
| S2 | `ausweisGueltigBis` falls before `arbeitsbeginnGeplant` | `unzulaessig`, reason `ausweis_abgelaufen` |
| S3 | `ausweisart = N` and `bundesasylzentrumVerlassen = false` | `unzulaessig`, reason `bundesasylzentrum` |
| S4 | `ausweisart = N` and `arbeitsbeginnGeplant` falls before `asylgesuchDatum` plus 3 months | `unzulaessig`, reason `wartefrist_n` |

### Stage 2 — Regime assignment

Where no block applies, the matrix in section 3 governs.

### Stage 3 — Additional checks

Independent of the regime, in addition:

| No. | Condition | Result |
|---|---|---|
| Z1 | `ausweisGueltigBis` falls fewer than 90 days after `arbeitsbeginnGeplant` | notice `ablauf_nah` |
| Z2 | `arbeitsortKanton` not in the canton table | notice `kanton_unbekannt` |
| Z3 | `ausweisart = B` and `staatsangehoerigkeitsgruppe = drittstaat` and `aufenthaltsgrund = unbekannt` | notice `aufenthaltsgrund_fehlt`, regime not determinable |

---

## 3. Rule matrix

Row key: `staatsangehoerigkeitsgruppe` + `ausweisart` + `aufenthaltsgrund`.

| # | Nationality | Permit | Ground | Regime | Work may start | Fee | Clarification | Sicherheit |
|---|---|---|---|---|---|---|---|---|
| R01 | `schweiz` | any | any | `frei` | `sofort` | none | — | belegt |
| R02 | any | `C` | any | `frei` | `sofort` | none | — | belegt |
| R03 | `eu_efta` | `B` | any | `frei` | `sofort` | none | — | belegt |
| R04 | `eu_efta` | `L` | any | `frei` | `sofort` | none | — | belegt |
| R05 | `eu_efta` | `G` | any | `bewilligung` | `nach_bewilligung` | yes | — | belegt |
| R06 | `drittstaat` | `B` | `familiennachzug` | `frei` | `sofort` | none | — | belegt |
| R07 | `drittstaat` | `B` | `asyl_anerkannt` | `meldung` | `nach_meldung` | none | — | belegt |
| R08 | `drittstaat` | `B` | `erwerbstaetigkeit` | `bewilligung` | `nach_bewilligung` | yes | `stellenwechsel_pruefen` | zu_bestaetigen |
| R09 | `drittstaat` | `L` | any | `bewilligung` | `nach_bewilligung` | yes | — | belegt |
| R10 | `drittstaat` | `G` | any | `bewilligung` | `nach_bewilligung` | yes | — | belegt |
| R11 | any | `F` | any | `meldung` | `nach_meldung` | none | — | belegt |
| R12 | any | `S` | any | `meldung` | `nach_meldung` | none | — | belegt |
| R13 | any | `N` | any | `bewilligung` | `nach_bewilligung` | yes | `branchenbeschraenkung_pruefen` | belegt |
| R14 | any | `keiner` | any | `unzulaessig` | `nie` | — | — | belegt |

**Evaluation order:** R01, R02, then the remainder by specificity. `C` overrides every other rule, because the settlement permit applies irrespective of nationality and ground of residence.

**Not covered:** `drittstaat` with `B` and `aufenthaltsgrund = unbekannt`. This combination yields no regime but the notice `aufenthaltsgrund_fehlt`.

### 3.1 Notes on individual rules

**R05 — EU and EFTA cross-border commuters need an application.** Before employment starts, the employer files an application for a cross-border commuter permit with the migration authority competent for the place of work. There is an **entitlement to the permit** — the authority reviews but does not normally refuse. On a change of employer, the **new** employer files a fresh application; the previous permit lapses and a new permit G is issued. The procedure carries a fee.

**R06 — family reunification from a third state: no procedure.** Evidenced by the directive of the canton of Zurich, the information sheet of the canton of Lucerne and the statement of the canton of Solothurn: spouses and children of Swiss nationals and of holders of a settlement or residence permit may work anywhere in Switzerland and may take up that work without any additional permit procedure. The basis is Art. 46 AIG and Art. 27 VZAE.

Two boundaries: family members of holders of a **short-term permit** do not have this entitlement — there every start and change of employment requires a permit. They hold an L permit themselves and therefore fall under R09.

And the entitlement is **tied to the permit of the sponsoring person**: if that residence permit is not renewed, the entitlement lapses. The system cannot detect this; hence the notice `familiennachzug_gebunden`.

**R08 — why a permit is needed although the person is already employed.** A residence permit B granted to a third-state national for gainful employment is tied to the canton, the employer and often the activity. It authorises work **with that employer**, not work as such. A move to us therefore requires a fresh decision by the authority.

○ **Open:** Whether relief for a change of employer applies after a certain period of residence could not be evidenced. Hence `zu_bestaetigen`. In a concrete case this should be clarified before filing — the effort may be smaller than assumed.

**R11 and R12 — notification only, no permit.** Since 1 January 2019 the simplified notification procedure under Art. 85a AIG applies to temporarily admitted persons, temporarily admitted refugees and recognised refugees, in place of a permit. Persons with protection status S are entitled to work throughout Switzerland. **Permit F exists in two forms** — temporarily admitted person and temporarily admitted refugee. The same notification procedure applies to both.

**Short-term employment up to 90 days.** For EU and EFTA nationals the notification procedure applies instead of a permit for up to 90 days per calendar year. This rule is **not represented** in the matrix, because our employments are designed to be permanent. For a fixed-term engagement under 90 days it should be checked.

---

## 4. Result object

```
{
  regime: 'frei' | 'meldung' | 'bewilligung' | 'unzulaessig' | 'nicht_bestimmbar',
  arbeitsbeginn: 'sofort' | 'nach_meldung' | 'nach_bewilligung' | 'nie',
  kostenpflichtig: boolean,
  regelNummer: string,
  sicherheit: 'belegt' | 'zu_bestaetigen' | 'ungeklaert',
  klaerung: string | null,
  hinweise: string[],
  zustaendigeStelle: string | null,
  meldekanal: string | null
}
```

`zustaendigeStelle` and `meldekanal` are derived from section 5 using `arbeitsortKanton` and `regime`.

---

## 5. Canton table

What governs is the **canton of the place of work**, that is where the relative actually works — not the seat of the organisation and not the relative's place of residence.

| Canton | Regime `bewilligung`, third state | Regime `meldung` | Regime `bewilligung`, permit N | Sicherheit |
|---|---|---|---|---|
| `ZH` | Amt für Wirtschaft (AWI), then SEM, then Migrationsamt | Amt für Wirtschaft (AWI) | cantonal asylum authorities | belegt / zu_bestaetigen |
| `BE` | Migrationsdienst (MIDI) | Migrationsdienst (MIDI) | Migrationsdienst, with RAV confirmation | belegt / zu_bestaetigen |
| `AG` | Amt für Migration und Integration (MIKA) | Amt für Migration und Integration (MIKA) | Amt für Migration und Integration (MIKA) | belegt / zu_bestaetigen |
| `BS` | Amt für Wirtschaft und Arbeit (AWA) | Amt für Wirtschaft und Arbeit (AWA) | AWA and Migrationsamt | belegt / zu_bestaetigen |
| `BL` | KIGA Baselland, then SEM, then Migrationsamt | KIGA Baselland or Amt für Migration | Amt für Migration | belegt / zu_bestaetigen |
| `SO` | Migrationsamt, Departement des Innern | Migrationsamt | Migrationsamt | zu_bestaetigen |

**Notification channel:** For the regime `meldung`, `EasyGov` is the preferred channel in every canton. The federal online desk selects the competent authority from the place of work. The cantonal form is the alternative.

**`ungeklaert`:** Competence for the notification procedure in `SO`, `BS` and `BL` is not conclusively evidenced.

---

## 6. Display strings

Keys are stable, the German text is what the user sees.

### 6.1 Regime

| Key | Text |
|---|---|
| `frei` | Keine Bewilligung und keine Meldung erforderlich. |
| `meldung` | Der Stellenantritt ist vor Arbeitsbeginn zu melden. Unmittelbar nach der Meldung darf gearbeitet werden. |
| `bewilligung` | Für den Stellenantritt ist eine Bewilligung erforderlich. Die Arbeitsaufnahme darf erst nach Erteilung erfolgen. |
| `unzulaessig` | Eine Anstellung ist nicht zulässig. |
| `nicht_bestimmbar` | Das Verfahren lässt sich mit den erfassten Angaben nicht bestimmen. |

### 6.2 Block reasons

| Key | Text |
|---|---|
| `kein_ausweis` | Ohne gültigen Ausweis ist eine Anstellung nicht zulässig. |
| `ausweis_abgelaufen` | Der Ausweis läuft vor dem geplanten Arbeitsbeginn ab. |
| `bundesasylzentrum` | Eine Bewilligung ist erst möglich, wenn die Person das Bundesasylzentrum verlassen hat. |
| `wartefrist_n` | In den ersten drei Monaten nach Einreichung des Asylgesuchs besteht ein Arbeitsverbot. |

### 6.3 Notices

| Key | Text |
|---|---|
| `ablauf_nah` | Der Ausweis läuft in weniger als 90 Tagen ab. Die Verlängerung frühzeitig anstossen. |
| `kanton_unbekannt` | Die zuständige Stelle ergibt sich aus dem Arbeitsort, sobald die Klientin erfasst ist. |
| `familiennachzug_gebunden` | Das Recht zur Erwerbstätigkeit ist an die Bewilligung der Person gebunden, die den Familiennachzug geltend gemacht hat. Wird deren Bewilligung nicht verlängert, entfällt es. |
| `aufenthaltsgrund_fehlt` | Bei einem Ausweis B aus einem Drittstaat entscheidet der Aufenthaltsgrund über das Verfahren. Bitte erfassen. |

### 6.4 Clarifications

| Key | Text |
|---|---|
| `meldung_kantonal_pruefen` | Ob eine Meldung erforderlich ist, ist kantonal zu prüfen. |
| `stellenwechsel_pruefen` | Die Bewilligung ist an den bisherigen Arbeitgeber gebunden. Ob für den Stellenwechsel ein vereinfachtes Verfahren gilt, ist vor der Gesuchseinreichung zu klären. |
| `branchenbeschraenkung_pruefen` | Der Kanton kann die Bewilligung auf einzelne Branchen beschränken. |

### 6.5 Standing notice at onboarding start

> Als Arbeitgeber gilt bereits, wer eine Person unter seinen Weisungen beschäftigt — unabhängig davon, ob ein schriftlicher Vertrag besteht und ob die Arbeit unentgeltlich oder gegen Kost und Logis erfolgt. Die ausländerrechtliche Prüfung gehört an den Anfang, nicht ans Ende des Onboardings.

---

## 7. What the system does not decide

These points are displayed, never answered automatically:

1. Whether a permit will in fact be granted in the individual case
2. Whether a notification is required in the canton concerned, where this is marked `zu_bestaetigen`
3. Whether a sector restriction applies
4. Whether special rules apply to a single EU state or to the United Kingdom
5. Whether the person meets the conditions for a third-state permit

**Where `sicherheit = zu_bestaetigen` or `ungeklaert`, the notice appears together with a prompt to contact the competent authority.** The result warns; it does not block.

**Where `regime = unzulaessig`, the system blocks contract signature.** That is the only hard block.

---

## 7a. Release of the contract step

The regime alone does not block. It determines **what must be documented** before the contract step is released.

| Regime | Released by |
|---|---|
| `frei` | nothing. Released immediately |
| `meldung` | documented notification: date of notification, optionally the confirmation as a file |
| `bewilligung` | documented filing: date of filing, optionally the confirmation as a file |
| `unzulaessig` | no release. Permanently blocked |
| `nicht_bestimmbar` | released, with a task for clarification |

**On sequence:** In law the notification must precede the **start of work**, not the signing of the contract. Because contract and start of work coincide here, the check is pulled forward to the contract step. That is a deliberate tightening, not a legal requirement.

**On the gap in the permit case:** What is documented is the filing, not the grant. The system does not know the date of grant and therefore cannot ensure that work starts only afterwards. That rule is displayed, not enforced. To enforce it, a field for the date of grant would be needed.

**On `nicht_bestimmbar`:** A block would be wrong here. The system has no substantive reason, only a missing entry. A block without a reason gets circumvented; a task stays visible.

---

## 8. Deadlines

Recurring deadlines follow from the result:

| Deadline | Trigger | Lead time | Produces |
|---|---|---|---|
| Permit expiry | `ausweisGueltigBis` | 90 days | task |
| Waiting period N | `asylgesuchDatum` plus 3 months | — | block until elapsed |
| Notification of termination | end of contract, regime `meldung` | immediate | task |

---

## 9. Test cases

| No. | Input | Expected regime | Rule |
|---|---|---|---|
| T01 | `eu_efta`, `B`, valid | `frei`, `sofort` | R03 |
| T02 | `drittstaat`, `C`, valid | `frei`, `sofort` | R02 |
| T03 | `drittstaat`, `B`, `familiennachzug` | `frei` with clarification | R06 |
| T04 | `drittstaat`, `B`, `asyl_anerkannt` | `meldung`, `nach_meldung` | R07 |
| T05 | `drittstaat`, `B`, `erwerbstaetigkeit` | `bewilligung`, `nach_bewilligung` | R08 |
| T06 | `drittstaat`, `B`, `unbekannt` | `nicht_bestimmbar` | Z3 |
| T07 | any, `F` | `meldung`, `nach_meldung` | R11 |
| T08 | any, `S` | `meldung`, `nach_meldung` | R12 |
| T09 | any, `N`, centre left, application 5 months ago | `bewilligung` | R13 |
| T10 | any, `N`, application 1 month ago | `unzulaessig`, `wartefrist_n` | S4 |
| T11 | any, `N`, centre not left | `unzulaessig`, `bundesasylzentrum` | S3 |
| T12 | any, `keiner` | `unzulaessig`, `kein_ausweis` | S1 |
| T13 | `eu_efta`, `B`, permit expires in 30 days | `frei` plus notice `ablauf_nah` | R03, Z1 |
| T15 | `eu_efta`, `G` | `bewilligung`, `nach_bewilligung` | R05 |
| T16 | `drittstaat`, `G` | `bewilligung`, `nach_bewilligung` | R10 |
| T14 | `eu_efta`, `B`, permit expired | `unzulaessig`, `ausweis_abgelaufen` | S2 |

---

## 10. Sources and status

Sources: websites of the migration and labour-market authorities of the cantons of Zurich, Bern, Aargau, Basel-Stadt, Basel-Landschaft and Solothurn, and of the State Secretariat for Migration, retrieved on 1 September 2026.

**This rule set does not replace legal advice.** Procedures and competences change. Intended review: annually, or on becoming aware of a change in procedure.

Open points are listed in the accompanying documentation.