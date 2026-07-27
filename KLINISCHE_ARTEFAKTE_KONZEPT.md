# Klinische Artefakte, Onboarding-Konvertierung und Audio-gestützte Erfassung

> Konzept-Spec für die klinischen Kern-Entitäten und den Onboarding-Lifecycle des Spitex Cockpits.
> Diese Datei ist die Referenz für alle Implementierungs-Prompts. Sie geht der `CLAUDE.md` in fachlicher und architektonischer Tiefe vor.

## Architektur-Modell: Onboarding-Konvertierung (Lead-Modell)

Das Spitex Cockpit folgt einem Lead-Konvertierungs-Modell, vergleichbar mit Salesforce-Lead-Conversion. Drei klar getrennte Entitäts-Lifecycles:

### Onboarding-Datensatz (Lead-Phase)

Während ein Mandat akquiriert und vorbereitet wird, lebt es als Onboarding-Datensatz. Während dieser Phase:

- Patient und Angehöriger existieren noch nicht als eigene Datensätze. Ihre Personendaten leben als Felder im Onboarding-Datensatz.
- Klinische Artefakte (InterRAI-Assessment, Pflegeplanung, KLV-Verordnung) werden während des Onboardings erstellt und hängen am Onboarding-Datensatz (`onboardingId`).
- Das Onboarding hat einen Lifecycle: in-erfassung, in-bearbeitung, fast-abgeschlossen, blockiert.

### Konvertierung (Abschluss-Akt)

Wenn das Onboarding erfolgreich abgeschlossen wird (alle Voraussetzungen erfüllt: Personalien beider, Vertrag unterzeichnet), findet eine Konvertierung statt:

1. Neuer Patient-Datensatz wird in der Patient-Tabelle erzeugt, befüllt aus den Onboarding-Personalien
2. Neuer Angehöriger-Datensatz wird in der Angehörige-Tabelle erzeugt, befüllt aus den Onboarding-Personalien
3. Alle klinischen Artefakte des Onboardings bekommen zusätzlich die neue `patientId` zugewiesen (die `onboardingId` bleibt als historische Referenz erhalten)
4. Onboarding-Status wechselt auf `abgeschlossen-konvertiert`
5. Onboarding wird aus aktiven Onboarding-Listen entfernt, bleibt aber als historischer Datensatz erhalten

### Aktive Phase (Account-Phase)

Nach der Konvertierung:

- Patient und Angehöriger sind eigene Datensätze, erscheinen in den jeweiligen Listen
- Klinische Artefakte hängen am Patient (`patientId`), die `onboardingId` zeigt auf das Quell-Onboarding
- Re-Assessments und neue InterRAI-Assessments werden direkt am aktiven Patient angelegt – sie haben keine `onboardingId`, weil sie nicht aus einem Onboarding stammen
- Die historische Verknüpfung "diese InterRAI stammt aus dem Onboarding vom Datum X" bleibt nachvollziehbar

### Onboarding-Abbruch

Falls ein Onboarding scheitert (Klient sagt ab, Krankenkasse lehnt ab, etc.):

- Onboarding-Status wechselt auf `abgebrochen`
- Kein Patient, kein Angehöriger entsteht
- Klinische Artefakte bleiben am Onboarding hängen und werden mit ihm archiviert
- Keine Datenleichen in den Patient- oder Angehörige-Tabellen

## Mentales Modell der klinischen Artefakte

**Das Erstgespräch ist die Quelle. Drei eigenständige Artefakte sind die Senken. Die Pflegefachperson entscheidet, was sie wann finalisiert.**

```
        Erstgespräch (Audio + Transkript)
                    │
            Anna verarbeitet
                    │
   ┌────────────────┼────────────────┐
   ▼                ▼                ▼
InterRAI       Pflege-            KLV-
Assessment     planung         Verordnung
(InterRAI HC   (Diagnosen,    (administrativ,
 Schweiz)       Massnahmen,    abrechnungs-
                Ziele)         relevant)

Jedes Artefakt: unabhängig validierbar, unabhängig finalisierbar.
Bearbeitung in beliebiger Reihenfolge möglich.
```

