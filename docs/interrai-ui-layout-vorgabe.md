# UI-Layout-Vorgabe — interRAI HC Schweiz

Verbindliche Darstellungsregeln für das interRAI-Erfassungsmodul.
Gilt für alle 20 Bereiche, 94 Items, 185 Sub-Items und 258 Eingabefelder.

Stand: 27.07.2026, Fassung 5 · Status: Entwurf, noch nicht durch Person B geprüft

---

## 0. Grundprinzipien

1. **Inhalt wird nie gekürzt.** Der vollständige Wortlaut bleibt sichtbar.
   Struktur entsteht durch Typografie und Anordnung, nicht durch Weglassen.
   Dies ist zertifizierungsrelevant: Das Instrument muss der Papiervorlage
   entsprechen.
2. **Ein Muster für alle.** Gleiche Darstellungsfälle sehen überall gleich aus.
3. **Alles kommt aus dem Seed.** Der Renderer interpretiert keine Texte und
   rät keine Zusammenhänge. Es gibt keine Begleitdateien mehr.
4. **Zielgeräte:** Laptop ohne externen Bildschirm (ca. 700 nutzbare Pixel
   Höhe) und Tablet. Kein Telefon.
5. **Kein Hover als einzige Informationsquelle.**

---

## 1. Datenquelle

Einzige Quelle ist `seed/interrai-hc-seed.ts`.

Die früheren Begleitdateien `interrai-labels.ts` und `interrai-structure.ts`
sind ersatzlos entfallen. Ihre Inhalte (Titel-/Erläuterungstrennung,
Gruppenüberschriften, G1-Paarung, N2-Anhänge, Einheiten) waren Rekonstruktionen
von etwas, das auf der Vorlage gedruckt steht und jetzt im Seed liegt.

Relevante Felder:

| Feld | Ebene | Darstellung |
|---|---|---|
| `label` | Item, Sub-Item, Anhang | Titelzeile |
| `instruction` | Item | Kursive Anweisungszeile unter dem Titel |
| `detail` | Sub-Item | Erläuterungszeile unter dem Titel |
| `footnote` | Item | Anmerkung am Ende des Items |
| `groupHeading` | Sub-Item | Zwischenüberschrift über dieser Zeile |
| `columns` | Item | Mehrere Antwortspalten pro Zeile |
| `attachmentIntro`, `attachments` | Sub-Item | Zusatzfelder unter der Zeile |
| `repeatRows` | Item | Fester Wiederholblock |
| `repeatable` | Item | Wiederholblock nach eingegebener Anzahl |
| `beobachtungsperiode` | Item, Sub-Item | Abweichende Periode |
| `options[].freeText` | Antwortoption | Option mit Freitextfeld |
| `dependencies` | Item | Sprunglogik |

---

## 2. Bedienelemente

### 2.1 Grundregel

Keine Radiobuttons, keine Checkboxen mit separatem Auswahlpunkt. Die Auswahl
ist ein Zustand der gesamten Bedienfläche.

### 2.2 Klickflächen

| Element | Mindestmass |
|---|---|
| Codefeld in einer Matrix | 34 × 34 px |
| Optionszeile bei Einzelfragen | volle Breite × 44 px |
| Info-Symbol | 30 × 30 px |

### 2.3 Ausgewählter Zustand

Erkennbar durch Füllung **und** ein zweites Merkmal (Rahmen oder
Schriftstärke). Farbe allein genügt nicht.

### 2.4 Zurücksetzen

Jede Auswahl ist aufhebbar; erneutes Antippen der gewählten Option hebt sie
auf. Leeres Feld und bewusst kodierter Wert sind fachlich nicht dasselbe.

### 2.5 Tastatur

Am Laptop setzen die Zifferntasten den Antwortcode im fokussierten Feld.
Codes ab 10 werden über eine kurze Eingabepause zusammengesetzt. Nach der
Eingabe wandert der Fokus auf das nächste offene Feld desselben Items, beim
Verlassen des Items nicht automatisch weiter.

### 2.6 Layoutstabilität

Eine Zeile ist ein festes Raster aus Beschriftung, Antwortfeldern und
Zusatzzeichen. Jede Zeile eines Items benutzt dasselbe Raster.

- Für Zusatzzeichen (Beleg, Abweichung, Kontext) ist der Platz **immer**
  reserviert, auch wenn kein Zeichen darin steht. Die Antwortfelder liegen
  dadurch in allen Zeilen an derselben Position.
- Ein Zustandswechsel darf kein Element verschieben, weder waagrecht noch
  senkrecht. Zustände werden über die Gestaltung eines Zeichens ausgedrückt,
  nie über sein Erscheinen oder Verschwinden.
- Das gilt für alle Darstellungsfälle, nicht nur für Matrizen, und über Items
  hinweg: Antwortfelder gleichartiger Items stehen an derselben Stelle.

