# Standardkatalog SDA und Entlassung

Verbindliche Feld- und Kodierungsreferenz für das Formular zur Aufnahme der
Stammdaten und der Anfrage (SDA) und das Formular Entlassung.

**Quelle:** Ergänzung zu den interRAI-Handbüchern — Handbuch zur Aufnahme der
Stammdaten und der Anfrage (SDA), Handbuch Entlassung, Handbuch
Spitex-Leistungskatalog. Version 1.3, Februar 2023. Deutschsprachige Ausgabe
für die Schweiz. Spitex Schweiz, Esther Bättig.
Kapitel 1.2 und 2.2, Seiten 5 bis 20.

Stand 4.8.2026 · intern · noch nicht durch Spitex Schweiz bestätigt

---

## Wie dieses Dokument zu verwenden ist 

Dies ist die Vorlage, gegen die gebaut wird. Kodierungen, Reihenfolgen und
Wertelisten sind wörtlich aus dem Handbuch übernommen und **nicht
verhandelbar**. Zusätzliche Felder einer Organisation sind zulässig; sie dürfen
keinen Standardcode belegen und keine Standardbeschriftung ersetzen.

Wo ich interpretiere statt abzuleiten, steht **[Auslegung]**. Diese Stellen
gehören auf die Fragenliste an Esther Bättig und dürfen bis zu ihrer Klärung
nicht hartkodiert werden.

**Zählweise.** Ein Item ist eine nummerierte Position des Handbuchs. Ein Feld
ist eine Eingabe. BB1 ist ein Item mit zwei Feldern, BB15 ein Item mit fünf.

**Stand der Umsetzung**, gezählt auf Item-Ebene:

| | AA | BB | Z |
|---|---|---|---|
| Vollständig, Kodierung stimmt | 0 | 7 | 0 |
| Vorhanden, Kodierung weicht ab | 0 | 5 | 0 |
| Nicht erhoben | 3 | 5 | 3 |
| **Total Items** | **3** | **17** | **3** |

Dazu drei nicht erhobene Freitextbereiche für individuelle Präzisierungen
(AA, BB, Z).

**Statuskennzeichnung**

| | |
|---|---|
| ✓ | vorhanden, Kodierung entspricht dem Standard |
| ≈ | vorhanden, Kodierung weicht ab — Abbildung nötig |
| ✗ | nicht erhoben |

---

# Bereich AA — Information zur Anmeldung

## AA1 · Eröffnungsgrund ✗

**Ziel** Dokumentieren, ob das Formular SDA für einen Eintritt eröffnet wurde;
Dokumentation, falls es zu einem Einsatzabbruch kommt.

**Kodierung**

| Code | Wert |
|---|---|
| 1 | Eintritt in die Spitex-Organisation |
| 2 | Einsatzabbruch |

**Regeln**
- Code 1 ist in der Software als Default zu setzen.
- Code 2 gilt, wenn der Einsatz abgebrochen wird, bevor eine vollständige
  Aufnahme erfolgte.
- Bei Code 2 wird das SDA abgeschlossen, **obwohl nicht alle Items im Bereich BB
  kodiert wurden**. Der Fall gilt als abgeschlossen.
- Bei Code 2 wird **kein** Formular Entlassung ausgefüllt.

## AA2 · Datum der Eröffnung des Dossiers ✗

**Ziel** Dokumentieren des Datums, an dem das Dossier der Person in der Spitex
eröffnet wurde. Meist ist dies das Datum der Anfrage.

**Typ** Datum, Format TT MM JJJJ.

**Entscheid 4.8.2026** Das heutige Aufnahmedatum ist dasselbe Feld. Es wird auf
die Bezeichnung des Standards umgestellt — „Datum der Eröffnung des Dossiers" —
und künftig bei der Anmeldung erhoben, nicht auf der Detailseite gepflegt.

## AA3 · Anmeldende Person, Institution ✗

**Ziel** Die Institution und, wenn möglich, die Angaben zur anmeldenden Person
identifizieren, die die Spitex-Organisation für Pflege- und
Betreuungsleistungen angefragt hat.

**Vorgehen** Beim Erstkontakt, der meistens telefonisch oder elektronisch
erfolgt, die Angaben direkt entsprechend kodieren und festhalten.

**AA3 · Institution/Privatperson — Kodierung**

| Code | Wert |
|---|---|
| 0 | Angehörige |
| 1 | Hausarzt, Hausärztin, oder anderer ambulanter ärztlicher Dienst |
| 2 | Spital, stationäre Einrichtung inkl. Psychiatrie |
| 3 | Rehabilitationsklinik |
| 4 | Alters- und Pflegeheim |
| 5 | Andere Spitexorganisation |
| 6 | Behörden (z.B. KESB, Sozialdienst) |
| 7 | Person selber |
| 8 | Andere — Freitext |

**Zusatzfeld** Neben der Institution sind, soweit möglich, die Angaben zur
tatsächlich anmeldenden Person festzuhalten — also wer angerufen oder
geschrieben hat. Das Handbuch verlangt es, nennt aber keine Struktur.

