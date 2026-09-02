# Standardkatalog — Pflegende Angehörige

Verbindliche Feld-, Wertelisten- und Regelreferenz für die Erfassung
pflegender Angehöriger.

**Geltung.** Für pflegende Angehörige besteht kein Standard von Spitex
Schweiz. Dieser Katalog ist die Setzung der Gesellschaft und gilt für alle
Kunden. Organisationsspezifische Zusatzfelder sind zulässig; sie dürfen keinen
Standardschlüssel belegen und keine Standardbeschriftung ersetzen.

**Herkunft.** Abgeleitet aus der Bestandsaufnahme vom 5.8.2026 — 73 Felder im
Formulartyp, 56 gerenderte Eingaben, 20 Regeln, 16 Wertelisten. Die
Entscheide unten wurden am 5.8.2026 getroffen.

Stand 5.8.2026 · intern · fachlich nicht abgenommen

---

## Wie dieses Dokument zu verwenden ist

Feldschlüssel, Wertelisten und Regeln sind verbindlich. Wo eine Angabe hier
fehlt, wird sie nicht erfunden, sondern ergänzt.

**Codes.** Bereich plus laufende Nummer, Präfix `AN`. Sie sind
Verweisadressen, keine Speicherwerte.

`[Setzung]` markiert Punkte, die aus dem heutigen Verhalten nicht ableitbar
sind, sondern entschieden wurden.
`[offen]` markiert, was fachlich noch zu klären ist.

**Bestand.** Der Prototyp hat heute keinen Schreibweg vom Formular in den
Angehörigenbestand. Dieser Katalog beschreibt den Sollzustand.

---

## Entscheide vom 5.8.2026

| Nr. | Entscheid | Folge |
|---|---|---|
| 1 | **Funktion führt, Qualifikation wird abgeleitet.** Die Siebenerliste `FUNKTIONEN` ist die Erhebung; die Dreierliste `qualifikation` ergibt sich daraus | Ein Erhebungsfeld weniger, eine Ableitung mehr. Anschluss an die Mindestqualifikation des Leistungskatalogs |
| 2 | **SRK wird auf zwei Angaben reduziert:** Zertifikat vorhanden ja/nein, plus das Dokument | Kursdatum, Anmeldedatum, Abschlussdatum, Status und Frist entfallen. Siehe Folgen unten |
| 3 | **Die Detailseite erhebt nicht.** Erfassung im Onboarding, Detailseite zeigt und korrigiert | 36 Bearbeiten-Felder der Detailseite entfallen als eigener Erhebungsort |
| 4 | **Ja/Nein wird einheitlich als `1` / `0` kodiert**, wie im Patientenbereich | `JA_NEIN` mit `ja`/`nein` entfällt |
| 5 | **`obNummer` entfällt.** Die Verbindung Fall ↔ Angehörige läuft über `angehoerigerId` im Fall | Ein Kennungsraum weniger |

### Folgen von Entscheid 2

Erhoben wird nur noch AN-G3. Die Frist und der Status werden **berechnet**
statt gespeichert — siehe R21. Damit bleibt die Ansicht „Qualifikation und
SRK" bestehen, ohne dass ein Feld erhoben wird.

Zwei Anzeigen ändern ihre Grundlage:

- Die Spalte „SRK Kurs" der Angehörigenliste zeigt, ob das Zertifikat
  vorliegt, statt eines Kursdatums.
- Der Hinweis „SRK ausstehend" beruht auf dem fehlenden Zertifikat, nicht auf
  einem fehlenden Kursdatum.

`srkAngemeldet` entfällt ersatzlos — die Anmeldung zum Kurs war nie erfassbar.

---

# Bereich A · Person

