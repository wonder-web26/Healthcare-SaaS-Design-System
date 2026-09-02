# Regelwerk: Ausländerrechtliche Prüfung bei Anstellung

**Zweck:** Maschinell auswertbare Spezifikation. Bei Erfassung einer pflegenden Angehörigen prüft das System im Hintergrund, ob eine Bewilligung oder eine Meldung erforderlich ist, und zeigt das Ergebnis an.

**Stand:** 1. September 2026 · Fassung 1.4 · Kantone BS, BL, AG, SO, BE, ZH
**Entwurf, anwaltlich zu prüfen.** Das Regelwerk unterstützt eine Entscheidung, es trifft sie nicht.

> **Massgebend ist die deutsche Fassung.** Die englische Fassung `regelwerk.en.md` ist eine Übersetzung zur Erläuterung. Bei Abweichungen gilt die deutsche. Schlüssel, Wertelisten, Anzeigetexte und Behördennamen sind in beiden Fassungen identisch und bleiben deutsch.

> ⚠️ **Eine der vierzehn Regeln ist nicht abschliessend belegt.** R08 trägt den Sicherheitsgrad `zu_bestaetigen`; für `SO`, `BS` und `BL` ist die Zuständigkeit im Meldeverfahren `ungeklaert`. Das Regelwerk ist implementierbar, aber noch nicht verlässlich. Der Sicherheitsgrad gehört sichtbar in die Oberfläche.


---

## 1. Eingabefelder

Alle Werte sind Schlüssel, keine Anzeigetexte. Die Anzeige wird getrennt geführt.

### 1.1 `staatsangehoerigkeitsgruppe`

| Schlüssel | Bedeutung |
|---|---|
| `eu_efta` | Mitgliedstaat der EU sowie Island, Norwegen, Liechtenstein |
| `drittstaat` | alles Übrige, einschliesslich Vereinigtes Königreich |
| `schweiz` | Schweizer Staatsangehörigkeit |

### 1.2 `ausweisart`

| Schlüssel | Bedeutung |
|---|---|
| `C` | Niederlassungsbewilligung |
| `B` | Aufenthaltsbewilligung |
| `L` | Kurzaufenthaltsbewilligung |
| `G` | Grenzgängerbewilligung |
| `F` | vorläufig aufgenommen |
| `N` | Asylsuchende im laufenden Verfahren |
| `S` | Schutzbedürftige |
| `keiner` | kein gültiger Ausweis |

### 1.3 `aufenthaltsgrund`

Nur bei `ausweisart = B` entscheidungserheblich.

| Schlüssel | Bedeutung |
|---|---|
| `erwerbstaetigkeit` | Bewilligung wurde für eine Erwerbstätigkeit erteilt |
| `familiennachzug` | Bewilligung aus Familiennachzug |
| `asyl_anerkannt` | anerkannter Flüchtling mit Asylgewährung |
| `unbekannt` | nicht erfasst |

### 1.4 Weitere Felder

| Feld | Typ | Erforderlich |
|---|---|---|
| `ausweisGueltigBis` | Datum | bei allen ausser `C` und `keiner` |
| `arbeitsortKanton` | Kantonskürzel | immer |
| `asylgesuchDatum` | Datum | nur bei `N` |
| `bundesasylzentrumVerlassen` | Wahrheitswert | nur bei `N` |
| `arbeitsbeginnGeplant` | Datum | immer |

---

## 2. Entscheidungsreihenfolge

Die Regeln werden in dieser Reihenfolge geprüft. **Die erste zutreffende Regel bestimmt das Ergebnis.**

### Stufe 1 — Sperren

| Nr. | Bedingung | Ergebnis |
|---|---|---|
| S1 | `ausweisart = keiner` | `unzulaessig`, Grund `kein_ausweis` |
| S2 | `ausweisGueltigBis` liegt vor `arbeitsbeginnGeplant` | `unzulaessig`, Grund `ausweis_abgelaufen` |
| S3 | `ausweisart = N` und `bundesasylzentrumVerlassen = falsch` | `unzulaessig`, Grund `bundesasylzentrum` |
| S4 | `ausweisart = N` und `arbeitsbeginnGeplant` liegt vor `asylgesuchDatum` plus 3 Monate | `unzulaessig`, Grund `wartefrist_n` |

