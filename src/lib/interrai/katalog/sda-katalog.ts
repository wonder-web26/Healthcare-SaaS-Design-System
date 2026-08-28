// AUTOGENERIERT – nicht von Hand bearbeiten.
// Quelle: 20211106_TABE_SDA_V1_5.xlsx, Blatt iCODES (Spitex Schweiz), unveraendert uebernommen.
//
// Formular «Stammdaten und Angaben (SDA)», produktiv der Formulartyp `registration`.
// 31 Items in zwei Bereichen: AA Informationen zur Anmeldung, BB Stammdaten und Angaben.
//
// SCHLUESSEL IST AUSSCHLIESSLICH `iCode`.
// Die sichtbare Nummer ist NICHT daraus ableitbar: BB1a traegt iA1c, BB1b traegt iA1a,
// AA2 traegt iB2, BB12 traegt CHB3. Es gibt kein Muster.
// 18 Items teilt das SDA mit dem interRAI HC unter anderer sichtbarer Nummer,
// aber unter demselben i-Code.
//
// GRUPPEN
// Sechs Nummernpraefixe fassen mehrere Items zusammen. Vier Gruppentitel stehen als
// eigene Zeile in der Quelle (BB5, BB7, BB10, BB17). BB15 ist zugleich Item und Kopf
// seiner Untereinträge. Fuer BB1 fuehrt die Quelle KEINEN Titel — `titel` ist dort
// bewusst null und darf nicht erfunden werden.
//
// BEREICHS-PRAEZISIERUNG
// Je Bereich existiert im Ausdruck ein Freitextfeld «Individuelle Praezisierungen».
// Es ist KEIN Item der Quelle und deshalb nicht in diesem Katalog. Es ist ein Systemfeld
// je Formular und Bereich. Anders als beim interRAI HC liegt die Praezisierung beim SDA
// auf Bereichsebene, nicht auf Itemebene.
//
// `scaleRoh` ist der Wortlaut der Antwortspalte. `optionen` ist nur dort gefuellt, wo
// jede Zeile eindeutig dem Muster «N. Text» folgt. Sonst ist `scaleRoh` massgebend.

export type SdaItemTyp = 'auswahl' | 'freitext' | 'datum' | 'unterschrift'

export type SdaAntwortOption = {
  readonly code: string
  readonly text: string
}

export type SdaGruppe = {
  readonly nummer: string
  readonly titel: string | null
  readonly bereich: string
}

export type SdaItem = {
  readonly iCode: string
  readonly nummer: string
  readonly bereich: string
  readonly gruppe: string | null
  readonly text: string
  readonly typ: SdaItemTyp
  readonly optionen: readonly SdaAntwortOption[]
  readonly scaleRoh: string
}