| Code | Feld | Typ | Pflicht | Werteliste |
|---|---|---|---|---|
| AN-A1 | Name | Text | ja | — |
| AN-A2 | Vorname | Text | ja | — |
| AN-A3 | Geschlecht | Auswahl | ja | `GESCHLECHT` |
| AN-A4 | Geburtsdatum | Datum | ja | — |
| AN-A5 | AHV-Nummer | AHV-Feld | ja | — |
| AN-A6 | Zivilstand | Auswahl | ja | `ZIVILSTAND` |
| AN-A7 | Zivilstand seit | Datum | ja | — |
| AN-A8 | Strasse und Nr. | Text | ja | — |
| AN-A9 | PLZ | Text, 4 Ziffern | ja | — |
| AN-A10 | Ort | Text | ja | — |
| AN-A11 | E-Mail | Text | ja | — |
| AN-A12 | Telefon | Text | ja | — |
| AN-A13 | Krankenkasse | Auswahl | ja | `KRANKENKASSEN` |
| AN-A14 | Kartennummer | Text | ja | — |
| AN-A15 | BAG-Nr. der Kasse | Text | nein | — |

AN-A15 wird aus AN-A13 vorbelegt und bleibt überschreibbar.

# Bereich B · Staatsangehörigkeit und Aufenthalt

| Code | Feld | Typ | Pflicht | Werteliste | sichtbar bei |
|---|---|---|---|---|---|
| AN-B1 | Staatsangehörigkeit | Combobox | ja | `STAATSANGEHOERIGKEIT` | immer |
| AN-B2 | Heimatort | Text | ja | — | AN-B1 = Schweiz |
| AN-B3 | Aufenthaltsstatus | Auswahl | ja | `AUFENTHALTSSTATUS` | AN-B1 ≠ Schweiz |
| AN-B4 | Einreisedatum | Datum | ja | — | AN-B3 gesetzt und ≠ C |
| AN-B5 | ZEMIS-Nummer | Text | ja | — | wie AN-B4 |
| AN-B6 | Einreichungsdatum Migrationsamt | Datum | ja | — | AN-B3 ∈ {B, S, F} |
| AN-B7 | Ablaufdatum Bewilligung | Datum | nein | — | AN-B3 ∈ {B, S, F} |
| AN-B8 | Einreichungsdatum Spezialbewilligung | Datum | ja | — | AN-B3 = B |
| AN-B9 | Status Spezialbewilligung | abgeleitet | — | `SPEZIALBEWILLIGUNG_STATUS` | AN-B3 = B |

AN-B9 wird nicht erhoben. Er ergibt sich aus AN-B8 und dem hochgeladenen
Dokument.

# Bereich C · Steuer und Sozialversicherung

| Code | Feld | Typ | Pflicht | Werteliste | sichtbar bei |
|---|---|---|---|---|---|
| AN-C1 | Quellensteuerpflichtig | Ja/Nein | ja | `JA_NEIN` | immer |
| AN-C2 | Konfession | Auswahl | ja | `KONFESSIONEN` | immer |
| AN-C3 | Tarifcode | abgeleitet, überschreibbar | ja | — | AN-C1 = ja |
| AN-C4 | Herkunft des Tarifcodes | abgeleitet | — | `TARIFCODE_QUELLE` | AN-C1 = ja |
| AN-C5 | Begründung der Abweichung | Text | ja | — | AN-C4 = manuell überschrieben |
| AN-C6 | Steuergemeinde | Text | nein | — | AN-C1 = ja |
| AN-C7 | BVG-versichert | Ja/Nein | ja | `JA_NEIN` | immer |
| AN-C8 | UVG-versichert | Ja/Nein | ja | `JA_NEIN` | immer |
| AN-C9 | Sozialamt involviert | Ja/Nein | ja | `JA_NEIN` | immer |
| AN-C10 | Kontakt Sozialamt | Text | ja | — | AN-C9 = ja |
| AN-C11 | Lohnabtretung | Ja/Nein | ja | `JA_NEIN` | immer |

**AN-C6 ist neu als Erhebungsfeld.** Es wird heute gesetzt, aber nie
angeboten. `[Setzung]`

# Bereich D · Partnerin oder Partner

