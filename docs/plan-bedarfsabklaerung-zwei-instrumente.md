# Plan — Bedarfsabklärung mit zwei Instrumenten (SDA + HC), Stammdaten auf die Patient-Detailseite

**Status:** Entwurf zur Freigabe · noch nicht gebaut
**Branch:** `onboarding-sda-optimierung`

Dieses Dokument beschreibt den vollständigen Umbau über alle Etappen. Es wird
erst gebaut, wenn es freigegeben ist. Jede Etappe ist für sich lauffähig,
verifiziert und wird einzeln zum Review vorgelegt.

---

## 1. Auslöser (vier Wünsche)

1. „Stammdaten und Angaben" aus dem Onboarding herausziehen.
2. Tab „interRAI" umbenennen in „Bedarfsabklärung".
3. Button „Neues Assessment starten" mit Auswahl **interRAI SDA** und **interRAI HC**.
4. Von dort den Flow starten.

## 2. Getroffene Entscheidungen (Grundlage dieses Plans)

- **Zwei echte Instrumente:** SDA und HC sind getrennte Erhebungs-Instrumente mit
  je eigenem Item-Katalog (eigener Seed, Instrument-Feld im Datenmodell).
- **Stammdaten wandern auf die Patient-Detailseite.**
- **Vereinheitlichen statt duplizieren:** Das SDA-Instrument **ist** die
  Stammdaten-Erfassung (seed-getrieben). Die Patient-Detailseite zeigt die
  strukturierte SDA-Ansicht. Kein doppelt gepflegter AA/BB-Katalog; die
  handgebauten SDA-Reiter im Onboarding entfallen mit der Zeit.

## 3. Wichtigster fachlicher Befund

[docs/standardkatalog-sda-entlassung.md](standardkatalog-sda-entlassung.md) ist die
verbindliche Referenz für **SDA** und definiert es ausdrücklich als *„Formular zur
Aufnahme der Stammdaten und der Anfrage (SDA)"*, Katalog **AA/BB**, Quelle
interRAI-Handbuch v1.3 (Feb 2023). Damit ist der SDA-Inhalt **identisch** mit dem,
was Wunsch 1 aus dem Onboarding herausziehen soll. Deshalb werden SDA-Instrument
und Stammdaten vereinheitlicht (siehe Entscheidung oben), nicht parallel gebaut.

Katalogumfang laut Doc: **Bereich AA** (3 Items), **Bereich BB** (17 Items),
**Bereich Z / Entlassung** (3 Items). Z ist ein eigener Austritts-Lebenszyklus und
bleibt vorerst **ausserhalb** des SDA-Erhebungsinstruments (offener Punkt 8.1).

---

## 4. Ausgangs-Architektur (Ist)

