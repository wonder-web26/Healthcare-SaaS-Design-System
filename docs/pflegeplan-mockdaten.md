# Pflegeplan — der Mock-Datensatz

Aus dem Code extrahiert (über die Vertragsabfragen aus `src/lib/pflegeplan/`),
nicht aus dem Gedächtnis. Stand: Lauf 6b, Branch `feature/pflegeplanung`.

Herkunfts-Legende je Eintrag:
- **katalog** — echter Katalog (Spitex-Leistungskatalog 2025 bzw. belegte
  Teilhandlungen)
- **kuratiert** — Initialschulungs-Vorlage, fachlich nicht validiert
- **mock** — für den Prototyp frei gewählt (die echte CAP-NANDA-Zuordnungsliste
  und NANDA/ENP liegen nicht vor; alle Zuordnungen sind Mock)

## Die vier Plan-Diagnosen

| Code | Titel | Typ | Auslösende CAPs | Herkunft |
|---|---|---|---|---|
| 00155 | Sturzgefahr | Risiko | CAP-FALLS | mock |
| 00085 | Beeinträchtigte körperliche Mobilität | Problem | CAP-FALLS, CAP-PAIN | mock |
| 00108 | Selbstversorgungsdefizit Körperpflege | Problem | CAP-ADL | mock |
| 00162 | Bereitschaft für ein verbessertes Gesundheitsmanagement | Bereitschaft | CAP-MOOD | mock |

Nur diese vier tragen Interventions-Zuordnungen (PROB_MAS); die übrigen 37
Kandidaten sind reine Vorschläge ohne hinterlegte Kette.

## Die 41 Kandidaten

Je CAP (Rangfolge = Listenposition, Belege als Itemcode=Wert; alles mock):

| CAP | Kandidaten |
|---|---|
| CAP-FALLS | 14 |
| CAP-ADL | 12 |
| CAP-PAIN | 8 |
| CAP-MOOD | 10 |

Summe 44, **dedupliziert 41**. Mehrfach vorgeschlagen: **00146** (PAIN+MOOD),
**00085** (FALLS+PAIN), **00092** (FALLS+PAIN) — bei ihnen werden CAPs und
Belege vereinigt und der beste Rang behalten.

## Ziele je Diagnose (hergeleitet über die Interventionen)

**00155 Sturzgefahr** — 5 Ziele, **1 durch die Ausschlussliste entfernt**
(Z-WOHLBEFINDEN «Fühlt sich wohl und gepflegt», erreichbar über
I-STURZBERATUNG, für diese Diagnose unterdrückt; alles mock):

| Ziel | Interventionen |
|---|---|
| Z-STURZFREI «Bleibt im Beobachtungszeitraum sturzfrei» | I-STURZASSESS, I-WOHNUMFELD, I-GLEICHGEWICHT |
| Z-WOHNUMFELD «Bewegt sich in einem angepassten, sicheren Wohnumfeld» | I-WOHNUMFELD |
| Z-BALANCE «Verbesserte Gleichgewichtsfähigkeit» | I-GLEICHGEWICHT |
| Z-HILFSMITTEL-SICHER «Setzt die Gehhilfe sicher und regelmässig ein» | I-HILFSMITTEL |
| Z-WISSEN-STURZ «Kennt die eigenen Sturzrisiken und Schutzmassnahmen» | I-STURZBERATUNG, I-ZIELGESPRAECH |

**00085 Mobilität** — 6 Ziele, 0 entfernt:

| Ziel | Interventionen |
|---|---|
| Z-GEHSTRECKE «Erhält die Gehstrecke innerhalb der Wohnung» | I-GEHTRAINING |
| Z-TRANSFER «Führt Transfers selbstständig und sicher durch» | I-TRANSFER |
| Z-BEWEGLICH «Erhält die Gelenkbeweglichkeit» | I-BEWEGUNG, I-LAGERUNG |
| Z-BALANCE | I-GLEICHGEWICHT |
| Z-STURZFREI | I-GLEICHGEWICHT |
| Z-HAUT «Die Haut bleibt intakt» | I-LAGERUNG |

**00108 Körperpflege** — 3 Ziele, 0 entfernt:

| Ziel | Interventionen |
|---|---|
| Z-SELBSTPFLEGE «Grösstmögliche Selbstständigkeit bei der Körperpflege» | I-GANZWASCHUNG, I-ANLEITUNG-SELBSTPFLEGE |
| Z-WOHLBEFINDEN «Fühlt sich wohl und gepflegt» | I-GANZWASCHUNG, I-TEILWAESCHE, I-HAARWAESCHE |
| Z-HAUT | I-HAUTPFLEGE |

**00162 Bereitschaft** — **0 Ziele** (keine Interventionen hinterlegt; der
Normalfall-Zustand für Bereitschafts-/Risikodiagnosen mit eigenem-Ziel-Pfad).

Eindeutige Ziele über alles: **11** (Z-BALANCE, Z-STURZFREI und Z-HAUT dienen
je zwei Diagnosen).

## Interventionen (15; Zuordnungen mock)