| Code | Feld | Typ | Pflicht | Werteliste |
|---|---|---|---|---|
| AN-D1 | Vorname | Text | ja | — |
| AN-D2 | Name | Text | ja | — |
| AN-D3 | Geburtsdatum | Datum | ja | — |
| AN-D4 | Staatsangehörigkeit | Auswahl | nein | `STAATSANGEHOERIGKEIT` |
| AN-D5 | Aufenthaltsbewilligung | Auswahl | ja | `AUFENTHALT_PARTNER` |
| AN-D6 | Erwerbstätig | Ja/Nein | ja | `JA_NEIN` |

Der Bereich ist sichtbar und pflichtig, wenn AN-A6 ∈ {verheiratet,
eingetragene Partnerschaft} **und** AN-C1 = ja. Sonst ist er freiwillig
zuschaltbar.

**Sechs Felder des heutigen Typs entfallen**, weil sie nie erhoben wurden:
AHV-Nummer, ZEMIS-Nummer, F/B-Ausweis angemeldet, Anmeldedatum,
berufstätig, AHV. `[Setzung]`

# Bereich E · Kinder und Zulagen

| Code | Feld | Typ | Pflicht | Werteliste | sichtbar bei |
|---|---|---|---|---|---|
| AN-E1 | Unterhaltspflichtige Kinder vorhanden | Ja/Nein | ja | `JA_NEIN` | immer |
| AN-E2 | Anzahl unterhaltspflichtige Kinder | Zahl | ja | — | AN-E1 = ja |
| AN-E3 | Kinderzulagen über die Spitex abgerechnet | Ja/Nein | ja | `JA_NEIN` | AN-E1 = ja |

**Je Kind:**

| Code | Feld | Typ | Pflicht | Werteliste |
|---|---|---|---|---|
| AN-E10 | Vorname | Text | ja | — |
| AN-E11 | Name | Text | ja | — |
| AN-E12 | Geburtsdatum | Datum | ja | — |
| AN-E13 | Geschlecht | Auswahl | ja | `GESCHLECHT` |
| AN-E14 | In Ausbildung | Ja/Nein | ab 16 ja | `JA_NEIN` |
| AN-E15 | Ausbildung voraussichtlich bis | Datum | bei AN-E14 = ja | — |
| AN-E16 | Zulagenart | abgeleitet | — | `ZULAGENART` |

**Umgesetzt.** AN-E14 und AN-E15 sind jetzt Erhebungsfelder je Kind
(`inAusbildung: boolean | null`, `ausbildungBis: string | null`), sichtbar erst
ab dem 16. Altersjahr. AN-E16 wird an genau einer Stelle abgeleitet
(`lib/stammdaten/zulagenart.ts`, Funktion `zulagenart(geburtsdatum,
inAusbildung, stichtag)`) und nirgends gespeichert. Das frühere gespeicherte
Kürzel (K/W) am Kind ist entfallen.

Die frühere manuelle Überschreibung der Zulagenart (Felder `typQuelle`,
`overrideBegruendung`, im Katalog AN-E17/AN-E18) wurde **nicht gebaut** — die
Ableitung hat keinen Override-Pfad. Siehe Offene Punkte.

**`familienausgleichskasse` und `kinderzulagenBeantragt` entfallen** — im Typ
vorhanden, nie erhoben, nie gelesen. `[Setzung]`

# Bereich F · Anstellung und Auszahlung

| Code | Feld | Typ | Pflicht | Werteliste | sichtbar bei |
|---|---|---|---|---|---|
| AN-F1 | Bereits bei anderem Arbeitgeber angestellt | Ja/Nein | ja | `JA_NEIN` | immer |
| AN-F2 | Funktion extern | Text | ja | — | AN-F1 = ja |
| AN-F3 | Pensum extern | Zahl, % | ja | — | AN-F1 = ja |
| AN-F4 | Eintritt extern | Datum | ja | — | AN-F1 = ja |
| AN-F5 | BVG-Anbindung gewünscht | Ja/Nein | nein | `JA_NEIN` | AN-F1 = ja |
| AN-F6 | Funktion | Auswahl | ja | `FUNKTIONEN` | immer |
| AN-F7 | Qualifikationsstufe | abgeleitet | — | `QUALIFIKATION` | immer |
| AN-F8 | Eintrittsdatum | Datum | ja | — | immer |
| AN-F9 | Stundenlohn | Zahl, CHF | ja | — | immer |
| AN-F10 | Ferienanspruch | Zahl, Wochen | ja | — | immer |
| AN-F11 | Bankname | Text | ja | — | immer |
| AN-F12 | IBAN | IBAN-Feld | ja | — | immer |
| AN-F13 | Lohnart | Auswahl | nein | `LOHNART` | immer |

