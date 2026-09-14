# Das Leistungsplanungsblatt — Fachmodell

Gesichert vor dem Abriss des KLV-/LPB-Moduls (Lauf 0b). Dieses Dokument
beschreibt, was das entfernte Modul über den Schweizer Ablauf wusste — das
Fachmodell, nicht die Implementierung. Es soll auch dann tragen, wenn niemand
den gelöschten Code je gesehen hat. Punkte, die aus dem Code nicht eindeutig
hervorgingen, sind als **offene Frage** markiert.

## Was das Blatt ist

Das Leistungsplanungsblatt (LPB, «KLV-Verordnung») ist die fachliche
Feststellung: so viel Pflege braucht dieser Mensch — als Liste von
Leistungspositionen aus dem Spitex-Leistungskatalog, mit Häufigkeit, Zeit und
erbringender Rolle. Es folgt dem Leistungsplanungsblatt nach RAI-Home-Care
Suisse. Die Kostengutsprache der Kasse ist die **Antwort** darauf — beide
bleiben getrennte Aussagen (siehe «Geplant gegen bewilligt»).

## Die Zustandskette

Sechs Zustände in fester Reihenfolge. Gewechselt wird **nur vorwärts und nur
um einen Schritt**; einen Weg zurück gibt es bewusst nicht.

| Zustand | Wer löst aus | Voraussetzung / Bedeutung |
|---|---|---|
| 1. Entwurf | Spitex | Anlage des Blattes; frei bearbeitbar. |
| 2. Kontrolliert | Spitex (interne Kontrolle) | Verlangt **mindestens eine Leistungsposition** — «ein leeres Blatt ist kein Blatt». |
| 3. An Arzt gesendet | Spitex | Ab jetzt ist die Ärztin am Zug; die Wartezeit beginnt zu zählen. |
| 4. Vom Arzt unterzeichnet | Spitex trägt die Rückkunft ein | Die ärztliche Unterschrift liegt vor; wieder Spitex am Zug. |
| 5. An Kasse übermittelt | Spitex | Kasse am Zug. **Ab hier ist der Inhalt gesperrt** (siehe unten). |
| 6. Entscheid erhalten | Spitex trägt den Kassenentscheid ein | Der Entscheid selbst (bewilligt/gekürzt/abgelehnt) steht an der Kostengutsprache, nicht am Blatt. |

Daneben existiert **«Ersetzt»** — ausserhalb der Kette. Es wird **nie von
Hand gesetzt**, sondern entsteht ausschliesslich beim Erstellen einer neuen
Version. Eine ersetzte Fassung wechselt den Zustand nie mehr.

Zwei Zustände warten auf jemanden **ausserhalb des Hauses** (an Arzt, an
Kasse). Genau dort liegt der Nutzen der Kette: sie macht Wartezeit sichtbar,
die niemand sieht, solange man Patient für Patient nachschaut.

## Die Sperre ab «An Kasse übermittelt»

Ein Blatt, das bei der Kasse liegt, darf **nicht still geändert** werden —
sonst laufen eingereichte und gespeicherte Fassung auseinander. Deshalb:

- Ab Zustand 5 (und bei «Ersetzt») ist der **Inhalt** gesperrt: Positionen,
  Diagnosen, Kopffelder. Wer etwas ändern will, erzeugt eine **neue Version**.
- Der **Zustand** läuft trotzdem weiter — sonst endete die Kette bei
  «an Kasse» in einer Sackgasse und der Entscheid liesse sich nie eintragen.
- Die Sperre gilt an jedem Schreibweg, in jeder Oberfläche — auch in denen,
  die nichts von ihr wissen.

## Blattarten und Versionierung

- Arten: **Erstabklärung** und **Folgeabklärung**. Das erste Blatt eines
  Patienten ist eine Erstabklärung; jede neue Version entsteht als Folge.
  **Offene Frage:** ob sich Erst- und Folgeabklärung fachlich über dieses
  Merkmal hinaus unterscheiden (andere Fristen, andere Formulare, anderes
  Kassenverfahren), ging aus dem Code nicht hervor.
- Versionsnummern laufen **je Patient** fortlaufend über die höchste bereits
  vergebene Nummer weiter.
- Eine neue Version übernimmt Positionen, Diagnosen und Zielformulierungen
  der Vorversion, beginnt bei «Entwurf» mit frischem Protokoll; die
  Vorversion wird «Ersetzt».