**Vorschlag** Vier optionale Felder: Name · Funktion oder Rolle · Telefon ·
E-Mail. Sie ergänzen den Code, sie ersetzen ihn nicht.

## Bereich AA · Individuelle Präzisierungen ✗

Mehrzeiliges Freitextfeld für zusätzliche Informationen, die für den Bereich AA
abklärungs-, betreuungs- oder pflegerelevant sind.

---

# Bereich BB — Stammdaten und Angaben

**Ziel des Bereichs** Personenbezogene Daten zur Identität der Person, zu ihrem
Hintergrund und zu den Gründen für die Aufnahme durch die Spitex-Organisation.

## BB1 · Namen/Vornamen ✓

| Feld | Bezeichnung | Heute |
|---|---|---|
| BB1a | Name | `name` |
| BB1b | Vorname(n) | `vorname` |

**Definition** Vollständiger Name und vollständige Vornamen eingeben.

## BB2 · Geschlecht ≈

**Kodierung**

| Code | Wert |
|---|---|
| 1 | Männlich |
| 2 | Weiblich |
| 3 | Andere |

**Abweichung heute** Auswahl mit den Werten Weiblich, Männlich, Divers, in
dieser Reihenfolge. Die Bezeichnung „Divers" entspricht nicht der
Standardbezeichnung „Andere".

**Abbildung**

| Heute | Code |
|---|---|
| Männlich | 1 |
| Weiblich | 2 |
| Divers | 3 |

Empfehlung: Beschriftung auf „Andere" ändern und die Reihenfolge des Standards
übernehmen, damit Anzeige und Kodierung nicht auseinanderfallen.

## BB3 · Geburtsdatum ✓

**Typ** Datum, Format TT MM JJJJ. Heute `geburtsdatum`, nur Vergangenheit
zulässig.

## BB4 · Zivilstand ≈

**Kodierung**

| Code | Wert |
|---|---|
| 1 | Ledig |
| 2 | Verheiratet, eingetragene Partnerschaft |
| 3 | Verwitwet |
| 4 | Geschieden |

**Regeln aus dem Handbuch**
- Verheiratet → 2.
- Gleichgeschlechtliche Beziehung mit **eingetragener** Partnerschaft → 2.
- Gleichgeschlechtliche Beziehung ohne eingetragene Partnerschaft → 1.

**Entscheid 4.8.2026** Die Werteliste wird auf die vier Standardwerte reduziert.
Die heutigen acht Werte entfallen.

| Heute | Neu |
|---|---|
| Ledig | 1 Ledig |
| Verheiratet | 2 Verheiratet, eingetragene Partnerschaft |
| Eingetragene Partnerschaft | 2 Verheiratet, eingetragene Partnerschaft |
| Verwitwet | 3 Verwitwet |
| Geschieden | 4 Geschieden |
| Aufgelöste Partnerschaft | entfällt — bestehende Werte neu erheben |
| Gerichtlich getrennt | entfällt — bestehende Werte neu erheben |
| Unbekannt | entfällt — siehe unten |

Das Handbuch kennt keinen Code für einen unbekannten Zivilstand. Solange das
SDA nicht abgeschlossen ist, bleibt das Feld leer; für den Abschluss ist es zu
kodieren.

## BB5 · Nummern

### BB5a · Versicherten-Nummer ✓ Feld, ✗ Regel

**Definition** 13-stellige Nummer, ersetzt die alte AHV-Nummer. Steht auf der
Krankenversicherungskarte und muss zusammen mit der Versicherten-Kartennummer
auf der Rechnung aufgeführt werden. Entspricht der 13-stelligen AHV-Nummer,
auch NNSS-Nummer.

**Regel** Bei fehlender Versichertennummer, zum Beispiel bei Ausländerinnen und
Ausländern, muss **von der Software automatisch eine Nummer generiert werden**.

**Abweichung heute** Pflichtfeld mit Formatprüfung 756.XXXX.XXXX.XX. Eine
fehlende Nummer blockiert die Erfassung; eine Ersatznummer wird nicht erzeugt.

**Entscheid 4.8.2026** Die Ersatznummer folgt dem AHV-Format
756.XXXX.XXXX.XX einschliesslich gültiger Prüfziffer, damit sie überall dort
verarbeitbar ist, wo eine Versichertennummer erwartet wird.

Zwingende Begleitmassnahmen, sonst ist der Entscheid gefährlich:
- Der Datensatz trägt ein Kennzeichen, dass die Nummer erzeugt und nicht
  erhoben wurde. Ohne dieses Kennzeichen ist eine erzeugte Nummer später nicht
  mehr von einer echten unterscheidbar.
- Der erzeugte Nummernraum ist so zu wählen, dass eine Kollision mit einer
  echten AHV-Nummer ausgeschlossen ist.
- Wird die echte Nummer nachgereicht, ersetzt sie die erzeugte, und der
  Austausch wird protokolliert.

### BB5b · Interne Fallnummer ✗