### Stufe 2 — Regimezuordnung

Wenn keine Sperre greift, gilt die Matrix in Abschnitt 3.

### Stufe 3 — Zusatzprüfungen

Unabhängig vom Regime, ergänzend:

| Nr. | Bedingung | Ergebnis |
|---|---|---|
| Z1 | `ausweisGueltigBis` liegt weniger als 90 Tage nach `arbeitsbeginnGeplant` | Hinweis `ablauf_nah` |
| Z2 | `arbeitsortKanton` nicht in der Kantonstabelle | Hinweis `kanton_unbekannt` |
| Z3 | `ausweisart = B` und `staatsangehoerigkeitsgruppe = drittstaat` und `aufenthaltsgrund = unbekannt` | Hinweis `aufenthaltsgrund_fehlt`, Regime nicht bestimmbar |

---

## 3. Regelmatrix

Schlüssel der Zeile: `staatsangehoerigkeitsgruppe` + `ausweisart` + `aufenthaltsgrund`.

| # | Staatsangeh. | Ausweis | Aufenthaltsgrund | Regime | Arbeitsbeginn | Kosten | Klärung | Sicherheit |
|---|---|---|---|---|---|---|---|---|
| R01 | `schweiz` | beliebig | beliebig | `frei` | `sofort` | keine | — | belegt |
| R02 | beliebig | `C` | beliebig | `frei` | `sofort` | keine | — | belegt |
| R03 | `eu_efta` | `B` | beliebig | `frei` | `sofort` | keine | — | belegt |
| R04 | `eu_efta` | `L` | beliebig | `frei` | `sofort` | keine | — | belegt |
| R05 | `eu_efta` | `G` | beliebig | `bewilligung` | `nach_bewilligung` | ja | — | belegt |
| R06 | `drittstaat` | `B` | `familiennachzug` | `frei` | `sofort` | keine | — | belegt |
| R07 | `drittstaat` | `B` | `asyl_anerkannt` | `meldung` | `nach_meldung` | keine | — | belegt |
| R08 | `drittstaat` | `B` | `erwerbstaetigkeit` | `bewilligung` | `nach_bewilligung` | ja | `stellenwechsel_pruefen` | zu_bestaetigen |
| R09 | `drittstaat` | `L` | beliebig | `bewilligung` | `nach_bewilligung` | ja | — | belegt |
| R10 | `drittstaat` | `G` | beliebig | `bewilligung` | `nach_bewilligung` | ja | — | belegt |
| R11 | beliebig | `F` | beliebig | `meldung` | `nach_meldung` | keine | — | belegt |
| R12 | beliebig | `S` | beliebig | `meldung` | `nach_meldung` | keine | — | belegt |
| R13 | beliebig | `N` | beliebig | `bewilligung` | `nach_bewilligung` | ja | `branchenbeschraenkung_pruefen` | belegt |
| R14 | beliebig | `keiner` | beliebig | `unzulaessig` | `nie` | — | — | belegt |

**Reihenfolge der Auswertung:** R01, R02, dann die übrigen nach Spezifität. `C` schlägt jede andere Regel, weil die Niederlassungsbewilligung unabhängig von Staatsangehörigkeit und Aufenthaltsgrund gilt.

**Nicht abgedeckt:** `drittstaat` mit `B` und `aufenthaltsgrund = unbekannt`. Diese Kombination liefert kein Regime, sondern den Hinweis `aufenthaltsgrund_fehlt`.

### 3.1 Erläuterungen zu einzelnen Regeln

