# Schema-Delta — Pflegeplan

Was das neue Pflegeplan-Modul (Kette Pflegediagnose → Ziel → Massnahme →
Detailintervention → KLV-Leistungsposition) an Strukturen braucht, die
`docs/Spit Full.dbml` heute nicht vorsieht. **Die dbml-Datei wurde nicht
geändert** — dieses Dokument ist der Antrag, nicht die Umsetzung.

Stand: Lauf 0 «Abriss der bestehenden Pflegeplanung», Branch `feature/pflegeplanung`.

## Ausgangslage nach dem Abriss (Lauf 0)

Die alte Typwelt (`Pflegediagnose`, `Pflegeziel`, `Massnahme`, `Pflegeplanung`
in `types/klinische-artefakte.ts`, `MOCK_PFLEGEPLANUNGEN`,
`nanda-enp-katalog.ts`, `PflegeplanungArbeitsbereich`, WZW-Auswertung) ist
vollständig entfernt. Sie bildete die Zielstruktur nicht ab: eine Massnahme
hing an genau einer Diagnose statt an Zielen, ein Ziel gehörte genau einer
Diagnose, Diagnosetyp (problem/risiko/bereitschaft) und Detaildialoge fehlten.

## Offene Posten gegenüber der dbml

### 1. Massnahme-Ziel-Bezug fehlt auf Instanzebene

