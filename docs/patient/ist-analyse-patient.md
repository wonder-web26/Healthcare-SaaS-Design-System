# IST-Analyse Patienten-Datensatz (Klient)

    Ankerblock (Stand: 2026-09-03, Commit: 1c9ecf2)
    Patient-Felder im Design-Repo:       67
    Patient-Felder in Spit_Full.dbml:    39
    Felder nur im Repo:                  44
    Felder nur im DBML:                  16
    Related Lists gesamt:                25
      davon direkt an Patient:           19
      davon ueber den Fall:              12
      davon im Design-Repo umgesetzt:    13
    Gelesene Dateien:                    55

Hinweise zum Ankerblock:

- **23 Felderpaare** haben eine Entsprechung in beiden Quellen (Abschnitt C3: 20
  mit abweichendem Namen oder Typ, Abschnitt C4: 3 identisch). Damit:
  67 − 23 = **44 nur im Repo**, 39 − 23 = **16 nur im DBML**.
- **Related Lists gesamt (25)** ist die Vereinigungsmenge der DBML-Tabellen, die
  entweder auf `Patient.id` oder auf `SpitexCareCase.id` verweisen. 19 verweisen
  auf `Patient.id`, 12 auf `SpitexCareCase.id`; **6 Tabellen verweisen auf beides**
  und sind in beiden Zahlen enthalten (19 + 12 − 6 = 25).
