# Datenmodell-Mapping — Design-Repo ↔ produktives Schema

Übergabehilfe fürs Engineering-Team. Dieses Repo ist der **Design-Repo**;
massgebend ist das produktive Schema (`docs/Spit Full.dbml`). Die deutschen
Entitätsnamen (`Fall`, `Formular`, `Onboarding`) bleiben bewusst — angeglichen
sind **Wertelisten, Regeln und Lebenszyklen**.

Quelle im Design-Repo: `src/lib/interrai/store.ts` (Modell + Regeln),
`src/lib/stammdaten/sda-einschaetzung-situation.ts` (Route-Mapping).

---

## Entitäten

| Design-Repo | Produktiv | Abweichungen / Hinweise |
|---|---|---|
| `Fall` | `SpitexCareCase` | Rolle identisch (klinische Episode). Status **abgeleitet** (`fallStatus`), kein gespeichertes Feld. `openedAt`/`closedAt` als Zeitstempel; zusätzlich `erstelltAm` (Shell-Anlage) und `abgebrochenAm` (Abbruch-Marke — produktiv evtl. über `deletedAt`/Event). |
| `Formular` | `SpitexFormInstance` | Rolle identisch. Feldnamen deutsch (`typ`, `laufnummer`, `vorgaengerId`, `gesperrtAm/Von`). |
| `Onboarding` | `SpitexOnboarding` | 1:1 zum Fall. Produktionsdefekt `phase` („preparation", schreitet nie fort) **nicht nachgebaut**. |
| `Klient` / `Person` | `Patient` | Im Design-Repo `Person`; Zustand (`klientZustand`) abgeleitet aus `patientId`. |
| `Versicherungsverhaeltnis` | `InsurancePolicy` **[PARTIAL]** | Zahlerseite eines Mandats: `patientId`, `typ` (kvg/vvg/uvg/ivg/mvg), `versichererId`, `gueltigAb`/`gueltigBis`, typabhängige Nummern. **Kein Statusfeld** — „aktiv" ist abgeleitet (`istAktiv`/`aktiveVersicherung`), wie bei `Mandat`. Ersetzt die fünf Einzelfelder am Patienten (`krankenkasse`, `kartennummer`, `bagNr`, `zusatzversicherungKasse`, `weitereVersicherung`). |
| `Versicherer` (= `KRANKENKASSEN`) | `Organization` (Kostenträger) | Organisation, ausgewählt statt abgetippt: `id`, `label`, `bagNr` (nur Krankenversicherer), `glnVersicherung` + `glnEmpfaenger` (je 13-stellig, **vorerst null**), `art`. Einzige Versichererliste des Projekts. |
| — | `SpitexServicePlan` | Das LPB ist **kein Formular**, sondern ein eigenes Objekt. In diesem Repo **entfernt, nicht ersetzt** (siehe unten). |

## Wertelisten

| Thema | Design-Repo | Produktiv | Status |
|---|---|---|---|
| Formulartyp | `FormularTyp = registration \| interrai_hc \| interrai_cmh \| housekeeping \| discharge` | `SpitexFormInstance.type` (gleiche Werte) | **angeglichen**. `'lpb'` entfällt (eigenes Objekt). |
| Fallstatus | `FallStatus = registering \| open \| discharged \| aborted` | `SpitexCareCase.status` (gleiche Werte) | **angeglichen**, abgeleitet. |
| Route | `FallRoute = somatic \| mental_health \| palliative \| paediatric \| isolated_therapeutic \| housekeeping \| declined \| null` | `SpitexCareCase.route` (gleiche Werte) | **angeglichen**. Ersetzt die frühere dreiwertige `triage`. |
| Anlass Reassessment | `reason = first \| periodic \| significant_change \| return_from_hospital \| null` | `SpitexFormInstance.reason` (gleiche Werte) | **angeglichen**. |
| Formularstatus | `FormularStatus = in_bearbeitung \| vollstaendig \| gesperrt` | `SpitexFormInstance.status = in_progress \| complete \| locked` | **ABWEICHUNG (offen):** Werte noch deutsch. Der Prompt dieses Laufs hat `FormularStatus` nicht im Umbau-Umfang; die Angleichung an `in_progress/complete/locked` ist ein Folgeschritt. |
| Laufnummer | `Formular.laufnummer` (int, je Fall+Typ ab 1) | `SpitexFormInstance.round` (int) | **ABWEICHUNG:** Feldname `laufnummer` statt `round` (deutscher Bezeichner bleibt). Semantik identisch. |
| Interne Fallnummer | Antwortfeld `BB5b` (registration) / `A5b` (interrai_hc) | i-Code `iA5d` (`SpitexFormAnswer.internalCode`) | Noch keine i-Code-Schlüsselung (Antwortmodell = Folgeschritt). Feld wird beim Sperren der Registrierung befüllt. |

## Regeln & Lebenszyklus (angeglichen)

- **Falleröffnung beim Sperren:** Anlegen der Registrierung → Fall `registering`, **ohne Fallnummer**. Sperren der Registrierung → Fallnummer vergeben, `route` und `openedAt` gesetzt (Nummer **vor** dem Sperrzustand geschrieben; der produktive Defekt `caseNumberAtLock = NULL` ist **nicht** nachgebaut). Sperren der Entlassung → `closedAt`. Ein interRAI-Formular zu sperren hat **keine** Wirkung auf den Fall.
- **Route steuert die Eröffnung:** `interrai_hc` nur bei `somatic`, `interrai_cmh` nur bei `mental_health`, `housekeeping` nur bei `housekeeping`. Bei `palliative`/`paediatric`/`isolated_therapeutic` ist ein nicht abgebildetes Instrument nötig; bei `declined` hat die Klientin abgelehnt — kein Abklärungsformular.
- **Nur ein offenes Abklärungsformular pro Fall** (produktiv partieller Unique-Index) — in `kannFormularEroeffnen` abgebildet.
- **Nur ein offener Fall pro Klient** (produktiv partieller Unique-Index) — in `eroeffneFall` abgebildet; der Fehler benennt die bestehende Fallnummer.
- **Route-Mapping BB16→Route** liegt an **einer** Stelle: `sdaRoute` in `sda-einschaetzung-situation.ts`. `sdaVerlangtInterrai` ist eine dünne Ableitung daraus (kein zweites Mapping).

### Bewusste Abweichung vom Seed-Wunsch (§10)

Der Prompt wünschte Fall B und Fall C für **denselben** Klienten. Das verletzt
**§7 (ein offener Fall pro Klient)**, da beide offen wären. §7 ist die produktive
Regel und gewinnt: Fall C erhält einen eigenen Klienten (Rosa Bianchi), Fall B
einen anderen (Anna Müller). Fall D (Systemgrenze, palliativ) hat einen eigenen
Klienten (Peter Ammann).

---

## Bewusst nicht gebaut

- **`SpitexServicePlan`** (Leistungsplanungsblatt) — eigenes Objekt mit
  Gültigkeitszeitraum, eigenem Status (`draft … completed`), Positionen und
  Mandatsbezug. Das frühere Formular `'lpb'` ist ersatzlos entfernt.
- **Antwortmodell** (`SpitexFormAnswer`) — i-Code-Schlüsselung (`internalCode`),
  `noAnswer`/X-Code, Herkunft (`source`), verschlüsselte Freitexte,
  `confirmedBy`. Keine Materialisierung beim Sperren.
- **Historisierung** berechneter CAPs und Skalen beim Sperren.
- **Mandanten- und Verschlüsselungsfelder** — `organizationId`, `officeId`,
  `nameHash`, `ahvHash`, verschlüsselte Spalten. Produktionsthemen.
- **Dokumentierte Produktionsdefekte** — weder `caseNumberAtLock = NULL` bei
  Registrierungen noch `SpitexOnboarding.phase`, das nie fortschreitet.

---

## Benannte Abweichungen: Registrierung ↔ Patient (Herkunft `klient`)

Das Registrierungsformular liest `klient`-Items aus dem **Patienten** durch und
schreibt zurück (`src/lib/interrai/katalog/sda-herkunft.ts`). Drei Items lassen
sich mit dem heutigen Patientenfeld **nicht** sauber durchlesen; sie werden
**formularseitig** geführt (im Formular erfasst, beim Sperren materialisiert) —
bewusst, statt Strings zu zerlegen oder Labels rückwärts auf Codes zu mappen.

| Item | Patientenfeld heute | Warum untauglich | Auflösungsweg |
|---|---|---|---|
| `iA10` Wohnort PLZ/Ort | `adresse` (ein String inkl. Strasse) | BB6 will nur PLZ+Ort | **`adresse` in `plz` und `ort` trennen** (eigene Felder am Patienten) |
| `CHA7a` Grundversicherung | ~~`krankenkasse` (Label)~~ | — | **AUFGELÖST:** `CHA7a`/`CHA7b`/`CHA7c` lesen jetzt den Namen des aktiven KVG-/VVG-/UVG-Versicherers aus den Versicherungsverhältnissen (`aktiverVersichererName`). Das Patientenfeld `krankenkasse` entfällt; die Doppelerfassung der Grundversicherung ist damit weg. |
| `iB4` Sprache | `sprache` (Label) | Auswahl-Code ≠ Label | **Sprache als Code führen** (Label nur zur Anzeige ableiten) |

**Folge — sichtbar dokumentiert, nicht stillschweigend:** Damit sind **Wohnort,
Krankenkasse und Sprache doppelt erfasst** — im Onboarding (Patient) **und** im
Registrierungsformular, nebeneinander, und sie **können auseinanderlaufen**. Das
ist der Preis für den kleinen Umbau (kein Zerlegen/Rückmappen). Er ist
vertretbar, entfällt aber erst, wenn die drei Felder oben nach dem Auflösungsweg
umgestellt sind — dann werden auch diese drei Items durchgelesen statt doppelt
geführt.

## Nachbesserung Versicherungsfelder (vier Feldänderungen)

Abgleich mit einem etablierten Schweizer Spitex-System und der Rechnungsstellung:

1. **`versicherungsmodell` entfernt.** Standard/HMO/Telmed/Hausarzt steuern nur den
   Erstkontakt bei einem medizinischen Problem. Für Spitex-Leistungen nach KLV
   ändert das weder Tarif noch Kostenträger noch Anordnungsbefugnis — das Feld
   hatte keine Wirkung und erzeugte den falschen Eindruck, es hätte eine.
2. **GLN gespalten:** `Versicherer.gln` → `glnVersicherung` (Versicherer) **+**
   `glnEmpfaenger` (Rechnungsempfänger). In generalInvoice XML 4.5 ist der
   Empfänger ein eigenes Element und kann abweichen (z. B. Verarbeitungszentrum).
   Beide vorerst `null`. Der GLN-Hinweisstreifen prüft beide und benennt die fehlende.
3. **`unfalldeckung` an der KVG** (`eingeschlossen`/`ausgeschlossen`/`unbekannt`,
   Vorgabe `unbekannt`). Nichterwerbstätige/Rentnerinnen sind nicht über den
   Arbeitgeber nach UVG gedeckt; ein Sturz läuft dann über die Grundversicherung,
   sofern die Unfalldeckung dort eingeschlossen ist. Der dritte Wert ist bewusst —
   ein Ja/Nein-Feld erzwänge eine geratene Antwort.
4. **Datumsfelder:** `unfalldatum` (Pflicht bei UVG), `verfuegungsdatum` (Pflicht
   bei IVG). Ein UVG-Verhältnis existiert nur bei gemeldetem Unfall, ein IVG-
   Verhältnis nur bei erteilter Verfügung. **MVG trägt kein Datum** (nur die
   Verfügungsnummer wird für die Abrechnung gebraucht).

Pflichtfelder je Typ (`TYP_PFLICHTFELDER`): kvg = Kartennummer + Unfalldeckung;
vvg = Policennummer; uvg = Schadennummer + Unfalldatum; ivg = Verfügungsnummer +
Verfügungsdatum; mvg = Verfügungsnummer.

**Bewusst nicht Teil dieses Laufs:** Abrechnungsart (Tiers payant/garant → Mandat),
abweichende Rechnungsadresse, Ergänzungsleistungen/Hilflosenentschädigung,
internationale Versicherung als sechster Typ.

## Bezugs- und Pflegeteam (elf Onboarding-Felder → Beziehungen)

Die Kontaktfelder im Onboarding sind durch die vorhandene Struktur `Beziehung`
(+ `Kontakt`) ersetzt. Keine Modellerweiterung — nur Umleitung. Entfernt aus
`PatientFormData` **und** vom `Patient`:

| Entferntes Feld | Ebene | Neue Quelle |
|---|---|---|
| `hausarztName` / `hausarztTelefon` / `hausarztEmail` | PatientFormData | Beziehung rolle `hausarzt` → `Kontakt` (Name/Telefon/E-Mail) |
| `spezialAerzte` | PatientFormData + Patient | Beziehung rolle `spezialarzt` (mehrere möglich) |
| `notfallkontaktId` / `notfallkontaktVerwandtschaft` | PatientFormData | Beziehung mit Merkmal `notfallkontakt` + `art` |
| `sozialamtKontakt` / `sozialamtKontaktId` | PatientFormData + Patient | Beziehung rolle `sozialdienst` (kein Ja/Nein-Schalter mehr) |
| `gesetzlicheVertretung` / `vertretungKontaktId` / `vertretungsart` | PatientFormData | Beziehung rolle `beistand` + `vertretungsart` |
| `hausarztEmail` | Patient | (siehe oben — Kontakt) |

- **Geteilte Komponente** `BezugsteamAbschnitt` — ein Renderer, zwei Verwender
  (Onboarding-Reiter Personalien + Patient360). Beziehungen entstehen **direkt**
  beim Hinzufügen (wie bei den Versicherungen), nicht mehr bei der Konvertierung;
  die Feld→Beziehung-Logik in `konvertierung.ts` entfällt.
- **`pflegende_angehoerige`** entsteht automatisch aus dem Angehörigen-Reiter
  (`sichereGepflegteAngehoerige`), nicht im Dialog; die frühere Lücke
  (Beziehung nur im Seed) ist behoben.
- **`ArztAnfrageContext`** liest den Empfänger aus der Beziehung rolle `hausarzt`
  → `Kontakt` (Name/E-Mail), nicht mehr aus einem Freitextfeld.
- **Notfallkontakt** und **Auskunftsberechtigung** sind Merkmale der Beziehung,
  keine Rollen. **`SPEZIALAERZTE_LUECKE`** entfällt.
- **GLN/Praxisadresse bei Ärzten:** weiterhin bewusst nicht geführt (`kontakte.ts`).
