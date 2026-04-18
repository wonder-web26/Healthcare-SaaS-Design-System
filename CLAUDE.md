# Spitex Cockpit — Projekt-Konventionen

Dieses Dokument beschreibt, wie in diesem Projekt gebaut wird. Bitte vor jeder 
Aufgabe lesen und die Konventionen einhalten. Bei Unklarheiten hier nachschauen, 
bevor du im Code rätst.

---

## Was dieses Produkt ist

Ein modernes, operatives Cockpit für die Angehörigenpflege der Spitex 
Kaufmann. Es löst bisherige Excel-Listen, Word-Dokumente und manuelle 
Notizen ab und steuert die administrativen Prozesse rund um Patienten, 
pflegende Angehörige, Onboarding, Dokumente, Workflow-Aufgaben, Pflegekraft-
Zuteilung und HR-/Compliance-Themen.

Das Produkt ist **kein klassisches CRM und kein Ticket-System**. Es ist ein 
Prozess-Cockpit mit klarer Trennung zwischen automatisch generierten 
Workflow-Aufgaben (Prozess) und Service-Desk-Tickets (ad hoc).

Der administrative Teil läuft im Cockpit, die medizinische Leistungserfassung 
und Abrechnung bleibt bei einem externen System namens MedLink. Das Cockpit 
ist die operative Oberfläche davor.

---

## Zielgruppen und Rollen

Drei Rollen mit unterschiedlichen Blickwinkeln auf dieselben Daten:

- **Pflegefachkraft** – sieht die zugewiesenen Klienten und Angehörigen, 
  kann Aufgaben bearbeiten, Dokumente lesen und hochladen
- **Koordination / Teamleitung** – verwaltet Zuteilungen, sieht Workflow-
  Übersichten, steuert operativ
- **HR / Admin** – Vertragsgenerierung, Stammdatenpflege, SRK-Compliance, 
  Benutzerverwaltung

Der Prototyp hat eine funktionierende Auth mit Rollen. Rollen-Guards gehören 
auf Route-Ebene und auf Datenebene, nicht nur auf UI-Ebene.

---

## Kerndomäne

- Ein Patient existiert einmal, ein Angehöriger existiert einmal
- Ein Patient kann mehrere Angehörige haben, ein Angehöriger kann mehrere 
  Patienten pflegen (n:m)
- Die Verknüpfung läuft intern über ein Mandat-/Beziehungs-Objekt, das 
  in der UI **nicht** als eigenes Konzept auftaucht. Intern sauber, nach 
  aussen unsichtbar
- Der Angehörige ist bei der Spitex Kaufmann im Stundenlohn angestellt, 
  daher braucht es umfangreiche HR-Daten (Quellensteuer, Kinderzulagen, 
  Partner, Bankverbindung)
- Der SRK-Kurs ist Pflicht. Wenn er nicht innerhalb eines Jahres nach 
  Vertragsunterzeichnung absolviert wird, werden Leistungen pausiert
- Workflow-Aufgaben werden automatisch erzeugt, nicht manuell. Service-
  Desk-Tickets sind eine separate Welt

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
- Server Components sind Default. Client Components nur wo nötig (Inter-
  aktivität, State, Event Handler). Marker `"use client"` bewusst setzen

Nicht verwenden ohne Rückfrage: andere Chart-Libraries (Recharts, Chart.js, 
Tremor), andere Table-Libraries, andere Form-Libraries, andere Icon-Sets, 
andere UI-Libraries.

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

Neue Komponenten landen im passenden Unterordner. Wenn unklar, lieber 
spezifisch als shared.

---

## Namenskonventionen

- **Datei- und Ordnernamen**: kebab-case, deutsch oder englisch je nach 
  Kontext. Fachliche Begriffe bleiben deutsch (`klient-detail.tsx`, 
  `angehoeriger-form.tsx`), technische englisch (`use-debounce.ts`)
- **Komponenten**: PascalCase, deutsch für fachliche Komponenten 
  (`KlientListe`, `AngehoerigerDetail`), englisch für generische 
  (`DataTable`, `EmptyState`)
- **Props-Typen**: `KlientListeProps`, direkt neben der Komponente deklariert
- **Variablen**: camelCase, deutsch für fachliche Konzepte (`angehoerige`, 
  `schweregrad`), englisch für Technisches (`isLoading`, `onSubmit`)
- **URLs und Routen**: deutsch, kebab-case, Umlaute vermeiden 
  (`/angehoerige` statt `/angehörige`, `/onboarding` bleibt englisch weil 
  etablierter Fachbegriff)
