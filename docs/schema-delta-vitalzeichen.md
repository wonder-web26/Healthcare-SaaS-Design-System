# Schema-Delta — Vitalzeichen

Was das Vitalzeichen-Modul an Feldern braucht, die `docs/Spit Full.dbml` heute nicht
vorsieht. **Die dbml-Datei wurde nicht geändert** — dieses Dokument ist der Antrag, nicht
die Umsetzung.

Stand: Lauf «Vitalzeichen», Branch `feature/vital-optimization`.
Referenztabelle: `Table Observation`.

## Was die Tabelle bereits richtig vorsieht

`Observation` deckt den Kern: `type` (die acht Parameter, wörtlich als Codes im Prototyp
übernommen), `measuredAt`, `valuePrimary`/`valueSecondary` (Blutdruck), `unit`,
`interpretation` (`abnormally_low | normal | abnormally_high` — exakt die dreiwertige
Beurteilung, im Prototyp wörtlich übernommen), `source`, `context` (JSON für die
qualifizierenden Angaben — Körperhaltung, Messort, Messkontext, Atmung), `note`,
`recordedBy`. Auch das BMI-Verbot («DO NOT ADD A BMI TYPE») deckt sich mit dem Modul:
der BMI wird berechnet und nie gespeichert.

## 1. Schmerz als Typ

`type` kennt keinen Schmerz. Die Pflege erfasst ihn täglich (NRS 0–10); im Modul steht er
bewusst in der Gruppe «Messwerte ohne Vitalzeichen-Status» — kein Vitalzeichen im
FHIR-Sinn, aber fachlich zentral, mit derselben Begründung wie der Blutzucker.

| Feld | Änderung | Begründung | Tabelle |
|---|---|---|---|
| `type` | Wert `pain_nrs` ergänzen | Schmerzerfassung hat heute keinen Platz; ein eigener Typ hält sie von den FHIR-Vitalzeichen getrennt | `Observation` |

## 2. Erfassungszeitpunkt getrennt vom Messzeitpunkt

`measuredAt` sagt, wann gemessen wurde — nicht, wann erfasst. Ein Nachtrag («gestern
Abend gemessen, heute eingetragen») ist bei der Spitex der Normalfall, nicht die
Ausnahme, und die Abweichung ist eine dokumentationsrelevante Aussage.

| Feld | Typ | Begründung | Tabelle |
|---|---|---|---|
| `recordedAt` | `timestamptz not null` | Systemseitig, unveränderlich; die Abweichung zu `measuredAt` macht den Nachtrag sichtbar | `Observation` |

## 3. «Nicht erhebbar» mit Grund

Eine dokumentierte Nichterhebung («Pulsoxymeter defekt») ist eine klinische Aussage und
nicht dasselbe wie ein fehlender Wert — dieselbe Unterscheidung, die das Schema bei
`Patient.noKnownAllergies` bereits trifft. Heute erzwingt `valuePrimary [not null]` einen
Wert; eine Nichterhebung liesse sich nur durch Weglassen der Zeile «dokumentieren», und
Weglassen dokumentiert nichts.

| Feld | Typ | Begründung | Tabelle |
|---|---|---|---|
| `valuePrimary` | nullable machen | Eine Nichterhebungs-Zeile trägt keinen Wert | `Observation` |
| `notObtainable` | `boolean not null default false` | Der eigene Zustand | `Observation` |
| `notObtainableReason` | `varchar` nullable | Ohne Grund ist die Nichterhebung ein Achselzucken | `Observation` |

## 4. Beurteiler mit Rolle

`interpretation` existiert, aber niemand sieht, wer beurteilt hat. Die Beurteilung ist
rollengebunden (nur Fachqualifikation) und bleibt sonst offen — dann muss erkennbar sein,
dass sie fehlt und wer sie nachholen soll.

| Feld | Typ | Begründung | Tabelle |
|---|---|---|---|
| `interpretedBy` | `uuid` nullable | Wer beurteilt hat — nicht dieselbe Frage wie `recordedBy` | `Observation` |
| `interpretedAt` | `timestamptz` nullable | Wann | `Observation` |
| `interpreterRole` | `varchar` nullable | Qualifikation zum Zeitpunkt der Beurteilung | `Observation` |
| `interpretationReason` | `Bytes` nullable (verschlüsselt) | Pflichtbegründung bei auffälliger Beurteilung | `Observation` |

## 5. Ärztlicher Zielwert als Bezugsrahmen

Die Beurteilung braucht einen sichtbaren Bezugsrahmen: ein hinterlegter ärztlicher
Zielwert, sonst der letzte Wert. Der Zielwert wird **angezeigt, nie ausgewertet** — keine
automatische Markierung, keine Einfärbung; das wäre Entscheidungsunterstützung und damit
regulatorisch ein Medizinprodukt.

| Feld | Typ | Begründung | Tabelle |
|---|---|---|---|
| `patientId` / `observationType` | `uuid` / `varchar` | Zielwert je Patient und Parameter | `ObservationTargetRange` (neu) |
| `displayText` | `varchar not null` | Der Wortlaut («unter 140/90 mmHg») — angezeigt, nicht geparst | dito |
| `bandMin` / `bandMax` | `decimal` nullable | Nur fürs Zielband im Diagramm; nullable, weil nicht jeder Zielwert ein Bereich ist | dito |
| `sourceContact` / `recordedAt` | `varchar` / `timestamptz` | Wer ihn verordnet hat und wann er hinterlegt wurde | dito |

## 6. Weitere Prototyp-Felder

| Feld | Typ | Begründung | Tabelle |
|---|---|---|---|
| `correctionOf` | `uuid` nullable | Korrektur als NEUER Eintrag, append-only; der korrigierte bleibt sichtbar mit Verweis. Muster wie `MedicationStatusChange`: Historie gehört in den Bestand | `Observation` |
| `collectionMethod` | `varchar` — `self_measured \| relative_reported \| from_document` | Erhebungsart; von Angehörigen berichtete Werte sind erkennbar, nicht abgewertet. `source` (`manual \| device`) beantwortet eine andere Frage | `Observation` |
| `device` | `varchar` nullable | Messgerät inkl. bewusstem «nicht dokumentiert» (null) | `Observation` |
| `recorderRole` | `varchar` | Rolle der erfassenden Person zum Zeitpunkt der Messung | `Observation` |

## Bewusst NICHT beantragt

- **LOINC-Codes.** Das Modul führt je Parameter ein leeres Codefeld mit TODO: die
  Zuordnung ist aus der HL7-Vital-Signs-Tabelle zu übernehmen und fachlich zu prüfen.
  Es wurden keine Codes gesetzt, auch keine plausibel aussehenden.
- **Ein BMI-Typ.** Bleibt berechnet, wie es die Schema-Notiz verlangt.
- **Referenzbereiche zur automatischen Auswertung.** Der Prototyp vergleicht nie selbst;
  die Plausibilitätsgrenzen im Parameterkatalog sind Tippfehler-Schutz an der Eingabe
  («ausserhalb des erfassbaren Bereichs»), keine klinischen Referenzwerte, und gehören
  nicht ins Schema.