**Definition** Bei der Anmeldung wird der Person eine Fallnummer zugeteilt.
Während die Versicherten-Nummer eine eindeutige Identifizierung der Person
ermöglicht, bezeichnet die Fallnummer **eine Periode von erbrachten
Dienstleistungen**. Benötigt dieselbe Person nach Abschluss einer Einsatzperiode
erneut Spitex-Dienstleistungen, wird ihr eine neue Fallnummer zugeteilt.

**Regeln** Die Fallnummer wird bei jedem Formular automatisch angezeigt, ist bei
allen Formularen des Falles identisch und **kann nicht manuell angepasst
werden**.

**Stand 4.8.2026** Das Handbuch schreibt kein Format vor, und es ist auch sonst
keines bekannt. Da die Nummer laut Handbuch von der Software vergeben wird,
definieren wir sie selbst. Bedingungen: eindeutig je Organisation, stabil,
nicht wiederverwendbar, für Menschen lesbar, und sie darf nicht mit der
Versichertennummer verwechselbar sein.

Zu bestätigen bei Esther Bättig, falls HomeCareData oder ein anderer
Datenaustausch ein Format erwartet.

## BB6 · Wohnort: Postleitzahl, Ort ✓

**Definition** Aufenthaltsort der Person für die Zeit, in der sie
Spitex-Dienstleistungen beansprucht.

**Heute** `adressePlz` (vier Ziffern erzwungen), `adresseOrt`. Die zusätzlich
erhobene Strasse kennt der Standard nicht; sie ist organisationsspezifisch und
operativ erforderlich.

## BB7 · Versicherungen

**Ziel** Festhalten, bei welchen Versicherungsgesellschaften die Person
Krankenversicherungen abgeschlossen hat.

**Vorgehen** Die Person oder deren Angehörige fragen, bei welchen Krankenkassen
sie grund- und zusatzversichert ist.

### BB7a · Krankenkasse: Grundversicherung ✓

Name der aktuellen Krankenversicherung, bei der die Person die obligatorische
Krankenversicherung (OKP) abgeschlossen hat. Heute `krankenkasse`, Auswahl aus
37 Kassen.

### BB7b · Krankenkasse: Zusatzversicherung ✗

Name der Zusatzversicherungs-Krankenkasse, sofern eine Zusatzversicherung
besteht, die ebenfalls Leistungen an die Kosten von Spitex-Dienstleistungen
erbringt.

**Hinweis des Handbuchs** Grund- und Zusatzversicherung derselben Person können
bei **verschiedenen** Krankenkassen abgeschlossen sein. Das Feld darf deshalb
nicht aus BB7a abgeleitet werden.

### BB7c · Invaliden-, Unfall-, Militärversicherung ✗

Name der aktuellen Invaliden-, Unfall- oder Militärversicherung, falls die
Person Spitex-Leistungen aufgrund eines Unfalls, einer Invalidität oder
aufgrund von Krankheit oder Unfall im Militär benötigt.

## BB8 · Ziele der Person — Primäres Behandlungsziel ✓ Feld, ✗ Regel

**Ziel** Die Person steht im Zentrum der Abklärungsbemühungen. Durch die Frage
nach den Behandlungszielen erhält sie eine aktive Rolle im Abklärungs- und
Behandlungsprozess. Ausgangspunkt für eine personenzentrierte Pflegeplanung.

**Vorgehen** Freitextfeld. Dokumentiert wird, was die Person von der Pflege und
Betreuung erwartet und welche Ziele sie bezüglich ihrer Gesundheit erreichen
will. Fragen allgemein und offen stellen, zum Beispiel: Was meinen Sie, wie
können wir Ihnen helfen? Was möchten Sie, dass unsere Zusammenarbeit bei Ihnen
ändern wird?

**Regeln**
- Die Person ermuntern, ihre Wünsche **in ihren eigenen Worten** auszudrücken.
- **Keine** Angaben zu möglichen Zielen aus Sicht der Pflegefachpersonen oder
  anderer Gesundheitsfachpersonen.
- Nur die Zielsetzungen der Person selbst dokumentieren, möglichst in deren
  Worten.
- Antwortet die Person, kann aber keine eigenen Ziele formulieren, wird
  **„keine"** eingetragen.
- Kann die Person nicht kommunizieren, wird ebenfalls **„keine"** eingetragen.
- Dokumentiert wird das **Hauptziel**.

**Heute** `behandlungszielFokus`, Textbereich ohne Hinweistext und ohne
„keine"-Regel.

## BB9 · Wohnsituation zur Zeit der Abklärung ≈

**Ziel** Festhalten, wo die Person während der Zeit wohnt, in der die
Spitex-Dienstleistung beansprucht wird.

**Kodierung**