- Ersetzte Fassungen sind Geschichte: sie erscheinen in der Übersicht nur
  auf ausdrücklichen Wunsch («Einschliesslich ersetzter»), denn sie würden
  die Frage «was ist im Verfahren?» verfälschen. Löschen ist nur für
  Entwürfe vorgesehen.

## Geplant gegen bewilligt

Der Kern des Abgleichs, eine Rechnung für alle Oberflächen:

- Das Blatt plant **Stunden pro Woche**: die Summe der periodischen
  Positionen, ausgewiesen je KLV-Kategorie (a, b, c) und als Total.
  Monatsrhythmen werden durch 4.33 geteilt; einmalige Leistungen und
  «nach Bedarf» zählen **nicht** zur Wochensumme (einmalige werden separat
  in Minuten ausgewiesen).
- Die Kostengutsprache bewilligt **Minuten pro Woche** (Umrechnung durch 60).
  Sie bewilligt heute **eine Menge für das ganze Blatt**, nicht je
  Kategorie — kämen Kategorienwerte hinzu, gehörte der Abgleich je
  Kategorie geführt.
- Kürzt die Kasse, wird das Blatt **nicht angepasst**. Wer es anpasst, tut
  es bewusst und erzeugt eine neue Version — die Differenz bleibt sichtbar.
- Vier Lagen: **über** der Bewilligung (mehr geplant als bewilligt),
  **unter** (bewilligt deckt), **abgelaufen** (Gutsprache vorhanden, aber
  Gültigkeit vorbei — mit dem Enddatum als Auskunft, was zu erneuern ist),
  **keine** (keine Gutsprache am Mandat, oder eine ohne bewilligte Menge —
  etwa solange die Kasse nicht entschieden hat). Ohne Zahl wird **nicht mit
  Null gerechnet, sondern gar nicht**.
- Die Kostengutsprache gehört zum **Mandat**, nicht zum Patienten. Ein
  Patient kann mehrere Mandate tragen (verschiedene Zahler, verschiedene
  Tarife); nur die Gutsprache des Blatt-Mandats zählt.
- «**Keine gültige Kostengutsprache**» ist gefährlich: die Kasse kann bis zu
  **fünf Jahre rückwirkend zurückfordern**, auch wenn die Leistung erbracht
  und die ärztliche Verordnung gültig war. Zeiten ohne Deckung werden darum
  als eigene Objekte geführt (**Lücken**: erster/letzter ungedeckter Tag,
  Dauer, offen bis zum Stichtag oder geschlossen).
- Bleibt der Kassenentscheid **14 Tage** aus, gilt das eingereichte Blatt als
  **stillschweigend angenommen** — das Rückforderungsrisiko bleibt davon
  unberührt. Gespeichert bleibt «ausstehend»; die Annahme ist eine
  Anzeige-Ableitung aus dem Einreichdatum.

## Gültigkeit, Zuständigkeit, Wartezeit

- Das Blatt trägt einen Gültigkeitszeitraum (Beginn/Ende); die
  Kostengutsprache ihren eigenen (gültig ab/bis). Eine in weniger als
  **30 Tagen** ablaufende Gutsprache wird vorwarnend angezeigt.
- Die **zuständige Person** kommt aus dem Mandat — nicht vom Ersteller des
  Blattes.
- Die **Wartezeit** wird nie gespeichert, sondern aus dem Protokoll
  gerechnet: aus dem Zeitpunkt des Wechsels **in** den aktuellen Zustand
  (ein zweiter, gespeicherter Wert könnte abweichen). Auffällig ab
  **14 Tagen**: bei der Kasse ist das die Verfahrensfrist der
  stillschweigenden Annahme; **bei der Ärztin ist dieselbe Zahl eine Setzung
  ohne Rechtsgrundlage, ein blosser Erfahrungswert.** Wartende Blätter
  werden mit der längsten Wartezeit zuerst gezeigt; Blätter ohne lesbaren
  Protokolleintrag bleiben aussen vor, statt mit einer geratenen Zahl zu
  erscheinen.

## Das Protokoll

