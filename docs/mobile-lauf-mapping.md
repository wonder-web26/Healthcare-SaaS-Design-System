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

## Gekürzte Filterbezeichnungen (Lauf 1b, Änderung 2, nur unter 1024 px)

Volle Bezeichnung bleibt als `title`/`aria-label` erhalten.

| Liste | Voll | Gekürzt |
|---|---|---|
| Onboarding | Startdatum überschritten | Startdatum |
| Onboarding | Pendenz überfällig | Überfällig |
| Onboarding | Pflichtdokument offen | Pflichtdok. |
| Onboarding | Nicht zugewiesen | Nicht zugew. |
| Pendenzen | Diese Woche fällig | Diese Woche |