| Code | Wert |
|---|---|
| 1 | Privathaus / Eigentums- / Mietwohnung / gemietetes Zimmer |
| 2 | Wohnung mit integrierten Dienstleistungen |
| 3 | Einrichtung für Personen mit psychischen Problemen |
| 4 | Wohngemeinschaft für Personen mit körperlicher Behinderung |
| 5 | Einrichtung für Personen mit geistiger Behinderung |
| 6 | Psychiatrische Klinik oder Abteilung |
| 7 | Obdachlos (mit oder ohne Obdachlosenunterkunft) |
| 8 | Alters- und Pflegeheim |
| 9 | Rehabilitationsklinik / -abteilung |
| 10 | Hospiz / Palliativstation |
| 11 | Akutklinik / -abteilung |
| 12 | Justizvollzugsanstalt |
| 13 | Sonstiges |

**Erläuterungen** Code 1 umfasst auch Seniorengemeinschaften und unabhängiges
Wohnen für ältere Erwachsene oder Personen mit Behinderungen. Code 2 meint
integrierte Dienste wie Reinigung, Mahlzeiten, Wäschereinigung — **nicht**
Pflegeleistungen.

**Vorgehen** Die anfragende Person nach der Wohnsituation fragen oder beim
Erstbesuch abklären. Weilt die Person zum Zeitpunkt der Anmeldung im Spital oder
an einer vorübergehenden Adresse, ist abzuklären, wo sie anschliessend wohnen
wird, wann der Umzug stattfindet und wo die Spitex-Dienstleistung beginnen soll.

**Hinweis des Handbuchs** Im Spitex-Setting sind vorwiegend die Codes 1, 2 und
13 relevant.

**Abbildung heute**

| Heute | Code |
|---|---|
| Eigene Wohnung | 1 |
| Eigenheim | 1 |
| Betreutes Wohnen | 2 |
| Pflegeheim | 8 |
| Sonstige | 13 |

Zwei bestehende Werte fallen auf Code 1 zusammen. Bestehende Daten sind damit
verlustfrei übertragbar; umgekehrt sind sie nicht rekonstruierbar.

## BB10 · Form des Zusammenlebens

**Ziel** Erfahren, mit wem die Person zum Zeitpunkt der Bedarfsabklärung
zusammenlebt. Hilft, Personen zu identifizieren, die möglicherweise für die
Unterstützung zur Verfügung stehen.

**Vorgehen** Zuerst die anfragende Person fragen. Ohne Angaben beim Erstbesuch
abklären.

### BB10a · Form des Zusammenlebens ✗

| Code | Wert |
|---|---|
| 1 | Alleine |
| 2 | Ausschliesslich mit Partner/in |
| 3 | Mit Partner/in und anderen (Kinder, Eltern, Freunde) |
| 4 | Mit Kindern, ohne Partner/in |
| 5 | Mit Eltern oder Erziehungsberechtigten (aber ohne Partner/in) |
| 6 | Mit Geschwistern (ohne Partner/in, Kinder, Eltern, Erziehungsberechtigte) |
| 7 | Mit anderen Verwandten (z.B. Tante, Onkel) |
| 8 | Mit einem oder mehreren Nicht-Verwandten |

**Erläuterungen** Code 2 umfasst Ehepartnerin und Ehepartner, auch eingetragene
Partnerschaft, sowie Freundin und Freund.

**Regel** Dokumentiert wird die Situation, die für die Zeitspanne des Assessments
gilt. **Vorübergehende Rahmenbedingungen werden nicht berücksichtigt** —
Beispiel des Handbuchs: die Tochter wohnt bei der Person, bis die
Spitex-Dienstleistung angelaufen ist.

**Verhältnis zum heutigen Feld** Die heutige Angabe „Personen im Haushalt" ist
eine Anzahl und beantwortet BB10a nicht. Beide Felder erfassen verschiedene
Sachverhalte.

### BB10b · Neu zusammenlebend ✗

**Frage** Lebt die Person neu mit jemand anderem zusammen, verglichen mit vor 90
Tagen oder seit der letzten Beurteilung?

**Definition** Zeigt, ob sich die Wohnsituation in den letzten 90 Tagen geändert
hat. Zum Beispiel ist die Person mit jemandem zusammengezogen, jemand ist zur
Person gezogen, oder die Ehepartnerin oder der Ehepartner ist in den letzten 90
Tagen gestorben.

| Code | Wert |
|---|---|
| 0 | Nein |
| 1 | Ja |

## BB11 · Zeit seit dem letzten Spitalaufenthalt ≈

**Ziel** Den Zeitpunkt des letzten Spitalaufenthalts, ohne Rehabilitation oder
Heim, in den letzten 90 Tagen ermitteln. Hilfreich für die Beurteilung der
Stabilität des Zustands und der Frage, ob eine Nachsorge erforderlich ist.

**Vorgehen** Die Person fragen, wie lange es her ist, seit sie aus dem Spital
entlassen wurde. Die Periode bestimmen, indem vom Beginn der Bedarfsabklärung
zurückgerechnet wird.

**Kodierung** Kodiert wird der letzte Aufenthalt in den **letzten 90 Tagen**.

| Code | Wert |
|---|---|
| 0 | Kein Spitalaufenthalt in den letzten 90 Tagen |
| 1 | Vor 31–90 Tagen |
| 2 | Vor 15–30 Tagen |
| 3 | Vor 8–14 Tagen |
| 4 | In den letzten 7 Tagen |
| 5 | Ist aktuell hospitalisiert |