- **Deutsche Sonderzeichen in Code**: in Strings und Labels erlaubt und 
  erwünscht. In Dateinamen, Routen, Variablen und Prisma-Models nicht 
  verwenden (ASCII-only für Technisches)

---

## Mock-Daten

Solange keine echten Daten existieren, arbeiten wir mit Mocks.

- Alle Mocks leben unter `lib/mocks/`, getrennt nach Domäne 
  (`klienten.ts`, `angehoerige.ts`, `aufgaben.ts`, `onboarding.ts`)
- Mocks sind typisiert mit denselben Typen wie die späteren Echt-Daten
- Mocks sind realistisch: echte deutschsprachige Namen, plausible Daten, 
  plausible Mengenverhältnisse. Nicht Lorem Ipsum
- Komponenten importieren Mocks nicht direkt. Pages importieren Mocks und 
  reichen sie via Props an die Komponenten weiter. So bleibt der Wechsel 
  zu echten Daten eine Änderung an einer Stelle
- Aktuelles Datum in Mocks: 3. März 2026 (Dienstag). Alle zeitlichen 
  Bezüge (Fälligkeiten, Vormonatsvergleiche) sind darauf ausgerichtet

---

## UI-Grundsätze

Das Cockpit soll wie ein modernes SaaS-Tool wirken, nicht wie klassische 
Enterprise-Software. Konkret heisst das:

- **Flach**: keine Gradienten, keine Schlagschatten, keine dekorativen 
  Effekte. Klare Flächen, dünne Borders
- **Ruhig**: wenig visuelle Lautstärke. Farbe nur dort, wo sie etwas 
  bedeutet (Status, Warnung, Aktion). Keine Farb-Dekoration
- **Dicht, aber nicht eng**: Informationsdichte ist höher als im typischen 
  Admin-Tool. Paddings sind bewusst knapp gehalten. Grosse Leerräume gelten 
  als Fehler, nicht als Atempause
- **Hierarchie durch Typografie und Abstand, nicht durch Boxen**: Sektions-
  Trenner entstehen durch vertikalen Abstand und Überschriften, nicht durch 
  Rahmen um ganze Sektionen
- **Kontext statt Navigation**: Aktionen passieren dort, wo die Information 
  sichtbar ist. Inline-Editing, Slide-over-Sidebars, keine unnötigen 
  Seitenwechsel
- **Explorer statt Wizard**: Dokumentenbereiche in Detail-Seiten sind 
  explorer-artig (Baum links, Inhalt rechts), nicht wizard-artig
- **Keine sichtbare interne Komplexität**: Fachlich komplexe Modelle (z.B. 
  Patient-Angehöriger-Mandat als n:m) dürfen die UI nicht belasten
- **Mobil- und iPad-tauglich**: primär für Desktop und iPad optimiert, nicht 
  Smartphone-first. Aber Breakpoints funktionieren überall