Begründung: Wenn ein Zeichen beim Bestätigen eines Vorschlags verschwindet,
verschiebt sich die ganze Zeile. Beim schnellen Arbeiten mit der Maus landet
der nächste Klick dann auf einem anderen Wert als beabsichtigt.

---

## 3. Beschriftung

Die Vorlage ist selbst zweistufig gesetzt. Diese Struktur wird abgebildet:

| Ebene | Feld | Darstellung |
|---|---|---|
| Item-Titel | `label` | 14 px, Schriftstärke 500 |
| Item-Anweisung | `instruction` | 12 px, Sekundärfarbe, eigene Zeile |
| Sub-Item-Titel | `label` | 13 px, Schriftstärke 500 |
| Sub-Item-Erläuterung | `detail` | 11.5 px, Sekundärfarbe, eigene Zeile |
| Anmerkung | `footnote` | 11.5 px, Sekundärfarbe, am Ende des Items |

Regeln:

- Anweisung, Erläuterung und Anmerkung werden **nie** eingeklappt, gekürzt
  oder ausgeblendet.
- Abgrenzungen und Ausschlüsse werden hervorgehoben. Signalwörter: OHNE,
  ausgenommen, nicht, beinhaltet auch, eingeschlossen.
- Der Code steht vor dem Titel, kleiner und in Sekundärfarbe.

---

## 4. Darstellungsfälle

Der Fall ergibt sich aus der Struktur des Items. Der Renderer entscheidet nicht
selbst und liest keine Texte aus.

### 4.1 Einfaches Item (keine Sub-Items)

Titel, Anweisung, darunter die Antwortoptionen als vollbreite Zeilen mit
Code-Badge links.

Ausnahme siehe 4.7.

### 4.2 Matrix (Sub-Items ohne eigene Optionen)

Aufbau:

1. Titel und Anweisung des Items
2. **Legende**: alle Antwortoptionen einmal, vollständig, untereinander
3. Zeilen: Titel und Erläuterung des Sub-Items links, Codefelder rechts

Regeln:

- **Optionstexte erscheinen nie als Spaltenüberschrift.**
- Die Legende ist ein getönter Block mit eigenem Rahmen. Die Tönung trennt
  Nachschlagewerk von Eingabebereich; sie ist nicht das einzige
  Unterscheidungsmerkmal, Rahmen und Abstand wirken auch ohne Farbe.
- Das Code-Badge in der Legende hat **dieselbe Form und Grösse wie die
  Antwortschaltfläche** in den Zeilen. Nur dadurch erkennt das Auge, dass es
  sich um denselben Code handelt. Das Badge bleibt neutral eingefärbt und darf
  nicht mit dem Zustand einer getroffenen Auswahl verwechselbar sein.
- Der Optionstext steht in Primärfarbe und Lesegrösse, nicht gedämpft. Er ist
  Inhalt des Instruments. Eine Überschrift „Legende“ entfällt.
- Die Codes werden **nicht** nach Schweregrad eingefärbt. Mehrere Skalen
  enthalten den Code 8 als Nicht-Antwort (nicht vorgekommen, unsicher, nicht
  bestimmbar, keine Antwort), und I2 ist kategorial statt ordinal. Ein Verlauf
  wäre fachlich irreführend und würde Kodierung nach Farbeindruck begünstigen.
- **Kurzlabel-Ausnahme:** Wenn das längste Optionslabel höchstens 28 Zeichen
  hat und es höchstens 4 Optionen gibt, entfällt die Legende und die
  Bedienflächen tragen den Text direkt. Die Bedingung wird aus dem Seed
  berechnet.
- Trägt ein Sub-Item `groupHeading`, erscheint diese als Zwischenüberschrift
  über der Zeile. Betrifft I2 (6 Gruppen), J3 (7), N1 (1).

### 4.3 Matrix mit Antwortspalten

Betrifft G1. Das Item trägt `columns`; jedes Sub-Item wird einmal pro Spalte
beantwortet.

- Die Spaltenbezeichnungen (`Effektive Leistungsfähigkeit`,
  `Vermutete Leistungsfähigkeit`) stehen als Überschrift über den
  Codefeldgruppen, vollständig lesbar.
- Jede Zeile zeigt Titel und Erläuterung des Sub-Items einmal, danach eine
  Codefeldgruppe je Spalte.
- Der gespeicherte Antwortcode ist Sub-Item-Code plus kleingeschriebener
  Spaltencode, also `G1a` plus `A` ergibt `G1aa`.
- Die Legende gilt für alle Spalten gemeinsam und erscheint einmal.

### 4.4 Gestapelt (jedes Sub-Item mit eigenen Optionen)

Titel und Anweisung des Items, darunter jedes Sub-Item als eigener Block nach
Regel 4.1.

### 4.5 Feldgruppe (nur Freitext-, Zahl- oder Datumsfelder)

