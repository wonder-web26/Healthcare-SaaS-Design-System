# Betreuungsrhythmus — im Onboarding und beim Patienten

Dieses Dokument beschreibt den **Betreuungsrhythmus**: das Modul, das aus einer versionierten Vorlage die wiederkehrenden Betreuungs-/Kontroll-Schritte eines Subjekts (Patient oder Angehörige/r) als terminierte Tickets erzeugt und über den Lebenszyklus führt.

**Codebasis:** `feature/patient-detailview-v3` (Worktree `spitex-onboarding-sda`).
**Kernmodul:** `src/lib/rhythmus/` — `vorlage.ts` (Definition/Stammdaten), `engine.ts` (Instanzen, Tickets, Status, Audit), `seed.ts` (Startbestand). **Anzeige:** `src/app/components/rhythmus/RhythmusTimeline.tsx`, eingebunden in `Patient360Page` und `Angehoerige360Page`.

> Es gibt im Produkt zwei Dinge, die „Rhythmus" heissen. Dieses Dokument meint den **Betreuungsrhythmus** (Workflow-Engine, WF-01/WF-02). Nicht gemeint ist der **KLV-Positions-Rhythmus** (`täglich / wöchentlich / monatlich / einmalig / nach Bedarf`) im KLV-Arbeitsbereich — das ist die Erbringungs-Frequenz einer einzelnen KLV-Position, nicht die Workflow-Kette.

---

## 1 · Konzept

Der Betreuungsrhythmus hat drei Schichten:

1. **Vorlage (Stammdaten, versioniert)** — eine subjekt-agnostische Schrittfolge. Jeder Schritt hat einen Code, ein Label, einen Typ, einen Zeit-Offset ab einem Ankerdatum, eine/n Default-Verantwortliche/n und ggf. Protokollpflicht.
2. **Instanz (je Subjekt)** — beim Eintritt eines Subjekts in den Lebenszyklus wird aus der aktiven Vorlage eine Instanz erzeugt. Die Instanz hält einen **Snapshot** der Vorlage (`vorlageId` + `vorlageVersion`) und das konkrete **Ankerdatum** des Subjekts.
3. **Tickets** — pro Vorlage-Schritt entsteht ein Ticket mit konkretem Fälligkeitsdatum (Anker + Offset). Tickets werden bearbeitet, verschoben, erledigt oder entfallen.

**Subjekt-agnostisch:** dieselbe Struktur trägt `entitaet = "patient"` **und** `entitaet = "angehoeriger"`.

---

## 2 · Der Patienten-Rhythmus im Onboarding

Für Patienten ist der Betreuungsrhythmus **deckungsgleich mit dem Onboarding-Prozess**: die Vorlage „Patient Prozess" (v1, `rv-pat-001`) bildet die Schrittkette von der Aufnahme bis zur laufenden Betreuung ab. Ankerdatum ist das **Aufnahmedatum**; die meisten Schritte liegen in den ersten ~28 Tagen plus Monat 1.

| Code | Schritt | Typ | Fällig (ab Aufnahme) | Verantwortlich |
|---|---|---|---|---|
| pp_01 | Erstassessment | klinisch | Tag 0 | Sandra Weber |
| pp_02 | Arzt kontaktiert | kommunikation | Tag 2 | Sandra Weber |
| pp_03 | Diagnose & Mediliste erhalten | klinisch | Tag 5 | Dr. M. Huber |
| pp_04 | KLV erfasst | administration | Tag 7 | Kathrin Meier |
| pp_05 | KLV an Arzt gesendet | kommunikation | Tag 10 | Kathrin Meier |
| pp_06 | KLV unterschrieben erhalten | administration | Tag 13 | Dr. M. Huber |
| pp_07 | KLV an Versicherung gesendet | administration | Tag 15 | System |
| pp_08 | Pflegeplan erstellt | klinisch | Tag 19 | Sandra Weber |
| pp_09 | Angehörigen-Mappe erstellt | administration | Tag 21 | Sandra Weber |
| pp_10 | Pflegediagnose erstellt | klinisch | Tag 24 | KI-Assistent |
| pp_11 | InterRAI erstellt | klinisch | Tag 26 | Sandra Weber |
| pp_12 | Medikamente erfasst | klinisch | Tag 28 | Kathrin Meier |
| pp_13 | Medlink-Schulung | schulung | Monat 1 | System |
| pp_14 | Zeit nachgetragen | administration | Monat 1 + 5 Tage | Sandra Weber |
| pp_15 | SRK-Schulung angemeldet | schulung | Monat 1 + 14 Tage | HR-Abteilung |