**Abweichung heute** Ja/Nein-Umschalter für „Spitalaufenthalte (letzte 90
Tage)".

**Abbildung** „Nein" → 0. **„Ja" ist nicht auflösbar** — es verteilt sich auf
die Codes 1 bis 5. Bestehende Ja-Werte sind nicht migrierbar und müssen neu
erhoben werden.

**Hinweis** Deckungsgleich mit interRAI HC Item A13.

## BB12 · Staatsangehörigkeit ≈

**Kodierung**

| Code | Wert |
|---|---|
| 1 | Schweizer/in |
| 2 | Andere, welche — Freitext mit Staatsangabe |

**Regel** Besitzt die Person eine doppelte Staatsbürgerschaft und ist eine davon
das Schweizer Bürgerrecht, wird mit **1** kodiert.

**Abweichung heute** Auswahl mit neun Werten (Schweiz, Deutschland, Frankreich,
Italien, Österreich, Portugal, Spanien, Türkei, Andere).

**Abbildung** Schweiz → 1. Alle übrigen → 2, wobei der Staatsname in den
Freitext übernommen wird. Die Doppelbürgerregel ist heute nicht abbildbar, weil
nur eine Staatsangehörigkeit erfasst werden kann.

## BB13 · Üblicherweise gesprochene Sprache ✗

**Ziel** Feststellen, in welcher Sprache die Person in der alltäglichen
Kommunikation spricht. Pflegefachpersonen müssen mit der Person in jener Sprache
kommunizieren können, die sie versteht. Die Angabe kann darauf hinweisen, dass
eine Übersetzerin oder ein Übersetzer beigezogen werden muss.

**Definition** Bevorzugte Sprache für die tägliche Kommunikation. Ist die Person
der lokalen Sprache nicht mächtig, wird die Sprache aufgeführt, die sie
normalerweise spricht.

**Vorgehen** Die Person oder deren Angehörige fragen, welche Sprache die Person
in erster Linie spricht oder versteht.

**Kodierung**

| Code | Sprache | Code | Sprache |
|---|---|---|---|
| 1 | Schweizerdeutsch | 12 | Arabisch |
| 2 | Französisch | 13 | Kurdisch |
| 3 | Italienisch | 14 | Türkisch |
| 4 | Rätoromanisch | 15 | Tamilisch |
| 5 | Hochdeutsch | 16 | Chinesisch |
| 6 | Englisch | 17 | Russisch |
| 7 | Portugiesisch | 18 | Hindi |
| 8 | Spanisch | 19 | Tigrinya |
| 9 | Albanisch | 20 | Somalisch |
| 10 | Kroatisch | 21 | Andere, welche — Freitext |
| 11 | Serbisch | | |

**Heute** Nur ein Freitextfeld „Sprache" auf der Patienten-Detailseite, nicht im
Onboarding, ohne Werteliste.

## BB14 · Übersetzer/in notwendig ✗

**Ziel** Bestimmen, ob für die Verständigung mit der Person die Hilfe einer
Übersetzerin oder eines Übersetzers notwendig ist.

| Code | Wert |
|---|---|
| 0 | Nein |
| 1 | Ja |

## BB15 · Wohn-Vorgeschichte in den letzten 5 Jahren ✗

**Vorgehen** Die Person oder Angehörige fragen. Auch die Krankengeschichte
konsultieren.

**Regel** Kodiert werden **alle** Einrichtungen, in denen die Person in den
letzten fünf Jahren vor der Eröffnung des Dossiers gelebt hat. Mehrfachnennung.

| Feld | Einrichtung | Definition |
|---|---|---|
| BB15a | Alters- und Pflegeheim | mit einer Rund-um-die-Uhr-Versorgung und Betreuung |
| BB15b | Begleitetes oder betreutes Wohnen | bietet die Möglichkeit der Inanspruchnahme gewisser Dienstleistungen, z.B. Mahlzeiten, hauswirtschaftliche Dienstleistungen, Pflegeleistungen, Einkaufsservice, soziale Unterstützung |
| BB15c | Einrichtung für Personen mit psychischen Problemen | z.B. Wohngruppen für Menschen mit psychischen Erkrankungen, die gewisse Dienstleistungen in Anspruch nehmen |
| BB15d | Psychiatrische Klinik oder Psychiatrieabteilung eines Spitals | spezialisiertes Spital oder Abteilung innerhalb eines Akutspitals |
| BB15e | Einrichtung für Personen mit einer geistigen Behinderung | Wohnheim mit entsprechenden Dienstleistungen, in der Regel rund um die Uhr |

Je Feld: 0 Nein · 1 Ja.

## BB16 · Einschätzung der Situation ✗

**Ziel** BB16 hat eine **Triagefunktion**. Je nach Beantwortung wird innerhalb
der Organisation ein anderer Prozess ausgelöst.