**R05 — Grenzgängerinnen aus EU und EFTA brauchen ein Gesuch.** Der Arbeitgeber reicht vor Stellenantritt ein Gesuch um Grenzgängerbewilligung bei der für den Arbeitsort zuständigen Migrationsbehörde ein. Es besteht ein **Anspruch auf Erteilung** — die Behörde prüft, lehnt aber im Regelfall nicht ab. Bei einem Stellenwechsel reicht der **neue** Arbeitgeber ein neues Gesuch ein; die bisherige Bewilligung wird ungültig und ein neuer Ausweis G wird ausgestellt. Das Verfahren ist gebührenpflichtig.

**R06 — Familiennachzug aus einem Drittstaat: kein Verfahren.** Belegt durch die Weisung des Kantons Zürich, das Merkblatt des Kantons Luzern und die Auskunft des Kantons Solothurn: Ehegatten und Kinder von Schweizerinnen sowie von Personen mit Niederlassungs- oder Aufenthaltsbewilligung dürfen in der ganzen Schweiz erwerbstätig sein und die Tätigkeit ohne zusätzliches Bewilligungsverfahren aufnehmen. Grundlage sind Art. 46 AIG und Art. 27 VZAE.

Zwei Abgrenzungen: Angehörige von Personen mit einer **Kurzaufenthaltsbewilligung** haben diesen Anspruch nicht — dort ist jeder Stellenantritt und Stellenwechsel bewilligungspflichtig. Sie tragen selbst einen Ausweis L und fallen damit unter R09.

Und das Recht ist **an die Bewilligung des Nachziehenden gebunden**: Wird dessen Aufenthaltsbewilligung nicht mehr verlängert, entfällt es. Das System kann das nicht erkennen; deshalb der Hinweis `familiennachzug_gebunden`.

**R08 — Warum eine Bewilligung, obwohl die Person bereits erwerbstätig ist.** Eine Aufenthaltsbewilligung B, die einem Drittstaatsangehörigen für eine Erwerbstätigkeit erteilt wurde, ist an Kanton, Arbeitgeber und häufig an die Tätigkeit gebunden. Sie berechtigt zur Arbeit **bei diesem Arbeitgeber**, nicht zur Arbeit schlechthin. Ein Stellenwechsel zu uns verlangt deshalb eine neue behördliche Entscheidung.

○ **Offen:** Ob nach einer bestimmten Aufenthaltsdauer Erleichterungen für den Stellenwechsel greifen, konnte ich nicht belegen. Deshalb `zu_bestaetigen`. Bei einem konkreten Fall gehört das vor der Gesuchseinreichung geklärt — möglicherweise ist der Aufwand geringer als angenommen.

**R11 und R12 — nur Meldung, keine Bewilligung.** Seit dem 1. Januar 2019 gilt für vorläufig aufgenommene Personen, vorläufig aufgenommene Flüchtlinge und anerkannte Flüchtlinge das vereinfachte Meldeverfahren nach Art. 85a AIG statt einer Bewilligung. Personen mit Schutzstatus S sind schweizweit zur Erwerbstätigkeit berechtigt. **Ausweis F gibt es in zwei Ausprägungen** — vorläufig aufgenommene Person und vorläufig aufgenommener Flüchtling. Für beide gilt dasselbe Meldeverfahren.

**Kurzfristige Erwerbstätigkeit bis 90 Tage.** Für EU- und EFTA-Angehörige gilt bis 90 Tage im Kalenderjahr das Meldeverfahren statt einer Bewilligung. Diese Regel ist in der Matrix **nicht abgebildet**, weil unsere Anstellungen auf Dauer angelegt sind. Bei einem befristeten Einsatz unter 90 Tagen gehört sie geprüft.

---

## 4. Ergebnisobjekt

```
{
  regime: 'frei' | 'meldung' | 'bewilligung' | 'unzulaessig' | 'nicht_bestimmbar',
  arbeitsbeginn: 'sofort' | 'nach_meldung' | 'nach_bewilligung' | 'nie',
  kostenpflichtig: boolean,
  regelNummer: string,
  sicherheit: 'belegt' | 'zu_bestaetigen' | 'ungeklaert',
  klaerung: string | null,
  hinweise: string[],
  zustaendigeStelle: string | null,
  meldekanal: string | null
}
```

