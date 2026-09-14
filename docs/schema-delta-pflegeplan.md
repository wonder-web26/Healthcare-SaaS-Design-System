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

## Was bewusst bleibt

- `spitex-leistungskatalog-2025.ts` — wird in Lauf 1 die einzige
  Positionsquelle.
- `klv-ausfuehrungsschritte.ts` — Ausführungsschritte je Position aus der
  Initialschulungs-Vorlage (85 Positionen), kein WZW-Code; Kandidat für die
  Teilhandlungen der Leistungsposition.
- `lib/diagnosen/store.ts` — reduziert auf die **ärztlichen** Diagnosen;
  der Pflege-Teil ist entfernt (Pflegediagnosen entstehen künftig im neuen
  Modul).
