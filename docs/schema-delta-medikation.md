# Schema-Delta — Reiter «Medikamente» (V1)

Was der Onboarding-Reiter «Medikamente» an Feldern braucht, die `docs/Spit Full.dbml`
heute nicht vorsieht. **Die dbml-Datei wurde nicht geändert** — dieses Dokument ist der
Antrag, nicht die Umsetzung.

Stand: Prototyp-Lauf «Medikamente V1», Branch `feature/medication-list`.
Referenztabelle: `Table Medication` (und `Table Patient`).

---

## 1. Der wichtigste Punkt: `approvedByContactId` ist `[not null]`

```
approvedByContactId uuid [not null, note: 'normally the GP — a Contact']
```

Der Verordner **muss optional werden.** Beim Eintritt bringt eine Klientin regelmässig
Medikamente mit, deren Verordner niemand kennt: eine Schachtel ohne Etikett, eine Angabe
des Ehemanns, ein Präparat aus einer früheren Hospitalisation. Die heutige Nicht-Null-
Bedingung lässt in diesem Fall nur zwei Auswege, und beide sind falsch: die Position gar
nicht erfassen (dann fehlt sie in der Liste, obwohl die Klientin sie einnimmt) oder
irgendeinen Kontakt eintragen (dann behauptet das Dossier eine Verordnung, die es nicht
gibt).

Der Prototyp führt darum `approvedByContactId: string | null` **plus** ein ausdrückliches
Feld `verordnerUnbekannt`. Die zwei sind nicht dasselbe: `null` allein hiesse «noch nicht
erfasst», `verordnerUnbekannt = true` heisst «wir haben gesucht und es nicht ermittelt» —
und blockiert die Bestätigung der Liste. Dieselbe Unterscheidung zwischen ungeprüfter
Leere und geprüfter Abwesenheit, die das Schema bei `Patient.noKnownAllergies` bereits
trifft.

| Feld | Typ | Begründung | Tabelle |
|---|---|---|---|
| `approvedByContactId` | `uuid` **nullable** | Verordner beim Eintritt oft unbekannt; erzwungener Wert erzeugt eine falsche Behauptung | `Medication` |
| `prescriberUnknown` | `boolean not null default false` | «gesucht und nicht ermittelt» — nicht dasselbe wie NULL | `Medication` |

---

## 2. Prüfachse neben dem klinischen Status

```
status varchar [not null, note: 'active | on_hold | stopped | completed | cancelled | entered_in_error']
```

`status` ist der **klinische Lebenszyklus** und bleibt unangetastet. Die Frage «hat eine
Fachperson diese Angabe geprüft» ist eine **zweite, unabhängige Achse**: eine laufende
Medikation kann ungeprüft sein, eine gestoppte kann geprüft sein. Beides in eine Spalte zu
legen, macht beide Aussagen unlesbar.

Dasselbe Muster ist im Prototyp bereits bei den Allergien umgesetzt (`klinischerStatus`
neben `verifikationsstatus`) und entspricht der Haltung, die das Schema an anderen Stellen
mit `confirmedBy` verfolgt («ALWAYS A PERSON. Never the machine.»).

| Feld | Typ | Begründung | Tabelle |
|---|---|---|---|
| `verificationStatus` | `varchar not null` — `confirmed \| to_verify \| unconfirmed` | Prüfachse; steuert die Freigabe der Gesamtliste | `Medication` |
| `confirmedBy` | `uuid` nullable | Bestätiger — wer fachlich geprüft hat. Nie dieselbe Frage wie der Erfasser | `Medication` |
| `confirmedAt` | `timestamptz` nullable | Zeitpunkt der Prüfung | `Medication` |

Der **Erfasser** braucht kein neues Feld: Die Kopfzeile der dbml hält fest, dass
`createdBy` auf nahezu jeder realen Tabelle existiert und nur im Diagramm weggelassen ist.
Der Prototyp führt ihn als `erfasstDurchUserId`.

---

## 3. Herkunft der Angabe

Drei Erfassungspfade sind vorgesehen (QR-Code, Foto der Papierliste, manuelle Eingabe); in
V1 entsteht nur `manuell`. Woher eine Position stammt, entscheidet mit, wie belastbar sie
ist — eine aus dem eMediplan-QR gelesene Position ist etwas anderes als die mündliche
Angabe eines Angehörigen. Das Schema kennt das Muster `source varchar` bereits an anderen
Tabellen (`manual | ai_suggested | copy_forward`, `manual | device`), aber nicht an
`Medication` und nicht mit dieser Wertemenge.

| Feld | Typ | Begründung | Tabelle |
|---|---|---|---|
| `source` | `varchar not null` — `qr \| photo \| manual` | Belastbarkeit der Angabe; Voraussetzung für den späteren eMediplan-Import | `Medication` |
| `sourceAt` | `timestamptz not null` | Wann die Angabe in dieses System kam | `Medication` |
| `sourceNote` | `varchar` nullable | Herkunftsvermerk im Klartext, z.B. «Angabe des Ehemanns, Präparat nicht gesichtet» | `Medication` |

---

## 4. Selbstmedikation

Die Gruppierung der Liste nach eMediplan-Konvention (Fixmedikation / Reservemedikation /
Selbstmedikation) lässt sich heute nur zur Hälfte ableiten: Reserve folgt aus
`scheduleType = 'reserve'`, aber Selbstmedikation hat kein Merkmal. Sie ist auch fachlich
mehr als eine Gruppe — eine selbst beschaffte Position hat definitionsgemäss keinen
Verordner, und das ist korrektes Fehlen, kein leeres Pflichtfeld.