`zustaendigeStelle` und `meldekanal` werden aus Abschnitt 5 anhand von `arbeitsortKanton` und `regime` bestimmt.

---

## 5. Kantonstabelle

Massgebend ist der **Kanton des Arbeitsorts**, also der Einsatzort der Angehörigen — nicht der Sitz der Organisation und nicht der Wohnort der Angehörigen.

| Kanton | Regime `bewilligung`, Drittstaat | Regime `meldung` | Regime `bewilligung`, Ausweis N | Sicherheit |
|---|---|---|---|---|
| `ZH` | Amt für Wirtschaft (AWI), danach SEM, danach Migrationsamt | Amt für Wirtschaft (AWI) | kantonale Stellen im Asylbereich | belegt / zu_bestaetigen |
| `BE` | Migrationsdienst (MIDI) | Migrationsdienst (MIDI) | Migrationsdienst, mit RAV-Bestätigung | belegt / zu_bestaetigen |
| `AG` | Amt für Migration und Integration (MIKA) | Amt für Migration und Integration (MIKA) | Amt für Migration und Integration (MIKA) | belegt / zu_bestaetigen |
| `BS` | Amt für Wirtschaft und Arbeit (AWA) | Amt für Wirtschaft und Arbeit (AWA) | AWA und Migrationsamt | belegt / zu_bestaetigen |
| `BL` | KIGA Baselland, danach SEM, danach Migrationsamt | KIGA Baselland oder Amt für Migration | Amt für Migration | belegt / zu_bestaetigen |
| `SO` | Migrationsamt, Departement des Innern | Migrationsamt | Migrationsamt | zu_bestaetigen |

**Meldekanal:** Für das Regime `meldung` gilt in allen Kantonen `EasyGov` als bevorzugter Kanal. Der Online-Schalter des Bundes wählt die zuständige Behörde anhand des Arbeitsorts. Alternativ das kantonale Formular.

**Ungeklärt:** Die Zuständigkeit für das Meldeverfahren in `SO`, `BS` und `BL` ist nicht abschliessend belegt.

---

## 6. Anzeigetexte

Die Schlüssel sind stabil, die Texte änderbar.

### 6.1 Regime

| Schlüssel | Text |
|---|---|
| `frei` | Keine Bewilligung und keine Meldung erforderlich. |
| `meldung` | Der Stellenantritt ist vor Arbeitsbeginn zu melden. Unmittelbar nach der Meldung darf gearbeitet werden. |
| `bewilligung` | Für den Stellenantritt ist eine Bewilligung erforderlich. Die Arbeitsaufnahme darf erst nach Erteilung erfolgen. |
| `unzulaessig` | Eine Anstellung ist nicht zulässig. |
| `nicht_bestimmbar` | Das Verfahren lässt sich mit den erfassten Angaben nicht bestimmen. |

### 6.2 Sperrgründe

| Schlüssel | Text |
|---|---|
| `kein_ausweis` | Ohne gültigen Ausweis ist eine Anstellung nicht zulässig. |
| `ausweis_abgelaufen` | Der Ausweis läuft vor dem geplanten Arbeitsbeginn ab. |
| `bundesasylzentrum` | Eine Bewilligung ist erst möglich, wenn die Person das Bundesasylzentrum verlassen hat. |
| `wartefrist_n` | In den ersten drei Monaten nach Einreichung des Asylgesuchs besteht ein Arbeitsverbot. |

### 6.3 Hinweise

| Schlüssel | Text |
|---|---|
| `ablauf_nah` | Der Ausweis läuft in weniger als 90 Tagen ab. Die Verlängerung frühzeitig anstossen. |
| `kanton_unbekannt` | Die zuständige Stelle ergibt sich aus dem Arbeitsort, sobald die Klientin erfasst ist. |
| `familiennachzug_gebunden` | Das Recht zur Erwerbstätigkeit ist an die Bewilligung der Person gebunden, die den Familiennachzug geltend gemacht hat. Wird deren Bewilligung nicht verlängert, entfällt es. |
| `aufenthaltsgrund_fehlt` | Bei einem Ausweis B aus einem Drittstaat entscheidet der Aufenthaltsgrund über das Verfahren. Bitte erfassen. |