- **Begrüssung statt Generiertitel**: Dashboard-Seiten beginnen mit Mensch-
  Kontext ("Guten Morgen, Maria"), nicht mit Systembegriff ("Operations-
  Cockpit")

---

## Farb- und Status-System

Nutze die shadcn-Design-Tokens. Status-Bedeutung immer konsistent:

- **Erfolgsfarbe (grün)**: abgeschlossen, bestanden, positiver Trend
- **Warnfarbe (amber)**: Aufmerksamkeit nötig, bald fällig, offen mit Zeit
- **Gefahrenfarbe (rot)**: überfällig, kritisch, sofortige Aktion
- **Neutral (grau)**: rein informativ, ohne Handlungsdruck
- **Primärfarbe (Marken-Violett)**: Haupt-Aktionen, interaktive Links, 
  Sektions-Akzente

Für Schweregrade der Klienten ein eigenes Ampelschema:

- **Leicht**: gedämpftes Grün
- **Mittel**: Amber
- **Schwer**: Rot (gesättigt, aber nicht grell – unterscheidbar von 
  Fehler-Rot)

Phasenfarben für die Onboarding-Pipeline:

- Vorbereitung: Lila / Purple
- KLV-Prozess: Blau
- Aktivierung: Teal

Diese Zuordnung ist projektweit konsistent. Nie umkippen oder mischen.

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

Maskierte Felder haben ein Aufdeck-Icon. Das Aufdecken ist ein bewusster 
Akt, kein Hover-Gag. Aufdeckungen werden geloggt (auditierbar). AHV-
Nummern dürfen nicht dauerhaft prominent in Listen sichtbar sein.

---

## Typografische Konventionen

- **Seitentitel (H1)**: grösste Überschrift der Seite, einmal pro Seite
- **Sektions-Titel (H2)**: mittlere Grösse, mittleres Gewicht
- **Karten-Überschriften**: kleine Grösse, mittleres Gewicht
- **Labels und Metainfos**: kleine Grösse, gedämpfte Farbe
- **Zahlen als Primär-Information**: gross, mittleres Gewicht, eigene 
  Zeile. Sie sind der Anker der Kachel
- **Versal-/Uppercase-Labels**: sparsam. Nur für kleine Gliederungs-Hinweise 
  ("DEIN FOKUS HEUTE"), nicht für normale Labels

---

## Interaktions-Konventionen

- **Primär-Button**: eine pro Seite, in Markenfarbe. Auf dem Dashboard ist 
  das "+ Neuer Klient"
- **Listen-Einträge**: ganze Zeile ist klickbar, Hover-State auf der Zeile
- **Inline-Aktionen**: Slide-over-Sidebar für Kontext-Aktionen, nicht Modal
- **Bestätigungs-Dialoge**: nur bei destruktiven Aktionen
- **Formulare**: Inline-Validierung via Zod, Fehler unter dem jeweiligen 
  Feld, nicht oben als Fehlerblock
- **Fehlermeldungen**: freundlich und lösungsorientiert formuliert, auf 
  Deutsch
- **Toast-Benachrichtigungen**: kurz und neutral. Keine "Success!"-Feier

---

## Accessibility

- Jede Komponente ist tastatur-bedienbar
- Sichtbarer Fokus-Ring auf allen interaktiven Elementen, nicht per 
  `outline: none` entfernen
- Semantisches HTML: `<button>` für Aktionen, `<a>` für Navigation, kein 
  `div` mit `onClick`
- ARIA-Labels für ikonen-only Buttons und für Status-Indikatoren, die 
  Farbe als einziges Mittel nutzen
- Kontraste nach WCAG AA, auch bei gedämpfter Sekundär-Schrift

---

## Arbeiten mit Prompts

Prompts beschreiben das **Was**, nicht das **Wie**. Das heisst:

- Tailwind-Klassen, konkrete Komponenten-Namen aus shadcn oder Props-
  Signaturen stehen nicht im Prompt
- Du wählst das "Wie" selbst, auf Basis der Codebase und der Konventionen 
  in diesem Dokument
- Wenn ein Prompt visuell unklar bleibt, orientierst du dich an den 
  Konventionen oben. Wenn das nicht reicht, lieber eine kurze Rückfrage 
  stellen als eine Design-Entscheidung zu erfinden

---

## Beim Umsetzen einer neuen Komponente

Reihenfolge, die sich bewährt hat:

1. Zuerst bestehende Komponenten der gleichen Domäne anschauen, um Stil, 
   Tokens und Patterns aufzunehmen
2. Prüfen, was durch die neue Komponente ersetzt oder gelöscht wird. Alte 
   Komponenten und verwaiste Imports aufräumen, nicht liegen lassen
3. Types definieren, Mock-Daten ergänzen wenn nötig
4. Komponente als Server Component bauen, ausser Client-Verhalten ist nötig
5. Komponente in die Page einbinden, Mock-Daten aus `lib/mocks/` laden, 
   via Props weitergeben
6. Accessibility prüfen: Tastatur, Fokus, ARIA
7. Layout auf Desktop und iPad-Breite durchschauen

---

## Was bewusst nicht in diesem Projekt landet

- Leistungserfassung (KLV A/B/C) – lebt in MedLink, nicht hier
- Abrechnung und Factoring – MedLink
- Einsatzplanung und Dienstpläne – nicht Teil des Scopes
- Klassische Chart-Dashboards – das Cockpit ist kein Reporting-Tool
- KI-Assistent – in Phase 1 nicht vorgesehen

---

## Sprache

- UI-Sprache: Deutsch (Schweizer Hochdeutsch, kein Schweizerdeutsch, 
  keine ß-Zeichen)
- Code-Kommentare und Dokumentation: Englisch oder Deutsch, konsistent 
  innerhalb einer Datei
- Commit-Messages: Englisch, imperativ ("add klient list filter" statt 
  "added filter")
- Fachbegriffe bleiben deutsch: Klient, Angehöriger, Pflegefachkraft, 
  Onboarding, Schweregrad, Zuteilung. Nicht übersetzen in "Patient" oder 
  "Caregiver", auch wenn ein englischer Code-Kontext das nahelegt

  