Während Onboarding hängen die Artefakte am Onboarding. Nach Konvertierung am Patient. Die Multi-Output-Mechanik (ein Gespräch füllt drei Artefakte) bleibt in beiden Phasen identisch.

## Realitäts-Bezug

In der Schweizer Spitex-Praxis wird das klinische Best-Practice-Vorgehen (InterRAI → Pflegeplanung → KLV) regelmässig unterbrochen. Weil die KLV-Verordnung Voraussetzung für die Vertragserstellung und damit für die Abrechnung ist, erstellen viele Spitex-Organisationen die KLV direkt nach dem Gespräch und kommen nur bei freier Kapazität zur ausführlichen Pflegeplanung und InterRAI-Validierung zurück. Diese Realität gilt während des Onboardings genauso wie nach der Konvertierung (z.B. bei Re-Assessments).

Das System bildet diese Realität ab, ohne sie zu erzwingen. Flexibilität ist Kern-Designprinzip. Compliance-Lücken werden sichtbar gemacht (siehe Abschnitt Compliance-Sichtbarkeit), aber nicht hart blockiert.

## Die drei Artefakt-Entitäten

### InterRAI-Assessment

Klinische Faktenbasis nach InterRAI HC Schweiz. Item-Texte sinngemäss formuliert (formale Lizenz mit Spitex Schweiz / interRAI.org steht aus).

**Inhalt:** InterRAI-Items über 20 Sektionen (A–T), getriggerte Clinical Assessment Protocols (CAPs), Outcome-Scales.

**Status:** in-bearbeitung, abgeschlossen.

**Typ:** erstassessment, re-assessment, ad-hoc.

**Container während Onboarding:** `onboardingId` ist gesetzt, `patientId` ist `null`.

**Container nach Konvertierung:** `patientId` zeigt auf den neuen Patient-Datensatz, `onboardingId` bleibt als historische Referenz erhalten.

**Container für Re-Assessments / Ad-hoc nach Konvertierung:** `patientId` direkt gesetzt, `onboardingId` ist `null`.

**Zugang:**
- Eigener Hauptbereich `/interrai` mit Liste und Detail-Routen.
- Während Onboarding: erreichbar über Onboarding-Tab "InterRAI" unter Patient (Medizin).
- Nach Konvertierung: erreichbar über Patient-Detail-Tab.

### Pflegeplanung

Klinische Handlungsplanung in NANDA-Struktur.

**Inhalt:** Pflegediagnosen (NANDA-Code, Titel, Begründung), Massnahmen, Ziele.

**Status:** entwurf, in-bearbeitung, validiert, abgeschlossen.

**Container-Logik analog InterRAI-Assessment:** während Onboarding `onboardingId`, nach Konvertierung `patientId` zusätzlich.

**Zugang:**
- Kein eigener Hauptbereich.
- Während Onboarding: erreichbar über Onboarding-Tab "Pflegeplanung" unter Patient (Medizin).
- Nach Konvertierung: erreichbar über Patient-Detail-Tab.

**Beziehungen:** Optional Verweis auf ein InterRAI-Assessment, aus dem die Vorschläge abgeleitet wurden.

### KLV-Verordnung

Administrative und abrechnungsrelevante Pflegeverordnung nach KLV-Vorgaben.

**Inhalt:** Diagnose-Bezeichnungen für den Arzt, Leistungspositionen pro KLV-Kategorie (a/b/c) mit Stundenzahl, Pflegeziele in administrativer Formulierung, Beginn- und Enddatum.

**Status:** entwurf, kontrolliert, beim-arzt, vom-arzt-zurueck, bei-krankenkasse, kostengutsprache-erhalten, abgelehnt, abgelaufen.

**Container-Logik analog:** während Onboarding `onboardingId`, nach Konvertierung `patientId` zusätzlich.