| Intervention | Detaildialog | Standardposition |
|---|---|---|
| I-STURZASSESS «Sturzrisiko-Assessment durchführen» | nein | **10901** (mock — bewusst ohne Teilhandlungen) |
| I-WOHNUMFELD «Wohnumfeld anpassen …» | nein | — (planerisch) |
| I-GLEICHGEWICHT «Gleichgewichts- und Kraftübungen anleiten» | nein | **10506** (mock, Lauf 6b — Doppelbelegung mit I-BEWEGUNG) |
| I-HILFSMITTEL «Gebrauch der Gehhilfe schulen» | nein | — |
| I-STURZBERATUNG «Beratungsgespräch zur Sturzprophylaxe führen» | nein | — |
| I-ZIELGESPRAECH «Pflegeziele … besprechen» | nein | — |
| I-GEHTRAINING «Gehtraining durchführen» | nein | 10505 |
| I-TRANSFER «Transfer üben und sichern» | nein | — |
| I-BEWEGUNG «Aktive und passive Bewegungsübungen …» | nein | **10506** (mock, Lauf 6b — fast wortgleich zum Katalogtext) |
| I-LAGERUNG «Lagern und positionieren» | nein | — |
| I-GANZWASCHUNG «Ganzkörperwaschung durchführen» | **ja** (Ort: Im Bett → 10101, In Dusche oder Bad → 10102; zweite Gruppe «Haarwäsche einschliessen» ohne Positionswirkung) | — (Position nur über den Dialog) |
| I-TEILWAESCHE «Teilwäsche durchführen» | nein | 10103 |
| I-HAUTPFLEGE «Hautpflege und Dekubitusprophylaxe …» | nein | — |
| I-ANLEITUNG-SELBSTPFLEGE «Zur selbstständigen Körperpflege anleiten» | nein | — |
| I-HAARWAESCHE «Haare waschen» | nein | 10107 |

## Erreichbare Positionen

| Nr. | Bezeichnung | KLV | Vorgabe | Wiederholungsgrenze | Mindestqualifikation | Teilhandlungen |
|---|---|---|---|---|---|---|
| 10101 | Ganzwäsche bettlägerige Klientin | c | 40 min | max 1×/Tag (mock) | Pflegehelfer/in SRK (mock) | 7 (**kuratiert**) |
| 10102 | Ganzwäsche in Bad, Dusche oder am Lavabo | c | 40 min | max 1×/Tag (mock) | Pflegehelfer/in SRK (mock) | 10 (**katalog** — die echten zehn, belegt) |
| 10103 | Teilwäsche im Bett (inkl. Intimpflege) | c | 20 min | max 2×/Tag (mock) | Pflegehelfer/in SRK (mock) | 7 (kuratiert) |
| 10107 | Haare waschen | c | 15 min | — | — | 6 (kuratiert) |
| 10505 | Hilfe beim Gehen | c | 8 min | max 3×/Tag (mock) | Pflegehelfer/in SRK (mock) | 7 (kuratiert) |
| 10506 | Aktive/passive Bewegungsunterstützung | c | 17 min | — | Pflegehelfer/in SRK (mock) | 1 (kuratiert) |
| 10901 | Erstassessment | a | 60 min | — | — | **keine** |

Nummer, Bezeichnung, KLV-Kategorie und Vorgabezeit: **katalog**
(Spitex-Leistungskatalog 2025, unverändert).

## Die Sonderfälle auf einen Blick

| UI-Zustand | Element |
|---|---|
| Ziel dient zwei Diagnosen | Z-BALANCE, Z-STURZFREI, Z-HAUT (je 00155/00085 bzw. 00085/00108) |
| Massnahme dient zwei Zielen | I-GLEICHGEWICHT (Z-BALANCE + Z-STURZFREI), I-GANZWASCHUNG (Z-SELBSTPFLEGE + Z-WOHLBEFINDEN), I-LAGERUNG (Z-BEWEGLICH + Z-HAUT) |
| Zwei Interventionen auf derselben Position (Blatt-Zusammenfassung, Lauf 6b) | I-BEWEGUNG + I-GLEICHGEWICHT → 10506 — eine Blattzeile, getragen von bis zu drei Zielen unter zwei Diagnosen |
| Intervention ohne Position (planerisch) | I-ZIELGESPRAECH, I-WOHNUMFELD, I-GLEICHGEWICHT u. a. |
| Position ohne Teilhandlungen | 10901 (über I-STURZASSESS) |
| Positionsumschaltung über Detaildialog | I-GANZWASCHUNG (10101 ↔ 10102) |
| Diagnose ohne Ziele | 00162 (Bereitschaft) |
| Durch Ausschlussliste unterdrücktes Ziel | Z-WOHLBEFINDEN bei 00155 (bei 00108 sichtbar) |
| Unbehandelter CAP | CAP-CARDIO (keine Zuordnungsliste; im Assessment-Mock seit Lauf 2 nicht mehr getriggert — `unbehandelteCaps` weist ihn aus, wenn er auftritt) |
| Kandidat aus mehreren CAPs | 00146, 00085, 00092 |

## Einschätzungen (Lauf 5; angepasst nach Entfernung des Zieldatums)

Die Mock-Gegenwart ist `GEGENWART_ISO` = **04.08.2026**. Ziele tragen
**kein Zieldatum** (fachlicher Entscheid): die Zielerreichung wird über die
fünfstufige Einschätzung erfasst — jederzeit, im Dokument, mit Datum und
Autorin der Erfassung. Datums-Befunde an Zielen und der Abschnitt
«Was ansteht» existieren damit nicht.

## Prüfung

Jeder oben genannte UI-Zustand ist im Browser erreichbar über
`/pflegeplan/P-2026-0041` (Assessment vom 15.08.2025 mit den vier CAPs);
der Leerzustand ohne Assessment über `/pflegeplan/P-2026-0043`.
