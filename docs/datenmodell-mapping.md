# Datenmodell-Mapping — Design-Repo ↔ produktives Schema

Übergabehilfe fürs Engineering-Team. Dieses Repo ist der **Design-Repo**;
massgebend ist das produktive Schema (`docs/Spit Full.dbml`). Die deutschen
Entitätsnamen (`Fall`, `Formular`, `Onboarding`) bleiben bewusst — angeglichen
sind **Wertelisten, Regeln und Lebenszyklen**.

Quelle im Design-Repo: `src/lib/interrai/store.ts` (Modell + Regeln),
`src/lib/stammdaten/sda-einschaetzung-situation.ts` (Route-Mapping).

---

## Entitäten

| Design-Repo | Produktiv | Abweichungen / Hinweise |
|---|---|---|
| `Fall` | `SpitexCareCase` | Rolle identisch (klinische Episode). Status **abgeleitet** (`fallStatus`), kein gespeichertes Feld. `openedAt`/`closedAt` als Zeitstempel; zusätzlich `erstelltAm` (Shell-Anlage) und `abgebrochenAm` (Abbruch-Marke — produktiv evtl. über `deletedAt`/Event). |
| `Formular` | `SpitexFormInstance` | Rolle identisch. Feldnamen deutsch (`typ`, `laufnummer`, `vorgaengerId`, `gesperrtAm/Von`). |
| `Onboarding` | `SpitexOnboarding` | 1:1 zum Fall. Produktionsdefekt `phase` („preparation", schreitet nie fort) **nicht nachgebaut**. |
| `Klient` / `Person` | `Patient` | Im Design-Repo `Person`; Zustand (`klientZustand`) abgeleitet aus `patientId`. |
| — | `SpitexServicePlan` | Das LPB ist **kein Formular**, sondern ein eigenes Objekt. In diesem Repo **entfernt, nicht ersetzt** (siehe unten). |

## Wertelisten

| Thema | Design-Repo | Produktiv | Status |
|---|---|---|---|
| Formulartyp | `FormularTyp = registration \| interrai_hc \| interrai_cmh \| housekeeping \| discharge` | `SpitexFormInstance.type` (gleiche Werte) | **angeglichen**. `'lpb'` entfällt (eigenes Objekt). |
| Fallstatus | `FallStatus = registering \| open \| discharged \| aborted` | `SpitexCareCase.status` (gleiche Werte) | **angeglichen**, abgeleitet. |
| Route | `FallRoute = somatic \| mental_health \| palliative \| paediatric \| isolated_therapeutic \| housekeeping \| declined \| null` | `SpitexCareCase.route` (gleiche Werte) | **angeglichen**. Ersetzt die frühere dreiwertige `triage`. |
| Anlass Reassessment | `reason = first \| periodic \| significant_change \| return_from_hospital \| null` | `SpitexFormInstance.reason` (gleiche Werte) | **angeglichen**. |
| Formularstatus | `FormularStatus = in_bearbeitung \| vollstaendig \| gesperrt` | `SpitexFormInstance.status = in_progress \| complete \| locked` | **ABWEICHUNG (offen):** Werte noch deutsch. Der Prompt dieses Laufs hat `FormularStatus` nicht im Umbau-Umfang; die Angleichung an `in_progress/complete/locked` ist ein Folgeschritt. |
| Laufnummer | `Formular.laufnummer` (int, je Fall+Typ ab 1) | `SpitexFormInstance.round` (int) | **ABWEICHUNG:** Feldname `laufnummer` statt `round` (deutscher Bezeichner bleibt). Semantik identisch. |
| Interne Fallnummer | Antwortfeld `BB5b` (registration) / `A5b` (interrai_hc) | i-Code `iA5d` (`SpitexFormAnswer.internalCode`) | Noch keine i-Code-Schlüsselung (Antwortmodell = Folgeschritt). Feld wird beim Sperren der Registrierung befüllt. |

## Regeln & Lebenszyklus (angeglichen)

- **Falleröffnung beim Sperren:** Anlegen der Registrierung → Fall `registering`, **ohne Fallnummer**. Sperren der Registrierung → Fallnummer vergeben, `route` und `openedAt` gesetzt (Nummer **vor** dem Sperrzustand geschrieben; der produktive Defekt `caseNumberAtLock = NULL` ist **nicht** nachgebaut). Sperren der Entlassung → `closedAt`. Ein interRAI-Formular zu sperren hat **keine** Wirkung auf den Fall.
- **Route steuert die Eröffnung:** `interrai_hc` nur bei `somatic`, `interrai_cmh` nur bei `mental_health`, `housekeeping` nur bei `housekeeping`. Bei `palliative`/`paediatric`/`isolated_therapeutic` ist ein nicht abgebildetes Instrument nötig; bei `declined` hat die Klientin abgelehnt — kein Abklärungsformular.
- **Nur ein offenes Abklärungsformular pro Fall** (produktiv partieller Unique-Index) — in `kannFormularEroeffnen` abgebildet.
- **Nur ein offener Fall pro Klient** (produktiv partieller Unique-Index) — in `eroeffneFall` abgebildet; der Fehler benennt die bestehende Fallnummer.
- **Route-Mapping BB16→Route** liegt an **einer** Stelle: `sdaRoute` in `sda-einschaetzung-situation.ts`. `sdaVerlangtInterrai` ist eine dünne Ableitung daraus (kein zweites Mapping).

### Bewusste Abweichung vom Seed-Wunsch (§10)

Der Prompt wünschte Fall B und Fall C für **denselben** Klienten. Das verletzt
**§7 (ein offener Fall pro Klient)**, da beide offen wären. §7 ist die produktive
Regel und gewinnt: Fall C erhält einen eigenen Klienten (Rosa Bianchi), Fall B
einen anderen (Anna Müller). Fall D (Systemgrenze, palliativ) hat einen eigenen
Klienten (Peter Ammann).

---

## Bewusst nicht gebaut

- **`SpitexServicePlan`** (Leistungsplanungsblatt) — eigenes Objekt mit
  Gültigkeitszeitraum, eigenem Status (`draft … completed`), Positionen und
  Mandatsbezug. Das frühere Formular `'lpb'` ist ersatzlos entfernt.
- **Antwortmodell** (`SpitexFormAnswer`) — i-Code-Schlüsselung (`internalCode`),
  `noAnswer`/X-Code, Herkunft (`source`), verschlüsselte Freitexte,
  `confirmedBy`. Keine Materialisierung beim Sperren.
- **Historisierung** berechneter CAPs und Skalen beim Sperren.
- **Mandanten- und Verschlüsselungsfelder** — `organizationId`, `officeId`,
  `nameHash`, `ahvHash`, verschlüsselte Spalten. Produktionsthemen.
- **Dokumentierte Produktionsdefekte** — weder `caseNumberAtLock = NULL` bei
  Registrierungen noch `SpitexOnboarding.phase`, das nie fortschreitet.
