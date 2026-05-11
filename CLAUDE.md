# Spitex Cockpit — Projekt-Konventionen

Dieses Dokument beschreibt, wie in diesem Projekt gebaut wird. Bitte vor jeder Aufgabe lesen und die Konventionen einhalten. Bei Unklarheiten hier nachschauen, bevor du im Code rätst.

---

## Verbindliche Referenz-Dokumente

Für UI- und UX-Themen gilt die styleguide.md als verbindliche Referenz. Lies sie vor jeder Komponenten-Implementation und folge ihren Regeln strikt.

Bei Konflikten zwischen den beiden Dokumenten:
- styleguide.md hat Vorrang bei: Farben, Komponenten, Typografie, Spacing, Rundungen, Linien, Schatten, Pills, Buttons, Inputs, Tabs, Cards, Avataren, Icons, Anna-Akzenten
- CLAUDE.md hat Vorrang bei: Architektur, Datenmodell, Fachlichkeit, Naming-Konventionen, Routing, Auth, Mock-Daten-Organisation, Tech-Stack-Entscheidungen

Wenn du eine neue Komponente baust oder eine bestehende änderst, prüfe die styleguide.md zuerst. Wenn etwas nicht dokumentiert ist, frage zurück oder folge der Designhaltung in Sektion 1 des Style-Guides – nicht selbst Designentscheidungen erfinden.

---

## Was dieses Produkt ist

Ein modernes, operatives Cockpit für die Angehörigenpflege der Spitex Kaufmann. Es löst bisherige Excel-Listen, Word-Dokumente und manuelle Notizen ab und steuert die administrativen Prozesse rund um Patienten, pflegende Angehörige, Onboarding, Dokumente, Workflow-Aufgaben, Pflegekraft-Zuteilung und HR-/Compliance-Themen.

Das Produkt ist kein klassisches CRM und kein Ticket-System. Es ist ein Prozess-Cockpit mit klarer Trennung zwischen automatisch generierten Workflow-Aufgaben (Prozess) und Service-Desk-Tickets (ad hoc).

Der administrative Teil läuft im Cockpit, die medizinische Leistungserfassung und Abrechnung bleibt bei einem externen System namens MedLink. Das Cockpit ist die operative Oberfläche davor.

---

## Zielgruppen und Rollen

Drei Rollen mit unterschiedlichen Blickwinkeln auf dieselben Daten:

- Pflegefachkraft – sieht die zugewiesenen Klienten und Angehörigen, kann Aufgaben bearbeiten, Dokumente lesen und hochladen
- Koordination / Teamleitung – verwaltet Zuteilungen, sieht Workflow-Übersichten, steuert operativ
- HR / Admin – Vertragsgenerierung, Stammdatenpflege, SRK-Compliance, Benutzerverwaltung

Der Prototyp hat eine funktionierende Auth mit Rollen. Rollen-Guards gehören auf Route-Ebene und auf Datenebene, nicht nur auf UI-Ebene.

---

## Kerndomäne

- Ein Patient existiert einmal, ein Angehöriger existiert einmal
- Ein Patient kann mehrere Angehörige haben, ein Angehöriger kann mehrere Patienten pflegen (n:m)
- Die Verknüpfung läuft intern über ein Mandat-/Beziehungs-Objekt, das in der UI nicht als eigenes Konzept auftaucht. Intern sauber, nach aussen unsichtbar
- Der Angehörige ist bei der Spitex Kaufmann im Stundenlohn angestellt, daher braucht es umfangreiche HR-Daten (Quellensteuer, Kinderzulagen, Partner, Bankverbindung)
- Der SRK-Kurs ist Pflicht. Wenn er nicht innerhalb eines Jahres nach Vertragsunterzeichnung absolviert wird, werden Leistungen pausiert
- Workflow-Aufgaben werden automatisch erzeugt, nicht manuell. Service-Desk-Tickets sind eine separate Welt

---

## Compliance-Gates

Bestimmte fachliche Konstellationen lösen automatische Compliance-Gates aus, die das UI hart erzwingt. Diese Gates dürfen niemals umgangen werden – weder durch neue UI-Pfade, noch durch Anna, noch durch Schreib-APIs.

Drei Schärfegrade etabliert:

- Hard Gate (Vertragsblockade): Aufenthaltsstatus B + Pflegekontext löst eine Spezialbewilligungs-Pflicht beim Migrationsamt aus. Vertragsunterzeichnung ist blockiert, bis die Einreichungs-Bestätigung hochgeladen ist. Dynamischer Sidebar-Schritt erscheint im Onboarding.
- Medium Validation: Aufenthaltsstatus G (Grenzgängerbewilligung) erfordert Upload des Ausweis G als Dokument. Kein Block, aber prominenter Hinweis mit direkter Upload-Aktion in Warnfarbe.
- Soft Validation: Unterhaltspflichtige Kinder oder Kinderzulagen über Spitex erfordern Familien-/Geburtsurkunde-Upload als Pflicht-Dokument. Kein Block, neutral-informativer Hinweis.