**AN-F7 wird nicht mehr erhoben** (Entscheid 1). Ableitung:

| AN-F6 Funktion | AN-F7 Qualifikation |
|---|---|
| pf_hf, pf_fh | fage_dipl |
| fage | fage_dipl |
| ags | srk |
| ph_srk | srk |
| ph_ohne_srk | ohne_srk |
| hauswirtschaft | ohne_srk |

Die Zuordnung von `ags` und `fage` ist `[offen]` — sie bestimmt mit, welche
KLV-Leistungen die Person erbringen darf, und gehört fachlich geprüft.

AN-F13 wird heute vom SEM-Meldeformular gelesen, aber nie erhoben. Es wird
Erhebungsfeld. `[Setzung]`

# Bereich G · Sprache und Qualifikationsnachweis

| Code | Feld | Typ | Pflicht | Werteliste | sichtbar bei |
|---|---|---|---|---|---|
| AN-G1 | Deutschkenntnisse | Auswahl | ja | `DEUTSCH_NIVEAU` | immer |
| AN-G2 | Sprachzertifikat vorhanden | Ja/Nein | nein | `JA_NEIN` | AN-G1 ≠ Muttersprache |
| AN-G3 | SRK-Pflegehelfer-Zertifikat vorhanden | Ja/Nein | ja | `JA_NEIN` | immer |

AN-G3 ist nach Entscheid 2 die einzige SRK-Angabe. Der Nachweis ist das
Dokument `srk_zertifikat`.

---

# Wertelisten

## Geteilt mit dem Patientenbereich

| Liste | Werte |
|---|---|
| `GESCHLECHT` | 1 Männlich · 2 Weiblich · 3 Andere |
| `ZIVILSTAND` | ledig · verheiratet · eingetragene_partnerschaft · verwitwet · geschieden |
| `STAATSANGEHOERIGKEIT` | volle Länderliste, Schweiz mit SDA-Code 1, alle übrigen 2 |
| `KRANKENKASSEN` | 35 Kassen, Schlüssel und Katalogbeschriftung |
| `KONFESSIONEN` | 12 Werte |
| `JA_NEIN` | 1 Ja · 0 Nein |

`JA_NEIN` wird nach Entscheid 4 auf `1`/`0` vereinheitlicht.

## Eigen

| Liste | Werte |
|---|---|
| `AUFENTHALTSSTATUS` | B · C · L · G · F · N · S |
| `AUFENTHALT_PARTNER` | CH · B · C · L · G · F · N · S |
| `FUNKTIONEN` | pf_hf · pf_fh · fage · ags · ph_srk · ph_ohne_srk · hauswirtschaft |
| `QUALIFIKATION` | ohne_srk · srk · fage_dipl |
| `DEUTSCH_NIVEAU` | muttersprache · c2 · c1 · b2 · b1 · a2 · a1 · keine |
| `ZULAGENART` | kinderzulage · ausbildungszulage · keine_zulage |
| `TARIFCODE_QUELLE` | abgeleitet · manuell_ueberschrieben |
| `SPEZIALBEWILLIGUNG_STATUS` | offen · eingereicht · bewilligt · abgelehnt |
| `LOHNART` | `[offen]` — heute keine Liste vorhanden |

**`AUFENTHALTSSTATUS` und `AUFENTHALT_PARTNER` bleiben zwei Listen.** Sie
unterscheiden sich um den Wert CH: Die angehörige Person führt einen
Aufenthaltsstatus nur, wenn sie nicht Schweizerin ist; beim Partner wird CH
ausdrücklich erfasst. Welche Liste gilt, gehört an der Felddefinition
vermerkt, nicht nur an der Aufrufstelle.

