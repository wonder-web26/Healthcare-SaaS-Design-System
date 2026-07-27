# Arbeitskontrolle — Abweichungen Vorlage gegen System

## Zweck

Jede Abweichung zwischen der Kundenvorlage (`arbeitskontrolle-v1.md`) und der
Umsetzung im Produkt wird hier festgehalten — **bevor** sie umgesetzt wird.

Grund: Die Arbeitskontrolle ist ein Nachweisdokument gegenüber der kantonalen
Aufsicht und gegenüber Krankenversicherern. Eine unentschiedene Abweichung von
der Kundenvorlage ist auch dann ein Problem, wenn sie fachlich sinnvoll ist.

## Regeln

1. Eintrag **vor** der Umsetzung, nicht danach.
2. Jeder Eintrag nennt eine Entscheidungsinstanz und einen Status.
3. Eine Abweichung mit Status `offen` darf nicht als Standardverhalten
   ausgeliefert werden.
4. Wird die Vorlage durch den Kunden aktualisiert, entsteht eine neue
   Transkription (`arbeitskontrolle-v2.md`); bestehende Einträge werden geprüft,
   nicht gelöscht.

## Status

| Status | Bedeutung |
|---|---|
| `offen` | noch nicht entschieden, nicht auslieferbar |
| `bestätigt` | von der Entscheidungsinstanz freigegeben |
| `abgelehnt` | zurückzubauen |
| `zurückgestellt` | bewusst vertagt, mit Termin |

## Entscheidungsinstanzen

| Kürzel | Wer | Zuständig für |
|---|---|---|
| `KM` | Spitex Kaufmann, Geschäftsführung | Inhalt und Aufbau des Formulars |
| `PB` | Fachliche Validierungsperson | pflegefachliche Eignung, Schwellenwerte |
| `HH` | hogo health | technische Umsetzung, Darstellung |

---

## Register

### A-01 — „Covid Schutz-Massnahmen" zu „Schutzmassnahmen" verallgemeinert

| | |
|---|---|
| Betrifft | `AK-B4-K3` |
| Vorlage | Covid Schutz-Massnahmen |
| System | Schutzmassnahmen |
| Art | Änderung eines Kriteriums |
| Begründung | Bezug auf eine einzelne Erkrankung wirkt 2026 überholt; allgemeine Formulierung deckt mehr ab |
| Entscheidungsinstanz | `KM` |
| **Status** | **offen** |
| Bemerkung | Bereits im System umgesetzt, ohne vorgängige Entscheidung. Nachträglich zu bestätigen oder zurückzubauen. |

### A-02 — Feld „Besuchter Patient" ergänzt

| | |
|---|---|
| Betrifft | Kopfdaten |
| Vorlage | nicht vorhanden |
| System | zusätzliches Feld, optional |
| Art | Ergänzung |
| Begründung | Ordnet die Kontrolle einem konkreten Einsatz zu; erhöht die Aussagekraft als Nachweis |
| Entscheidungsinstanz | `KM` |
| **Status** | **offen** |
| Bemerkung | Bereits im System umgesetzt, ohne vorgängige Entscheidung. Datenschutzseitig zu prüfen: Der Patientenname erscheint damit in einem Personaldokument der Mitarbeiterin. |

### A-03 — Art der Kontrolle: regulär / ausserordentlich

| | |
|---|---|
| Betrifft | Kopfdaten |
| Vorlage | nicht vorhanden |
| System | zusätzliches Merkmal, im Dokument nur bei `ausserordentlich` sichtbar |
| Art | Ergänzung |
| Begründung | Unterscheidet turnusmässige Kontrolle von anlassbezogener |
| Entscheidungsinstanz | `KM` |
| **Status** | **offen** |

### A-04 — Drei Freitextfragen zu einer zusammengefasst

| | |
|---|---|
| Betrifft | `AK-F1`, `AK-F2`, `AK-F3` |
| Vorlage | drei getrennte Fragen mit eigenem Antwortraum |
| System | ein Feld „Verbesserungen und Vorschläge" |
| Art | Reduktion |
| Begründung | keine dokumentiert |
| Entscheidungsinstanz | `KM` |
| **Status** | **offen** |
| Bemerkung | Inhaltlich verschiedene Fragen: erwünschte Verbesserung, Herkunft eines Vorschlags, Fehlervermeidung. Die Zusammenfassung verliert insbesondere, von wem ein Vorschlag stammt. |

### A-05 — Ablaufhinweis ersatzlos entfallen

| | |
|---|---|
| Betrifft | Ablaufhinweis „Formular bei der Geschäftsleitung abgeben" |
| Vorlage | vorhanden |
| System | entfallen, ohne Ablaufschritt als Ersatz |
| Art | Wegfall |
| Begründung | Papierartefakt |
| Entscheidungsinstanz | `HH` |
| **Status** | **offen** |
| Bemerkung | Der Wegfall des Satzes ist richtig, der fehlende Ersatz nicht. Die Übergabe an Geschäftsleitung oder Leitung Pflege sollte als Pendenz entstehen. |

### A-06 — „nicht erfasst" und „kann ich nicht beurteilen" nicht unterscheidbar