Bei jeder neuen Schreib- oder Erstell-Aktion (UI oder API) muss geprüft werden, ob ein Compliance-Gate greift und wie es umgesetzt wird.

---

## Tech-Stack

- Next.js 15 mit App Router
- TypeScript, strict mode
- Tailwind CSS
- shadcn/ui für UI-Primitives
- lucide-react für Icons
- React Hook Form plus Zod für Formulare und Validierung
- Prisma plus PostgreSQL
- Auth.js (NextAuth v5) für Authentication und Rollenprüfung
- TanStack Table für Listen mit Filtern
- Server Components sind Default. Client Components nur wo nötig (Interaktivität, State, Event Handler). Marker "use client" bewusst setzen

Nicht verwenden ohne Rückfrage: andere Chart-Libraries (Recharts, Chart.js, Tremor), andere Table-Libraries, andere Form-Libraries, andere Icon-Sets, andere UI-Libraries.

---

## Projektstruktur

```
app/                      Next.js App Router
  (auth)/                 Public routes, Login, Signup
  (app)/                  Geschützte Routes, alles hinter Auth
    dashboard/
    klienten/
    angehoerige/
    onboarding/
    aufgaben/
    service-desk/
    einstellungen/
  api/                    Route Handlers wo nötig

components/
  ui/                     shadcn-Komponenten
  shared/                 Projektweit wiederverwendbare Komponenten
  dashboard/              Dashboard-spezifische Komponenten
  klient/                 Klienten-spezifisch
  angehoeriger/           Angehörige-spezifisch
  onboarding/             Onboarding-Flow-Komponenten
  dokumente/              Dokumenten-Explorer und Upload
  anna/                   AI-Assistent Anna (Sidebar, Konversations-Logik)

lib/
  auth/                   Auth.js-Konfiguration, Session-Helper
  db/                     Prisma Client, Connection
  mocks/                  Mock-Daten für den Prototyp, nach Domäne getrennt
  utils/                  Helper-Funktionen
  validators/             Zod-Schemas

prisma/
  schema.prisma
  seed.ts

types/                    Globale TypeScript-Typen
```

Neue Komponenten landen im passenden Unterordner. Wenn unklar, lieber spezifisch als shared.

---

## Namenskonventionen

- Datei- und Ordnernamen: kebab-case, deutsch oder englisch je nach Kontext. Fachliche Begriffe bleiben deutsch (klient-detail.tsx, angehoeriger-form.tsx), technische englisch (use-debounce.ts)
- Komponenten: PascalCase, deutsch für fachliche Komponenten (KlientListe, AngehoerigerDetail), englisch für generische (DataTable, EmptyState)
- Props-Typen: KlientListeProps, direkt neben der Komponente deklariert
- Variablen: camelCase, deutsch für fachliche Konzepte (angehoerige, schweregrad), englisch für Technisches (isLoading, onSubmit)
- URLs und Routen: deutsch, kebab-case, Umlaute vermeiden (/angehoerige statt /angehörige, /onboarding bleibt englisch weil etablierter Fachbegriff)
- Deutsche Sonderzeichen in Code: in Strings und Labels erlaubt und erwünscht. In Dateinamen, Routen, Variablen und Prisma-Models nicht verwenden (ASCII-only für Technisches)

---

## Mock-Daten

Solange keine echten Daten existieren, arbeiten wir mit Mocks.

- Alle Mocks leben unter lib/mocks/, getrennt nach Domäne (klienten.ts, angehoerige.ts, aufgaben.ts, onboarding.ts)
- Mocks sind typisiert mit denselben Typen wie die späteren Echt-Daten
- Mocks sind realistisch: echte deutschsprachige Namen, plausible Daten, plausible Mengenverhältnisse. Nicht Lorem Ipsum
- Komponenten importieren Mocks nicht direkt. Pages importieren Mocks und reichen sie via Props an die Komponenten weiter. So bleibt der Wechsel zu echten Daten eine Änderung an einer Stelle
- Aktuelles Datum in Mocks: 3. März 2026 (Dienstag). Alle zeitlichen Bezüge (Fälligkeiten, Vormonatsvergleiche) sind darauf ausgerichtet

---

## Maskierung sensibler Daten

Standardmässig maskiert angezeigt:

- AHV-Nummer (eigene, Partner, Kinder)
- ZEMIS-Nummer
- IBAN und Kontoverbindungen
- Identifikationsnummern generell

Nicht maskiert:

- Adresse, Telefon, E-Mail
- Krankenkasse, Hausarzt
- Statusinformationen

Maskierte Felder haben ein Aufdeck-Icon. Das Aufdecken ist ein bewusster Akt, kein Hover-Gag. Aufdeckungen werden geloggt (auditierbar). AHV-Nummern dürfen nicht dauerhaft prominent in Listen sichtbar sein.

---

## Interaktions-Konventionen

Visuelle Details (Farben, Pill-Formen, Border-Radien, Spacing) stehen ausschliesslich in der styleguide.md. Diese Sektion regelt nur das fachliche Interaktions-Verhalten.