### 6.4 Klärungen

| Schlüssel | Text |
|---|---|
| `meldung_kantonal_pruefen` | Ob eine Meldung erforderlich ist, ist kantonal zu prüfen. |
| `stellenwechsel_pruefen` | Die Bewilligung ist an den bisherigen Arbeitgeber gebunden. Ob für den Stellenwechsel ein vereinfachtes Verfahren gilt, ist vor der Gesuchseinreichung zu klären. |
| `branchenbeschraenkung_pruefen` | Der Kanton kann die Bewilligung auf einzelne Branchen beschränken. |

### 6.5 Dauerhinweis beim Onboarding-Start

> Als Arbeitgeber gilt bereits, wer eine Person unter seinen Weisungen beschäftigt — unabhängig davon, ob ein schriftlicher Vertrag besteht und ob die Arbeit unentgeltlich oder gegen Kost und Logis erfolgt. Die ausländerrechtliche Prüfung gehört an den Anfang, nicht ans Ende des Onboardings.

### 6.6 Zusammengelegte Warnung

Klärung (6.4) und allgemeiner Sicherheitszusatz sagen bei nicht abschliessend belegten Regeln dasselbe. Es erscheint deshalb **nur eine** Warnung:

- Klärung vorhanden **und** `sicherheit ≠ belegt` → die Klärung, ergänzt um den Satz „Vor dem Stellenantritt beim zuständigen Amt bestätigen lassen."
- keine Klärung, aber `sicherheit ≠ belegt` → der allgemeine Zusatz „Diese Einschätzung ist nicht abschliessend belegt. Vor dem Stellenantritt beim zuständigen Amt bestätigen lassen."
- Klärung bei `sicherheit = belegt` → die Klärung ohne Zusatz.
- sonst → keine Warnung.

Das Symbol der Anzeige richtet sich nach dem **Regime**, nicht nach dem Sicherheitsgrad; der Sicherheitsgrad zeigt sich in der Formulierung. So trägt eine Aussage `frei` kein Warnsymbol, auch wenn die Regel `zu_bestaetigen` ist.

---

## 7. Was das System nicht entscheidet

Diese Punkte werden angezeigt, nie automatisch beantwortet:

1. Ob im Einzelfall eine Bewilligung tatsächlich erteilt wird
2. Ob eine Meldung im betreffenden Kanton erforderlich ist, wo dies als `zu_bestaetigen` gekennzeichnet ist
3. Ob eine Branchenbeschränkung besteht
4. Ob für einen einzelnen EU-Staat oder für das Vereinigte Königreich Sonderregeln gelten
5. Ob die Person die Voraussetzungen für eine Drittstaatenbewilligung erfüllt

**Bei `sicherheit = zu_bestaetigen` oder `ungeklaert` erscheint der Hinweis zusammen mit der Aufforderung, die zuständige Stelle zu kontaktieren.** Das Ergebnis blockiert nicht, es warnt.

**Bei `regime = unzulaessig` blockiert das System die Vertragsunterzeichnung.** Das ist die einzige harte Sperre.

---

## 7a. Freigabe des Vertragsschritts

Das Regime allein sperrt nicht. Es bestimmt, **was dokumentiert sein muss**, bevor der Vertragsschritt freigegeben wird.

| Regime | Freigabe erfolgt durch |
|---|---|
| `frei` | nichts. Sofort freigegeben |
| `meldung` | dokumentierte Meldung: Meldedatum, optional die Bestätigung als Datei |
| `bewilligung` | dokumentierte Einreichung: Einreichungsdatum, optional die Bestätigung als Datei |
| `unzulaessig` | keine Freigabe. Dauerhaft gesperrt |
| `nicht_bestimmbar` | freigegeben, mit einer Aufgabe zur Nachklärung |