| | |
|---|---|
| Betrifft | alle Kriterien |
| Vorlage | drei Zustände unterscheidbar: leer, 1–6, „Kann ich nicht beurteilen" |
| System | zwei Zustände: `1–6` oder `null`; `null` ist zugleich Anfangszustand und wird als `n.b.` gedruckt |
| Art | **Regression gegenüber der Vorlage** |
| Entscheidungsinstanz | `HH` |
| **Status** | **offen — Auslieferungssperre** |
| Bemerkung | Ein nicht ausgefülltes Formular erzeugt ein Dokument, das für jedes Kriterium behauptet, eine Beurteilung sei nicht möglich gewesen. Das ist eine unzutreffende Aussage in einem Nachweisdokument. Vor jeder Demonstration zu beheben. |
| Umsetzung | In diesem Lauf technisch umgesetzt am 27.07.2026 (Dreiteilung nicht erfasst / nicht beurteilbar / bewertet in Datenmodell, Maske und Dokument). Status unverändert — die Entscheidung liegt bei `HH`. |

### A-07 — Massnahmen und Nachkontrolle fehlen

| | |
|---|---|
| Betrifft | neuer Abschnitt |
| Vorlage | nicht vorhanden |
| System | nicht vorhanden |
| Art | Vorschlag zur Ergänzung |
| Begründung | Die Vorlage fragt nach Verbesserungen, hält aber weder Entscheid noch Zuständigkeit noch Frist fest. Damit belegt das Dokument eine Kontrolle, aber keine Begleitung — GeKoZH-Vorschlag Nr. 4 verlangt beides. |
| Entscheidungsinstanz | `KM`, fachlich `PB` |
| **Status** | **offen** |
| Bemerkung | Umsetzung ohne neues Domänenobjekt möglich: Bewertung unterhalb einer Schwelle erzeugt eine Pendenz mit Frist und Verantwortlicher. Die Schwelle ist von `PB` zu setzen. |

### A-08 — Signaturbild in der Maske, nicht im Dokument

| | |
|---|---|
| Betrifft | `AK-U1`, `AK-U2` |
| Vorlage | Unterschriftslinien auf Papier |
| System | Signaturpad in der Bildschirmmaske, im erzeugten Dokument erscheinen nur Rolle, Name und Datum |
| Art | Inkonsistenz |
| Entscheidungsinstanz | `HH` |
| **Status** | **offen** |
| Bemerkung | Das Weglassen des Bildes im Dokument entspricht der Erkenntnis, dass ein Unterschriftsbild keine eigenständige Beweiskraft hat. Dann sollte die Maske aber auch kein Signaturpad anbieten, das etwas anderes suggeriert. Entweder beides oder keines. |

### A-09 — Bestätigter Wortlaut wird nicht festgehalten

| | |
|---|---|
| Betrifft | `AK-U1`, `AK-U2` |
| Vorlage | Klammerzusätze „(Beurteilung)" und „(Kenntnisnahme)" |
| System | Wortlaut erscheint als Hinweis in der Maske, wird nicht gespeichert und nicht im Dokument ausgewiesen |
| Art | Wegfall |
| Entscheidungsinstanz | `HH` |
| **Status** | **offen** |
| Bemerkung | „Kenntnisnahme, nicht Zustimmung" ist eine rechtlich bedeutsame Unterscheidung. Sie gehört gespeichert und im Dokument ausgewiesen. |
| Umsetzung | In diesem Lauf technisch umgesetzt am 27.07.2026 (Wortlaut wird beim Unterschreiben gespeichert und im Dokument unter der jeweiligen Unterschrift ausgewiesen). Status unverändert — die Entscheidung liegt bei `HH`. |

### A-10 — Unterschriftsreihenfolge nicht erzwungen

| | |
|---|---|
| Betrifft | `AK-U1`, `AK-U2` |
| Vorlage | Reihenfolge Beurteilung vor Kenntnisnahme nahegelegt, nicht vorgeschrieben |
| System | beliebige Reihenfolge zulässig |
| Art | Abweichung von der nahegelegten Ordnung |
| Entscheidungsinstanz | `HH` |
| **Status** | **offen** |
| Bemerkung | Eine Kenntnisnahme vor der Beurteilung ergibt fachlich keinen Sinn. |
| Umsetzung | In diesem Lauf technisch umgesetzt am 27.07.2026 (AK-U2 erst möglich, wenn AK-U1 vorliegt; die gesperrte Fläche ist sichtbar, nicht bedienbar, mit Begründung). Status unverändert — die Entscheidung liegt bei `HH`. |

### A-11 — Kontrollintervall im Dokument nicht ausgewiesen

| | |
|---|---|
| Betrifft | Kopfdaten |
| Vorlage | nicht vorhanden |
| System | Intervall konfigurierbar (Vorgabe 3 Monate), erscheint aber nicht im Dokument |
| Art | Vorschlag zur Ergänzung |
| Entscheidungsinstanz | `HH` |
| **Status** | **offen** |
| Bemerkung | Das Drei-Monats-Intervall ist Kaufmanns interne Regel, keine gesetzliche. Für die Nachvollziehbarkeit sollte im Dokument stehen, welche Regel zum Zeitpunkt der Kontrolle galt. |
| Umsetzung | In diesem Lauf technisch umgesetzt am 27.07.2026 (bei Abschluss geltendes Intervall wird festgehalten und im Kopfbereich des Dokuments ausgewiesen, ausdrücklich als organisationsinterne Vorgabe). Status unverändert — die Entscheidung liegt bei `HH`. |

---

## Historie

| Datum | Änderung |
|---|---|
| 27.07.2026 | Register angelegt, A-01 bis A-11 aus der ersten Bestandsaufnahme erfasst |
| 27.07.2026 | A-06, A-09, A-10, A-11 in diesem Lauf technisch umgesetzt (Umsetzungsvermerk je Eintrag). Status unverändert — Entscheidung offen. |