Auf **Katalogebene** trägt die dbml das n:m bereits: `EnpInterventionGoal`
(MAS_ZIEL, 2'944 Links) verknüpft Interventionen mit Zielen, und
`NandaDiagnosisGoalHidden` (PROB_ZIEL_HIDE, 408 Unterdrückungen) nimmt die
klinisch unsinnigen Ziele wieder heraus.

Auf **Instanzebene** trägt sie es nicht: `ActionItem` (die geplante Massnahme)
hat `diagnosisId [not null]` und keinerlei Ziel-Bezug. Eine geplante Massnahme,
die zwei Zielen dient, ist nicht abbildbar.

**Antrag:** eigene Verknüpfungstabelle `ActionItemGoal (actionItemId,
treatmentGoalId)` mit echten Fremdschlüsseln — nicht über den polymorphen
`TreatmentGoalLink`, dessen Note die Polymorphie ausdrücklich auf sich selbst
beschränkt («ACCEPT IT HERE AND NOWHERE ELSE»).

### 2. `action_item` fehlt in `TreatmentGoalLink.targetType`

Die erlaubten Zieltypen sind `medical_diagnosis | nursing_diagnosis |
medication | service_plan_position | observation | care_mandate` — die
geplante Massnahme fehlt. Wird statt Punkt 1 der polymorphe Weg gewählt,
muss `action_item` in diese Werteliste aufgenommen werden. Punkt 1 und
Punkt 2 sind Alternativen; eine von beiden braucht es.

### 3. KLV-Bezug kommt in Lauf 6 aus dem neuen Modul

Mit dem Abriss wurden aus `KLVLeistung` entfernt: `bezugMassnahmeId`,
`diagnoseIds`, `wzwBegruendung`; aus `KLVVerordnung`: `pflegeplanungId`.
KLV-Leistungen sind **bis Lauf 6 ohne Diagnose- und Massnahmenbezug**.
Der neue Bezug entsteht dann aus dem neuen Pflegeplan-Modul entlang der
Kette Massnahme → Detailintervention → Leistungsposition (Ableitung als
Wertobjekt an der geplanten Massnahme), nicht wieder als loses ID-Feld.

Ebenfalls entfernt (Folge des fehlenden Diagnosebezugs): die WZW-Auswertung.
Eine Zweckmässigkeits-Begründung ohne Diagnose wäre eine halbe Prüfung; sie
kommt mit Lauf 6 zurück.

### 4. Mitbetroffene Funktionsflächen (Wiederaufbau eingeplant)

- **Arzt-Anfrage-Strecke im Onboarding:** Die Inline-Strecke (Einwilligung →
  Versand → Antwort → Diagnose-Extraktion) lebte im entfernten Pflegeplan-Tab.
  Der `ArztAnfrageContext` und der Workflow-Spiegel «Arzt kontaktiert»
  bestehen weiter; die Auslöse-Fläche kehrt mit dem neuen Modul zurück.
- **Pflegediagnosen in Patient360:** Ansicht «Diagnosen» (Pflege-Teil) und
  Ansicht «Pflegeplan» zeigen einen Leerzustand; die ärztlichen Diagnosen
  (eigenes Artefakt, ICD) sind unberührt und weiter erfassbar.
- **Prüfbereitschaft (Controlling):** `pflegediagnosen` wird mit `null`
  («kein Pflegeplan») gespeist — ein im Prüfmodell vorgesehener Zustand.

## Abweichungen aus Lauf 1 (Datenvertrag und Mock-Adapter)

Der Vertrag in `src/lib/pflegeplan/vertrag.ts` braucht vier Dinge, die die
dbml heute nicht vorsieht:

1. **Diagnosetyp** (`problem | risiko | bereitschaft`): `NandaDiagnosisCatalog`
   trägt kein Typ-Feld. Der Typ steuert später die Begründungsfelder des UI
   (Bestimmende Merkmale/Beeinflussende Faktoren vs. Risikofaktoren).
   Antrag: Spalte `diagnosisType` am Katalog — der Typ ist Katalogwissen,
   kein Patientenwissen.
2. **Detaildialog-Struktur**: Die dbml nennt 5'201 action-guiding detail
   interventions unter `EnpInterventionCatalog`, aber keine Struktur für
   Gruppen, Items und deren Positionswirkung (`folgePosition`). Antrag:
   Detailinterventionen als eigene Tabelle mit Gruppenlabel, Itemlabel und
   optionalem ServiceCatalog-Verweis.
3. **Intervention→Position-Regel**: Es gibt keine Mapping-Tabelle von der
   ENP-Intervention zur `ServiceCatalog`-Position (weder Standardposition
   noch detailabhängige Umschaltung). `positionFuer` braucht genau das.
4. **ServiceCatalog-Erweiterungen**: `maxAnzahl`/`maxEinheit`
   (Mengenbegrenzung je Tag/Woche) und `teilhandlungen` fehlen;
   `requiresQualification` existiert bereits und deckt
   `mindestqualifikation`. Zusätzlich braucht jedes Feld eine **Herkunft**
   (`katalog | kuratiert | mock`) — im Prototyp als parallele Karte je
   Objekt gelöst; produktiv wäre das eine Quellenangabe je Anreicherungs-
   tabelle, nicht je Zelle.

## Abweichungen aus Lauf 2 (Aufbau-Ansicht)

1. **`ausgeschlosseneZiele(code)`** ist als sechste Vertragsabfrage
   dazugekommen — die Gegenliste zur Zusicherung von `zieleZuDiagnose`
   (nicht als Zahl, sondern als Liste: «welche Ziele unterdrückt ihr bei
   dieser Diagnose» muss beantwortbar bleiben). **`NandaDiagnosisGoalHidden`
   muss diese Abfrage auch mit echten Daten tragen**: die Unterdrückungen
   je Diagnose müssen als Zielmenge auflösbar sein, nicht nur als Filter
   beim Herleiten.
2. **`unbehandelteCaps(caps)`**: ein ausgelöster CAP ohne Zuordnungsliste
   wird von `diagnoseVorschlaege` übersprungen und hier ausgewiesen — kein
   CAP verschwindet spurlos. Mit echten Daten heisst das: die
   CAP-NANDA-Zuordnungsliste braucht eine nachschlagbare Menge der
   abgedeckten CAPs.
3. **DEMO_CAPS des Alt-Assessments** wurden auf die vier Vertrags-CAPs
   gestellt (FALLS, ADL, PAIN, MOOD; CAP-CARDIO entfiel — keine
   Zuordnungsliste). Sichtbare Nebenwirkung: die interRAI-Ansichten dieses
   Assessments zeigen vier statt drei CAP-Karten.

## Abweichungen aus Lauf 5 (Dokument-Ansicht)

1. **`zielBewertungsSkala()`** ist als achte Vertragsabfrage dazugekommen —
   die fünfstufige Zielerreichungs-Skala aus der Katalog-Lieferung, Herkunft
   `katalog`. **Die Ordnung ist Teil des Vertrags** (5 bestes, 1
   schlechtestes, absteigend geliefert; per Test belegt). Mit echten Daten
   hängt die Skala **je Ziel** (`EnpGoalCatalog.evaluationScaleId`), nicht
   global — verschiedene Ziele können verschiedene Skalen tragen. Der
   Adapter darf nicht auf eine globale Skala festgelegt werden.
2. **Zieldatum, Evaluationsintervall und Einschätzung** (Stufe, Datum,
   Autorin) leben im Prototyp am Plan-Zustand je Ziel. In der dbml trägt
   `TreatmentGoal` nur `status (active | achieved | cancelled)` — es fehlen
   **Zieldatum**, **Evaluationsintervall** und die **skalierte Einschätzung
   mit Datum und Person**.
3. **Fassungen sind im Prototyp eine Zählung, keine Historie**: alte Stände
   werden nicht gespeichert und sind nicht lesbar. Mit echten Daten braucht
   der Plan **versionierte Stände** (Vorbild: die LPB-Versionierung im
   Fachmodell — neue Fassung statt stiller Änderung, ersetzte Fassungen
   bleiben lesbar).
4. Das Bezugsdatum für «überfällig» ist die feste Mock-Gegenwart
   (`GEGENWART_ISO`); produktiv ersetzt das Systemdatum die Konstante.

## Abweichungen aus Lauf 3 (Massnahmen-Editor)

1. **Zweitmandat als Lauf-6-Bedarf:** Der Massnahmen-Editor trägt einen
   Mandatsbezug; die Auswahl erscheint nur bei mehreren Mandaten (belegt per
   Unit-Test, nicht per Browser). Der Mock kann den Mehrfach-Fall heute nicht
   zeigen: `lib/mandate/store.ts:31` leitet **genau ein KVG-Mandat je
   Patient** ab, und das Mandats-Modul ist bis Lauf 6 unberührbar. Die dbml
   sieht den Fall ausdrücklich vor («a patient can be under KVG long-term
   care AND UVG accident cover at the same time», `CareMandate` ohne
   Unique-Constraint). **Lauf 6 braucht ein zweites aktives Mandat
   (UVG-Unfall) für den Demo-Klienten** — zusammen mit der dortigen
   Verifikation von Lagebild, Prüfbereitschaft, Monatsabschluss und
   Einsatzkontrolle gegen den Mehrmandats-Fall.
2. **I-STURZASSESS → 10901** (Herkunft mock): frei gewählte
   Prototyp-Zuordnung, damit eine Position ohne Teilhandlungen über die
   Oberfläche erreichbar ist.
3. **Feinplanungsfelder der Massnahme** (Wiederholung mit sechs Formen,
   Tageszeitfenster mit Verbindlichkeits-Kennzeichen, Erbringer S/I/A/V mit
   Begründungstext, Dauerabweichung mit Pflichtbegründung, überschriebene
   Qualifikation): leben im Prototyp am Plan-Zustand. In der dbml decken
   `SpitexServicePlanPosition.schedulePreference` (recurrence, weekdays,
   time-of-day band, strict-time flag), `performedBy` (S/I/A/V),
   `durationMinutes` und `minQualification` das meiste — es fehlt ein Feld
   für die **Begründung einer Dauerabweichung** vom Katalogrichtwert.

## Abweichungen aus Lauf 0b (Abriss des KLV-/LPB-Moduls)

Das KLV-/LPB-Modul ist vollständig entfernt; das Fachmodell ist in
`docs/lpb-fachmodell.md` gesichert. Was in Lauf 6 aus dem Pflegeplan-Vertrag
neu entstehen muss:

1. **Das Leistungsplanungsblatt selbst** — Positionen mit Häufigkeit, Zeit
   und erbringender Rolle, abgeleitet über die Vertragskette (Massnahme →
   Detailintervention → Position) statt frei erfasst; dazu Zustandskette,
   Sperre ab Kasseneinreichung, Versionierung und Protokoll wie im
   Fachmodell beschrieben. Die dbml trägt dies bereits als
   `SpitexServicePlan`/`SpitexServicePlanPosition`.
2. **Der Bewilligungs-Abgleich** (geplant gegen bewilligt, je Mandat) und
   die Übersichts-Filter (wartet auf Antwort, ohne Kostengutsprache, über
   der Bewilligung, einschliesslich ersetzter).
3. **Das Tagessoll der Einsatzkontrolle**: Soll-Ist-Vergleich und
   Abweichungs-Befunde sind stillgelegt — erbrachte Zeiten bleiben sichtbar,
   ohne Urteil. Ebenso die Tarifkategorie je erbrachter Leistung: sie fällt
   bis Lauf 6 pauschal auf Grundpflege (c) zurück, die Positionsauflösung
   (Bezeichnung, Häufigkeit) zeigt die rohe Positionsnummer.
4. **Der Abschnitt «Verordnet gegen dokumentiert»** im Controlling (der
   maschinelle Kassen-Abgleich) und die Prüfkarte «Leistungsplanungsblatt
   unterzeichnet» (steht konstant auf «fehlt»).
5. **Der Initialschulungs-Nachweis** beim Onboarding-Abschluss: er entstand
   aus den KLV-Nummern des Blattes und wird bis Lauf 6 nicht erzeugt.
6. **Die Sichtbarkeit der Kostengutsprachen**: die Ansicht «Verordnung und
   Kostengutsprache» ist entfernt; das Mandats-Modul (Verordnung,
   Kostengutsprache, Lücken, Stillschweige-Annahme) besteht weiter und
   speist Lagebild und Prüfbereitschaft — die Verweise führen zu den
   Mandaten. Eine eigene Anzeige gehört zum Lauf-6-Umfang.

## Was bewusst bleibt

- `spitex-leistungskatalog-2025.ts` — wird in Lauf 1 die einzige
  Positionsquelle.
- `klv-ausfuehrungsschritte.ts` — Ausführungsschritte je Position aus der
  Initialschulungs-Vorlage (85 Positionen), kein WZW-Code; Kandidat für die
  Teilhandlungen der Leistungsposition.
- `lib/diagnosen/store.ts` — reduziert auf die **ärztlichen** Diagnosen;
  der Pflege-Teil ist entfernt (Pflegediagnosen entstehen künftig im neuen
  Modul).