**Zugang:**
- Kein eigener Hauptbereich in V1.
- Während Onboarding: erreichbar über Onboarding-Tab "KLV" unter Patient (Medizin).
- Nach Konvertierung: erreichbar über Patient-Detail-Tab.

**Beziehungen:** Optional Verweis auf eine Pflegeplanung, aus der Massnahmen übernommen wurden.

## Beziehungs-Übersicht

```
Onboarding (Lead-Phase)
  ├── Personalien Patient-im-Werden (Felder im Onboarding)
  ├── Personalien Angehöriger-im-Werden (Felder im Onboarding)
  ├── InterRAI-Assessments (0:n via onboardingId)
  ├── Pflegeplanungen (0:n via onboardingId)
  └── KLV-Verordnungen (0:n via onboardingId)

Patient (Account-Phase, entsteht bei Konvertierung)
  ├── InterRAI-Assessments (0:n via patientId)
  │     └── die aus Onboarding stammenden haben zusätzlich onboardingId
  ├── Pflegeplanungen (0:n via patientId)
  └── KLV-Verordnungen (0:n via patientId)

Angehöriger (Contact-Phase, entsteht bei Konvertierung)
  └── eigene Entität, separat verwaltet

Pflegeplanung referenziert optional InterRAI (Quelle)
KLV-Verordnung referenziert optional Pflegeplanung (Quelle der Massnahmen)
```

Alle Referenzen ausser den Container-Verweisen sind optional. Eine KLV kann ohne Pflegeplanung existieren. Eine Pflegeplanung ohne InterRAI. Das spiegelt die Praxis-Realität.

## Das Gespräch als Multi-Output-Werkzeug

Das Audio-Aufnahme-Werkzeug ist während Onboarding im Header des Patient-Medizin-Bereichs verfügbar. Nach Konvertierung ist es im Patient-Detail erreichbar (für Re-Assessment-Gespräche).

Im Prototyp ist die Aufnahme-Geste echt (Mikrofon-Indikator, Start/Stopp, Aufnahme-Zeit), aber das Transkript und die abgeleiteten Inhalte sind vorbereitet (gescriptet). Es gibt keine Live-AI und keine echte Audio-Verarbeitung.

**Multi-Output-Verhalten:** Während des gescripteten Transkripts werden parallel drei Drafts befüllt:

1. **InterRAI-Items.** Aussagen werden InterRAI-Items zugeordnet.
2. **Pflegeplanungs-Vorschläge.** Anna leitet Pflegediagnose-Vorschläge ab, inklusive Massnahmen und Ziele.
3. **KLV-Leistungspositionen.** Anna schlägt Stunden pro KLV-Kategorie vor.

Die drei Drafts hängen während des Onboardings am Onboarding, nach Konvertierung am Patient.

## Onboarding-Verhalten

Die bestehende Onboarding-Struktur bleibt unverändert: linke Sidebar mit drei Bereichen (Angehöriger HR, Patient Medizin, Vertragsunterzeichnung).

**Erweiterungen im Bereich Patient (Medizin):**

- Drei neue Tabs nach "Aktivitäten" und vor "Dokumente": InterRAI, Pflegeplanung, KLV
- Prominenter Recording-Button im Header des Patient-Medizin-Bereichs, sichtbar unabhängig vom aktiven Tab

**Onboarding-Abschluss-Logik:**

Sobald die Voraussetzungen erfüllt sind (Personalien Patient, Personalien Angehöriger, Vertrag unterzeichnet), erscheint ein "Onboarding abschliessen"-Button. Klick öffnet einen Bestätigungs-Dialog mit Zusammenfassung. Bei Bestätigung läuft die Konvertierung:

1. Neuer Patient-Datensatz wird erzeugt
2. Neuer Angehöriger-Datensatz wird erzeugt
3. Klinische Artefakte bekommen die neue patientId
4. Onboarding-Status wechselt auf abgeschlossen-konvertiert
5. Weiterleitung zum neuen aktiven Patient-Detail