**Definition** Hier wird festgelegt, welche Art von Pflege- und
Betreuungsleistungen die Person voraussichtlich, zum Zeitpunkt der Anmeldung, in
Anspruch nehmen soll.

**Kodierung und Prozessfolge**

| Code | Situation | Folge |
|---|---|---|
| 1 | Somatische Pflege- und Betreuungssituation | Bedarfsabklärung mit interRAI HC Schweiz |
| 2 | Psychiatrische Pflege- und Betreuungssituation | Bedarfsabklärung mit interRAI CMH Schweiz |
| 3 | Palliative Pflege- und Betreuungssituation | Bedarfsabklärung mit fachspezifischem Instrument |
| 4 | Pädiatrische Pflege- und Betreuungssituation | Bedarfsabklärung mit fachspezifischem Instrument |
| 5 | Isoliert-therapeutische Pflegesituation | **kein interRAI** — SDA vollständig, Leistungsplanungsblatt, beim Austritt Formular Entlassung |
| 6 | Vorübergehende Betreuungssituation (hauswirtschaftliche Leistungen) | **kein interRAI** — SDA plus hauswirtschaftliche Abklärung |
| 7 | Klientin lehnt eine umfassende Bedarfsabklärung ab | **kein interRAI** — SDA vollständig, Leistungsplanungsblatt, beim Austritt Formular Entlassung |

**Erläuterungen des Handbuchs**
- Code 5: Heparin verabreichen (z.B. Fraxiparin), Verbandwechsel, Augentropfen,
  Stützstrümpfe und Ähnliches. Nur zu kodieren, wenn ein klarer, zeitlich
  befristeter Auftrag vorliegt, der keine Planung oder Evaluation durch die
  Pflegefachperson erfordert. In der Regel liegen diese Einsätze unterhalb einer
  Periode von drei Monaten.
- Code 6: Vorübergehende Unterstützung im Haushalt von bis zu drei Monaten bei
  Ausfall oder gesundheitlicher Beeinträchtigung der haushaltführenden Person
  infolge Krankheit, Unfall, Wochenbett, Schwangerschaft oder Geburt.
- Code 7: Müssen die Einsätze über einen längeren Zeitraum erbracht werden,
  sollte eine Bedarfsabklärung mit einem interRAI-Instrument erfolgen, um die
  Situation vollständig zu erfassen.

## BB17 · Verantwortliche Personen ✗

**Ziel** Festhalten, welche Personen das Formular SDA bearbeitet und
abgeschlossen haben.

| Feld | Inhalt |
|---|---|
| BB17a | Unterschrift der Personen, die mit dem Formular SDA gearbeitet haben |
| BB17b | Unterschrift der zuständigen Person, die das Formular SDA abschliesst — Datum und Unterschrift |

**Entscheid 4.8.2026** Eine Unterschrift im Wortsinn ist bei einem digital
geführten Formular nicht umsetzbar. An ihre Stelle tritt ein Protokoll:

- **BB17a** — alle Benutzerinnen und Benutzer, die am Formular gearbeitet
  haben, je mit Zeitpunkt. Mehrere Einträge, chronologisch.
- **BB17b** — die Benutzerin oder der Benutzer, die oder der das Formular
  abgeschlossen hat, mit Zeitpunkt. Genau ein Eintrag.

Dasselbe gilt für Z3. Das Protokoll ist nicht bearbeitbar.

## Bereich BB · Individuelle Präzisierungen ✗

Mehrzeiliges Freitextfeld für zusätzliche Informationen, die für den Bereich BB
abklärungs-, betreuungs- oder pflegerelevant sind.

---

# Bereich Z — Entlassung

**Einleitung** Die Punkte dieses Bereichs werden erst bei der Entlassung der
Person aus den Spitexleistungen ausgefüllt. Damit wird die Dokumentation des
Falls abgeschlossen. Der Bereich ist eine Informationsquelle, falls die Person
später erneut Spitexleistungen in Anspruch nimmt, für die Überprüfung der
Qualität der Behandlung und für die zusammenfassende Berichterstattung innerhalb
der Organisation.

**Öffnungsregeln**
- Eine Entlassung erfolgt, wenn die Person keine Spitex-Leistungen mehr bezieht.
- Das Formular Entlassung kann erst geöffnet und ausgefüllt werden, wenn das
  vorhergehende Formular abgeschlossen ist.
- Bei Personen mit SDA, aber ohne Bedarfsabklärung mit einem
  interRAI-Instrument, muss das SDA zwingend abgeschlossen sein.
- Wurde ein Erst- oder Reassessment mit einem interRAI-Instrument durchgeführt,
  müssen diese Formulare **und** das SDA zwingend abgeschlossen sein.
- Bei einem Einsatzabbruch wird **kein** Formular Entlassung ausgefüllt.

## Z1 · Letzter Tag der Inanspruchnahme von Leistungen durch die Spitex ✗

**Ziel** Dokumentieren des Entlassungsdatums. Eine Entlassung findet statt, wenn
die Person keine Pflege- und Betreuungsleistungen mehr durch die
Spitexorganisation in Anspruch nimmt.