| Baustein | Datei | Ist-Zustand |
|---|---|---|
| Onboarding-Wizard | [OnboardingPage.tsx:87-119](../src/app/components/OnboardingPage.tsx#L87-L119) | Schritte Angehöriger → Patient → Vertrag; kein Tab-Layout |
| Patient-Schritt (hostet Stammdaten) | [StepPatient.tsx:525-560](../src/app/components/StepPatient.tsx#L525-L560) | Monolith mit innerer Tab-Leiste; `SDA_REITER = anmeldung, personalien, steuer, wohnen, anamnese` |
| Bedarfsabklärung-Tab (Einstieg) | [StepPatient.tsx:1412-1441](../src/app/components/StepPatient.tsx#L1412-L1441) | `OnboardingTabBA` → Leerzustand mit „Bedarfsabklärung erfassen" bzw. `AssessmentStatusView` |
| Assessment-Status/Start | [AssessmentStatusView.tsx:39-41](../src/app/components/interrai-neu/AssessmentStatusView.tsx#L39-L41) | `handleStartNew` → `createAssessment(personId, anlass)` → `/interrai-neu/:id` |
| Datenmodell | [store.ts:87-110](../src/lib/interrai/store.ts#L87-L110), [store.ts:313](../src/lib/interrai/store.ts#L313) | `NeuAssessment` **ohne** Instrument-Feld; `createAssessment(personId, anlass)` |
| Instrument-Zugriff | [instrument.ts:51-61](../src/lib/interrai/instrument.ts#L51-L61) | Modul-globale Caches, fest auf `interraiHcSchweiz` |
| Instrument-Seed + Typen | [seed/interrai-hc-seed.ts:30-141](../src/lib/interrai/seed/interrai-hc-seed.ts#L30-L141) | Einziger Seed; `Instrument`/`Bereich`/`Item`-Typen leben hier |
| Formular-Engine | [InterraiNeuPage.tsx](../src/app/components/interrai-neu/InterraiNeuPage.tsx) | Seed-getrieben, aber „interRAI HC Schweiz" hartkodiert (~Z. 1030, 1372) |
| Labels „InterRAI" | StepPatient.tsx:533, AppSidebar.tsx:23, InterRAIListPage.tsx:266 | drei Tab-/Nav-/Überschrift-Strings |

---

## 5. Zielbild (Soll)

- Ein **Instrument-Registry**: `{ HC_CH: interraiHcSchweiz, SDA_CH: interraiSdaSchweiz }`.
- Jedes `NeuAssessment` trägt ein `instrument`-Feld. Die Engine lädt Bereiche,
  Items, Skip-Logik und Branding aus dem Seed dieses Instruments.
- Der Start-Flow bietet die Wahl **interRAI SDA** / **interRAI HC** und öffnet die
  passende Erhebung.
- Der Tab heisst überall „Bedarfsabklärung".
- Die **Patient-Detailseite** zeigt „Stammdaten (SDA)" als strukturierte Ansicht
  der abgeschlossenen SDA-Erhebung. Der handgebaute SDA-Anteil im Onboarding wird
  durch den Verweis auf die SDA-Bedarfsabklärung ersetzt.

---

## 6. Umbau im Detail

### A. Datenmodell — Instrument-Feld ([store.ts](../src/lib/interrai/store.ts))
- Neuer Typ `export type AssessmentInstrument = "SDA_CH" | "HC_CH";`
- `NeuAssessment` erhält `instrument: AssessmentInstrument`.
- Signatur ändern: `createAssessment(personId, instrument, anlass)`.
- Demo-Seed-Assessments (`initDemo`, [store.ts:179-243](../src/lib/interrai/store.ts#L179-L243)) und `NEU-ASS-…` bekommen `instrument: "HC_CH"`.
- Aufrufer nachziehen: `AssessmentStatusView.handleStartNew`, `OnboardingTabBA.erfassen` ([StepPatient.tsx:1421-1425](../src/app/components/StepPatient.tsx#L1421-L1425)), `OnboardingPage.startGespraech` ([OnboardingPage.tsx:610-621](../src/app/components/OnboardingPage.tsx#L610-L621)).

### B. Instrument-Zugriffsschicht ([instrument.ts](../src/lib/interrai/instrument.ts)) — der grösste Umbau
Heute sind ~15 Funktionen an modulglobale Caches über **ein** Instrument gebunden.
Umstellung auf mehrere Instrumente:
- **Typen entkoppeln:** `Instrument`/`Bereich`/`Item`/`SubItem`/… aus dem HC-Seed in ein neutrales Modul `seed/typen.ts` ziehen; HC- und SDA-Seed importieren daraus.
- **Registry:** `seed/index.ts` mappt Code → Instrument.
- **Access-Factory:** `instrument.ts` wird zu `createInstrumentAccess(instrument): InstrumentAccess` — baut die Caches (`bereicheByCode`, `itemsByCode`, `subItemsByCode`) für **dieses** Instrument und liefert alle Getter gebunden zurück (`getItem`, `getBereich`, `getCompositeType`, `getInputFieldsForBereich`, `evaluateSkipLogic`, …). Memoisiert per Code über `getInstrumentAccess(code)`.
- **Aufrufer:** `InterraiNeuPage` löst `const inst = getInstrumentAccess(assessment.instrument)` einmalig auf und ruft `inst.getItem(...)` statt der freien Funktionen. Mechanische, aber breite Änderung an den Aufrufstellen.

### C. SDA-Seed ([seed/interrai-sda-seed.ts](../src/lib/interrai/seed/interrai-sda-seed.ts), neu)
- Aufgebaut aus AA/BB des Katalog-Docs, im selben `Instrument`-Format wie HC.
- Bestehende Wertelisten wiederverwenden, wo der Katalog darauf abbildet ([stammdaten/geschlecht.ts](../src/lib/stammdaten/geschlecht.ts), [zivilstand.ts](../src/lib/stammdaten/zivilstand.ts), [sda-sprache.ts](../src/lib/stammdaten/sda-sprache.ts) u. a.).
- Code `"SDA_CH"`, `name`/`label` „interRAI SDA (Schweiz)", Version aus dem Doc.
- **[Auslegung]**-markierte Felder des Docs werden **nicht** hartkodiert, sondern minimal/als offen gehalten.
- Lizenz-Konvention (CLAUDE.md): Texte sinngemäss, keine geschützten Logos.

### D. Engine instrument-bewusst ([InterraiNeuPage.tsx](../src/app/components/interrai-neu/InterraiNeuPage.tsx))
- Zugriffsschicht aus `assessment.instrument` auflösen (B).
- Hartkodiertes „interRAI HC Schweiz"-Branding durch `instrument.name`/`label` aus dem Seed ersetzen.

### E. Start-Flow mit Instrumentwahl (Wünsche 3 + 4)
- In `OnboardingTabBA` (Leerzustand) und `AssessmentStatusView` („Neue Abklärung starten") den einzelnen Start durch eine **Auswahl SDA / HC** ersetzen.
- UI nach Styleguide: bestehende Muster (`BottomSheet` mobil / zentriertes Menü desktop) statt Eigenbau. Auswahl → `createAssessment(person.id, instrument, anlass)` → `/interrai-neu/:id`.
- Anlass-Logik bleibt (`erstabklaerung` beim ersten, sonst `re_assessment`).

### F. Tab-Umbenennung (Wunsch 2)
- Label an drei Stellen auf „Bedarfsabklärung": [StepPatient.tsx:533](../src/app/components/StepPatient.tsx#L533), [AppSidebar.tsx:23](../src/app/components/AppSidebar.tsx#L23), [InterRAIListPage.tsx:266](../src/app/components/interrai/InterRAIListPage.tsx#L266). Keys/Routen (`interrai`, `/interrai-neu/:id`) bleiben.

### G. Stammdaten → Patient-Detailseite (Wunsch 1, vereinheitlicht)
- Auf der Patient-360-Detailseite ([Patient360Page.tsx](../src/app/components/Patient360Page.tsx)) einen Abschnitt „Stammdaten (SDA)" ergänzen, der die abgeschlossene SDA-Erhebung strukturiert (les-/bearbeitbar) darstellt.
- Onboarding-Patient-Schritt: die handgebauten `SDA_REITER`-Reiter durch den Verweis auf die SDA-Bedarfsabklärung ersetzen; Validitäts-Verdrahtung (`step2Valid`) entkoppeln.
- **Einzige Quelle** für AA/BB ist danach der SDA-Seed, nicht mehr `PatientFormData` — diese Entscheidung wird vor Etappe 3 final bestätigt (offener Punkt 8.4).

---

## 7. Etappen (jede lauffähig + verifiziert + Zwischen-Review)

**Etappe 1 — Fundament, Rename, Instrumentwahl** *(HC voll funktionsfähig, SDA registriert)*
- A Datenmodell-Instrumentfeld, B Zugriffsschicht-Refactor, D Engine-Branding, F Tab-Rename, E Start mit SDA/HC-Auswahl.
- SDA in dieser Etappe: registriertes Instrument mit **minimalem** AA/BB-Seed (Beleg-Umfang, z. B. AA + BB1–BB3), damit die Auswahl real öffnet. Voller Inhalt folgt in Etappe 2.
- Ergebnis: „Bedarfsabklärung"-Tab, Start-Auswahl funktioniert, HC unverändert korrekt, SDA öffnet die Engine mit dem SDA-Seed.

**Etappe 2 — SDA-Seed vollständig**
- Bereich AA + BB komplett aus dem Katalog-Doc (C). Wertelisten wiederverwenden, [Auslegung] offen halten.
- Ergebnis: SDA-Erhebung inhaltlich vollständig durchführbar.

**Etappe 3 — Stammdaten auf die Patient-Detailseite**
- G: strukturierte SDA-Ansicht auf Patient-Detail; Onboarding-Patient-Schritt entkoppeln; handgebaute SDA-Reiter ablösen.
- Grösster, riskantester Schritt (StepPatient-Monolith, `PatientFormData`, Validität). Vor Baubeginn Bestätigung der Einzelquelle (8.4).

---

## 8. Offene Punkte / Risiken

1. **Bereich Z (Entlassung):** eigener Austritts-Flow oder Teil des SDA-Instruments? → vorerst ausserhalb.
2. **[Auslegung]-Felder** im Katalog-Doc: nicht hartkodieren, bis Fachfreigabe (Esther Bättig).
3. **Anlass-Set:** passt `erstabklaerung`/`re_assessment` auch für SDA? Voraussichtlich ja; bei Bedarf SDA-spezifische Anlässe.
4. **Einzelquelle AA/BB (Etappe 3):** Seed vs. heutiges `PatientFormData` — die handgebauten Reiter dürfen nach dem Umbau den Katalog nicht doppelt führen. Entscheidung vor Etappe 3.
5. **Persistenz:** alles in-memory (Prototyp-Grenze) bleibt bestehen.
6. **Breite von Refactor B:** viele Aufrufstellen in `InterraiNeuPage`; mechanisch, aber gründlich zu verifizieren (Skip-Logik, Feldzählung, Matrix-Fälle).

---

## 9. Verifikation je Etappe

- `npm run typecheck` (0 Fehler) + `npx vite build` (grün).
- Durchklicken: HC-Erhebung unverändert (Bereiche, Skip-Logik, Vorschläge, Abschluss); SDA-Auswahl öffnet die richtige Erhebung; Tab heisst überall „Bedarfsabklärung".
- Rohausgabe der Feldzählung je Instrument (aus `getInputFieldStats` der jeweiligen Zugriffsschicht) zum Abgleich HC vorher/nachher (darf sich für HC nicht ändern).

## 10. Migrations-Bericht (CLAUDE.md-Pflicht) je Etappe

Welche Komponente jetzt welche Zugriffsschicht/welchen Seed nutzt, welche
handgebauten Stammdaten-Teile abgelöst oder als offener Posten markiert wurden,
und welche fachliche Logik unverändert geprüft wurde (Skip-Logik, Feldzählung,
Vorschlags-Klassifikation, Abschluss-Immutabilität).