**Zur Reihenfolge:** Rechtlich muss die Meldung vor dem **Stellenantritt** erfolgen, nicht vor der Vertragsunterzeichnung. Da bei uns Vertrag und Arbeitsbeginn zusammenfallen, wird die Prüfung an den Vertragsschritt gezogen. Das ist eine bewusste Verschärfung und kein rechtliches Erfordernis.

**Zur Lücke bei der Bewilligung:** Dokumentiert wird die Einreichung, nicht die Erteilung. Das System kennt das Erteilungsdatum nicht und kann deshalb nicht sicherstellen, dass die Arbeitsaufnahme erst danach erfolgt. Diese Regel wird angezeigt, nicht erzwungen. Soll sie erzwungen werden, braucht es ein Feld für das Bewilligungsdatum.

**Zu `nicht_bestimmbar`:** Eine Sperre wäre hier falsch. Das System hat keinen fachlichen Grund, sondern nur eine fehlende Angabe. Eine Sperre ohne Grund wird umgangen; eine Aufgabe bleibt sichtbar.

---

## 8. Fristen

Aus dem Ergebnis entstehen wiederkehrende Fristen:

| Frist | Auslöser | Vorlauf | Erzeugt |
|---|---|---|---|
| Ablauf der Bewilligung | `ausweisGueltigBis` | 90 Tage | Pendenz |
| Wartefrist N | `asylgesuchDatum` plus 3 Monate | — | Sperre bis Ablauf |
| Meldung der Beendigung | Vertragsende, Regime `meldung` | sofort | Pendenz |

---

## 9. Testfälle

| Nr. | Eingabe | Erwartetes Regime | Regel |
|---|---|---|---|
| T01 | `eu_efta`, `B`, gültig | `frei`, `sofort` | R03 |
| T02 | `drittstaat`, `C`, gültig | `frei`, `sofort` | R02 |
| T03 | `drittstaat`, `B`, `familiennachzug` | `frei` mit Klärung | R06 |
| T04 | `drittstaat`, `B`, `asyl_anerkannt` | `meldung`, `nach_meldung` | R07 |
| T05 | `drittstaat`, `B`, `erwerbstaetigkeit` | `bewilligung`, `nach_bewilligung` | R08 |
| T06 | `drittstaat`, `B`, `unbekannt` | `nicht_bestimmbar` | Z3 |
| T07 | beliebig, `F` | `meldung`, `nach_meldung` | R11 |
| T08 | beliebig, `S` | `meldung`, `nach_meldung` | R12 |
| T09 | beliebig, `N`, Zentrum verlassen, Gesuch vor 5 Monaten | `bewilligung` | R13 |
| T10 | beliebig, `N`, Gesuch vor 1 Monat | `unzulaessig`, `wartefrist_n` | S4 |
| T11 | beliebig, `N`, Zentrum nicht verlassen | `unzulaessig`, `bundesasylzentrum` | S3 |
| T12 | beliebig, `keiner` | `unzulaessig`, `kein_ausweis` | S1 |
| T13 | `eu_efta`, `B`, Ausweis läuft in 30 Tagen ab | `frei` plus Hinweis `ablauf_nah` | R03, Z1 |
| T15 | `eu_efta`, `G` | `bewilligung`, `nach_bewilligung` | R05 |
| T16 | `drittstaat`, `G` | `bewilligung`, `nach_bewilligung` | R10 |
| T14 | `eu_efta`, `B`, Ausweis abgelaufen | `unzulaessig`, `ausweis_abgelaufen` | S2 |

---

## 10. Grundlagen und Stand

Quellen: Webseiten der Migrations- und Arbeitsmarktbehörden der Kantone Zürich, Bern, Aargau, Basel-Stadt, Basel-Landschaft und Solothurn sowie des Staatssekretariats für Migration, abgerufen am 1. September 2026.

**Dieses Regelwerk ersetzt keine Rechtsberatung.** Verfahren und Zuständigkeiten ändern sich. Vorgesehene Überprüfung: jährlich oder bei Kenntnis einer Verfahrensänderung.

Offene Punkte sind in der begleitenden Dokumentation aufgeführt.