Titel und Anweisung, darunter die Felder untereinander mit Beschriftung.
Zahlenfelder zeigen ihre Einheit als Suffix, sofern im Seed hinterlegt.

### 4.6 Zusatzfelder unter einer Zeile

Betrifft N2 bei Physiotherapie, Ergotherapie und Logopädie.

- Bei Auswahl `Ja` erscheinen die Zusatzfelder eingerückt unter der Zeile.
- Über ihnen steht `attachmentIntro` wortgetreu.
- Jedes Feld zeigt seinen gedruckten Marker, seine vollständige Beschriftung
  und seine Einheit. Der Titel des übergeordneten Sub-Items wird nicht
  wiederholt.

### 4.7 Lange Optionslisten

Ab 8 Antwortoptionen: ein Bedienelement, das etwa fünf Optionen sichtbar
zeigt, scrollbar ist und ein Suchfeld zum Filtern enthält. Reihenfolge immer
wie im Seed, keine Option wird entfernt oder vorsortiert. Einfachauswahl.

### 4.8 Wiederholblöcke

**Fester Block** (`repeatRows`, betrifft I3): Die angegebene Anzahl Zeilen
wird angeboten, jede mit den definierten Feldern nebeneinander. Die `footnote`
steht unter dem Block.

**Block nach Anzahl** (`repeatable`, betrifft P2): Zuerst ein Zahlenfeld für
die Anzahl, danach entsprechend viele Blöcke mit den definierten Feldern.

### 4.9 Freitext-Optionen

Optionen mit `freeText` erhalten bei Auswahl ein zusätzliches Textfeld direkt
daneben. Betrifft Z2 Option 13.

---

## 5. Übergreifende Elemente

### 5.1 Beobachtungsperiode

Weicht die Periode eines Items oder Sub-Items von der Standardperiode ab,
erscheint sie als Kennzeichnung direkt beim Titel. Ohne Abweichung nichts.
Betrifft 12 Stellen.

### 5.2 Skip-Logik

Der Zustand übersprungener Bereiche und Items wird laufend ermittelt.
Übersprungene Bereiche sind in der Navigation erkennbar und nicht bearbeitbar.
Übersprungene Felder zählen weder als offen noch als erfasst.

### 5.3 Fortschritt

Angezeigt wird die verbleibende Arbeit: offene Eingabefelder pro Bereich und
insgesamt, unter Berücksichtigung der Skip-Logik.

### 5.4 Kopfbereich

Zertifizierungshinweis, Instrumentbezeichnung und Fortschritt belegen zusammen
höchstens eine kompakte Zeile. Beim Scrollen bleibt eine schmale Leiste mit
Bereichscode und offenen Feldern sichtbar.

### 5.5 Legenden-Zugriff beim Scrollen

Die Legende wird **nicht** dauerhaft in der Leiste mitgeführt. Bei G2 wären das
acht Optionen mit bis zu 163 Zeichen, also rund 300 Pixel dauerhaft belegter
Höhe auf einem Bildschirm mit etwa 700 nutzbaren Pixeln, und die Leistenhöhe
würde bei jedem Itemwechsel springen.

Stattdessen erscheint in der Leiste ein kompakter Hinweis mit dem Item-Code und
einem Aufklapp-Symbol, sobald

- die Legende des Items nicht mehr sichtbar ist **und**
- noch mindestens eine Zeile dieses Items sichtbar ist.

Ist die Legende sichtbar oder das Item verlassen, erscheint der Hinweis nicht.
Bei Items ohne Legende erscheint er nie.

Ein Klick klappt die vollständige Legende auf, in derselben Gestaltung wie im
Item. Der aufgeklappte Zustand verdeckt keine Eingabefelder: Er schiebt den
Inhalt nach unten oder schliesst sich, sobald ein Antwortfeld bedient wird.
Ein erneuter Klick schliesst ihn.

### 5.6 Zertifizierungshinweis

Solange nicht zertifiziert, weist der Screen sichtbar und dauerhaft darauf hin,
dass es sich um eine nicht zertifizierte Vorabversion handelt, die nicht für
echte Klientendaten verwendet werden darf.

---

## 6. Ausgeschlossen

- Radiobuttons und Checkboxen mit separatem Auswahlpunkt
- Optionstexte als Spaltenüberschriften
- Abgeschnittene oder mit Auslassungspunkten verkürzte Beschriftungen
- Ausblenden von Anweisungen, Erläuterungen oder Anmerkungen
- Automatische Vorbelegung von Antwortwerten
- Sammelaktionen, die mehrere Felder ohne Einzelentscheid setzen
- Textanalyse im Renderer zur Ableitung von Struktur
- Horizontales Scrollen innerhalb eines Items
- Jede Änderung am Seed durch den Renderer
- Elemente, die je nach Zustand erscheinen oder verschwinden und dadurch das
  Layout verschieben