Compliance-Hinweis im Dialog: Falls InterRAI oder Pflegeplanung noch unvollständig ist, ein dezenter Hinweis "Die InterRAI ist noch in Bearbeitung. Sie wird mit dem Patient mitkonvertiert und kann später vervollständigt werden."

## Compliance-Sichtbarkeit

Wo nicht-sequenzielle oder unvollständige Bearbeitung sichtbar gemacht wird:

**Onboarding-Detail.** Im Bestätigungs-Dialog beim Abschluss: Hinweis auf unvollständige klinische Artefakte. Während des Onboardings: in den jeweiligen Tabs (InterRAI, Pflegeplanung, KLV) klare Status-Anzeige (Erfassungsgrad, Entwurfs-Status).

**Patient-Detail nach Konvertierung.** Pro klinisches Artefakt eine Status-Karte. Bei Lücken zwischen Artefakten (z.B. aktive KLV, aber InterRAI unvollständig) eine Warning-Markierung.

**Compliance-Dashboard.** Aggregat-KPI über alle aktiven Patienten. Beispiel: Anteil aktiver Patienten mit abgeschlossener KLV ohne validierte InterRAI. Trifft GeKoZH-Vorschläge Nr. 4 und Nr. 9.

**Pendenzen.** Auto-generierte Compliance-Pendenz, wenn eine KLV länger als X Tage abgeschlossen ist ohne nachfolgende InterRAI-Validierung.

## Was diese Spec nicht regelt

- Echte Audio-Aufnahme oder Live-Transkription (im Prototyp gescriptet).
- Echte AI-Verarbeitung des Gesprächs (Mock-Drafts).
- Echte HomeCareData- oder KLV-Versand-Schnittstellen (Mock-Bestätigungen).
- Datenpersistenz über Sessions hinaus (Mock-Daten im Speicher).
- Klinische Validität der Demo-Inhalte (plausibel nachgebildet).
- Multi-Mandanten-Fähigkeit, Mehrsprachigkeit, Performance-Optimierung über Caching hinaus.
- Konkrete Lizenz-Vereinbarung mit Spitex Schweiz für InterRAI-HC-Inhalte. Originale Item-Texte werden erst nach formaler Lizenz verwendet.

## Implementierungs-Reihenfolge

Die folgenden Prompts setzen diese Spec sequenziell um. Jeder Prompt referenziert diese Datei.

**Prompt A (überarbeitet) – Datenmodell und Patient-Detail-Tabs.** Definiert die drei Entitäten mit onboardingId/patientId-Logik, erstellt Mock-Daten inklusive Konvertierungs-Geschichte für Anna Müller, implementiert die InterRAI-Routen, ergänzt die drei Patient-Detail-Tabs (InterRAI, Pflegeplanung, KLV).

**Prompt B – Recording-Button, drei Tabs im Onboarding, Konvertierungs-Akt.** Erweitert den Patient-Medizin-Bereich um drei neue Tabs (InterRAI, Pflegeplanung, KLV) und einen Recording-Button im Header. Implementiert die Onboarding-Abschluss-Konvertierungs-Logik.

**Prompt C – Gespräch als Multi-Output-Werkzeug.** Implementiert die Aufnahme-Logik mit parallel befüllten Drafts. Stellt das Werkzeug an den verschiedenen Aufruf-Stellen zur Verfügung.

**Prompt D – InterRAI-Arbeitsbereich.** Single-Page-Sektions-Ansicht mit Validierungs-Modus.

**Prompt E – Pflegeplanungs-Arbeitsbereich.** Maria validiert Diagnosen, Massnahmen, Ziele. Unabhängig vom Status der InterRAI öffenbar.

**Prompt F – KLV-Arbeitsbereich.** KLV-Erstellung, Validierung, Versand-Workflow.

**Prompt G – Compliance-Sichtbarkeit.** Status-Hinweise, Warning-Markierungen, Auto-Pendenzen.