**Vorgehen** Erst bei der Entlassung ausfüllen.

**Typ** Datum, Format TT MM JJJJ.

## Z2 · Entlassung nach ✗

**Ziel** Dokumentieren der Lebensumstände, in die die Person entlassen wird.

**Vorgehen** Erst bei der Entlassung ausfüllen. Kodiert werden die
Lebensumstände unmittelbar nach der Entlassung. Es wird **genau eine** Antwort
ausgewählt.

| Code | Wert |
|---|---|
| 1 | Privathaus / Eigentums- / Mietwohnung / gemietetes Zimmer |
| 2 | Wohnung mit integrierten Dienstleistungen |
| 3 | Einrichtung für Personen mit psychischen Problemen |
| 4 | Wohngemeinschaft für Personen mit körperlicher Behinderung |
| 5 | Einrichtung für Personen mit geistiger Behinderung |
| 6 | Psychiatrische Klinik oder Abteilung |
| 7 | Obdachlos (mit oder ohne Obdachlosenunterkunft) |
| 8 | Alters- und Pflegeheim |
| 9 | Rehabilitationsklinik / -abteilung |
| 10 | Hospiz / Palliativstation |
| 11 | Akutklinik / -abteilung |
| 12 | Justizvollzugsanstalt |
| 13 | Sonstiges — Freitext, z.B. andere Spitexorganisation |
| 14 | **Verstorben** — die Person ist zuhause verstorben |

Codes 1 bis 12 sind mit BB9 identisch. Code 13 trägt hier ein Freitextfeld,
Code 14 existiert nur in Z2.

## Bereich Z · Individuelle Präzisierungen ✗

Mehrzeiliges Freitextfeld für zusätzliche Informationen, die für den Bereich Z
abklärungs-, betreuungs- oder pflegerelevant sind.

## Z3 · Unterschrift der für den Austritt zuständigen Person ✗

**Ziel** Festhalten, welche Fachperson den Austritt kodiert hat.

**Inhalt** Unterschrift der zuständigen Person, die den Austritt (Z1 und Z2)
dokumentiert und abgeschlossen hat — Datum und Unterschrift.

---

# Prozessregeln, die nicht an einem einzelnen Item hängen

| Regel | Quelle |
|---|---|
| Mit dem Formular SDA wird bei einer Klientin ein Fall eröffnet | Kap. 1.1 |
| Pro Fall ein SDA sowie mehrere interRAI HC Schweiz, interRAI CMH Schweiz, Modul Hauswirtschaft, andere spezifische Instrumente und Leistungsplanungsblätter | Kap. 1.1 |
| Ein Fall umfasst eine Behandlungsperiode | Kap. 1.1 |
| Der Fall gilt als abgeschlossen, wenn die Klientin keine Spitex-Leistung mehr benötigt bzw. das Formular Entlassung abgeschlossen ist | Kap. 1.1 |
| Ein nächster Fall kann erst eröffnet werden, wenn der vorhergehende mit einer Entlassung abgeschlossen wurde | Kap. 1.1 |
| Das SDA wird zum Zeitpunkt der Anmeldung eröffnet und im Rahmen des Erstbesuchs bei der Klientin vervollständigt | Kap. 1.1 |
| Unter Umständen ist es sinnvoll oder nötig, die Angehörigen einzubeziehen | Kap. 1.1 |
| Viele Items des SDA finden sich auch in den Bereichen A und B von interRAI HC Schweiz und interRAI CMH Schweiz. Die Software sieht vor, dass die Angaben aus dem SDA **automatisch in die interRAI-Instrumente übertragen** werden | Kap. 1.1 |
| Das Formular wird abgeschlossen, wenn alle Items in AA und BB kodiert wurden | Kap. 1.1.1 |
| Die Daten im SDA sind Angaben zum Zeitpunkt des Eintrittes und sollen **nicht dynamisch angepasst** werden | Kap. 1.1.2 |
| Änderungen in den Stammdaten sind in der Pflegedokumentation **unabhängig vom SDA** festzuhalten, sobald das SDA abgeschlossen ist | Kap. 1.1.2 |
| Nach Abschluss eines Formulars können die erfassten Daten nicht mehr geändert werden; das abgeschlossene Formular ist **gesperrt** | Kap. 1.1.2 |
| Die einzelnen abgeschlossenen Formulare werden über die **Versichertennummer und die Fallnummer** miteinander verknüpft — alle Formulare eines Falles müssen diese Informationen zwingend identisch enthalten, so dass die zeitlich chronologische Abfolge erkennbar ist | Kap. 1.1.2 |

---

# Herkunft der Felder

## Standard — Spitex Schweiz

Alle oben aufgeführten Items. Feld, Kodierung, Werteliste, Reihenfolge und
Beschriftung liegen fest. Keine Organisation kann sie ändern, umbenennen,
umkodieren, ergänzen oder entfernen. Nur diese Felder gehen in Verknüpfung und
Export.

