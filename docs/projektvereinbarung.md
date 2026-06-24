# Projektvereinbarung — Spitex Cockpit

**Zwischen**
Wondercode GmbH, Zürich („Auftragnehmer")
und
Spitex Kaufmann AG, Zürich („Auftraggeber")

**Datum:** 10. Juni 2026
**Dokumentversion:** 1.0

---

## A. Gegenstand und Zweck

Der Auftragnehmer entwickelt und liefert das **Spitex Cockpit** — eine operative Verwaltungsplattform für die Angehörigenpflege, die die bestehenden Excel-, Word- und papierbasierten Prozesse des Auftraggebers für Patienten-Onboarding, Angehörigen-Administration, Dokumentenverwaltung, Workflow-Tracking und Aufgabenverwaltung ablöst.

Die Plattform wird in zwei Phasen geliefert:

| Phase | Umfang | Go-Live |
|-------|--------|---------|
| **Phase 1** | Operativer Kern — Mandate erfassen und verwalten (Onboarding, Patienten, Angehörige, Pendenzen, Dokumente, Workflows) | **30. September 2026** |
| **Phase 2** | Klinische Intelligenz — InterRAI-Assessments, Pflegeplanung (NANDA), KLV-Verordnungen, AI-Assistentin Anna, Gesprächsaufnahme, Arzt-Anfrage-Automatisierung, Zuteilungs-Matching | **4. Januar 2027** |

---

## B. Anforderungskatalog

Der beigelegte **Anforderungskatalog (Anhang 1)** definiert den verbindlichen Funktionsumfang pro Phase. Jede Anforderung enthält:

- **ID** — eindeutige Kennung für die Nachverfolgung
- **Phase** — 1 oder 2
- **Anforderung** — Kurztitel
- **Beschreibung** — detaillierte Spezifikation der gelieferten Funktionalität
- **Status** — „Zugesagt" (Umfangszusage des Auftragnehmers)
- **Abnahme** — wird beim Go-Live befüllt (Abgenommen / Nicht abgenommen)

Der Katalog umfasst **96 Anforderungen** in **23 thematischen Abschnitten**:

- Phase 1: **50 Anforderungen** (operativer Kern)
- Phase 2: **46 Anforderungen** (klinische Intelligenz)

---

## C. Verfeinerungsperiode

Innerhalb von **14 Kalendertagen** nach Unterzeichnung dieser Vereinbarung (die „Verfeinerungsperiode", bis **[Datum einsetzen]**) werden die Anforderungen gemeinsam auf Feld-Ebene spezifiziert. Dies umfasst:

1. **Konkrete Datenfelder pro Objekt** (Patient, Angehöriger, Onboarding-Vorgang, Ticket)
2. **Pflichtfeld- und Optionalfeld-Klassifikation** pro Objekt
3. **Validierungsregeln und Abhängigkeiten** (z.B. konditionelle Felder bei bestimmtem Aufenthaltsstatus)
4. **Anpassungen an bestehenden Anforderungen** (Umformulierung, Zusammenlegung, Aufteilung zur Präzisierung)

Das Ergebnis der Verfeinerungsperiode wird als **aktualisierter Anhang 1 (Version 2)** beiden Parteien zugestellt und ersetzt den ursprünglichen Anhang.

**Scope-Grenze:** Neue Anforderungen, die über den bestehenden Katalog hinausgehen (d.h. Funktionalität, die durch keine der 96 Anforderungen abgedeckt ist), werden als **Change Request** behandelt und unterliegen einer separaten Aufwandschätzung und Vereinbarung.

---

## D. Lieferung und Abnahme

### D.1 Phase 1 — Go-Live 30. September 2026

**Lieferkriterien:**
- Alle Phase-1-Anforderungen im Katalog sind implementiert und in der Produktionsumgebung bereitgestellt
- Die Anwendung ist über den Webbrowser erreichbar (Desktop, Tablet, Smartphone)
- Die SharePoint-Integration ist operativ für die Dokumentenablage
- Benutzerkonten sind für die Mitarbeitenden des Auftraggebers eingerichtet

**Abnahmeprozess:**
1. Der Auftragnehmer führt einen **geführten Demo-Durchlauf** mit dem Auftraggeber durch, der alle Phase-1-Anforderungen abdeckt
2. Der Auftraggeber hat **5 Arbeitstage** ab dem Demo-Durchlauf, um das System zu testen und Mängel zu melden
3. Ein Mangel ist definiert als: eine Phase-1-Anforderung, die nicht wie im Katalog beschrieben funktioniert
4. Kritische Mängel (blockieren den Tagesbetrieb) werden vor dem Go-Live behoben; nicht-kritische Mängel werden innerhalb von 10 Arbeitstagen nach Go-Live behoben
5. Der Auftraggeber markiert jede Anforderung im Katalog als **„Abgenommen"** oder **„Nicht abgenommen"** (mit Mangelbeschreibung)
6. Phase 1 gilt als abgenommen, wenn alle Phase-1-Anforderungen als „Abgenommen" markiert sind

### D.2 Phase 2 — Go-Live 4. Januar 2027

Gleicher Abnahmeprozess wie Phase 1, angewendet auf die Phase-2-Anforderungen.

---

## E. Ausschlüsse

Folgendes ist **ausdrücklich nicht Teil** dieser Vereinbarung:

| Ausschluss | Begründung |
|------------|------------|
| MedLink-Integration (Abrechnung, Leistungserfassung) | Separates System; Schnittstellendefinition noch nicht festgelegt |
| Einsatzplanung und Dienstpläne | Nicht im Scope des Cockpits |
| Reporting-/BI-Dashboards über die Phase-1-KPIs hinaus | Auf eine mögliche Phase 3 verschoben |
| Datenmigration aus bestehenden Excel-/Word-Dateien | Bei Bedarf separat zu vereinbaren |
| On-Premise-Hosting | Die Anwendung wird in der Cloud betrieben |
| Schulungsmaterialien und Endbenutzer-Schulungen | Bei Bedarf separat zu vereinbaren |

---

## F. Technische Rahmenbedingungen

| Annahme | Detail |
|---------|--------|
| Hosting | Cloud-gehostet (Auftragnehmer-verwaltet), HTTPS |
| Browser-Unterstützung | Aktuelle Versionen von Chrome, Safari, Edge, Firefox |
| Geräte-Unterstützung | Desktop, iPad (Hoch- und Querformat), Smartphone |
| SharePoint | Der Auftraggeber stellt eine SharePoint-Umgebung mit API-Zugangs­daten bereit |
| Authentifizierung | Der Auftragnehmer implementiert die Authentifizierung; der Auftraggeber liefert die Benutzerliste und Rollenzuordnungen |
| Datenschutz | Sensible Daten (AHV, ZEMIS, IBAN, medizinische Daten) werden verschlüsselt gespeichert und übertragen |

---

## G. Verantwortlichkeiten

### Auftragnehmer (Wondercode GmbH)
- Design, Entwicklung und Bereitstellung des Spitex Cockpits
- Fehlerbehebungen während der Abnahmeperioden
- Technische Dokumentation (API und Datenmodell)
- Einrichtung und Betrieb der Produktionsumgebung

### Auftraggeber (Spitex Kaufmann AG)
- Teilnahme an der Verfeinerungsperiode (Feld-Spezifikation)
- Zeitgerechtes Feedback während der Abnahmeperioden (5 Arbeitstage)
- Bereitstellung der SharePoint-Umgebung und Zugangsdaten
- Bereitstellung der Benutzerliste mit Rollen
- Benennung einer Ansprechperson für Projektentscheidungen
- Fachliche Validierung (z.B. Korrektheit der InterRAI-Items, KLV-Katalog, Compliance-Regeln)

---

## H. Change Requests

Jede Funktionalität, die nicht durch die 96 Anforderungen in Anhang 1 abgedeckt ist, gilt als Change Request. Change Requests folgen diesem Prozess:

1. Der Auftraggeber beschreibt die gewünschte Funktionalität schriftlich
2. Der Auftragnehmer schätzt den Aufwand und Zeitrahmen innerhalb von 5 Arbeitstagen
3. Beide Parteien einigen sich auf Umfang, Zeitrahmen und Kosten vor Implementierungsbeginn
4. Genehmigte Change Requests werden dem Anhang 1 mit einer neuen ID und Phasenzuordnung hinzugefügt

---

## I. Geistiges Eigentum

- Der **Quellcode** des Spitex Cockpits ist Eigentum des Auftragnehmers
- Der Auftraggeber erhält eine **dauerhafte, nicht-exklusive Lizenz** zur Nutzung der Software für seinen Betrieb
- **Daten des Auftraggebers** (Patienten-, Angehörigen-Datensätze, Dokumente) bleiben jederzeit Eigentum des Auftraggebers
- Bei Vertragsbeendigung exportiert der Auftragnehmer alle Daten des Auftraggebers in einem Standardformat (CSV/JSON) innerhalb von 30 Tagen

---

## J. Vertraulichkeit

Beide Parteien verpflichten sich, alle projektbezogenen Informationen vertraulich zu behandeln. Insbesondere:

- Patienten- und Angehörigendaten unterliegen dem Schweizer Datenschutzgesetz (DSG/nDSG)
- Der Auftragnehmer greift nicht zu anderen Zwecken als Entwicklung, Test und Support auf Daten des Auftraggebers zu
- Testumgebungen verwenden, wo immer möglich, anonymisierte oder synthetische Daten

---

## Unterschriften

| | Auftragnehmer | Auftraggeber |
|---|---------------|--------------|
| **Firma** | Wondercode GmbH | Spitex Kaufmann AG |
| **Name** | _________________________ | _________________________ |
| **Funktion** | _________________________ | _________________________ |
| **Datum** | _________________________ | _________________________ |
| **Unterschrift** | _________________________ | _________________________ |

---

**Anhänge:**
- **Anhang 1:** Anforderungskatalog (anforderungskatalog-kunde.csv) — 96 Anforderungen, 23 Abschnitte, Phase 1 + Phase 2
- **Anhang 2:** Feld-Spezifikation (wird am Ende der Verfeinerungsperiode geliefert)