export const SDA_GRUPPEN: readonly SdaGruppe[] = [
  { nummer: 'BB1', titel: null, bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN' },
  { nummer: 'BB10', titel: 'Form des Zusammenlebens', bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN' },
  { nummer: 'BB15', titel: 'Wohn-Vorgeschichte in den letzten 5 Jahren Kodieren Sie alle Einrichtungen, in denen die Person in den letzten 5 Jahren vor der Eröffnung des Dossiers gelebt hat (B1 AA2).', bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN' },
  { nummer: 'BB17', titel: 'Verantwortliche Personen', bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN' },
  { nummer: 'BB5', titel: 'Nummern', bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN' },
  { nummer: 'BB7', titel: 'Versicherungen', bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN' },
] as const

export const SDA_KATALOG: readonly SdaItem[] = [
  {
    iCode: 'CHAA1',
    nummer: 'AA1',
    bereich: 'BEREICH AA: INFORMATIONEN ZUR ANMELDUNG',
    gruppe: null,
    text: 'Eröffnungsgrund',
    typ: 'auswahl',
    optionen: [
      { code: '1', text: 'Eintritt in die Spitexorganisation' },
      { code: '2', text: 'Einsatzabbruch' },
    ],
    scaleRoh: '1. Eintritt in die Spitexorganisation \n2. Einsatzabbruch',
  },
  {
    iCode: 'iB2',
    nummer: 'AA2',
    bereich: 'BEREICH AA: INFORMATIONEN ZUR ANMELDUNG',
    gruppe: null,
    text: 'Datum der Eröffnung des Dossiers',
    typ: 'datum',
    optionen: [],
    scaleRoh: 'TT/MM/JJJJ',
  },
  {
    iCode: 'CHAA3',
    nummer: 'AA3',
    bereich: 'BEREICH AA: INFORMATIONEN ZUR ANMELDUNG',
    gruppe: null,
    text: 'Anmeldende Person, Institution',
    typ: 'auswahl',
    optionen: [
      { code: '0', text: 'Angehörige' },
      { code: '1', text: 'Hausarzt, Hausärztin, oder anderer ambulanter ärztlicher Dienst' },
      { code: '2', text: 'Spital, stationäre Einrichtung inkl. Psychiatrie' },
      { code: '3', text: 'Rehabilitationsklinik' },
      { code: '4', text: 'Alters- und Pflegeheim' },
      { code: '5', text: 'Andere Spitexorganisation' },
      { code: '6', text: 'Behörden (z.B. KESP KESB, Sozialdienst, etc.)' },
      { code: '7', text: 'Person selber' },
      { code: '8', text: 'Andere: ___________________________' },
    ],
    scaleRoh: '0.	Angehörige\n1.	Hausarzt, Hausärztin, oder anderer ambulanter ärztlicher Dienst\n2.	Spital, stationäre Einrichtung inkl. Psychiatrie\n3.	Rehabilitationsklinik\n4.	Alters- und Pflegeheim\n5.	Andere Spitexorganisation\n6.	Behörden (z.B. KESP KESB, Sozialdienst, etc.)\n7.	Person selber\n8.	Andere: ___________________________',
  },
  {
    iCode: 'iA1c',
    nummer: 'BB1a',
    bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN',
    gruppe: 'BB1',
    text: 'Name',
    typ: 'freitext',
    optionen: [],
    scaleRoh: 'Freitext',
  },
  {
    iCode: 'iA1a',
    nummer: 'BB1b',
    bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN',
    gruppe: 'BB1',
    text: 'Vorname(n)',
    typ: 'freitext',
    optionen: [],
    scaleRoh: 'Freitext',
  },
  {
    iCode: 'iA2',
    nummer: 'BB2',
    bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN',
    gruppe: null,
    text: 'Geschlecht',
    typ: 'auswahl',
    optionen: [
      { code: '1', text: 'Männlich' },
      { code: '2', text: 'Weiblich' },
      { code: '3', text: 'Andere' },
    ],
    scaleRoh: '1. Männlich\n2. Weiblich\n3. Andere',
  },
  {
    iCode: 'iA3',
    nummer: 'BB3',
    bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN',
    gruppe: null,
    text: 'Geburtsdatum',
    typ: 'datum',
    optionen: [],
    scaleRoh: 'TT/MM/JJJJ',
  },
  {
    iCode: 'iA4',
    nummer: 'BB4',
    bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN',
    gruppe: null,
    text: 'Zivilstand',
    typ: 'auswahl',
    optionen: [
      { code: '1', text: 'Ledig' },
      { code: '2', text: 'Verheiratet, eingetragene Partnerschaft' },
      { code: '3', text: 'Verwitwet' },
      { code: '4', text: 'Geschieden' },
    ],
    scaleRoh: '1. Ledig\n2. Verheiratet, eingetragene Partnerschaft\n3. Verwitwet\n4. Geschieden',
  },
  {
    iCode: 'iA5a',
    nummer: 'BB5a',
    bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN',
    gruppe: 'BB5',
    text: 'Versicherten-Nummer',
    typ: 'freitext',
    optionen: [],
    scaleRoh: '',
  },
  {
    iCode: 'iA5d',
    nummer: 'BB5b',
    bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN',
    gruppe: 'BB5',
    text: 'Interne Fallnummer',
    typ: 'freitext',
    optionen: [],
    scaleRoh: '',
  },
  {
    iCode: 'iA10',
    nummer: 'BB6',
    bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN',
    gruppe: null,
    text: 'Wohnort: Postleitzahl, Ort',
    typ: 'freitext',
    optionen: [],
    scaleRoh: 'PLZ / Ort',
  },
  {
    iCode: 'CHA7a',
    nummer: 'BB7a',
    bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN',
    gruppe: 'BB7',
    text: 'Krankenkasse: Grundversicherung',
    typ: 'freitext',
    optionen: [],
    scaleRoh: 'Freitext',
  },
  {
    iCode: 'CHA7b',
    nummer: 'BB7b',
    bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN',
    gruppe: 'BB7',
    text: 'Krankenkasse: Zusatzversicherung',
    typ: 'freitext',
    optionen: [],
    scaleRoh: 'Freitext',
  },
  {
    iCode: 'CHA7c',
    nummer: 'BB7c',
    bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN',
    gruppe: 'BB7',
    text: 'Invaliden-, Unfall-, Militärversicherung',
    typ: 'freitext',
    optionen: [],
    scaleRoh: 'Freitext',
  },
  {
    iCode: 'iB1a',
    nummer: 'BB8',
    bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN',
    gruppe: null,
    text: 'Ziele der Person - Notieren Sie das primäre Behandlungsziel',
    typ: 'freitext',
    optionen: [],
    scaleRoh: 'Freitext',
  },
  {
    iCode: 'iA11b',
    nummer: 'BB9',
    bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN',
    gruppe: null,
    text: 'Wohnsituation zur Zeit der Abklärung',
    typ: 'auswahl',
    optionen: [
      { code: '1', text: 'Privathaus/Eigentums-/Mietwohnung/gemietetes Zimmer' },
      { code: '2', text: 'Wohnung mit integrierten Dienstleistungen' },
      { code: '3', text: 'Einrichtung für Personen mit psychischen Problemen, z.B.  Wohngruppen für Menschen mit psychischen Erkrankungen' },
      { code: '4', text: 'Wohngemeinschaft für Personen mit körperlicher Behinderung' },
      { code: '5', text: 'Einrichtung für Personen mit geistiger Behinderung' },
      { code: '6', text: 'Psychiatrische Klinik oder Abteilung' },
      { code: '7', text: 'Obdachlos (mit oder ohne Obdachlosenunterkunft)' },
      { code: '8', text: 'Alters- und Pflegeheim' },
      { code: '9', text: 'Rehabilitationsklinik/-abteilung' },
      { code: '10', text: 'Hospiz/Palliativstation' },
      { code: '11', text: 'Akutklinik/-abteilung' },
      { code: '12', text: 'Justizvollzuganstalt' },
      { code: '13', text: 'Sonstiges' },
    ],
    scaleRoh: '1. Privathaus/Eigentums-/Mietwohnung/gemietetes Zimmer \n2. Wohnung mit integrierten Dienstleistungen  \n3. Einrichtung für Personen mit psychischen Problemen, z.B.  Wohngruppen für Menschen mit psychischen Erkrankungen \n4. Wohngemeinschaft für Personen mit körperlicher Behinderung \n5. Einrichtung für Personen mit geistiger Behinderung \n6. Psychiatrische Klinik oder Abteilung \n7. Obdachlos (mit oder ohne Obdachlosenunterkunft)\n8. Alters- und Pflegeheim\n9. Rehabilitationsklinik/-abteilung \n10. Hospiz/Palliativstation \n11. Akutklinik/-abteilung\n12. Justizvollzuganstalt\n13. Sonstiges',
  },
  {
    iCode: 'iA12a',
    nummer: 'BB10a',
    bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN',
    gruppe: 'BB10',
    text: 'Form des Zusammenlebens',
    typ: 'auswahl',
    optionen: [
      { code: '1', text: 'Alleine' },
      { code: '2', text: 'Ausschliesslich mit Partner/in' },
      { code: '3', text: 'Mit Partner/in und anderen (Kinder, Eltern, Freunde)' },
      { code: '4', text: 'Mit Kindern, ohne Partner/in' },
      { code: '5', text: 'Mit Eltern oder Erziehungsberechtigten' },
      { code: '6', text: 'Mit Geschwistern' },
      { code: '7', text: 'Mit anderen Verwandten' },
      { code: '8', text: 'Mit einem oder mehreren Nicht-Verwandten' },
    ],
    scaleRoh: '1. Alleine\n2. Ausschliesslich mit Partner/in \n3. Mit Partner/in und anderen (Kinder, Eltern, Freunde)\n4. Mit Kindern, ohne Partner/in\n5. Mit Eltern oder Erziehungsberechtigten\n6. Mit Geschwistern\n7. Mit anderen Verwandten\n8. Mit einem oder mehreren Nicht-Verwandten',
  },
  {
    iCode: 'iA12b',
    nummer: 'BB10b',
    bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN',
    gruppe: 'BB10',
    text: 'Lebt die Person neu mit jemand anderem zusammen (im Vergleich zu vor 90 Tagen oder seit der letzten Beurteilung) – z.B. zog bei jemandem ein, jemand zog bei der Person ein',
    typ: 'auswahl',
    optionen: [
      { code: '0', text: 'Nein' },
      { code: '1', text: 'Ja' },
    ],
    scaleRoh: '0. Nein\n1. Ja',
  },
  {
    iCode: 'iA13',
    nummer: 'BB11',
    bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN',
    gruppe: null,
    text: 'Zeit seit dem letzten Spitalaufenthalt Kodieren Sie den letzten Aufenthalt in den LETZTEN 90 TAGEN',
    typ: 'auswahl',
    optionen: [
      { code: '0', text: 'Kein Spitalaufenthalt in den letzten 90 Tagen' },
      { code: '1', text: 'Vor 31-90 Tagen' },
      { code: '2', text: 'Vor 15-30 Tagen' },
      { code: '3', text: 'Vor 8-14 Tagen' },
      { code: '4', text: 'In den letzten 7 Tagen' },
      { code: '5', text: 'Ist aktuell hospitalisiert' },
    ],
    scaleRoh: '0. Kein Spitalaufenthalt in den letzten 90 Tagen\n1. Vor 31-90 Tagen \n2. Vor 15-30 Tagen\n3.Vor 8-14 Tagen\n4. In den letzten 7 Tagen\n5. Ist aktuell hospitalisiert',
  },
  {
    iCode: 'CHB3',
    nummer: 'BB12',
    bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN',
    gruppe: null,
    text: 'Staatsangehörigkeit',
    typ: 'freitext',
    optionen: [],
    scaleRoh: '1. Schweiz\n2. Andere, welche:\n\nBei Andere: Verpflichtendes Freitextfeld mit der Nennung des entsprechenden Staates (Bsp. Deutschland, Spanien)',
  },
  {
    iCode: 'iB4',
    nummer: 'BB13',
    bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN',
    gruppe: null,
    text: 'Üblicherweise gesprochene Sprache',
    typ: 'auswahl',
    optionen: [
      { code: '1', text: 'Schweizerdeutsch' },
      { code: '2', text: 'Französisch' },
      { code: '3', text: 'Italienisch' },
      { code: '4', text: 'Rätoromanisch' },
      { code: '5', text: 'Hochdeutsch' },
      { code: '6', text: 'Englisch' },
      { code: '7', text: 'Portugiesisch' },
      { code: '8', text: 'Spanisch' },
      { code: '9', text: 'Albanisch' },
      { code: '10', text: 'Kroatisch' },
      { code: '11', text: 'Serbisch' },
      { code: '12', text: 'Arabisch' },
      { code: '13', text: 'Kurdisch' },
      { code: '14', text: 'Türkisch' },
      { code: '15', text: 'Tamilisch' },
      { code: '16', text: 'Chinesisch' },
      { code: '17', text: 'Russisch' },
      { code: '18', text: 'Hindi' },
      { code: '19', text: 'Tigrinya' },
      { code: '20', text: 'Somalisch' },
      { code: '21', text: 'Andere, welche?' },
    ],
    scaleRoh: '1. Schweizerdeutsch\n2. Französisch\n3. Italienisch\n4. Rätoromanisch\n5. Hochdeutsch\n6. Englisch\n7. Portugiesisch\n8. Spanisch\n9. Albanisch\n10. Kroatisch\n11. Serbisch\n12. Arabisch\n13. Kurdisch\n14. Türkisch\n15. Tamilisch\n16. Chinesisch\n17. Russisch\n18. Hindi\n19. Tigrinya\n20. Somalisch\n21. Andere, welche?',
  },
  {
    iCode: 'iB11',
    nummer: 'BB14',
    bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN',
    gruppe: null,
    text: 'Übersetzer/in notwendig',
    typ: 'auswahl',
    optionen: [
      { code: '0', text: 'Nein' },
      { code: '1', text: 'Ja' },
    ],
    scaleRoh: '0. Nein\n1. Ja',
  },
  {
    iCode: 'iB5',
    nummer: 'BB15',
    bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN',
    gruppe: null,
    text: 'Wohn-Vorgeschichte in den letzten 5 Jahren Kodieren Sie alle Einrichtungen, in denen die Person in den letzten 5 Jahren vor der Eröffnung des Dossiers gelebt hat (B1 AA2).',
    typ: 'freitext',
    optionen: [],
    scaleRoh: '',
  },
  {
    iCode: 'iB5a',
    nummer: 'BB15a',
    bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN',
    gruppe: 'BB15',
    text: 'Alters- und Pflegeheim',
    typ: 'auswahl',
    optionen: [
      { code: '0', text: 'Nein' },
      { code: '1', text: 'Ja' },
    ],
    scaleRoh: '0. Nein\n1. Ja',
  },
  {
    iCode: 'iB5b',
    nummer: 'BB15b',
    bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN',
    gruppe: 'BB15',
    text: 'Begleitetes oder betreutes Wohnen',
    typ: 'auswahl',
    optionen: [
      { code: '0', text: 'Nein' },
      { code: '1', text: 'Ja' },
    ],
    scaleRoh: '0. Nein\n1. Ja',
  },
  {
    iCode: 'iB5e',
    nummer: 'BB15c',
    bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN',
    gruppe: 'BB15',
    text: 'Einrichtung für Personen mit psychischen Problemen, z.B. Wohngruppen für Menschen mit psychischen Erkrankungen',
    typ: 'auswahl',
    optionen: [
      { code: '0', text: 'Nein' },
      { code: '1', text: 'Ja' },
    ],
    scaleRoh: '0. Nein\n1. Ja',
  },
  {
    iCode: 'iB5c',
    nummer: 'BB15d',
    bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN',
    gruppe: 'BB15',
    text: 'Psychiatrische Klinik oder Psychiatrieabteilung eines Spitals',
    typ: 'auswahl',
    optionen: [
      { code: '0', text: 'Nein' },
      { code: '1', text: 'Ja' },
    ],
    scaleRoh: '0. Nein\n1. Ja',
  },
  {
    iCode: 'iB5d',
    nummer: 'BB15e',
    bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN',
    gruppe: 'BB15',
    text: 'Einrichtung für Personen mit einer geistigen Behinderung',
    typ: 'auswahl',
    optionen: [
      { code: '0', text: 'Nein' },
      { code: '1', text: 'Ja' },
    ],
    scaleRoh: '0. Nein\n1. Ja',
  },
  {
    iCode: 'CHBB16',
    nummer: 'BB16',
    bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN',
    gruppe: null,
    text: 'Einschätzung der Situation',
    typ: 'auswahl',
    optionen: [
      { code: '1', text: 'Somatische Pflege- und Betreuungssituation' },
      { code: '2', text: 'Psychiatrische Pflege- und Betreuungssituation' },
      { code: '3', text: 'Palliative Pflege- und Betreuungssituation' },
      { code: '4', text: 'Pädiatrische Pflege- und Betreuungssituation' },
      { code: '5', text: 'Isoliert-therapeutische Pflegesituation – Heparin verabreichen (z.B. Fraxiparin), Verbandwechsel, Augentropfen, Stützstrümpfe, etc:' },
      { code: '6', text: 'Vorübergehende Betreuungssituation (Hauswirtschaftliche Leistungen) - Vorübergehende Unterstützung im Haushalt durch die Spitexorganisation von bis zu drei Monaten bei Ausfall oder gesundheitlicher Beeinträchtigung der haushaltführenden Person infolge Krankheit, Unfall, Wochenbett/Schwangerschaft/Geburt.' },
      { code: '7', text: 'Klientin lehnt eine umfassende Bedarfsabklärung ab - Falls die Klientin eine Bedarfsabklärung ablehnt, obwohl dies gemäss den Richtlinien der Spitex angezeigt wäre, kann dieser Umstand hier dokumentiert werden.' },
    ],
    scaleRoh: '1. Somatische Pflege- und Betreuungssituation\n2. Psychiatrische Pflege- und Betreuungssituation\n3. Palliative Pflege- und Betreuungssituation\n4. Pädiatrische Pflege- und Betreuungssituation\n5. Isoliert-therapeutische Pflegesituation – Heparin verabreichen (z.B. Fraxiparin), Verbandwechsel, Augentropfen, Stützstrümpfe, etc: \n6. Vorübergehende Betreuungssituation (Hauswirtschaftliche Leistungen) - Vorübergehende Unterstützung im Haushalt durch die Spitexorganisation von bis zu drei Monaten bei Ausfall oder gesundheitlicher Beeinträchtigung der haushaltführenden Person infolge Krankheit, Unfall, Wochenbett/Schwangerschaft/Geburt. \n7. Klientin lehnt eine umfassende Bedarfsabklärung ab - Falls die Klientin eine Bedarfsabklärung ablehnt, obwohl dies gemäss den Richtlinien der Spitex angezeigt wäre, kann dieser Umstand hier dokumentiert werden.',
  },
  {
    iCode: 'CHBB17a',
    nummer: 'BB17a',
    bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN',
    gruppe: 'BB17',
    text: 'Unterschrift der Personen, die mit dem Formular SDA gearbeitet haben.',
    typ: 'unterschrift',
    optionen: [],
    scaleRoh: 'Unterschrift',
  },
  {
    iCode: 'CHBB17b',
    nummer: 'BB17b',
    bereich: 'BEREICH BB: STAMMDATEN UND ANGABEN',
    gruppe: 'BB17',
    text: 'Unterschrift der zuständigen Person, die das Formular SDA abschliesst',
    typ: 'datum',
    optionen: [],
    scaleRoh: 'TT/MM/JJJJ und Unterschrift',
  },
] as const

const NACH_ICODE = new Map<string, SdaItem>(SDA_KATALOG.map((i) => [i.iCode, i]))
const NACH_NUMMER = new Map<string, SdaItem>(SDA_KATALOG.map((i) => [i.nummer, i]))

export function sdaItem(iCode: string): SdaItem | undefined {
  return NACH_ICODE.get(iCode)
}

/** Nur fuer Anzeige und Fehlersuche. Niemals als Schluessel verwenden. */
export function sdaItemNachNummer(nummer: string): SdaItem | undefined {
  return NACH_NUMMER.get(nummer)
}

export const SDA_BEREICHE: readonly string[] = Array.from(
  new Set(SDA_KATALOG.map((i) => i.bereich)),
)

export function sdaItemsFuerBereich(bereich: string): readonly SdaItem[] {
  return SDA_KATALOG.filter((i) => i.bereich === bereich)
}

export function sdaGruppe(nummer: string): SdaGruppe | undefined {
  return SDA_GRUPPEN.find((g) => g.nummer === nummer)
}