**Geltungsbereich.** Das SDA gilt für die Patientin oder den Patienten. Für
pflegende Angehörige existiert kein Spitex-Schweiz-Standard. Die Felder des
Onboarding-Schritts Angehöriger sind deshalb vollständig von uns definiert und
bilden einen eigenen Standard, den wir gegenüber Kunden setzen — er ist nicht
organisationsspezifisch, sondern unser Produkt.

## Organisationsspezifisch — heute Spitex Kaufmann

Zusätzlich erhoben, im Standard nicht vorgesehen, fachlich zulässig:

**Erreichbarkeit und Behandelnde** Strasse · E-Mail · Telefon · Hausarzt Name,
Telefon, E-Mail · Spezialarzt · Notfallkontakt Name, Telefon, Beziehung

**Identität ergänzend** Heimatort · Aufenthaltsstatus · Kartennummer · BAG-Nr.
der Kasse

**Sozialleistungen** Sozialamt involviert und Kontakt · IV-Bezug und Prozent ·
Hilflosenentschädigung · IV-Assistenzbeitrag · Konfession ·
Quellensteuer-Hinweise

**Anamnese und Wohnung** Chronische Erkrankungen · Operationen · Allergien ·
Ausführliche Anamnese · Etage · Lift vorhanden · Treppen · Stimmung

## Weder noch — zu bereinigen

Diese Felder doppeln **interRAI**, nicht das SDA, und in schwächerer Skala. Sie
gehören nicht in den Organisationstopf, sondern zur fachlichen Klärung durch
Person B:

| Feld heute | interRAI-Item | Abweichung |
|---|---|---|
| Grösse | K1a | identisch |
| Gewicht | K1b | identisch, dazu Vitaldaten als dritte Erhebung |
| Gewichtsverlust | K2a | Ja/Nein gegen 5 % im Monat / 10 % in 6 Monaten |
| Brille | D4 Sehen | Hilfsmittelbesitz gegen 5-stufigen Funktionsgrad |
| Hörgerät | D3 Hören | Hilfsmittelbesitz gegen 5-stufigen Funktionsgrad |
| Stürze (3 Felder) | J1, J2 | Zeitpunkt über 365 Tage gegen Häufigkeit über 180 Tage |
| Personen im Haushalt | — | steht neben BB10a, erfasst etwas anderes |

---

# Offene Punkte

## Entschieden am 4.8.2026

| Punkt | Entscheid |
|---|---|
| BB4 Zivilstand | Nur die vier Standardwerte. Die heutigen acht entfallen |
| BB5a Ersatznummer | AHV-Format mit Prüfziffer, plus Kennzeichen „erzeugt", kollisionsfreier Nummernraum, protokollierter Austausch bei Nachreichung |
| BB5b Fallnummer | Kein Standardformat bekannt; wir definieren es selbst |
| AA2 | Identisch mit dem heutigen Aufnahmedatum, Bezeichnung auf den Standard umgestellt |
| AA3 Zusatzangaben | Name, Funktion, Telefon, E-Mail als optionale Felder |
| BB17a/b, Z3 | Benutzerprotokoll mit Zeitpunkt statt Unterschrift |
| Zertifizierung | Spitex Schweiz zertifiziert **nur die interRAI-Instrumente**. SDA und Entlassung sind nicht Gegenstand der Zertifizierung. Wir bauen sie dennoch standardkonform, weil die Formulare über Versicherten- und Fallnummer verknüpft sind und die Kodierung sonst auseinanderfällt |
| Geltungsbereich | Das SDA gilt **nur für Patientinnen und Patienten**. Für pflegende Angehörige gibt es keinen Spitex-Schweiz-Standard; deren Felder definieren wir selbst |

## Weiterhin offen

| Punkt | An wen |
|---|---|
| Ist Version 1.3 vom Februar 2023 die aktuelle Fassung? | Esther Bättig |
| Erwartet HomeCareData oder ein anderer Datenaustausch ein Format für die Fallnummer? | Esther Bättig |
| Genügt ein Benutzerprotokoll dort, wo das Handbuch eine Unterschrift verlangt — insbesondere gegenüber Krankenversicherern im Controlling? | Bättig, ggf. juristisch |
| Bestehende Ja-Werte bei BB11 sind nicht auflösbar und müssen neu erhoben werden. Betrifft eine allfällige Datenübernahme | Kaufmann |
| Welche der sieben Felder, die interRAI in schwächerer Skala doppeln, bleiben bestehen? | Person B |

---

# Was dieses Dokument nicht enthält

- Den Leistungskatalog Spitex und das Leistungsplanungsblatt. Beide stehen in
  denselben Handbuch-Kapiteln 3 und 4 und sind im Umsetzungs-Backlog erfasst.
- Die interRAI-Instrumente selbst. Dieses Handbuch ist eine **Ergänzung** zu den
  interRAI-Handbüchern; ob dort weitere Prozessregeln stehen, die wir nicht
  erfüllen, ist nicht geprüft.
- Die hauswirtschaftliche Abklärung (Modul Hauswirtschaft), die aus BB16 Code 6
  folgt.
