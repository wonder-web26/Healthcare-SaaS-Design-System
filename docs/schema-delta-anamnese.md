# Schema-Delta — Anamnese (Situation und Vorgeschichte)

Was der reduzierte Anamnese-Reiter an Feldern braucht, die `docs/Spit Full.dbml` heute
nicht vorsieht. **Die dbml-Datei wurde nicht geändert** — dieses Dokument ist der Antrag,
nicht die Umsetzung.

Stand: Lauf «Anamnese-Reduktion», Branch `feature/anamnese-reduktion`.

## Ausgangslage

Der Reiter besteht neu aus zwei erzählenden Blöcken:

- **Situation** — vier Freitextbereiche: Häusliche Situation, Soziale Situation,
  Ressourcen, Sonstiges.
- **Vorgeschichte** — zwei Zeilenlisten (chronische Erkrankungen mit Bezeichnung +
  Zeitangabe, Operationen/Eingriffe mit Bezeichnung + Jahr) und ein Freitext
  «Krankheitsverlauf».

Beide Blöcke tragen einen **Bearbeitungsstand** (Autor + Datum des letzten
Schreibzugriffs). Ist er älter als zwölf Monate, zeigt die Oberfläche einen
Überprüfungshinweis — rein informativ, keine Sperre.

Die dbml kennt dafür keine Struktur. `Diagnosis`/`NandaDiagnosisCatalog` bilden
Pflegediagnosen mit Katalogbindung ab — die Vorgeschichte-Listen sind **bewusst keine
Diagnose-Objekte** (Freitext ohne ICD/Codes, Nicht-Ziel des Laufs) und dürfen nicht in
diese Tabellen gepresst werden.

## Beantragte Struktur

### Neue Tabelle `PatientAnamnesis` (1:1 zu Patient)

| Feld | Typ | Zweck |
|---|---|---|
| `patientId` | uuid, not null, unique | Bezug |
| `situationHome` | text | Häusliche Situation |
| `situationSocial` | text | Soziale Situation |
| `situationResources` | text | Ressourcen |
| `situationOther` | text | Sonstiges |
| `situationUpdatedBy` | uuid → User | Bearbeitungsstand Block Situation |
| `situationUpdatedAt` | timestamp | dito |
| `historyCourse` | text | Krankheitsverlauf |
| `historyUpdatedBy` | uuid → User | Bearbeitungsstand Block Vorgeschichte |
| `historyUpdatedAt` | timestamp | dito |

### Neue Tabelle `PatientHistoryEntry` (n:1 zu PatientAnamnesis)

| Feld | Typ | Zweck |
|---|---|---|
| `anamnesisId` | uuid, not null | Bezug |
| `kind` | enum `chronic_condition \| procedure` | Listen-Zugehörigkeit |
| `label` | varchar, not null | Bezeichnung, Freitext |
| `timeInfo` | varchar | Zeitangabe («seit 2018») bzw. Jahr («2019»), Freitext, optional |
| `sortOrder` | int | Reihenfolge wie erfasst |

Der Bearbeitungsstand liegt **pro Block**, nicht pro Feld — das entspricht der
Oberfläche (eine Stempelzeile je Block) und vermeidet zehn Einzel-Timestamps.

## Was im Prototyp davon abweicht

- Beide Strukturen leben als Felder von `PatientFormData`
  (`situationHaeuslich`…`vorgeschichteBearbeitetAm`, `chronischeErkrankungenListe`,
  `operationenListe` mit `VorgeschichteEintrag { id, bezeichnung, zeitangabe }`) —
  keine Persistenz, kein eigener Store.
- `…UpdatedBy` ist im Prototyp die Anzeigeform («M. Keller»), kein User-Verweis.
- Der Stempel wird bei jedem Schreibzugriff mit der Mock-Gegenwart
  (`GEGENWART_ISO`, 2026-08-04) gesetzt; der Demo-Fall Steiner trägt für die
  Situation bewusst einen alten Stempel (12.06.2025), damit der
  Überprüfungshinweis vorführbar ist.

## Entfallene Felder (kein Delta-Bedarf)

Grösse, Gewicht, Gewichtsverlust, Brille, Hörgerät, Sturz-Assessment, Stimmung und
«Ausführliche Anamnese» sind ersatzlos aus dem Reiter entfernt: Körpermasse führt das
Vitalzeichen-Modul (`Observation`, siehe `schema-delta-vitalzeichen.md`), die übrigen
Items sind interRAI-Gegenstand der Bedarfsabklärung. BB11 (Zeit seit dem letzten
Spitalaufenthalt) war vorgemappt (iA13) und lebt unverändert im Registrierungsformular —
nur die Zweit-Erfassungsstelle im Reiter ist weggefallen.
