# Feldzuordnung Patienten-Detailseite

52 im Onboarding erhobene Stammdatenfelder, je einer Platzierung zugeordnet.
Grundlage: Bestandsaufnahme vom 4.8.2026, Erhebungsorte A, B und C.
Stand 4.8.2026 · intern

## Regel

Drei Fragen je Feld, in dieser Reihenfolge. Die erste zutreffende bestimmt den Ort.

| | Frage | Ort |
|---|---|---|
| **Ü** | Wird es gebraucht, bevor man die Wohnung betritt? | Überblick |
| **W** | Wird es nur beim Nachschlagen gebraucht? | Weiterer Ort im Dossier |
| **N** | Weder noch? | Nicht anzeigen |

`?` markiert Felder, deren Zweck aus dem Code nicht hervorgeht. Dort ist meine
Zuordnung eine Vermutung, keine Ableitung.

Die Reiterstruktur ist bewusst noch nicht festgelegt. Sie wird aus dem Ergebnis
abgeleitet, nicht vorausgesetzt.

**Ergebnis: 23 Überblick · 26 weiterer Ort · 3 nicht anzeigen.**

---

## A · Personalien (24 Felder)

| Feld | Ort | Begründung |
|---|---|---|
| Name | Ü | Kopfzeile |
| Vorname | Ü | Kopfzeile |
| Geburtsdatum | Ü | Kopfzeile, Alter ist klinischer Kontext |
| Geschlecht | W | für die Pflegeplanung relevant, nicht zur Vorbereitung |
| AHV-Nummer | W | Abrechnung, nicht Pflege — heute im Kopf, gehört dort weg |
| Nationalität | W | Nachschlagewert |
| Heimatort | N `?` | kein erkennbarer Verwendungszweck |
| Aufenthaltsstatus | W `?` | beim Angehörigen entscheidend, beim Patienten unklar |
| Zivilstand | W | Nachschlagewert |
| Strasse | Ü | Einsatzort |
| PLZ | Ü | Einsatzort |
| Ort | Ü | Einsatzort |
| Krankenkasse | Ü | Teil der Abrechnungsgrundlage |
| Kartennummer | W | nur bei Abrechnung und Rückfragen |
| BAG-Nr. der Kasse | N | technische Kennung für die Abrechnungsdatei |
| Hausarzt Name | Ü | häufigster Anruf im Betrieb |
| Hausarzt Telefon | Ü | dito |
| Hausarzt E-Mail | W | selten genutzter Zweitkanal |
| Spezialarzt | W | Nachschlagewert |
| E-Mail | W | Patienten dieser Zielgruppe werden telefonisch erreicht |
| Telefon | Ü | Anruf vor dem Besuch |
| Notfallkontakt Name | Ü | Notfall duldet keine zwei Klicks |
| Notfallkontakt Telefon | Ü | dito |
| Notfallkontakt Beziehung | Ü | steht mit dem Namen in einer Zeile |

## B · Soziales & Steuer (8 Felder)

| Feld | Ort | Begründung |
|---|---|---|
| Sozialamt involviert | W | Fallkontext, kein Handlungsauslöser vor Ort |
| Kontakt Sozialamt | W | dito |
| IV-Bezug | W | Anspruchsklärung |
| IV-Bezug Prozent | W | dito |
| Hilflosenentschädigung | W | dito |
| IV-Assistenzbeitrag | W | dito; zugehöriger Dokumenttyp ist auskommentiert |
| Konfession | W `?` | relevant bei Palliativsituation und Ernährung, sonst nicht |
| Quellensteuer-Hinweise | N | Personalthema — gehört zum Angehörigen, nicht zum Patienten |

## C · Anamnese (20 Felder)

