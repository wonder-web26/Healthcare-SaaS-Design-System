# Mobile-Läufe — Mapping und offene Entscheidungen

Dieses Dokument hält Zuordnungen und offene Entscheidungen der Mobile/Tablet-Läufe
fest (Lauf 1: Grundlage, Onboarding, Pendenzen · Lauf 1b: Nachbesserung).

## Offene Entscheidungen

| # | Entscheidung | Stand | Kontext |
|---|---|---|---|
| M-1 | Soll der schwebende Anna-Knopf auch auf dem Desktop (≥ 1024 px) die schwebende Position verlassen und in ein Menü des Kopfbereichs wandern? | **offen** | Lauf 1b, Änderung 8: Unter 1024 px wurde er entfernt (er überdeckte Aktionen und Fusszeilen) und durch den Eintrag «Anna öffnen» im Topbar-Benutzermenü ersetzt. Auf dem Desktop bleibt er unverändert unten rechts. |

## Zähler-Zuordnung Kopfbereich (Lauf 1b, Änderung 1)

Unter 1024 px entfallen die drei Kopfbereich-Marken des Onboarding-Details.
Ihre Zahlen erscheinen stattdessen:

| Marke (Desktop) | Ort unter 1024 px |
|---|---|
| «N überfällig» | Zähler-Punkt an der Seitenspalten-Schaltfläche (dort lebt der Workflow) |
| «N Dokumente offen» / «N Pflichtdok. fehlen» | Zähler am Reiter «Dokumente» des Angehörigen-Schritts und des Patienten-Schritts (je eigener Anteil) |
| «N von M Schritten» | **entfällt als Zähler** — die Schrittleiste zeigt denselben Stand über die Zustandssymbole je Schritt (erledigt/in Bearbeitung/ausstehend) |

## Pendenzen: Statuswechsel und manuelles Anlegen (Lauf «Pendenzen erstellen»)

- **Bestätigungspflicht Statuswechsel:** Ein Klick auf einen anderen Status wählt vor
  und speichert nicht. Gespeichert wird über die Bestätigungszeile (Speichern/Abbrechen)
  im Detail; Sammelaktionen und Anna-Demoaktionen bestätigen über eine kurze Rückfrage
  bzw. den bestehenden Demo-Dialog. Verlassen mit offener Vorauswahl fragt nach.
  Jeder Wechsel steht im Verlauf: alt → neu, Person, Zeitpunkt. Beim Wechsel auf
  «Abgeschlossen» zusätzlich eine optionale Abschlussbemerkung (eigener Verlaufseintrag).
- **Wiedereröffnen:** Eine abgeschlossene Pendenz kann heute über denselben Umschalter
  wieder geöffnet werden (bestehendes Verhalten, von diesem Lauf nicht berührt).
- **Herkunft:** Manuell erstellte Pendenzen tragen `quelle: "manuell"` mit erstellender
  Person und Zeitpunkt; der Verlauf zeigt «Pendenz manuell erstellt». Automatisch
  erzeugte tragen ihren Auslöser (workflow/ticket/rhythmus).
- **Entfallenes Feld:** Die Personensuche im Neue-Pendenz-Dialog umfasst Klientinnen
  und Angehörige, **nicht Mitarbeitende** — PersonArt kennt bewusst keine Mitarbeitenden
  (personen-aufloesung.ts: Personaladministration ausserhalb des Produktumfangs).
  Kategorie- und Prioritäts-Werteliste sowie der Mitarbeitendenbestand für «Zuständig»
  existieren; kein weiteres Feld entfällt.

## Gekürzte Filterbezeichnungen (Lauf 1b, Änderung 2, nur unter 1024 px)

Volle Bezeichnung bleibt als `title`/`aria-label` erhalten.

| Liste | Voll | Gekürzt |
|---|---|---|
| Onboarding | Startdatum überschritten | Startdatum |
| Onboarding | Pendenz überfällig | Überfällig |
| Onboarding | Pflichtdokument offen | Pflichtdok. |
| Onboarding | Nicht zugewiesen | Nicht zugew. |
| Pendenzen | Diese Woche fällig | Diese Woche |

## Patientenverfügung und Vorsorgeauftrag (Lauf «Vorsorge»)

- **Zwei getrennte Instrumente** im Abschnitt Vorsorge (Reiter Soziales): Patientenverfügung
  (Art. 370 ff. ZGB) und Vorsorgeauftrag (Art. 360 ff. ZGB), je dreiwertig
  ja/nein/unbekannt mit Vorgabe **unbekannt** («nein» = es gibt keine; «unbekannt» = niemand hat gefragt).