**Wann entsteht er:** Der Patienten-Rhythmus wird **beim Abschluss des Onboardings** angelegt (`lib/onboarding/konvertierung.ts`); der Startbestand der Demo kommt aus `lib/rhythmus/seed.ts`. Erzeugt wird bei einem definierten Lebenszyklus-Ereignis — **nicht** beim Öffnen eines Dossiers (siehe Prinzipien unten).

**interRAI-Triage:** Die Schritte `pp_01` und `pp_11` sind die interRAI-Abklärungsschritte (`INTERRAI_SCHRITTE`). Verlangt der Standard keine Abklärung (BB16 ∈ {5, 6, 7}), **entfallen genau diese beiden Schritte** — die Triage vergleicht Codes, nicht Text.

---

## 3 · Der Rhythmus beim Patienten (Dossier)

Im Patienten-Dossier (`Patient360Page`) gibt es den Bereich **„Betreuungsrhythmus"**, dargestellt über die geteilte **`RhythmusTimeline`**. Wichtig:

- **Das Dossier liest nur, es erzeugt nichts.** Im Code steht ausdrücklich: *„Hier entsteht nichts."* Würde der Rhythmus beim Öffnen erzeugt, hinge die Zahl der Pendenzen davon ab, wer welches Dossier zuletzt geöffnet hat. Gelesen wird mit `getTicketsFuerSubjekt("patient", patientId)`.

**Ticket-Zustände** (`TicketStatus`):

| Status | Bedeutung |
|---|---|
| `offen` | steht an |
| `ueberfaellig` | Fälligkeit überschritten (`aktualisiereUeberfaellige()`) |
| `erledigt` | jemand hat die Arbeit getan (mit `erledigtVon` / `erledigtAm`, ggf. Protokoll) |
| `entfallen` | fällt weg, weil das Subjekt weggefallen ist — **bewusst nicht „erledigt"**: es behauptet keine getane Arbeit, sondern nennt den Grund, warum niemand sie mehr tut |

**Je Ticket** werden geführt: `faelligAm`, das **unveränderliche** ursprüngliche Datum `faelligAmUrspruenglich`, ein **Audit-Trail** jeder Verschiebung (`faelligkeitsAenderungen`: alt/neu/Begründung/von/wann), `protokollPflicht` + `protokoll`, `zugewiesenAn`, sowie `entfallenGrund`.

**Beenden bei Austritt:** Wird der Patient ausgetragen, endet der Betreuungsrhythmus (`rhythmusBeenden`): **offene Schritte entfallen mit Grund, erledigte bleiben als Nachweis stehen.** Im Dossier erscheint dann z. B. „Der Betreuungsrhythmus ist beendet: N offene Schritte sind entfallen, M erledigte bleiben als Nachweis."

---

## 4 · Gegenstück: der Angehörigen-Rhythmus

Dasselbe Modul trägt den Rhythmus der Angehörigen. Vorlage „Betriebshandbuch Angehörige" (v1, `rv-ang-001`), Ankerdatum **Eintrittsdatum**, alle Schritte mit **Protokollpflicht**:

| Code | Schritt | Typ | Fällig (ab Eintritt) |
|---|---|---|---|
| rk_m1 | Initialschulung + Regelkontrolle (Beobachtung) | kombiniert | Monat 1 |
| rk_m2 | Mikroschulung | schulung | Monat 2 |
| rk_m3 | Fallbesprechung | fallbesprechung | Monat 3 |
| rk_m4 | Arbeitskontrolle + Mikroschulung | kombiniert | Monat 4 |
| rk_m6 | Reassessment | reassessment | Monat 6 |

**Wann entsteht er:** mit der **Anstellung** der angehörigen Person — nicht mit dem Öffnen ihres Dossiers. (Hier liegt auch die **Initialschulung**: Schritt `rk_m1`, ein Monat nach Eintritt.) Angezeigt über dieselbe `RhythmusTimeline` in `Angehoerige360Page`.

---

## 5 · Daten- und Designprinzipien

- **Deterministisch, ohne Nebenwirkung beim Lesen.** Erzeugt wird an Lebenszyklus-Ereignissen (Patient: Onboarding-Abschluss; Angehörige: Anstellung); der Store benachrichtigt seine Abonnenten. Dossiers lesen nur.
- **Versionierte Vorlagen.** Eine Änderung erzeugt eine **neue Version**, die alte wird **archiviert** (`vorlageVersionieren`). Sie gilt **nur für neue Subjekte**; laufende Instanzen behalten ihre Version (Snapshot in der Instanz).
- **Unveränderliches Ursprungsdatum + Audit.** `faelligAmUrspruenglich` bleibt fix; jede Verschiebung ist begründet und protokolliert.
- **`entfallen` ≠ `erledigt`.** Beweissicherheit: ein weggefallener Schritt behauptet keine geleistete Arbeit.
- **Protokollpflicht.** Schritte mit `protokollPflicht: true` verlangen beim Erledigen eine Protokoll-Eingabe (`ticketErledigen`).
- **Ankerdatum je Entität.** Offsets rechnen ab einem Subjekt-Datum: Patient = Aufnahmedatum, Angehörige = Eintrittsdatum.
- **Strukturell angelegt, noch nicht ausgewertet:** `triggerTyp: "nach_schritt"` und das `bedingung`-Feld (aus dem `DokumentBedingung`-Vokabular) existieren im Modell, werden aktuell aber nicht ausgewertet (nur `zeit_offset` ist wirksam).

---

## 6 · Wichtige Funktionen (engine.ts)

| Funktion | Zweck |
|---|---|
| `generiereRhythmusTickets(subjektTyp, id, name, ankerDatum, verantwortlich)` | Instanz + Tickets aus der aktiven Vorlage erzeugen |
| `aktualisiereUeberfaellige()` | offene Tickets mit überschrittener Fälligkeit auf `ueberfaellig` setzen |
| `ticketFaelligkeitAendern(...)` | Fälligkeit verschieben (mit Audit-Eintrag) |
| `ticketErledigen(...)` | erledigen (Protokoll, falls Pflicht) |
| `rhythmusBeenden(subjektTyp, id, grund)` | Rhythmus beenden — offene → `entfallen`, erledigte bleiben |
| `konvertiereRhythmusSubjekt(...)` | Subjekt eines Rhythmus umhängen (z. B. Mandats-/Patientenwechsel) |
| `getTicketsFuerSubjekt` / `getInstanzFuerSubjekt` / `getOffeneTicketsFuerPerson` / `getAlleTickets` / `getAlleInstanzen` | Lesezugriffe für Dossier- und Sammelansichten |

---

*Kurz: Der Betreuungsrhythmus ist eine versionierte Vorlage, die je Subjekt zu terminierten, auditierbaren Tickets wird. Beim Patienten ist er die Onboarding-Kette selbst (erzeugt beim Onboarding-Abschluss, angezeigt read-only im Dossier); beim Angehörigen die wiederkehrende Schulungs-/Kontroll-Kette ab Anstellung. Erledigt bleibt Nachweis, Entfallenes nennt seinen Grund.*