Jeder Zustandswechsel wird festgehalten: **Zustand, Person, Zeitstempel**,
älteste zuerst. Das Protokoll ist die Quelle der Wartezeit und belegt, wann
das Blatt zur Kasse ging (eine fachliche Angabe — sie steht auf der
Bedarfsmeldung —, kein Bedienprotokoll).

## Die Übersicht und ihre Filter

Die Übersicht beantwortet die Frage «was ist im Verfahren, und wo hängt es?».

- Chips (Lagen, die Aufmerksamkeit verlangen):
  - **Wartet auf Antwort** — fasst «an Arzt» und «an Kasse» zusammen.
  - **Ohne Kostengutsprache** — kein am Stichtag deckendes Gutsprache-Objekt
    am Mandat des Blattes.
  - **Über der Bewilligung** — es liegt eine gültige Zusicherung vor und es
    ist trotzdem mehr geplant. Blätter ohne Gutsprache zählen bewusst
    **nicht** dazu — für sie sagt der Chip daneben schon, was fehlt.
- Auswahlfelder (Merkmale): Zustand, zuständige Person.
- **Einschliesslich ersetzter** als bewusste Option; Vorgabe ohne.
- Suche über Patientenname und Blattnummer; Standardsortierung nach
  längster Wartezeit.

## Weitere Regeln am Blatt

- **Positionen**: Einheiten sind einmalig, wöchentlich, an 2–7 Tagen pro
  Woche, monatlich, nach Bedarf. Jede Position trägt, **wer** sie erbringt
  (Spitex, informelles Netz, anderer Anbieter, verweigert) und ein
  Trainings-Kennzeichen. **Offene Frage:** die fachliche Wirkung des
  Trainings-Kennzeichens (im Zielmodell ist ein Zuschlag von 20 % auf die
  Dauer notiert; der Code rechnete keinen).
- **Tagessoll**: die Summe der täglich (an 7 Tagen) verordneten Minuten —
  Grundlage der Einsatzkontrolle (erbrachte Minuten eines Tages gegen das
  Soll des Blattes).
- **Erwartete Häufigkeit im Monat**: Wochenrhythmen werden über die echte
  Monatslänge hochgerechnet (4.3–4.4 Wochen), nicht über eine feste Vier —
  bei 3×/Woche macht das über den Monat einen ganzen Einsatz Unterschied.
- **Inklusiv-Regeln**: eine Hauptleistung schliesst bestimmte Teilleistungen
  ein; eine enthaltene Position darf nicht zusätzlich abgerechnet werden.
  **Offene Frage:** die vollständige Regelbasis — im Prototyp lag nur eine
  kleine Demo-Auswahl vor; sie muss mit Pflegeteam/Abrechnungsstelle
  erarbeitet werden.
- **Kassen-Sonderregeln**: einzelne Versicherer begrenzen je Position Tage
  pro Woche oder Höchstzeiten (warnender Hinweis, keine Sperre).
  **Offene Frage:** auch hier existierte nur eine Demo-Auswahl.
- **Simultan-Gruppen**: gleichzeitig erbringbare Leistungen werden einander
  als Hinweis zugeordnet (keine automatische Zeitkorrektur in der
  Wochensumme).
- **KLV-Kategorien**: a = Abklärung, Beratung, Koordination, Pflegeplanung;
  b = Untersuchung und Behandlung; c = Grundpflege; daneben nicht
  KLV-pflichtige Leistungen (Hauswirtschaft, Begleitung). Die Menge a/b/c
  ist die geschlossene Menge aus Art. 7 Abs. 2 KLV.
- **Zielformulierungen**: das Blatt führte eine administrative Freitext-Liste
  von Zielformulierungen. **Offene Frage:** ihr Verhältnis zu den fachlichen
  Pflegezielen — im Neubau (Lauf 6) sollen Ziele aus dem Pflegeplan-Vertrag
  kommen, nicht als zweite Zielwelt daneben.

## Zusammenspiel mit der ärztlichen Verordnung

Die ärztliche Verordnung (Anordnung der Ärztin, am Mandat) und die
Kostengutsprache sind **eigene Objekte neben dem Blatt** — ohne Verordnung
darf nicht abgerechnet werden; beide Status werden aus den Daten
**abgeleitet, nie gespeichert** (bei einer Kontrolle zählt das Datum, nicht
die Marke). Sie gehören zum Mandats-Modul und überleben den Abriss des
LPB-Moduls.