| Feld | Ort | Begründung |
|---|---|---|
| Grösse | W | Wert ohne Handlungsbezug; doppelt zu interRAI K1a |
| Gewicht | W | Verlauf gehört zu den Vitalwerten; doppelt zu K1b |
| Gewichtsverlust | W | doppelt zu interRAI K2a, dort mit definierter Schwelle |
| Brille | Ü | Hilfsmittel, bestimmt die Ansprache — siehe Vorbehalt |
| Hörgerät | Ü | Hilfsmittel, bestimmt die Ansprache — siehe Vorbehalt |
| Chronische Erkrankungen | Ü | klinischer Grundkontext jedes Besuchs |
| Spitalaufenthalte 90 Tage | W | doppelt zu interRAI A13, dort 6-stufig |
| Operationen | W | Vorgeschichte, kein Handlungsauslöser |
| **Allergien** | Ü | sicherheitsrelevant, keine Ausnahme denkbar |
| Wohnsituation | Ü | Zugang und Setting |
| Etage | Ü | Zugang |
| Lift vorhanden | Ü | Zugang |
| Treppen | Ü | Zugang und Sturzkontext |
| Personen im Haushalt | Ü | wer ist bei Ankunft anwesend |
| Ausführliche Anamnese | W | Fliesstext, wird gelesen, nicht überflogen |
| Stürze letzte 12 Monate | Ü | Sturzrisiko ist Handlungskontext; doppelt zu interRAI J1 |
| Anzahl Stürze | W | Detail zum Risiko |
| Sturz-Bemerkungen | W | Detail zum Risiko |
| Stimmung | W `?` | Erhebungsrhythmus ungeklärt — als Einzelwert kaum belastbar |
| Behandlungsziel | W `?` | Verhältnis zu den SMART-Pflegezielen ungeklärt |

---

## Der Überblick in Blöcken

23 Felder ergeben nicht 23 Zeilen. Zusammengefasst:

| Block | Inhalt | Zeilen |
|---|---|---|
| Kopf | Name, Geburtsdatum | 1 |
| Zuhause | Adresse, Wohnsituation, Etage, Lift, Treppen, Haushalt | 3 |
| Achtung | Allergien, chronische Erkrankungen, Stürze, Brille, Hörgerät | 3–5 |
| Erreichbar | Telefon Patient, Notfallkontakt, Hausarzt | 3 |
| Kostenträger | Krankenkasse | 1 |

Rund elf Zeilen — heute sind es vierzehn, davon vier ohne Handlungsbezug.

## Was auf den Überblick gehört, aber nicht aus diesen 52 Feldern stammt

| Was | Herkunft |
|---|---|
| Verlinkung zur pflegenden Angehörigen | `RelativePatient` |
| Abrechenbarkeit mit Grund | `abrechnungsStatus` |
| Bewilligung, Kostengutsprache, KLV-Umfang mit Ablaufdatum | kein Datenmodell |
| Kanton, Aufnahmedatum | Mandat |
| Re-Assessment-Frist | Datum, heute nur als Tageszahl |
| Die drei nächsten Pendenzen | `Task` |
| Fehlende Stempeltage | `TimesheetEntry`, heute ohne Patientenbezug |

Sieben Angaben, von denen drei heute keine belastbare Quelle haben.

---

## Vorbehalte

**Brille und Hörgerät auf dem Überblick sind eine Verlegenheitslösung.**
Als Ja/Nein-Angaben zum Hilfsmittelbesitz sagen sie nichts über den Seh- und
Hörgrad; interRAI D3 und D4 erheben denselben Sachverhalt 5-stufig als
Funktionsgrad. Fachlich richtig wäre, den interRAI-Wert zu zeigen und die
Anamnesefelder zu streichen. Solange interRAI nicht durchgängig erhoben ist,
ist das Ja/Nein besser als nichts. Entscheid gehört zu Person B.

**Dasselbe gilt für Stürze, Gewichtsverlust und Spitalaufenthalte.** Vier von
zwanzig Anamnesefeldern sind klinisch schwächer als das, was interRAI ohnehin
abfragt. Die Anzeigefrage ist hier die kleinere; die grössere ist, ob diese
Felder überhaupt erhoben werden sollen.

**Fünf Felder mit `?`** — Heimatort, Aufenthaltsstatus beim Patienten,
Konfession, Stimmung, Behandlungsziel. Sie stammen aus dem Schema des
Entwicklungsteams. Bevor eines davon gestrichen wird, sollte dort jemand
sagen, wofür es gedacht war.

**Nicht angezeigt heisst nicht ungenutzt.** BAG-Nummer und Kartennummer werden
für die Abrechnung gebraucht, erscheinen aber auf keiner Pflegeansicht. Das ist
Absicht, keine Lücke.
