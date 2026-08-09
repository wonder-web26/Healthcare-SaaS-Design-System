# Feldzuordnung Patient

Welches Feld des Abklärungsgesprächs (SDA) landet wo am Patienten, und in
welcher Karte der Ansicht `Patient › Stammdaten` erscheint es.

Stand: 9. August 2026. Grundlage: `PatientFormData` in
`src/app/components/StepPatient.tsx`, `Patient` in
`src/app/components/patientData.ts`, Abbildung in
`src/lib/patienten/store.ts` (`stammdatenAbbilden`).

**Die Übernahme wirkt nur für neue Abschlüsse.** `stammdatenAbbilden` läuft
beim Abschluss eines Onboardings. Die zehn Patienten des Startbestands
tragen ihre Werte aus dem Seed; die hier neu übernommenen Felder stehen bei
ihnen leer und zeigen ihren erklärten Leerzustand. Erfundene Werte wären
schlimmer als keine.

## Übernommene Felder

| SDA-Feld | Kennung | Feld am Patienten | Karte |
|---|---|---|---|
| `name` | — | `nachname` | Identität |
| `vorname` | — | `vorname` | Identität |
| `geburtsdatum` | — | `geburtsdatum` | Identität |
| `ahvNummer` | — | `ahvNummer` | Identität |
| `geschlecht` | BB2 | `geschlecht` | Identität |
| `staatsangehoerigkeit` | BB12 | `staatsangehoerigkeit` | Identität |
| `heimatort` | — | `heimatort` | Identität |
| `zivilstand` | BB4 | `zivilstand` | Identität |
| `aufenthaltsstatus` | — | `aufenthaltsstatus` | Identität |
| `konfession` | — | `konfession` | Identität |
| `dossierEroeffnetAm` | AA2 | `aufnahmeDatum` | Identität |
| `adresseStrasse` + `adressePlz` + `adresseOrt` | — | `adresse` (zusammengesetzt) | Kontakt |
| `telefon` | — | `telefon` | Kontakt |
| `email` | — | `email` | Kontakt |
| `spracheCode` | BB13 | `sprache` | Kontakt |
| `spracheAndere` | BB13/21 | `spracheAndere` | Kontakt |
| `uebersetzerNotwendig` | BB14 | `uebersetzerNotwendig` | Kontakt |
| `wohnsituation` | BB9 | `wohnsituation` | Wohnsituation |
| `formZusammenleben` | BB10a | `formZusammenleben` | Wohnsituation |
| `neuZusammenlebend` | BB10b | `neuZusammenlebend` | Wohnsituation |
| `etage` | — | `etage` | Wohnsituation |
| `liftVorhanden` | — | `liftVorhanden` | Wohnsituation |
| `treppen` | — | `treppen` | Wohnsituation |
| `personenImHaushalt` | — | `personenImHaushalt` | Wohnsituation |
| `krankenkasse` | SP-02 | `krankenkasse` | Versicherung |
| `kartennummer` | SP-03 | `kartennummer` | Versicherung |
| `bagNr` | SP-03 | `bagNr` | Versicherung |
| `zusatzversicherungKasse` | BB7b | `zusatzversicherungKasse` | Versicherung |
| `weitereVersicherung` | BB7c | `weitereVersicherung` | Versicherung |
| `hausarztName` | — | `hausarztName` | Ärztliche Betreuung |
| `hausarztTelefon` | — | `hausarztTelefon` | Ärztliche Betreuung |
| `hausarztEmail` | — | `hausarztEmail` | Ärztliche Betreuung |
| `spezialAerzte` | — | `spezialAerzte` | Ärztliche Betreuung |
| `sozialamtKontakt` | — | `sozialamtKontakt` | Sozialversicherung und Steuern |
| `sozialamtKontaktDetail` | — | `sozialamtKontaktDetail` | Sozialversicherung und Steuern |
| `ivBezug` | — | `ivBezug` | Sozialversicherung und Steuern |
| `ivBezugProzent` | — | `ivBezugProzent` | Sozialversicherung und Steuern |
| `hilflosenentschaedigung` | — | `hilflosenentschaedigung` | Sozialversicherung und Steuern |
| `assistenzbeitrag` | PA-01 | `assistenzbeitrag` | Sozialversicherung und Steuern |
| `quellensteuerHinweise` | — | `quellensteuerHinweise` | Sozialversicherung und Steuern |
| `notfallkontaktName` | — | `notfallkontaktName` | — (wird zur Beziehung) |
| `notfallkontaktTelefon` | — | `notfallkontaktTelefon` | — (wird zur Beziehung) |
| `notfallkontaktBeziehung` | — | `notfallkontaktBeziehung` | — (wird zur Beziehung) |

`hausarztFachgebiet` besteht am Patienten, wird im Abklärungsgespräch aber
nicht erhoben — es bleibt leer, bis es dort ergänzt wird.

## Nicht übernommen — mit Grund

| SDA-Feld | Grund |
|---|---|
| `eroeffnungsgrund` (AA1) | Vorgangsangabe, keine Eigenschaft der Person |
| `anmeldendeInstitution` (AA3), `anmeldendeInstitutionAndere`, `anmeldendePerson*` | Angaben zur anmeldenden Stelle |
| `einschaetzungSituation` (BB16) | Einschätzung, kein Stammdatum |
| `anmeldungPraezisierungen`, `stammdatenPraezisierungen` | Freitext zum Gespräch |
| `sdaBearbeitende` (BB17a), `sdaAbgeschlossenVon` (BB17b), `sdaAbgeschlossenAm` | Protokoll des Vorgangs |
| `groesse`, `gewicht`, `gewichtsverlust`, `brille`, `hoergeraet` | Zustand, nicht Person — bleibt in der Anamnese |
| `chronischeErkrankungen`, `allergien` | Zustand — bleibt in der Anamnese |
| `spitalaufenthalte` (BB11), `operationen` | Vorgeschichte — eigene Ansicht |
| `wohnvorgeschichte*` (BB15a–e) | Vorgeschichte, nicht heutige Wohnsituation |
| `anamneseText` | Anamnese |
| `sturz*`, `stimmungAktuell`, `behandlungszielFokus` | Zustand und Ziel — Überblick und Anamnese |
| `atlAssessment` | Aktivitäten des täglichen Lebens — eigene Ansicht |
| `scans` | Dokumente — eigenes Modell, siehe `lib/dokumente/` |

## Erkannte Lücken

Angaben, die klinisch zählen und im Abklärungsgespräch **nicht erhoben**
werden. Eine Karte „Vertretung" wäre heute leer; drei leere Felder wären eine
Behauptung, deshalb erscheint sie nicht.

| Fehlt | Warum es zählt |
|---|---|
| **Vorsorgeauftrag** | Wer entscheidet, wenn der Patient es nicht mehr kann. Bei jeder Einwilligung erheblich. |
| **Beistandschaft** | Ob eine erwachsenenschutzrechtliche Massnahme besteht und welchen Umfang sie hat. Betrifft Vertragsfähigkeit und Abrechnung. |
| **Patientenverfügung** | Ob eine besteht und wo sie liegt. Bei Verschlechterung die erste Frage. |
| `hausarztFachgebiet` | Besteht am Patienten, wird im Gespräch nicht erfragt. |
| Mobiltelefon getrennt vom Festnetz | Das Gespräch erhebt ein Telefonfeld; für die Erreichbarkeit unterwegs wäre die Trennung nützlich. |
| PLZ und Ort getrennt | Am Patienten steht nur die zusammengesetzte Adresse. Für Auswertungen nach Gemeinde müsste sie zerlegt werden. |