- **O2-Ableitung offen:** interRAI O2 wird künftig abgeleitet — `1. Ja`, wenn eines der beiden
  Instrumente «ja» ist; sonst `0`. **Nicht gebaut**, weil der Bereich O im interRAI-Renderer
  nicht existiert (geprüft: 0 Treffer im Renderer).
- **Chipbeschriftung ungekürzt:** «In Patientenverfügung bezeichnet» bleibt voll ausgeschrieben —
  jede Kürzung verlöre die Herkunft, und die ist der Punkt: Die Person entscheidet kraft
  Willenserklärung der Klientin, nicht kraft behördlicher Anordnung.
- Unit-Test zu V11 (Wertehaltung beim Umschalten) entfällt mangels Test-Runner im Repo —
  als Browser-Prüfung durchgeführt.

## Bezugspersonen-Dialog: Merkmalgruppen (Lauf «Bezugspersonen»)

- **Eine Wahrheitsquelle:** Gruppen, Rollenmatrix und Sonderregeln stehen in
  `lib/beziehungen/merkmalkonfig.ts`; der Dialog rendert ausschliesslich daraus
  (kein `if (rolle === …)` im Markup). Nicht zutreffende Merkmale sind
  ausgeblendet, nicht ausgegraut; leere Gruppen entfallen.
- **Vorsorgeauftrag entflochten:** Das Instrument (Existenz, KESB-Validierung)
  führt der Klient im Abschnitt Vorsorge; die Beziehung trägt nur noch
  `imVorsorgeauftragBeauftragt`. `beistandschaft.vorsorgeauftrag` wurde
  herausgelöst — ein Vorsorgeauftrag ist keine Beistandschaft.
- **KESB-Hinweis weggelassen:** Der Hinweis «Noch nicht wirksam …» braucht den
  Validierungsstand des Klienten; der lebt nur im Formularzustand
  (PatientFormData), nicht in einem Store. Kein Umbau des Datenflusses dafür —
  Hinweis entfällt, bis das Vorsorge-Instrument in einen Store wandert.
- **Vertretung von Gesetzes wegen (Nachtrag 3, danach gelockert):** wird
  ERFASST — Feld `vertretungVonGesetzesWegen` an der Beziehung. Die mit
  Nachtrag 3 eingeführten Vorbedingungen (Beziehungsart Ehe/eingetragene
  Partnerschaft; gemeinsamer Haushalt ODER unbezahlte Betreuung) wurden auf
  Anweisung wieder entfernt: der Chip ist bei Angehörigen und pflegenden
  Angehörigen (Privatpersonen) frei wählbar, die fachliche Prüfung liegt bei
  der erfassenden Person. Der generische Mechanismus `setztVorausEines`
  (ODER-Voraussetzung mit deaktiviertem Chip und title-Begründung) bleibt in
  der Konfiguration erhalten, wird aktuell aber von keinem Merkmal genutzt.
  Die Rangfolge gegenüber Beistandschaft Gesundheit und Vorsorgeauftrag ist
  bewusst NICHT abgebildet (braucht juristische Abnahme).
- **Beistandschaft entkoppelt:** administrativ/gesundheit sind bei Angehörigen
  UND Beistand führbar (nicht mehr an die Rolle gebunden). Nachweis (Ernennung
  vom, Beleg vorhanden) hängt an der Beistandschaft und wandert später an ein
  eigenes Instrument-Objekt; die Zuordnungs-Merkmale Patientenverfügung/
  Vorsorgeauftrag tragen bewusst keinen Nachweis.
- **Listen-Chips unverändert:** Die Zeilen zeigen weiterhin Rolle,
  Notfallkontakt, Auskunftsberechtigt, In Patientenverfügung bezeichnet;
  Chips für die neuen Merkmale sind bewusst zurückgestellt.

## Hilflosenentschädigung: Grad (Lauf «HE-Grad»)

Neues Feld `hilflosenentschaedigungGrad` (leicht/mittel/schwer, Werteliste in
`lib/stammdaten/hilflosenentschaedigung.ts`), nur sichtbar und Pflicht bei
Ja-Nein = «ja»; beim Verlassen von «ja» wird der Wert gelöscht. Besprochen und
bewusst zurückgestellt:
- Status (`nicht geprüft`, `beantragt`, `zugesprochen`, `abgelehnt`)
- Träger: IV, AHV, UVG, MVG
- Verfügungsdatum, Verfügungsnummer, Gültigkeit
- Abgrenzung zum Assistenzbeitrag: setzt HE-Bezug voraus und verlangt, dass die
  versicherte Person selbst Arbeitgeberin ist — mögliche Kollision mit dem
  Anstellungsmodell ist anwaltlich zu klären.