- **Im Design-Repo umgesetzt (13)** zaehlt nur Objekte mit einer eigenen, echten
  Datenquelle im Repo („ja" in Abschnitt B). Hinzu kommen **8 teilweise** umgesetzte
  (Mock oder abweichende Bezugsebene) und **4 gar nicht** umgesetzte
  (`Medication`, `Allergy`, `Appointment`, `Invoice`). 13 + 8 + 4 = 25.
- Die Datei heisst im Repo `docs/Spit Full.dbml` (mit Leerzeichen), nicht
  `Spit_Full.dbml`. `backend-db-reference.md`: **nicht gefunden**.

---

## Methode und Quellenlage

| Quelle | Pfad | Status |
|---|---|---|
| Typdefinition Patient | `src/app/components/patientData.ts` | gelesen |
| Detailseite Klient | `src/app/components/Patient360Page.tsx` | gelesen |
| Datenbankmodell | `docs/Spit Full.dbml` (2630 Zeilen, 91 Tabellen) | gelesen |
| Backend-Referenz | `backend-db-reference.md` | **nicht gefunden** |

Alle Zeilenangaben beziehen sich auf Commit `1c9ecf2`.

---

## A. Feldinventar Patient

Das Interface `Patient` steht in `src/app/components/patientData.ts:38–162`.
**Kein einziges Feld ist optional (`?:`)** — alle 67 Felder sind im TypeScript-Sinn
Pflicht. Die Spalte „Pflicht" unten bezieht sich deshalb auf die *fachliche*
Pflicht, soweit im Code belegt (Pflichtfeldpruefung im Onboarding); wo dazu nichts
im Code steht, ist der Eintrag `—`.

Die fachliche Gruppierung ist **teilweise** vorhanden: `patientData.ts` trennt die
Bloecke durch Blockkommentare (`:55–57`, `:67–69`, `:82–88`, `:124–126`, `:144–145`).
Fuer die Felder `:39–54` und `:78–81` gibt es **keine Ueberschrift im Code**; sie
sind unten als „ohne Gruppenueberschrift im Code" gefuehrt.

Legende Marker: aus der DBML-Note der Spalte bzw. der Tabelle
(`docs/Spit Full.dbml:24–35`: `[BUILT]` existiert in Prisma, `[PARTIAL]` unvollstaendig,
`[TICKETED]` entworfen mit WON-Nummer, `[TARGET]` vorgeschlagen). Die Tabelle
`Patient` traegt insgesamt `[BUILT]` (`docs/Spit Full.dbml:466`); Spalten-Marker sind
je Zeile angegeben.

### A1. Kennung und Person — ohne Gruppenueberschrift im Code

| Feldname | Typ | Pflicht | Quelle | in UI sichtbar (wo) | in DBML | Marker | Bemerkung |
|---|---|---|---|---|---|---|---|
| `id` | string | — | patientData.ts:39 | Stammdaten Identitaet (Patient360Page.tsx:3292); sonst als Fremdschluessel | ja `id` (dbml:417) | [BUILT] | im DBML `uuid [pk]` |
| `onboardingId` | string \| null | — | patientData.ts:41 | **nicht in UI** | nein | — | Kommentar :40 „null = Altbestand ohne Mandat" |
| `vorname` | string | ja (StepPatient.tsx:374) | patientData.ts:42 | Kopfzeile :674, Stammdaten :3279 | ja `firstName` (dbml:421) | [BUILT] | DBML `Bytes`, ENCRYPTED |
| `nachname` | string | ja (StepPatient.tsx:374) | patientData.ts:43 | Kopfzeile :674, Stammdaten :3278 | ja `lastName` (dbml:422) | [BUILT] | DBML `Bytes`, ENCRYPTED |
| `angehoeriger` | string | — | patientData.ts:45 | **nicht in UI** (Patient360Page) | nein | — | Kommentar :44 „NICHT aus dem Notfallkontakt abgeleitet" |
| `angehoerigerTelefon` | string | — | patientData.ts:46 | **nicht in UI** | nein | — | — |
| `status` | PatientStatus | — | patientData.ts:47 | Kopfzeile :639/:685, Austritt :3849 | ja `status` (dbml:458) | [BUILT] | DBML-Note :458 „DEFECT: written in_onboarding at intake and never advances" |
| `kanton` | string | — | patientData.ts:48 | Adresse & Mandat :1088, Stammdaten :3082, Mandate :2136 | ja `canton` (dbml:439) | [BUILT] | — |
| `schweregrad` | Schweregrad \| "" | nein | patientData.ts:50 | Kopfzeile :641/:687, ATL :1834 | nein | — | Kommentar :49 „wird im Onboarding nicht erhoben" |
| `pflegefachkraft` | string | — | patientData.ts:51 | Kopfzeile :697/:698 | nein | — | Zuteilung, kein DBML-Gegenstueck an Patient |
| `pflegefachkraftInitialen` | string | — | patientData.ts:52 | Kopfzeile :698 | nein | — | — |
| `ahvNummer` | string | ja (StepPatient.tsx:374) | patientData.ts:53 | Kopfzeile :686 (maskiert), Stammdaten :3281 | ja `ahvNumber` (dbml:431) | [BUILT] | DBML ENCRYPTED + `ahvHash` :432 |
| `geburtsdatum` | string | ja (StepPatient.tsx:374) | patientData.ts:54 | Kopfzeile :688, Stammdaten :3280 | ja `dateOfBirth` (dbml:424) | [BUILT] | Repo `string`, DBML `date` |

### A2. Wohnsitzadresse — Blockkommentar patientData.ts:55–57

| Feldname | Typ | Pflicht | Quelle | in UI sichtbar (wo) | in DBML | Marker | Bemerkung |
|---|---|---|---|---|---|---|---|
| `strasse` | string | ja (StepPatient.tsx:374) | patientData.ts:58 | Kopfzeile :689, Adresse & Mandat :1067/:1081, Stammdaten :3193 | ja `addressStreet` (dbml:436) | [BUILT] | DBML ENCRYPTED |
| `plz` | string | — | patientData.ts:59 | dito | ja `addressZip` (dbml:437) | [BUILT] | — |
| `ort` | string | ja (StepPatient.tsx:374) | patientData.ts:60 | dito | ja `addressCity` (dbml:438) | [BUILT] | — |
| `gemeinde` | string | — | patientData.ts:63 | Adresse & Mandat :1086 | nein | — | Kommentar :61–62 „Bestimmt den Restkostensatz" |
| `bfsNummer` | string | — | patientData.ts:65 | Adresse & Mandat :1067, Stammdaten :3081 | nein | — | — |
| `land` | string | — | patientData.ts:66 | Adresse & Mandat :1067 | nein | — | — |

### A3. Abweichender Pflegeort — Blockkommentar patientData.ts:67–69

| Feldname | Typ | Pflicht | Quelle | in UI sichtbar (wo) | in DBML | Marker | Bemerkung |
|---|---|---|---|---|---|---|---|
| `pflegeortAbweichend` | boolean | — | patientData.ts:70 | Kopfzeile :691, Adresse & Mandat :1091 | nein | — | im DBML implizit ueber gefuellte `careAddress*` |
| `pflegeortStrasse` | string | — | patientData.ts:71 | Kopfzeile :693, :1092 | ja `careAddressStreet` (dbml:451) | **[TARGET]** | DBML ENCRYPTED |
| `pflegeortPlz` | string | — | patientData.ts:72 | dito | ja `careAddressZip` (dbml:452) | **[TARGET]** | — |
| `pflegeortOrt` | string | — | patientData.ts:73 | dito | ja `careAddressCity` (dbml:453) | **[TARGET]** | — |
| `pflegeortGemeinde` | string | — | patientData.ts:74 | **nicht in UI** (Patient360Page) | nein | — | erfasst im Onboarding, MigratedPatientForms.tsx:152 |
| `pflegeortBfsNummer` | string | — | patientData.ts:75 | **nicht in UI** | nein | — | dito |
| `pflegeortKanton` | string | — | patientData.ts:76 | **nicht in UI** | nein | — | dito |
| `pflegeortLand` | string | — | patientData.ts:77 | **nicht in UI** | nein | — | dito |

### A4. Betreuung und Zeitpunkte — ohne Gruppenueberschrift im Code

| Feldname | Typ | Pflicht | Quelle | in UI sichtbar (wo) | in DBML | Marker | Bemerkung |
|---|---|---|---|---|---|---|---|
| `leistungsart` | string | — | patientData.ts:78 | Adresse & Mandat :1096 (bearbeitbar) | nein | — | — |
| `aufnahmeDatum` | string | — | patientData.ts:79 | Kopfzeile :705, Stammdaten :3291 | nein (vgl. `SpitexCareCase.openedAt` dbml:812) | — | siehe Frage 3 |
| `letzterBesuch` | string | — | patientData.ts:80 | Kopfzeile :707 | nein (vgl. `Visit` dbml:1732) | — | im DBML abgeleitet, nicht gespeichert |
| `sprache` | string | — | patientData.ts:81 | Adresse & Mandat :1095, Stammdaten :3086, Anamnese :1474, ATL :1882 | ja `language` (dbml:441) | [BUILT] | — |

### A5. Angaben aus dem Abklaerungsgespraech (SDA) — Blockkommentar patientData.ts:82–88

| Feldname | Typ | Pflicht | Quelle | in UI sichtbar (wo) | in DBML | Marker | Bemerkung |
|---|---|---|---|---|---|---|---|
| `geschlecht` | string | ja (StepPatient.tsx:374) | patientData.ts:90 | Stammdaten :3282 | ja `gender` (dbml:425) | [BUILT] | BB2 |
| `staatsangehoerigkeit` | string | — | patientData.ts:92 | Stammdaten :3284 | ja `nationality` (dbml:426) | [BUILT] | BB12 |
| `heimatort` | string | — | patientData.ts:93 | Stammdaten :3285 | ja `homeTown` (dbml:427) | [BUILT] | — |
| `zivilstand` | string | — | patientData.ts:95 | Stammdaten :3283 | ja `maritalStatus` (dbml:428) | [BUILT] | BB4 |
| `aufenthaltsstatus` | string | — | patientData.ts:96 | Stammdaten :3286 | ja `residenceStatus` (dbml:429) | [BUILT] | DBML-Note :429 „DRIVES THE PERMIT COMPLIANCE GATE" |
| `konfession` | string | — | patientData.ts:98 | Stammdaten :3290 | nein | — | — |
| `telefon` | string | — | patientData.ts:100 | Stammdaten :3083 | ja `phone` (dbml:435) | [BUILT] | DBML ENCRYPTED |
| `mobil` | string | — | patientData.ts:102 | Stammdaten :3084 | nein | — | DBML kennt nur ein Telefonfeld |
| `email` | string | — | patientData.ts:103 | Stammdaten :3085 | ja `email` (dbml:434) | [BUILT] | DBML ENCRYPTED |
| `spracheAndere` | string | — | patientData.ts:105 | Stammdaten :3087 | nein | — | BB13 Code 21 |
| `uebersetzerNotwendig` | string | — | patientData.ts:107 | Stammdaten :3088 | ja `needsInterpreter` (dbml:442) | [BUILT] | **Typabweichung**: Repo `string`, DBML `boolean` |
| `wohnsituation` | string | — | patientData.ts:109 | Stammdaten :3090 | nein | — | BB9 |
| `formZusammenleben` | string | — | patientData.ts:111 | Stammdaten :3091 | nein | — | BB10a |
| `neuZusammenlebend` | string | — | patientData.ts:113 | Stammdaten :3092 | nein | — | BB10b |
| `etage` | string | — | patientData.ts:114 | Stammdaten :3093 | nein | — | — |
| `liftVorhanden` | string | — | patientData.ts:115 | Stammdaten :3094 | nein | — | — |
| `treppen` | string | — | patientData.ts:116 | Stammdaten :3095 | nein | — | — |
| `personenImHaushalt` | string | — | patientData.ts:117 | Stammdaten :3096 | nein | — | — |
| `ivBezug` | string | — | patientData.ts:118 | Stammdaten :3105 | nein | — | — |
| `ivBezugProzent` | string | — | patientData.ts:119 | Stammdaten :3106 | nein | — | — |
| `hilflosenentschaedigung` | string | — | patientData.ts:120 | Stammdaten :3107 | ja `heDegree` (dbml:456) | **[TARGET]** | DBML-Enum `none\|light\|medium\|severe`, Repo Freitext |
| `assistenzbeitrag` | string | — | patientData.ts:122 | Stammdaten :3108 | nein | — | PA-01 |
| `quellensteuerHinweise` | string | — | patientData.ts:123 | Stammdaten :3109 | nein | — | — |

### A6. Bereich Z · Entlassung — Blockkommentar patientData.ts:124–126

| Feldname | Typ | Pflicht | Quelle | in UI sichtbar (wo) | in DBML | Marker | Bemerkung |
|---|---|---|---|---|---|---|---|
| `austrittDatum` | string | — | patientData.ts:128 | Austritt :3854, :3883 | nein (vgl. `SpitexCareCase.closedAt` dbml:813) | — | Z1; siehe Frage 3 |
| `austrittNach` | string | — | patientData.ts:130 | Austritt :3857 | nein | — | Z2 |
| `austrittNachAndere` | string | — | patientData.ts:132 | Austritt :3857 | nein | — | Z2 Code 13 |
| `austrittPraezisierungen` | string | — | patientData.ts:134 | Austritt :3863 | nein | — | — |
| `austrittErfasstVon` | string | — | patientData.ts:142 | Austritt :3861 | nein | — | Kommentar :135–141 „Als Abweichung vom Katalog vermerkt" |
| `austrittErfasstAm` | string | — | patientData.ts:143 | Austritt :3861 | nein | — | — |

### A7. Betriebliche Zusatzfelder — Blockkommentar patientData.ts:144–145 („Extended fields")

| Feldname | Typ | Pflicht | Quelle | in UI sichtbar (wo) | in DBML | Marker | Bemerkung |
|---|---|---|---|---|---|---|---|
| `abrechnungsStatus` | AbrechnungsStatus | — | patientData.ts:146 | Kopfzeile :640/:686 | nein | — | — |
| `reAssessmentFrist` | string \| null | — | patientData.ts:149 | Karte Re-Assessment :1182 (ueber `tageBisReAssessment` :1038) | nein | — | — |
| `offeneActionTasks` | number \| null | — | patientData.ts:150 | **nicht in UI** | nein | — | — |
| `letzteAktivitaet` | string | — | patientData.ts:151 | Karte Letzte Aktivitaet :1205 | nein | — | — |
| `abrechnungsstoppGrund` | string | — | patientData.ts:152 | **nicht in UI** | nein | — | — |
| `medlinkSync` | "synced"\|"pending"\|"error"\|"" | — | patientData.ts:154 | **nicht in UI** | nein | — | Kommentar :153 „im Onboarding wird nichts dazu erhoben" |
| `prozessStatus` | Objekt \| null | — | patientData.ts:157–161 | **nicht in UI** (Karte :1149 nutzt `getPatientProzess(status)`) | nein | — | — |

### A8. Felder ohne jede Darstellung in `Patient360Page.tsx`

`onboardingId` (:41), `angehoeriger` (:45), `angehoerigerTelefon` (:46),
`pflegeortGemeinde` (:74), `pflegeortBfsNummer` (:75), `pflegeortKanton` (:76),
`pflegeortLand` (:77), `offeneActionTasks` (:150), `abrechnungsstoppGrund` (:152),
`medlinkSync` (:154), `prozessStatus` (:157). **11 von 67 Feldern.**

---

## B. Related Lists und abhaengige Objekte

Die entscheidende Unterscheidung: haengt das Objekt im DBML an **`Patient.id`**
oder an **`SpitexCareCase.id`** (dem Fall)? Sechs Tabellen tragen **beide**
Fremdschluessel.

Der Fall existiert im DBML als `SpitexCareCase` (`docs/Spit Full.dbml:803`, 12 Felder,
Marker [BUILT] :818). Im Design-Repo existiert er als `Fall` in
`src/lib/interrai/store.ts:63–79` — mit dem ausdruecklichen Kommentar :55–61
„Fall — the clinical care episode (SpitexCareCase)" und demselben Statuswertebereich
(`registering | open | discharged | aborted`, store.ts:54 vs. dbml:810). Der Fall
verweist im Repo aber auf `klientId` (eine `Person`), **nicht** direkt auf den
Patienten; die Bruecke ist `Person.patientId` (`src/lib/interrai/store.ts:43`).

Daneben gibt es im Repo einen **zweiten, unabhaengigen Fallbegriff**: die
Onboarding-Kennung `caseId` (`src/app/routes.tsx:51`,
`src/lib/betreuung/store.ts:33`, `src/lib/onboarding/status-store.ts:28`). Sie hat
im DBML kein direktes Gegenstueck an dieser Stelle; die Verknuepfung beider Raeume
laeuft ueber `Onboarding.patientId` (`src/lib/onboarding/faelle.ts:22`).

### B1. Objekte mit Fremdschluessel auf `Patient.id`

| Objekt | Kardinalitaet | FK-Feld | im Design-Repo | im DBML | UI-Ort | Bemerkung |
|---|---|---|---|---|---|---|
| InsurancePolicy | 1:n | `patientId` (dbml:714, not null) | ja — `Versicherungsverhaeltnis.patientId` (src/lib/versicherung/store.ts:31) | ja (dbml:710) [PARTIAL] | Patient360Page.tsx:1104, :3181 | `VersicherungenAbschnitt` |
| PatientContact | 1:n | `patientId` (dbml:670, not null) | ja — `Beziehung.patientId` (src/lib/beziehungen/beziehungen.ts:230) | ja (dbml:666) [TICKETED WON-157] | Patient360Page.tsx:3475 | `BezugsteamAbschnitt` |
| RelativePatient | n:m | `patientId` (dbml:534, not null) | teilweise — Angehoerigen-Zuordnung ueber dieselbe Beziehungstabelle | ja (dbml:529) [BUILT] | Patient360Page.tsx:3455 (Betreuungsnetz) | im Repo nicht als eigenes Objekt |
| SpitexCareCase | 1:n | `patientId` (dbml:807, not null) | ja — `Fall` (src/lib/interrai/store.ts:63) | ja (dbml:803) [BUILT] | Patient360Page.tsx:6266 (`TabInterRAI`) | Repo verknuepft ueber `Person.patientId` |
| CareMandate | 1:n | `patientId` (dbml:1453) **und** `careCaseId` (dbml:1452) | ja — `Mandat.patientId` (src/lib/mandate/mandate.ts:21) | ja (dbml:1448) [TARGET] | Patient360Page.tsx:2094, beendete :2371 | DBML-Note :1452 „MANY mandates to ONE case" |
| Diagnosis | 1:n | `patientId` (dbml:1121) **und** `careCaseId` (dbml:1122, nullable) | ja — `AerztlicheDiagnose.patientId` (src/lib/diagnosen/store.ts:22) | ja (dbml:1117) [PARTIAL] | Patient360Page.tsx:4007 | — |
| MedicalDiagnosis | 1:n | `patientId` (dbml:1155) | teilweise — `PflegediagnoseEintrag.patientId` (src/lib/diagnosen/store.ts:22) | ja (dbml:1151) [TARGET] | Patient360Page.tsx:4046 | Zuordnung Repo↔DBML unsicher, siehe Verifikation |
| TreatmentGoal | 1:n | `patientId` (dbml:1241) **und** `careCaseId` (dbml:1242) | teilweise — nur Mock (`MOCK_PFLEGEPLANUNGEN`, src/lib/mocks/klinische-artefakte-mock.ts) | ja (dbml:1237) [TARGET] | Patient360Page.tsx:6287 | DBML-Note :1242 „a goal belongs to an episode" |
| Observation | 1:n | `patientId` (dbml:1282) | ja — `Vitalmessung.patientId` (src/lib/vitaldaten/store.ts:21) | ja (dbml:1278) [TARGET] | Patient360Page.tsx Route :812, `VitaldatenTab` | — |
| Medication | 1:n | `patientId` (dbml:1322) | **nein** | ja (dbml:1318) [TARGET] | Ansicht ohne Inhalt (Patient360Page.tsx:763–781) | keine Liste vorhanden |
| Allergy | 1:n | `patientId` (dbml:1382) | **nein** | ja (dbml:1378) [TARGET] | Ansicht `unvertraeglichkeiten` ohne Inhalt | keine Liste vorhanden |
| ProgressNote | 1:n | `patientId` (dbml:1398) | ja — Notizen (`Notiz.ref`, src/lib/notizen/notizen.ts:19) und Pflegeberichte | ja (dbml:1394) [TARGET] | Notizen :5131, Pflegeberichte :4419 | Repo referenziert ueber `{art,kennung}`, nicht `patientId` |
| Activity | 1:n | `patientId` (dbml:1431) | teilweise — erbrachte Leistungen (src/lib/einsaetze/store.ts) | ja (dbml:1427) [BUILT] | Patient360Page.tsx:2800 | — |
| Visit | 1:n | `patientId` (dbml:1736) **und** `careCaseId` (dbml:1737) | ja — `Einsatz.patientId` (src/lib/einsaetze/einsaetze.ts:64) | ja (dbml:1732) [TARGET] | Pflegekontrolle :2800, Pflegeberichte :4419 | — |
| Appointment | 1:n | `patientId` (dbml:1706, **nullable**) **und** `careCaseId` (dbml:1708, nullable) | **nein** | ja (dbml:1702) [BUILT] | Ansicht `termine` ohne Inhalt (:781) | keine Liste vorhanden |
| BillableItem | 1:n | `patientId` (dbml:1853) | teilweise — `KLVVerordnung.patientId` (src/lib/klv/store.ts:117) | ja (dbml:1849) [TARGET] | Patient360Page.tsx:6497 (`TabKLV`) | Zuordnung unsicher, siehe Verifikation |
| Invoice | 1:n | `patientId` (dbml:1900) | **nein** | ja (dbml:1893) [TARGET] | — | Abrechnung liegt laut CLAUDE.md ausserhalb |
| PatientDocument | 1:n | `patientId` (dbml:2247) **und** `careCaseId` (dbml:2248, nullable) | ja — `Dokument.ref = {art:"patient", kennung}` (src/lib/dokumente/dokumente.ts:33) | ja (dbml:2243) [TARGET] | Dokumente :4282, Ordnerstruktur :4237, Pflichtluecken :4351 | drei UI-Listen auf einer Quelle |
| Consent | 1:n | `patientId` (dbml:2278) | teilweise — `EinwilligungContext.tsx:24` | ja (dbml:2274) [TARGET] | Patient360Page (Kontext, keine eigene Liste) | — |

### B2. Objekte, die **nur** am Fall haengen (kein `patientId`)

| Objekt | Kardinalitaet | FK-Feld | im Design-Repo | im DBML | UI-Ort | Bemerkung |
|---|---|---|---|---|---|---|
| SpitexFormInstance | 1:n zum Fall | `careCaseId` (dbml:847, not null) | ja — `Formular.fallId` (src/lib/interrai/store.ts:158) | ja (dbml:843) [BUILT] | `AssessmentStatusView` (Patient360Page.tsx:6266) | Repo-Kommentar :157 „The Klient is reached via Fall.klientId" |
| CarePlan | 1:n zum Fall | `careCaseId` (dbml:1195, not null) | teilweise — nur Mock (klinische-artefakte-mock.ts) | ja (dbml:1191) [BUILT] | Patient360Page.tsx:6287 | — |
| SpitexServicePlan | 1:n zum Fall | `careCaseId` (dbml:1617, not null) | teilweise — `KLVVerordnung` haengt im Repo am Patienten, nicht am Fall | ja (dbml:1613) [TICKETED WON-142] | :6497 | **Bezugsebene weicht ab**, siehe Frage 2 |
| WorkflowInstance | 1:n zum Fall | `careCaseId` (dbml:1987, **nullable**) | ja — Rhythmus-Engine (src/lib/rhythmus/engine.ts) | ja (dbml:1981) [TICKETED WON-152] | `TabWorkflow` :2044 | Repo bindet an `subjektId` = patientId |
| Task | 1:n zum Fall | `careCaseId` (dbml:2062, **nullable**) | ja — Pendenzen (src/lib/mocks/service-desk-unified.ts) | ja (dbml:2058) [BUILT, BEING EXTENDED] | `TabTickets` :6088 | **UI-Liste ist ein Mock**, `getTickets(_patientId)` :507 ignoriert den Parameter |
| SpitexOnboarding | 1:1 zum Fall | `careCaseId` (dbml:2112, not null) | ja — `Onboarding.patientId` (src/lib/onboarding/faelle.ts:22) | ja (dbml:2108) [BUILT] | eigene Route `onboarding/:caseId` | im Repo am Patienten **und** am caseId |

### B3. UI-Listen ohne DBML-Gegenstueck an dieser Stelle

| Liste | UI-Ort | Datenquelle | Bemerkung |
|---|---|---|---|
| Monatsabschluesse | Patient360Page.tsx:2842 | `Monatsabschluss.patientId` (src/lib/abschluss/abschluss.ts:26) | im DBML nicht gefunden |
| Schulungsnachweise | Patient360Page.tsx:2046 | `Schulungsnachweis.patientId` (src/lib/schulung/nachweis-store.ts:38) | im DBML nicht gefunden |
| Kostengutsprachen | Patient360Page.tsx:2475 | `useKostengutsprachen` (src/lib/mandate/verordnungen-store.ts) | Bezug indirekt ueber `mandatId` |
| Aerztliche Verordnungen | Patient360Page.tsx:2645 | `useVerordnungen` (src/lib/mandate/verordnungen-store.ts) | Bezug indirekt ueber `mandatId` |
| Vorgeschichte (Spitalaufenthalte, fruehere Behandlungen) | :3663, :3700 | `Record<patientId, …>` (src/lib/patienten/vorgeschichte.ts:64) | im DBML nicht gefunden |
| Controlling / Pruefbereitschaft | :4747 | `Pruefbereitschaft.patientId` (src/lib/controlling/pruefbereitschaft.ts:75) | abgeleitete Kennzahl |
| Anna-Lagebild | :5001 | `lagebild.ts:59` | abgeleitete Kennzahl |
| Verlauf/Historie | `TabHistorie` :6184 | fester Mock `historyEntries` :528 | **kein Patientenbezug im Code** |
| Betreuungsnetz | :3455 | Beziehungen + Mandate + Einsaetze | Darstellung, keine eigene Quelle |

---

## C. Drift-Report

### C1. Nur im Design-Repo vorhanden (44 Felder)

`onboardingId` (:41), `angehoeriger` (:45), `angehoerigerTelefon` (:46),
`schweregrad` (:50), `pflegefachkraft` (:51), `pflegefachkraftInitialen` (:52),
`gemeinde` (:63), `bfsNummer` (:65), `land` (:66), `pflegeortAbweichend` (:70),
`pflegeortGemeinde` (:74), `pflegeortBfsNummer` (:75), `pflegeortKanton` (:76),
`pflegeortLand` (:77), `leistungsart` (:78), `aufnahmeDatum` (:79),
`letzterBesuch` (:80), `konfession` (:98), `mobil` (:102), `spracheAndere` (:105),
`wohnsituation` (:109), `formZusammenleben` (:111), `neuZusammenlebend` (:113),
`etage` (:114), `liftVorhanden` (:115), `treppen` (:116), `personenImHaushalt` (:117),
`ivBezug` (:118), `ivBezugProzent` (:119), `assistenzbeitrag` (:122),
`quellensteuerHinweise` (:123), `austrittDatum` (:128), `austrittNach` (:130),
`austrittNachAndere` (:132), `austrittPraezisierungen` (:134),
`austrittErfasstVon` (:142), `austrittErfasstAm` (:143), `abrechnungsStatus` (:146),
`reAssessmentFrist` (:149), `offeneActionTasks` (:150), `letzteAktivitaet` (:151),
`abrechnungsstoppGrund` (:152), `medlinkSync` (:154), `prozessStatus` (:157).

### C2. Nur im DBML vorhanden (16 Felder)

`organizationId` (dbml:418), `officeId` (:419), `nameHash` (:423),
`ahvHash` (:432), `noKnownAllergies` (:443) [TARGET], `externalId` (:445) [TARGET],
`deceasedAt` (:446) [TARGET], `resuscitationDecision` (:447) [TARGET],
`advanceDirectiveExists` (:448) [TARGET], `advanceDirectiveDate` (:449) [TARGET],
`accessNote` (:450) [TARGET], `elEntitled` (:454) [TARGET],
`elCaseNumber` (:455) [TARGET], `encryptionKeyId` (:460), `createdAt` (:462),
`deletedAt` (:463).

Fachlich hervorzuheben: `resuscitationDecision` traegt die DBML-Note
„SAFETY-CRITICAL. A nurse at a collapsed client needs this on the first screen."
(:447) und hat im Repo kein Gegenstueck.

### C3. In beiden vorhanden, Name oder Typ weichen ab (20 Paare)

| Repo | DBML | Abweichung |
|---|---|---|
| `vorname` (patientData.ts:42) | `firstName` (dbml:421) | Sprache; DBML `Bytes` ENCRYPTED, Repo `string` |
| `nachname` (:43) | `lastName` (:422) | dito |
| `geburtsdatum` (:54) | `dateOfBirth` (:424) | Sprache; Repo `string`, DBML `date` |
| `geschlecht` (:90) | `gender` (:425) | Sprache |
| `staatsangehoerigkeit` (:92) | `nationality` (:426) | Sprache |
| `heimatort` (:93) | `homeTown` (:427) | Sprache |
| `zivilstand` (:95) | `maritalStatus` (:428) | Sprache |
| `aufenthaltsstatus` (:96) | `residenceStatus` (:429) | Sprache |
| `ahvNummer` (:53) | `ahvNumber` (:431) | Sprache; DBML zusaetzlich `ahvHash` (:432) |
| `telefon` (:100) | `phone` (:435) | Sprache; Repo trennt zusaetzlich `mobil` (:102), DBML nicht |
| `strasse` (:58) | `addressStreet` (:436) | Sprache; DBML ENCRYPTED |
| `plz` (:59) | `addressZip` (:437) | Sprache |
| `ort` (:60) | `addressCity` (:438) | Sprache |
| `kanton` (:48) | `canton` (:439) | Sprache |
| `sprache` (:81) | `language` (:441) | Sprache |
| `uebersetzerNotwendig` (:107) | `needsInterpreter` (:442) | Sprache **und Typ**: Repo `string` (Code aus sda-ja-nein), DBML `boolean` |
| `pflegeortStrasse` (:71) | `careAddressStreet` (:451) | Sprache; DBML [TARGET] + ENCRYPTED |
| `pflegeortPlz` (:72) | `careAddressZip` (:452) | Sprache; DBML [TARGET] |
| `pflegeortOrt` (:73) | `careAddressCity` (:453) | Sprache; DBML [TARGET] |
| `hilflosenentschaedigung` (:120) | `heDegree` (:456) | Sprache **und Wertebereich**: DBML `none\|light\|medium\|severe`, Repo Freitext |

### C4. In beiden identisch benannt (3 Paare)

| Feld | Repo | DBML | Bemerkung |
|---|---|---|---|
| `id` | patientData.ts:39 | dbml:417 | Repo `string`, DBML `uuid [pk]` |
| `status` | patientData.ts:47 | dbml:458 | Wertebereich nicht verglichen, siehe Verifikation |
| `email` | patientData.ts:103 | dbml:434 | Name identisch, DBML `Bytes` ENCRYPTED |

Nur drei Feldnamen stimmen woertlich ueberein. Ursache: das Repo ist durchgehend
deutsch benannt, das DBML durchgehend englisch (vgl. CLAUDE.md-Konvention
„Fachbegriffe bleiben deutsch").

---

## D. Offene Fragen

1. **Bezugsebene der Leistungsplanung.** Im DBML haengt `SpitexServicePlan` am Fall
   (`careCaseId`, dbml:1617), im Repo haengt `KLVVerordnung` am Patienten
   (`patientId`, src/lib/klv/store.ts:117), mit einer Nachtragung aus dem Fall
   (store.ts:32–34).
   (a) Repo folgt dem DBML und bindet an den Fall.
   (b) DBML folgt dem Repo und bindet an den Patienten.
   (c) Beide Bezuege bleiben, der Fall wird abgeleitet.

2. **Zwei Fallbegriffe.** Das Repo kennt `Fall` (src/lib/interrai/store.ts:63) und
   davon getrennt die Onboarding-Kennung `caseId` (src/lib/betreuung/store.ts:33).
   (a) Beide werden auf `SpitexCareCase` zusammengefuehrt.
   (b) `caseId` bleibt als reine Routen-/Entwurfskennung ohne Datenbank-Entsprechung.
   (c) `caseId` wird ein eigenes Objekt im DBML.

3. **Aufnahme- und Austrittsdatum.** Im Repo stehen `aufnahmeDatum`
   (patientData.ts:79) und `austrittDatum` (:128) am Patienten; im DBML stehen
   `openedAt`/`closedAt` am Fall (dbml:812/:813).
   (a) Die Daten wandern im Repo an den Fall.
   (b) Sie bleiben am Patienten und gelten als Kennzahl ueber alle Faelle.

4. **Klient-Bruecke.** Im Repo verweist `Fall.klientId` auf eine `Person`, die
   optional ein `patientId` traegt (src/lib/interrai/store.ts:43); im DBML verweist
   `SpitexCareCase.patientId` direkt auf den Patienten (dbml:807).
   (a) Die `Person`-Zwischenschicht entfaellt.
   (b) `Person` bleibt und bekommt im DBML ein eigenes Objekt.

5. **Sicherheitskritische Felder ohne Repo-Gegenstueck.** `resuscitationDecision`
   (dbml:447), `advanceDirectiveExists` (:448), `accessNote` (:450) und
   `noKnownAllergies` (:443) sind alle [TARGET] und fehlen im Repo.
   (a) In einem eigenen Lauf im Repo ergaenzen.
   (b) Bis zur Backend-Umsetzung ausgelassen lassen.

6. **Telefonfelder.** Das Repo trennt `telefon` und `mobil` (patientData.ts:100/:102),
   das DBML kennt nur `phone` (dbml:435).
   (a) DBML bekommt ein zweites Feld.
   (b) Repo fuehrt beide in einem Feld zusammen.
   (c) Mehrere Nummern werden ueber `Contact`/`PatientContact` abgebildet.

7. **`uebersetzerNotwendig` als Typkonflikt.** Repo `string` (Katalogcode,
   patientData.ts:107) gegen DBML `boolean` (dbml:442).
   (a) Repo wechselt auf `boolean`.
   (b) DBML wechselt auf den Katalogcode (dreiwertig inkl. „unbekannt").

8. **Elf Felder ohne Darstellung.** `onboardingId`, `angehoeriger`,
   `angehoerigerTelefon`, die vier `pflegeort*`-Zusatzfelder, `offeneActionTasks`,
   `abrechnungsstoppGrund`, `medlinkSync`, `prozessStatus` erscheinen nirgends in
   `Patient360Page.tsx` (Abschnitt A8).
   (a) Sie werden in der Detailseite sichtbar gemacht.
   (b) Sie bleiben rein technisch und werden als solche dokumentiert.
   (c) Nicht genutzte Felder werden entfernt.

9. **Pendenzenliste am Patienten ist ein Mock.** `getTickets(_patientId)`
   (Patient360Page.tsx:507) ignoriert den Parameter und liefert eine feste Liste
   (:508–513), obwohl `Task` im DBML [BUILT] ist (dbml:2058).
   (a) Die Liste wird an den echten Pendenzenbestand angeschlossen.
   (b) Sie bleibt bis zur Backend-Anbindung ein Mock.

10. **Fehlende Listen zu [TARGET]-Tabellen.** `Medication` (dbml:1318),
    `Allergy` (:1378) und `Appointment` (:1702) haben im Repo keine Liste; die
    zugehoerigen Ansichten sind ohne Inhalt (Patient360Page.tsx:763–781).
    (a) Sie werden als naechste Related Lists gebaut.
    (b) Sie bleiben leer, bis das Backend sie fuehrt.

---

*Diese Analyse ist reine IST-Aufnahme. Sie enthaelt keinen Soll-Zustand, keine
Bewertung und keine Empfehlung.*