- Primär-Button: maximal einer pro Sektion. Auf dem Dashboard ist das "+ Neuer Klient", in der Service-Desk-Ansicht "+ Neues Ticket"
- Listen-Einträge: ganze Zeile ist klickbar, Hover-State auf der Zeile
- Inline-Aktionen: Slide-over-Sidebar für Kontext-Aktionen, nicht Modal
- Bestätigungs-Dialoge: nur bei destruktiven Aktionen
- Formulare: Inline-Validierung via Zod, Fehler unter dem jeweiligen Feld, nicht oben als Fehlerblock
- Fehlermeldungen: freundlich und lösungsorientiert formuliert, auf Deutsch
- Toast-Benachrichtigungen: kurz und neutral. Keine "Success!"-Feier

---

## Accessibility

- Jede Komponente ist tastatur-bedienbar
- Sichtbarer Fokus-Ring auf allen interaktiven Elementen, nicht per outline: none entfernen
- Semantisches HTML: <button> für Aktionen, <a> für Navigation, kein div mit onClick
- ARIA-Labels für ikonen-only Buttons und für Status-Indikatoren, die Farbe als einziges Mittel nutzen
- Kontraste nach WCAG AA, auch bei gedämpfter Sekundär-Schrift

---

## Arbeiten mit Prompts

Prompts beschreiben das Was, nicht das Wie. Das heisst:

- Tailwind-Klassen, konkrete Komponenten-Namen aus shadcn oder Props-Signaturen stehen nicht im Prompt
- Du wählst das Wie selbst, auf Basis der Codebase, der styleguide.md und der Konventionen in diesem Dokument
- Wenn ein Prompt visuell unklar bleibt, orientierst du dich an der styleguide.md. Wenn das nicht reicht, lieber eine kurze Rückfrage stellen als eine Design-Entscheidung zu erfinden

---

## Beim Umsetzen einer neuen Komponente

Reihenfolge, die sich bewährt hat:

1. styleguide.md prüfen, ob die Komponente dort dokumentiert ist
2. Bestehende Komponenten der gleichen Domäne anschauen, um Stil, Tokens und Patterns aufzunehmen
3. Prüfen, was durch die neue Komponente ersetzt oder gelöscht wird. Alte Komponenten und verwaiste Imports aufräumen, nicht liegen lassen
4. Types definieren, Mock-Daten ergänzen wenn nötig
5. Komponente als Server Component bauen, ausser Client-Verhalten ist nötig
6. Komponente in die Page einbinden, Mock-Daten aus lib/mocks/ laden, via Props weitergeben
7. Accessibility prüfen: Tastatur, Fokus, ARIA
8. Layout auf Desktop, iPad und Smartphone-Breite durchschauen
9. Compliance-Gates prüfen: greift bei dieser Komponente eines der drei Schärfegrade?

---

## Was bewusst nicht in diesem Projekt landet

- Leistungserfassung (KLV A/B/C) – lebt in MedLink, nicht hier
- Abrechnung und Factoring – MedLink
- Einsatzplanung und Dienstpläne – nicht Teil des Scopes
- Klassische Chart-Dashboards – das Cockpit ist kein Reporting-Tool
- Schreib-Operationen via Anna – Anna ist in Phase 1 ausschliesslich lesend

---

## Anna – AI-Assistent

Anna ist der eingebaute AI-Assistent des Cockpits. Sie lebt in einer rechten Sidebar und wird über den Anna-Trigger-Button in der Topbar geöffnet.

Aktueller Stand:
- Phase 1: lesende Funktionalität (Suchen, Filter-Anfragen verstehen, Navigation, Tageszusammenfassung, Suggestion-Chips)
- Keine Schreib-, Update- oder Lösch-Operationen
- Mock-basierte Pattern-Erkennung (noch keine echte LLM-Anbindung)
- Compliance-Gates werden auch von Anna respektiert: bei Schreib-Anfragen leitet sie zum entsprechenden UI-Pfad weiter

Geplant für spätere Phasen:
- Phase 2: Diktat-Funktion in Formularen, geführte Aktionen
- Phase 3: Voice-Input, autonomere Aktionen mit expliziter Bestätigung

Annas visuelle Signatur (Malachit-Cerulean-Gradient, Sparkle-Icon, Anna-Empfehlungs-Cards) ist in styleguide.md Sektion 8 dokumentiert.

---

## Sprache

- UI-Sprache: Deutsch (Schweizer Hochdeutsch, kein Schweizerdeutsch, keine ß-Zeichen)
- Code-Kommentare und Dokumentation: Englisch oder Deutsch, konsistent innerhalb einer Datei
- Commit-Messages: Englisch, imperativ ("add klient list filter" statt "added filter")
- Fachbegriffe bleiben deutsch: Klient, Angehöriger, Pflegefachkraft, Onboarding, Schweregrad, Zuteilung. Nicht übersetzen in "Patient" oder "Caregiver", auch wenn ein englischer Code-Kontext das nahelegt