---

# Regeln

Regeln sind Teil des Standards. Sie werden nicht je Kunde abgewandelt.

## Pflicht und Sichtbarkeit

| Nr. | Auslöser | Bedingung | Wirkung |
|---|---|---|---|
| R1 | AN-B1 | Schweiz | AN-B2 pflichtig, AN-B3 entfällt |
| R2 | AN-B1 | nicht Schweiz | AN-B3 pflichtig, AN-B2 entfällt |
| R3 | AN-B3 | gesetzt und ≠ C | AN-B4 und AN-B5 pflichtig |
| R4 | AN-B3 | ∈ {B, S, F} | AN-B6 pflichtig, AN-B7 sichtbar |
| R5 | AN-A6 und AN-C1 | verheiratet oder eingetragene Partnerschaft **und** quellensteuerpflichtig | Bereich D wird pflichtig |
| R6 | AN-C9 | ja | AN-C10 pflichtig |
| R7 | AN-E1 | ja | AN-E2 und AN-E3 pflichtig. AN-E2 = 0 ist ein Fehler |
| R8 | AN-F1 | ja | AN-F2, AN-F3, AN-F4 pflichtig, AN-F5 sichtbar |
| R9 | AN-G1 | gesetzt und ≠ Muttersprache | AN-G2 sichtbar |

## Ableitungen

| Nr. | Ergebnis | Grundlage |
|---|---|---|
| R10 | **AN-C3 Tarifcode** | Buchstabe: verheiratet und Partner erwerbstätig → C · verheiratet und Partner nicht erwerbstätig → B · Kinder ohne Ehe → H · sonst A. Ziffer: Anzahl Kinder, 0 bis 9. Suffix: Y bei Kirchensteuerpflicht laut AN-C2, sonst N |
| R11 | **AN-C4** | `manuell_ueberschrieben`, sobald AN-C3 von Hand geändert wird. Dann wird AN-C5 pflichtig und die Ableitung ausgesetzt |
| R12 | **Quellensteuerpflicht entfällt** | AN-D5 ∈ {CH, C} — die zugehörige Pendenz wird beendet |
| R13 | **AN-E16 Zulagenart** | aus AN-E12 Geburtsdatum und AN-E14 in Ausbildung |
| R14 | **AN-F7 Qualifikation** | aus AN-F6, siehe Tabelle in Bereich F |
| R15 | **Ferienzuschlag** | aus AN-F10 |
| R22 | **Flüchtlingsstatus** | wahr, wenn AN-B3 ∈ {F, S}. Anzeige, kein gespeichertes Feld |
| R23 | **Grenzgänger** | wahr, wenn AN-B3 = G. Anzeige, kein gespeichertes Feld |

## Sperren und Nachweise

| Nr. | Auslöser | Wirkung |
|---|---|---|
| R16 | AN-B3 = B | Zusätzlicher Schritt „Spezialbewilligung B", sichtbar und dokumentierbar. **Keine Vertragssperre** (aufgehoben in Korrekturen Lauf 1) |
| R17 | AN-B3 ∈ {S, F} | SEM-Meldeformular wird erzeugbar. Bei AN-B3 = B erscheint stattdessen nur ein Abklärungs-Hinweis, kein Formular (Korrekturen Lauf 1) |
| R18 | AN-F10 unter dem gesetzlichen Minimum für das Alter aus AN-A4 | Warnung |
| R19 | AN-F8 | Ankerdatum der Monatsschritte |
| R20 | AN-F6 mit vorliegender KLV-Verordnung | Qualifikationsnachweis wird erzeugt |
| R21 | AN-G3 und AN-F7 | **SRK-Gate.** Gilt nur bei Qualifikationsstufe `srk` und `ohne_srk`; bei `fage_dipl` entfällt es. **Frist = AN-F8 + 12 Monate.** Ampel: Zertifikat vorhanden → erlaubt · fehlt und Frist läuft → Risiko · fehlt und Frist überschritten → pausiert. Ohne AN-F8 keine Ampel — nicht „erlaubt" als Vorgabe |