| Feld | Typ | Begründung | Tabelle |
|---|---|---|---|
| `selfMedication` | `boolean not null default false` | Dritte Gruppe der eMediplan-Liste; begründet das Fehlen des Verordners | `Medication` |

---

## 5. Grund der Anwendung, Stärke und Form

| Feld | Typ | Begründung | Tabelle |
|---|---|---|---|
| `treatmentReason` | `varchar` nullable | «Wofür nimmt sie das» — steht auf jedem eMediplan und ist beim Abgleich die wichtigste Frage. `instructions` deckt nur das Wie | `Medication` |
| `strength` | `varchar` nullable | Stärke getrennt vom Namen | `Medication` |
| `doseForm` | `varchar` nullable | Darreichungsform getrennt vom Namen | `Medication` |

Zu `strength` / `doseForm`: Das Schema führt heute nur `productName`. In der schweizerischen
Katalogkonvention trägt der Produktname beides bereits mit («BELOC ZOK Ret Tabl 25 mg»), was
für die Anzeige genügt. Sobald die Documedis-Stammdaten angebunden sind, kommen Stärke und
Form dort strukturiert an; sie dann wieder in einen String zu falten wäre ein Rückschritt,
und der Editor braucht sie ohnehin als eigene, vorbefüllte Felder. Falls die Felder nicht
gewünscht sind, ist die Alternative, sie ausschliesslich aus dem Katalog zu lesen und gar
nicht an der Position zu speichern — dann verliert man allerdings den übersteuerten Fall.

---

## 6. Übersteuern der Stammdaten

Applikationsart, Stärke und Form kommen aus den Stammdaten und sind schreibgeschützt. Wer
sie dennoch ändern muss, übersteuert ausdrücklich — und das darf nicht spurlos geschehen,
sonst steht später ein Wert im Dossier, der dem Katalog widerspricht, ohne dass jemand
weiss warum.

| Feld | Typ | Begründung | Tabelle |
|---|---|---|---|
| `overridden` | `boolean not null default false` | Produktangaben weichen bewusst vom Katalog ab | `Medication` |
| `overrideNote` | `varchar` nullable | Begründung des Übersteuerns | `Medication` |

---

## 7. Negativ-Aussage und Bestätigung der Gesamtliste

Zwei Aussagen, die keine einzelne Position tragen kann.

**«Die Klientin nimmt keine Medikamente ein»** ist eine geprüfte Abwesenheit — genau das,
was das Schema für Allergien mit `Patient.noKnownAllergies` bereits vorsieht («a CHECKED
absence, which is not the same as no allergy rows»). Für Medikation fehlt das Gegenstück.
Ohne es ist eine leere Liste doppeldeutig: niemand hat gefragt, oder es gibt nichts.

**Die Bestätigung der Gesamtliste** ist der Abschluss der Erfassung: eine Fachperson
erklärt, die Liste als Ganzes geprüft zu haben. Sie ist mehr als die Summe der
Positionsbestätigungen, weil sie auch die Vollständigkeit umfasst — und sie braucht die
Qualifikation der bestätigenden Person, nicht nur ihren Namen.

| Feld | Typ | Begründung | Tabelle |
|---|---|---|---|
| `noKnownMedication` | `boolean not null default false` | Geprüfte Abwesenheit, analog `noKnownAllergies` | `Patient` |
| `medicationListSignedBy` | `uuid` nullable | Wer die Gesamtliste bestätigt hat | `Patient` oder eigene Tabelle |
| `medicationListSignedAt` | `timestamptz` nullable | Zeitpunkt der Bestätigung | dito |
| `medicationListSignerQualification` | `varchar` nullable | Qualifikation zum Zeitpunkt der Bestätigung — sie kann sich später ändern, die Aussage nicht | dito |

Ob diese vier Felder an `Patient` gehören oder in eine eigene Tabelle
(`MedicationListSignOff`, eine Zeile je Bestätigung), ist eine offene Entscheidung. Für
eine eigene Tabelle spricht, dass eine erneute Bestätigung nach jeder Änderung fachlich ein
neues Ereignis ist und die Historie erhalten bleiben sollte — dieselbe Begründung, mit der
das Schema `MedicationStatusChange` von `AuditLog` trennt.

---

## Was NICHT fehlt

- **Posologie-Typ.** `scheduleType` deckt alles ab und trägt die Erweiterbarkeit bereits:
  `#-#-#-# | single | periodic | day_plan | week_plan | free | rate | reserve`. Der Prototyp
  speichert diese Werte wörtlich; deutsche Beschriftungen gibt es nur an der Oberfläche.
- **Posologie-Werte.** `schedule json` mit «shape follows scheduleType» ist genau richtig;
  der Prototyp bildet die Form je Typ typisiert ab.
- **Reserve-Bedingung.** `reserveIndication` existiert.
- **Erfasser.** `createdBy` gilt laut Konvention der Dateikopfzeile ohnehin überall.
- **Applikationsart und Einheit.** `route` und `baseUnit` mit den Wertemengen aus den
  Schema-Notizen.

## Offen, bewusst nicht entschieden

- **CHMED-Abbildung.** Die Werte von `scheduleType` sind vor einem eMediplan- oder
  CH-EMED-Export gegen die CHMED-Spezifikation zu verifizieren. Es wurden keine
  CHMED-Feldnamen erfunden; im Code steht dazu eine TODO-Notiz.
- **Documedis.** Die Arzneimittel-Stammdaten kommen später über die Documedis-API von
  HCI Solutions. Der Prototyp-Katalog liegt hinter einer Suchfunktion und einer
  Einzelabfrage; nur diese eine Datei wird beim Anschluss ersetzt.