## Korrekturen Lauf 1 — falsche Aussagen im Ausländerrechtsteil

Vier Anzeigen behaupteten etwas, das nicht zutrifft; sie wurden vor dem Umbau der Regeln (Lauf 3) beseitigt. **Keine neue Regellogik.**

1. **Versprochene Ablauf-Pendenz entfernt.** Der Hinweis unter AN-B7 (Ablaufdatum Bewilligung) versprach eine Erneuerungs-Pendenz 30 Tage vor Ablauf, die kein Code erzeugte. Neuer Hinweis: „Optional. Das Datum steht auf dem Ausweis." **Offen:** Die Fristenüberwachung des Bewilligungsablaufs wird zusammen mit SRK-Kurs und Supervision in einem Fristenmodell gebaut — mit vorgesehenem **Vorlauf von 90 Tagen** (nicht mehr 30).
2. **Arbeitsort-Kanton nicht mehr festgeschrieben.** Das SEM-Meldeformular schrieb Kanton und Ort auf „Zürich" fest. Beide kommen jetzt aus dem Patientenkontext (`patientData.kanton`, Pflege-/Adressort); fehlt der Kanton, erscheint im Banner eine Kantonsauswahl, und der Download bleibt ohne Wahl inaktiv.
3. **Feldzählung erreicht null.** `firmaUid`, `beschaeftigungsgrad` und `wochenstunden` sind aus den erfassten Daten nicht befüllbar (Org-Stammdatum bzw. im Onboarding nicht erhoben) und wurden aus der Zählung genommen. Die Zahl der leeren Felder kann jetzt null erreichen.
4. **Meldepflicht-Hinweis bei Ausweis B entschärft.** Bei AN-B3 = B erscheint statt der behaupteten Meldepflicht ein Abklärungs-Hinweis („Verfahren abklären"), und der SEM-Knopf entfällt. Bei S und F unverändert. **Das Spezialbewilligungs-Gate bleibt sichtbar/dokumentierbar, sperrt aber die Vertragsunterzeichnung nicht mehr.**

**Begründung zur aufgehobenen Sperre:** Eine EU-/EFTA-Angehörige mit Ausweis B darf ohne jedes Verfahren arbeiten. Die bisherige Sperre verhinderte eine zulässige Anstellung und erzeugte eine erfundene Pflicht. Solange die Unterscheidung EU/EFTA ↔ Drittstaat (und der Bewilligungsgrund) nicht erfasst wird, ist ein Hinweis richtiger als eine Sperre. Die Vertragssperre hing allein an AN-B9 (Status Spezialbewilligung); sie ist an zwei Stellen aufgehoben (Wizard-Schritt-Sperre und „Weiter"-Sperre auf dem Spezialbewilligungs-Schritt).

**Bekannter Restposten (nicht Teil dieses Laufs):** `SpezialbewilligungDialog` trägt noch die Formulierungen „Vertragsphase … freigegeben/blockiert". Der Dialog ist im heutigen Onboarding nicht erreichbar (`onOpenSpezialbewilligung` wird nirgends aufgerufen); der Text bleibt als offener Posten für einen späteren Lauf.

## Lauf 2 — Staatsangehörigkeitsgruppe und Aufenthaltsgrund erfassbar

Zwei Angaben werden **erfasst, gespeichert und angezeigt, aber nicht ausgewertet** (die Auswertung folgt in Lauf 3 nach `Regelwerk_Auslaenderrecht_DE.md`).

1. **Länderliste kommt produktiv vom Backend.** Die acht Seed-Länder plus `andere` sind nur ein Platzhalter. Die erwartete Struktur ist das Feld `gruppe: 'schweiz' | 'eu_efta' | 'drittstaat' | null` an jedem Eintrag; das Engineering-Team ersetzt später den Seed, nicht die Struktur. `null` steht für ein nicht benanntes Land („Andere"), dessen Gruppe unbekannt ist — es wird keine Zuordnung erfunden.
2. **`sdaCode` und `gruppe` bestehen nebeneinander.** `sdaCode` ist binär (1 = Schweiz, 2 = übriges Land) und dient dem SDA-/interRAI-Export; `gruppe` ist dreiwertig und dient der ausländerrechtlichen Prüfung — dort darf eine EU-/EFTA-Angehörige mit Ausweis B ohne Verfahren arbeiten, eine Drittstaatsangehörige nicht. Beide beantworten verschiedene Fragen und bleiben getrennt.
3. **`aufenthaltsgrund = 'andere'` steht für fachlich ungeklärte Gründe**, namentlich Studium und Härtefall. Ohne diesen Wert wählte jemand einen der drei benannten Gründe (Erwerbstätigkeit, Familiennachzug, anerkannter Flüchtling), weil das Formular eine Antwort verlangt. Das Feld erscheint nur bei Drittstaat + Ausweis B, ist dann Pflicht, und wird gelöscht, sobald eine der beiden Bedingungen unwahr wird.

**Quelle zu R21:** Administrativvertrag Spitex Schweiz / ASPS mit
Einkaufsgemeinschaft HSK, gültig ab 1.4.2023, Anhang 6 «Pflegende
Angehörige», Ziffer 3.1: Die Ausbildung ist innerhalb eines Jahres ab
Anstellung zu absolvieren. Anker ist damit AN-F8, nicht der KLV-Beginn.

Zwei weitere Bestimmungen desselben Anhangs berühren das Produkt, sind aber
nicht Teil dieses Katalogs:

- **Ziffer 1.2** — ohne Zulassung als Pflegefachperson und ohne pflegerische
  Berufsausbildung dürfen ausschliesslich Massnahmen der Grundpflege nach
  Art. 7 Abs. 2 lit. c **Ziffer 1** KLV zulasten der OKP erbracht werden.
  Gehört zur Mindestqualifikation im Leistungsplanungsblatt.
- **Ziffer 2.3** — alle zwei Wochen telefonischer Kontakt, mindestens einmal
  monatlich ein Besuch einer Pflegefachperson vor Ort. Gehört zum
  Betreuungsrhythmus.

**R18 fällt heute ohne Geburtsdatum auf ein Alter von 30 zurück.** Das ist
eine stille Annahme über einen Menschen; künftig entfällt die Prüfung, wenn
AN-A4 fehlt. `[Setzung]`

---

# Dokumente

| Code | Beschriftung | Pflicht | beidseitig | Bedingung |
|---|---|---|---|---|
| `ausweis_id` | Ausweis / ID | ja | ja | immer |
| `krankenkassenkarte` | Krankenkassenkarte | ja | nein | immer |
| `bankkarte` | Bankkarte / IBAN-Nachweis | ja | nein | immer |
| `partner_ausweis` | Ausweis Partner | ja | ja | Bereich D pflichtig |
| `srk_zertifikat` | SRK-Pflegehelfer-Zertifikat | ja | nein | AN-G3 = ja |
| `familienbuechlein` | Familienbüchlein | nein | nein | AN-E1 = ja |
| `sprachzertifikat_deutsch` | Sprachzertifikat Deutsch | nein | nein | AN-G2 = ja |
| `spezialbewilligung_b` | Spezialbewilligung B | ja | nein | AN-B3 = B, eigener Schritt |
| `kind_kk_<id>` | Krankenkassenkarte Kind | ja | nein | AN-E3 = ja, je Kind |
| `kind_ausbildungsbestaetigung_<id>` | Ausbildungsbestätigung Kind | ja | nein | AN-E14 = ja, je Kind |

---

# Was entfällt

| Was | Grund |
|---|---|
| `qualifikation` als Erhebungsfeld | Entscheid 1, wird nach R14 abgeleitet |
| `srkKursDatum`, `srkStatus`, `srkDeadline`, `srkAbgeschlossenAm` | Entscheid 2, ersetzt durch die Berechnung nach R21 |
| `srkAngemeldet` | nie erfassbar gewesen |
| Die 36 Bearbeiten-Felder der Detailseite als Erhebungsort | Entscheid 3 |
| `JA_NEIN` mit `ja`/`nein` | Entscheid 4 |
| `obNummer` | Entscheid 5 |
| `fluechtlingsstatus` als gespeichertes Feld | Anzeige bleibt, abgeleitet nach R22 |
| `grenzgaenger` als gespeichertes Feld | Anzeige bleibt, abgeleitet nach R23 |
| `kinderzulagenAktiv` | AN-E3 sagt bereits, ob über die Spitex abgerechnet wird |
| `lohnsumme` | keine Quelle, nirgends erhoben, nirgends berechnet |
| `versicherungsnummer` | derselbe Sachverhalt wie AN-A14; ein Feld, Beschriftung „Kartennummer" |
| `partnerAhvNummer`, `partnerZemisNummer`, `partnerFbAusweisAngemeldet`, `partnerAnmeldungDatum`, `partnerBerufstaetig`, `partnerAhv` | nie erhoben |
| `kinderzulagenBeantragt`, `familienausgleichskasse` | nie erhoben, nie gelesen |
| Der Rückfall-Personendatensatz der Detailseite | zeigt fremde Daten |

**Bleibt:** `dokumente` als betriebliches Feld. Der Katalog führt
Dokumenttypen mit Bedingungen; welche einer Person vorliegen, ist ein Zustand
wie Stempeltage.

**Ergänzt:** AN-D1 Partner-Vorname erscheint künftig auch auf der
Detailseite; heute zeigt sie nur den Nachnamen.

---

# Offene Punkte

| Punkt | An wen |
|---|---|
| Zuordnung von `ags` und `fage` zur Qualifikationsstufe (R14) — sie bestimmt mit, welche KLV-Leistungen erbracht werden dürfen | Person B |
| **Ist die Organisation dem Administrativvertrag beigetreten?** Nur dann gelten Anhang 6 und damit R21, Ziffer 1.2 und Ziffer 2.3. Betriebe ohne Anschluss sind nicht gebunden | Kaufmann |
| **Wann wird AN-F8 festgelegt?** Der Katalog erhebt es im Schritt Angehöriger; in der Praxis beginnt die Anstellung oft erst mit der Kostenübernahme durch die Krankenversicherung. Bis dahin ist der Wert ein Planwert | Kaufmann |
| Abgrenzung der drei Daten: AA2 Eröffnung des Dossiers, AN-F8 Eintrittsdatum, KLV-Beginn. Sie liegen in dieser Reihenfolge und werden heute vermischt | intern, Kaufmann |
| Werteliste `LOHNART` — heute keine vorhanden, vom SEM-Formular gelesen | intern, ggf. Kaufmann |
| Ob AN-C6 Steuergemeinde erhoben oder aus der Adresse abgeleitet wird | intern |
| Ob `pf_hf` und `pf_fh` bei pflegenden Angehörigen überhaupt vorkommen | Kaufmann |
| **Altersgrenzen der Zulagenart** (16 / 25 Jahre) sind in `lib/stammdaten/zulagenart.ts` als vorläufige Konstanten hinterlegt und fachlich zu bestätigen | Person B / Lohnstelle |
| **Sonderfall Erwerbsunfähigkeit** — Kinderzulage läuft bei erwerbsunfähigen Kindern bis zum 20. Altersjahr weiter. Nicht abgebildet, solange das Modell keine Erwerbsunfähigkeit trägt | Person B / Lohnstelle |
| **AN-E17/AN-E18 (Override der Zulagenart)** — die Felder `typQuelle`/`overrideBegruendung` sind entfallen; falls ein manueller Override fachlich nötig ist, muss er neu spezifiziert werden | Person B |

---

# Was dieses Dokument nicht enthält

- Betriebliche Felder des Angehörigenbestands: Status, Abrechenbarkeit,
  Stempeltage, Monatsschritt, zugeordnete Patienten, Mutationsverlauf. Sie
  entstehen im Betrieb, nicht in der Erfassung.
- Die Verknüpfung zum Patienten mit Verhältnis, Beginn und Ende sowie der
  Kennzeichnung als abgerechnete Pflegeperson.
- Die Arbeitskontrolle.
- Den Leistungskatalog und die Mindestqualifikation je Leistung.