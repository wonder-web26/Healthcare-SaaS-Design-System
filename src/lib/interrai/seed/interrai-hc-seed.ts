/**
 * interRAI HC Schweiz – Bedarfsabklärungsinstrument (seed)
 * ====================================================================
 * Source: interRAI HC Schweiz Bedarfsabklärungsinstrument, all 8 pages.
 * © interRAI HC 1994–2022 (9.4) · ISBN 978-1-62255-184-2 · www.interRAI.org
 *
 * Every string in this file is taken verbatim from the printed form. Nothing
 * is shortened, reworded, summarised or reconstructed. Where the form prints
 * a title, an italic instruction and answer codes, those are three separate
 * fields here; that reproduces the form rather than interpreting it.
 *
 * This file replaces an earlier seed that had been derived by OCR from
 * screenshots. Roughly half of its entries diverged from the form in wording,
 * in punctuation or in whole missing sentences. It also replaces the two
 * companion files interrai-labels.ts and interrai-structure.ts: the label
 * split, the group headings, the G1 pairing, the attached N2 fields and the
 * units are all printed on the form and are therefore part of the instrument,
 * not of our presentation layer.
 *
 * IMPORTANT — Licensing:
 *   The form carries "Vervielfältigung verboten". Internal development
 *   groundwork only. No productive use and no real client data before the
 *   Spitex Schweiz licence and certification. Keep interraiCertified = false.
 *
 * Scales, CAP triggers and the HomeCareData export are deliberately NOT part
 * of this file. That logic comes from the official Spitex Schweiz
 * specification and must never be reconstructed from the form or the manual.
 *
 * Status: draft, not yet reviewed by Person B.
 */

export type AnswerType = "text" | "number" | "date" | "single_choice" | "composite";

/**
 * A conditional follow-up field revealed only while this option is selected.
 * Its value is stored under `code`, counts as an open field only while visible,
 * and is reset when another option is chosen. Expressed on the option, so the
 * renderer needs no per-item special case.
 */
export interface FollowUp {
  code: string;
  kind: "text" | "land";
  label?: string;
}

export interface AnswerOption {
  code: string;
  label: string;
  /** The printed option is followed by a blank line for free text */
  freeText?: boolean;
  /** Conditional follow-up field shown while this option is selected */
  followUp?: FollowUp;
}

/** Answer column for items printed with more than one box per row (G1). */
export interface AnswerColumn {
  code: string;
  label: string;
}

/** Extra numeric field printed beneath a sub-item (N2 e, f, g). */
export interface Attachment {
  code: string;
  /** Printed marker, e.g. "(A)" */
  marker: string;
  label: string;
  answerType: AnswerType;
  unit?: string;
}

export interface SubItem {
  code: string;
  /** Italic group heading printed above this sub-item */
  groupHeading?: string;
  /** Bold term, verbatim */
  label: string;
  /** Explanation after the em dash, verbatim */
  detail?: string;
  /** Observation period when it differs from the item */
  beobachtungsperiode?: string;
  answerType: AnswerType;
  /** Own options; when absent the sub-item inherits the item's options */
  options?: AnswerOption[];
  /** Printed line introducing the attached fields, verbatim */
  attachmentIntro?: string;
  attachments?: Attachment[];
}

export interface Dependency {
  triggerValue: string;
  action: "skip_items";
  target: string;
  description: string;
}

export interface Item {
  code: string;
  order: number;
  /** Bold title as printed, verbatim */
  label: string;
  /** Italic instruction line as printed, verbatim */
  instruction?: string;
  /** Note printed below the item, verbatim */
  footnote?: string;
  answerType: AnswerType;
  /** Observation period when it differs from the instrument default */
  beobachtungsperiode?: string;
  options?: AnswerOption[];
  /** When present, every sub-item is answered once per column */
  columns?: AnswerColumn[];
  subItems?: SubItem[];
  dependencies?: Dependency[];
  /** Number of printed repetitions for a fixed repeatable block */
  repeatRows?: number;
  /** Repeatable block whose count is entered by the assessor */
  repeatable?: boolean;
}

export interface Bereich {
  code: string;
  /** Section heading as printed on the form */
  title: string;
  items: Item[];
}

export interface Instrument {
  code: "HC_CH";
  version: string;
  locale: "de-CH";
  copyright: string;
  isbn: string;
  /** Printed at the top of page 1 */
  defaultBeobachtungsperiode: string;
  bereiche: Bereich[];
}

export const interraiHcSchweiz: Instrument = {
  code: "HC_CH",
  version: "9.4",
  locale: "de-CH",
  copyright: "© interRAI HC 1994–2022 (9.4) www.interRAI.org",
  isbn: "978-1-62255-184-2",
  defaultBeobachtungsperiode: "Wenn nicht anders vermerkt, Beobachtungsperiode 3 Tage",
  bereiche: [
    {
      code: "A",
      title: "Administrative Daten und Beurteilungsgrund",
      items: [
        {
          code: "A1",
          order: 1,
          label: "Namen / Vornamen",
          answerType: "composite",
          subItems: [
            {
              code: "A1a",
              label: "Name",
              answerType: "text",
            },
            {
              code: "A1b",
              label: "Vorname",
              answerType: "text",
            },
          ],
        },
        {
          code: "A2",
          order: 2,
          label: "Geschlecht",
          answerType: "single_choice",
          options: [
            { code: "1", label: "Männlich" },
            { code: "2", label: "Weiblich" },
            { code: "3", label: "Andere" },
          ],
        },
        {
          code: "A3",
          order: 3,
          label: "Geburtsdatum",
          answerType: "date",
        },
        {
          code: "A4",
          order: 4,
          label: "Zivilstand [länderspezifisch]",
          answerType: "single_choice",
          options: [
            { code: "1", label: "Ledig" },
            { code: "2", label: "Verheiratet, registrierte Partnerschaft" },
            { code: "3", label: "Verwitwet" },
            { code: "4", label: "Geschieden" },
          ],
        },
        {
          code: "A5",
          order: 5,
          label: "Nummern [länderspezifisch]",
          answerType: "composite",
          subItems: [
            {
              code: "A5a",
              label: "Versicherten-Nummer",
              answerType: "text",
            },
            {
              code: "A5b",
              label: "Interne Fallnummer",
              answerType: "text",
            },
          ],
        },
        {
          code: "A6",
          order: 6,
          label: "Wohnort: Postleitzahl, Ort [länderspezifisch]",
          answerType: "composite",
          subItems: [
            {
              code: "A6a",
              label: "PLZ",
              answerType: "text",
            },
            {
              code: "A6b",
              label: "Ort",
              answerType: "text",
            },
          ],
        },
        {
          code: "A7",
          order: 7,
          label: "Versicherungen [länderspezifisch]",
          answerType: "composite",
          subItems: [
            {
              code: "A7a",
              label: "Krankenkasse: Grundversicherung",
              answerType: "text",
            },
            {
              code: "A7b",
              label: "Krankenkasse: Zusatzversicherung",
              answerType: "text",
            },
            {
              code: "A7c",
              label: "Invaliden-, Unfall-, Militärversicherung",
              answerType: "text",
            },
          ],
        },
        {
          code: "A8",
          order: 8,
          label: "Beurteilungsgrund",
          answerType: "single_choice",
          options: [
            { code: "1", label: "Erste Beurteilung (Erstassessment)" },
            { code: "2", label: "Periodische Beurteilung (Reassessment) [Länderspezifisch]" },
            { code: "3", label: "Wiedereintritts-Beurteilung (z.B. nach einem Spitalaufenthalt)" },
            { code: "4", label: "Reassessment aufgrund signifikanter Statusveränderung" },
            { code: "5", label: "Austritt [Länderspezifisch]" },
            { code: "6", label: "Einsatzabbruch" },
            { code: "7", label: "Andere (z.B. Forschungsstudie)" },
          ],
        },
        {
          code: "A9",
          order: 9,
          label: "Beginn der Bedarfsabklärung [länderspezifisch]",
          answerType: "date",
        },
        {
          code: "A10",
          order: 10,
          label: "Ziele der Person",
          instruction: "Notieren Sie das primäre Behandlungsziel",
          answerType: "text",
        },
        {
          code: "A11",
          order: 11,
          label: "Wohnsituation zur Zeit der Abklärung",
          answerType: "single_choice",
          options: [
            { code: "1", label: "Privathaus / Eigentums- / Mietwohnung / gemietetes Zimmer" },
            { code: "2", label: "Wohnung mit integrierten Dienstleistungen" },
            { code: "3", label: "Einrichtung für Personen mit psychischen Problemen, z.B. Wohngruppen für Menschen mit psychischen Erkrankungen" },
            { code: "4", label: "Wohngemeinschaft für Personen mit körperlicher Behinderung" },
            { code: "5", label: "Einrichtung für Personen mit geistiger Behinderung" },
            { code: "6", label: "Psychiatrische Klinik oder Abteilung" },
            { code: "7", label: "Obdachlos (mit oder ohne Obdachlosenunterkunft)" },
            { code: "8", label: "Alters- und Pflegeheim" },
            { code: "9", label: "Rehabilitationsklinik / -abteilung" },
            { code: "10", label: "Hospiz / Palliativstation" },
            { code: "11", label: "Akutklinik / -abteilung" },
            { code: "12", label: "Justizvollzugsanstalt" },
            { code: "13", label: "Sonstiges" },
          ],
        },
        {
          code: "A12",
          order: 12,
          label: "Form des Zusammenlebens",
          answerType: "composite",
          subItems: [
            {
              code: "A12a",
              label: "Form des Zusammenlebens",
              answerType: "single_choice",
              options: [
                { code: "1", label: "Alleine" },
                { code: "2", label: "Ausschliesslich mit Partner/in" },
                { code: "3", label: "Mit Partner/in und anderen (Kinder, Eltern, Freunde)" },
                { code: "4", label: "Mit Kindern, ohne Partner/in" },
                { code: "5", label: "Mit Eltern oder Erziehungsberechtigten" },
                { code: "6", label: "Mit Geschwistern" },
                { code: "7", label: "Mit anderen Verwandten" },
                { code: "8", label: "Mit einem oder mehreren Nicht-Verwandten" },
              ],
            },
            {
              code: "A12b",
              label: "Lebt die Person neu mit jemand anderem zusammen (im Vergleich zu vor 90 Tagen oder seit der letzten Beurteilung)",
              detail: "z.B. zog bei jemandem ein, jemand zog bei der Person ein",
              answerType: "single_choice",
              options: [
                { code: "0", label: "Nein" },
                { code: "1", label: "Ja" },
              ],
            },
            {
              code: "A12c",
              label: "Die Person oder ein Angehöriger ist der Meinung, dass es für die Person besser wäre, woanders zu leben",
              answerType: "single_choice",
              options: [
                { code: "0", label: "Nein" },
                { code: "1", label: "Ja, in einer anderen Wohnung" },
                { code: "2", label: "Ja, in einer anderen Einrichtung" },
              ],
            },
          ],
        },
        {
          code: "A13",
          order: 13,
          label: "Zeit seit dem letzten Spitalaufenthalt",
          instruction: "Kodieren Sie den letzten Aufenthalt in den LETZTEN 90 TAGEN",
          answerType: "single_choice",
          beobachtungsperiode: "letzte 90 Tage",
          options: [
            { code: "0", label: "Kein Spitalaufenthalt in den letzten 90 Tagen" },
            { code: "1", label: "Vor 31–90 Tagen" },
            { code: "2", label: "Vor 15–30 Tagen" },
            { code: "3", label: "Vor 8–14 Tagen" },
            { code: "4", label: "In den letzten 7 Tagen" },
            { code: "5", label: "Ist aktuell hospitalisiert" },
          ],
        },
      ],
    },
    {
      code: "B",
      title: "Aufnahme und Vorgeschichte",
      items: [
        {
          code: "B1",
          order: 1,
          label: "Datum der Eröffnung des Dossiers",
          answerType: "date",
        },
        {
          code: "B2",
          order: 2,
          label: "Staatsangehörigkeit [länderspezifisch]",
          instruction: "Bei Andere: Verpflichtendes Freitextfeld mit der Nennung des entsprechenden Staates (Bsp. Deutschland, Spanien)",
          answerType: "single_choice",
          options: [
            { code: "1", label: "Schweiz" },
            { code: "2", label: "Andere, welche:", followUp: { code: "B2a", kind: "land", label: "Staat" } },
          ],
        },
        {
          code: "B3",
          order: 3,
          label: "Üblicherweise gesprochene Sprache [länderspezifisch]",
          answerType: "single_choice",
          options: [
            { code: "1", label: "Schweizerdeutsch" },
            { code: "2", label: "Französisch" },
            { code: "3", label: "Italienisch" },
            { code: "4", label: "Rätoromanisch" },
            { code: "5", label: "Hochdeutsch" },
            { code: "6", label: "Englisch" },
            { code: "7", label: "Portugiesisch" },
            { code: "8", label: "Spanisch" },
            { code: "9", label: "Albanisch" },
            { code: "10", label: "Kroatisch" },
            { code: "11", label: "Serbisch" },
            { code: "12", label: "Arabisch" },
            { code: "13", label: "Kurdisch" },
            { code: "14", label: "Türkisch" },
            { code: "15", label: "Tamilisch" },
            { code: "16", label: "Chinesisch" },
            { code: "17", label: "Russisch" },
            { code: "18", label: "Hindi" },
            { code: "19", label: "Tigrinya" },
            { code: "20", label: "Somalisch" },
            { code: "21", label: "Andere, welche?", followUp: { code: "B3a", kind: "text", label: "Sprache" } },
          ],
        },
        {
          code: "B4",
          order: 4,
          label: "Übersetzer/in notwendig",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Nein" },
            { code: "1", label: "Ja" },
          ],
        },
        {
          code: "B5",
          order: 5,
          label: "Wohn-Vorgeschichte in den letzten 5 Jahren",
          instruction: "Kodieren Sie alle Einrichtungen, in denen die Person in den letzten 5 Jahren vor der Eröffnung des Dossiers gelebt hat (B1).",
          answerType: "composite",
          options: [
            { code: "0", label: "Nein" },
            { code: "1", label: "Ja" },
          ],
          subItems: [
            {
              code: "B5a",
              label: "Alters- und Pflegeheim",
              answerType: "single_choice",
            },
            {
              code: "B5b",
              label: "Begleitetes oder betreutes Wohnen",
              answerType: "single_choice",
            },
            {
              code: "B5c",
              label: "Einrichtung für Personen mit psychischen Problemen",
              detail: "z.B. Wohngruppen für Menschen mit psychischen Erkrankungen",
              answerType: "single_choice",
            },
            {
              code: "B5d",
              label: "Psychiatrische Klinik oder Psychiatrieabteilung eines Spitals",
              answerType: "single_choice",
            },
            {
              code: "B5e",
              label: "Einrichtung für Personen mit einer geistigen Behinderung",
              answerType: "single_choice",
            },
          ],
        },
      ],
    },
    {
      code: "C",
      title: "Kognitive Fähigkeiten",
      items: [
        {
          code: "C1",
          order: 1,
          label: "Kognitive Fähigkeiten für alltägliche Entscheidungen",
          instruction: "Entscheidungen bezüglich der Organisation des Alltages (z.B. Zeitpunkt zum Aufstehen, zum Essen, welche Kleider anziehen oder welche Tätigkeiten ausführen)",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Unabhängig — Entscheidungen sind konsistent, vernünftig und sinnvoll" },
            { code: "1", label: "Veränderte Unabhängigkeit — Einige Schwierigkeiten in neuen, unbekannten Situationen" },
            { code: "2", label: "Leichte Beeinträchtigung — In spezifischen wiederkehrenden Situationen werden Entscheidungen unzuverlässig oder gefährlich, braucht in spezifischen Situationen Anleitung und Überwachung" },
            { code: "3", label: "Mittlere Beeinträchtigung — Entscheidungen sind durchwegs unzuverlässig oder gefährlich; in diesen Situationen i.d.R. Unterstützung erforderlich" },
            { code: "4", label: "Schwere Beeinträchtigung — Trifft selten / nie Entscheidungen" },
            { code: "5", label: "Kein wahrnehmbares Bewusstsein, komatöser Status [weiter mit Bereich G]" },
          ],
          dependencies: [
            { triggerValue: "5", action: "skip_items", target: "C2,C3,C4,C5,D,E,F", description: "Bei C1 = 5 weiter mit Bereich G." },
          ],
        },
        {
          code: "C2",
          order: 2,
          label: "Gedächtnis",
          instruction: "Erinnerung an Gelerntes oder Bekanntes",
          answerType: "composite",
          options: [
            { code: "0", label: "Ja, Gedächtnis funktioniert" },
            { code: "1", label: "Gedächtnisprobleme" },
          ],
          subItems: [
            {
              code: "C2a",
              label: "Kurzzeitgedächtnis",
              detail: "Erinnerung nach 5 Min. möglich",
              answerType: "single_choice",
            },
            {
              code: "C2b",
              label: "Gedächtnis für Handlungsabläufe",
              detail: "Erinnert sich ohne Unterstützung (fast) gänzlich an die Abfolge von Handlungen",
              answerType: "single_choice",
            },
            {
              code: "C2c",
              label: "Situatives Gedächtnis",
              detail: "Erkennt die Namen und Gesichter der bekannten Pflegepersonen UND kann sich an bekannten Orten orientieren (Schlafzimmer, Esszimmer, Küche)",
              answerType: "single_choice",
            },
          ],
        },
        {
          code: "C3",
          order: 3,
          label: "Schwankungen im Denken oder verändertes Bewusstsein",
          instruction: "Eine präzise Beurteilung verlangt, dass Sie mit Angehörigen und Fachpersonen, die mit der Person vertraut sind, sprechen.",
          answerType: "composite",
          options: [
            { code: "0", label: "Verhalten nicht vorhanden" },
            { code: "1", label: "Verhalten vorhanden, stimmt mit üblichem Verhalten überein" },
            { code: "2", label: "Verhalten vorhanden, scheint unterschiedlich zum üblichen Verhalten (neu aufgetreten oder verschlechtert, unterschiedlich zu vor ein paar Wochen)" },
          ],
          subItems: [
            {
              code: "C3a",
              label: "Leicht ablenkbar",
              detail: "z.B. kann Aufmerksamkeit nicht halten; lässt sich ablenken; verwirrbar",
              answerType: "single_choice",
            },
            {
              code: "C3b",
              label: "Episoden unzusammenhängenden Sprechens",
              detail: "z.B. unsinnig; sprunghaft; verliert den Faden",
              answerType: "single_choice",
            },
            {
              code: "C3c",
              label: "Tagesschwankungen kognitiver Fähigkeiten",
              detail: "Mal besser, mal schlechter",
              answerType: "single_choice",
            },
          ],
        },
        {
          code: "C4",
          order: 4,
          label: "Akute Änderung der kognitiven Fähigkeiten gegenüber Normalzustand der Person",
          instruction: "z.B. Unruhe, Lethargie, Aufmerksamkeitsschwierigkeiten, veränderte Umgebungswahrnehmung",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Nein" },
            { code: "1", label: "Ja" },
          ],
        },
        {
          code: "C5",
          order: 5,
          label: "Änderung in der Fähigkeit für alltägliche Entscheidungen im Vergleich zu vor 90 Tagen (oder seit letzter Beurteilung, falls weniger lange zurück)",
          answerType: "single_choice",
          beobachtungsperiode: "letzte 90 Tage",
          options: [
            { code: "0", label: "Verbessert" },
            { code: "1", label: "Keine Änderung" },
            { code: "2", label: "Verschlechtert" },
            { code: "8", label: "Unsicher" },
          ],
        },
      ],
    },
    {
      code: "D",
      title: "Kommunikation und Sehen",
      items: [
        {
          code: "D1",
          order: 1,
          label: "Sich verständlich machen",
          instruction: "Inhaltliche Ausdrucksfähigkeit, verbal und non-verbal",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Ist verständlich — Drückt sich ohne Probleme aus" },
            { code: "1", label: "Ist normalerweise verständlich — Hat Schwierigkeiten, Worte zu finden oder Gedanken zu beenden ABER wenn genug Zeit gegeben wird, sind keine Rückfragen notwendig" },
            { code: "2", label: "Ist häufig verständlich — Hat Schwierigkeiten, die eigenen Worte zu finden oder Gedanken zu beenden UND Unterstützung ist üblicherweise erforderlich" },
            { code: "3", label: "Manchmal verständlich — Beschränkte Fähigkeit, konkrete Wünsche zu äussern" },
            { code: "4", label: "Selten oder nie verständlich" },
          ],
        },
        {
          code: "D2",
          order: 2,
          label: "Fähigkeit andere zu verstehen",
          instruction: "Verständlichkeit des Inhalts mündlicher Informationen auch mit Hörhilfe, falls benutzt",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Versteht — Klare Auffassungsgabe" },
            { code: "1", label: "Versteht andere normalerweise — Verpasst einige wenige Bruchstücke / Sinn der Konversation ABER versteht das Meiste" },
            { code: "2", label: "Versteht andere häufig — Verpasst einige wenige Bruchstücke / Sinn der Konversation ABER versteht mit Hilfe von Erläuterungen und Wiederholungen das Meiste" },
            { code: "3", label: "Versteht andere manchmal — Reagiert ausreichend nur auf einfache direkte Fragen" },
            { code: "4", label: "Versteht selten oder nie" },
          ],
        },
        {
          code: "D3",
          order: 3,
          label: "Hören",
          instruction: "Mit Hörhilfe, falls benutzt",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Ausreichend — Keine Probleme normalen Gesprächen zu folgen, an sozialen Interaktionen teilzunehmen, den Fernseher zu hören" },
            { code: "1", label: "Leichte Schwierigkeiten — Mühe in gewissen Umgebungen (beispielsweise wenn leise gesprochen wird oder sich die Person mehr als 2 Meter entfernt aufhält)" },
            { code: "2", label: "Mittlere Schwierigkeiten — Schwierigkeiten normale Gespräche zu hören, ist auf ruhige Umgebung angewiesen" },
            { code: "3", label: "Grosse Schwierigkeiten — Schwierigkeiten in allen Situationen (Gegenüber muss laut und deutlich oder sehr langsam sprechen, oder Person sagt, dass sie nur ein Gemurmel wahrnimmt)" },
            { code: "4", label: "Hört nichts" },
          ],
        },
        {
          code: "D4",
          order: 4,
          label: "Sehen",
          instruction: "Bei angemessener Beleuchtung, falls nötig mit Sehhilfen",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Ausreichend — Sieht kleine Details, einschliesslich gewöhnlicher Druckbuchstaben in Zeitungen / Büchern" },
            { code: "1", label: "Leichte Schwierigkeiten — Sieht grosse Druckbuchstaben, aber keine gewöhnlichen" },
            { code: "2", label: "Mittlere Schwierigkeiten — Eingeschränktes Sehvermögen; unfähig, Zeitungsüberschriften zu lesen aber kann Gegenstände in Umgebung identifizieren" },
            { code: "3", label: "Grosse Schwierigkeiten — Erkennt Gegenstände in Umgebung kaum aber scheint mit den Augen zu folgen, sieht nur Licht, Farben und Umrisse" },
            { code: "4", label: "Kein Sehvermögen" },
          ],
        },
      ],
    },
    {
      code: "E",
      title: "Stimmungslage und Verhalten",
      items: [
        {
          code: "E1",
          order: 1,
          label: "Mögliche Anzeichen für depressive, ängstliche oder traurige Stimmungslage",
          instruction: "Kodieren Sie die Anzeichen, die in den letzten 3 Tagen beobachtet wurden, unabhängig von den Ursachen. Hinweis: Wenn möglich Fragen Sie die Person jedes Mal.",
          answerType: "composite",
          options: [
            { code: "0", label: "Nicht vorhanden" },
            { code: "1", label: "Vorhanden, zeigte sich jedoch nicht in den letzten 3 Tagen" },
            { code: "2", label: "Zeigte sich an 1–2 Tagen der letzten 3 Tage" },
            { code: "3", label: "Zeigte sich täglich in den letzten 3 Tagen" },
          ],
          subItems: [
            {
              code: "E1a",
              label: "Macht negative Äusserungen zum Lebenssinn",
              detail: "Wie „Nichts hat einen Sinn; Ich will lieber tot sein; Warum lebe ich so lange? Lasst mich sterben!\"",
              answerType: "single_choice",
            },
            {
              code: "E1b",
              label: "Anhaltender Ärger über sich oder andere",
              detail: "z.B.: schnell missmutig, verärgert über Pflege",
              answerType: "single_choice",
            },
            {
              code: "E1c",
              label: "Ausdruck (auch nonverbal) von scheinbar unrealistischen Ängsten",
              detail: "z.B. verlassen zu werden, alleine gelassen zu werden, mit anderen zusammen sein, intensive Angst vor bestimmten Gegenständen / Situationen",
              answerType: "single_choice",
            },
            {
              code: "E1d",
              label: "Sorgt sich wiederholt um eigene Gesundheit",
              detail: "z.B.: Sucht anhaltend medizinische Aufmerksamkeit, hat zwanghafte Sorge um eigene Körperfunktionen",
              answerType: "single_choice",
            },
            {
              code: "E1e",
              label: "Wiederholte ängstliche Beschwerden (nicht gesundheitsbezogen)",
              detail: "Sucht Aufmerksamkeit, Bestätigung betreffend Tagesablauf, Mahlzeiten, Kleider, Beziehungen",
              answerType: "single_choice",
            },
            {
              code: "E1f",
              label: "Traurige, gequälte oder besorgte Mimik",
              detail: "z.B.: stirnrunzelnd, finster",
              answerType: "single_choice",
            },
            {
              code: "E1g",
              label: "Weinerlich, tränenüberströmt",
              answerType: "single_choice",
            },
            {
              code: "E1h",
              label: "Wiederkehrende Äusserungen, dass etwas Schreckliches passieren wird",
              detail: "z.B.: Glaubt bald zu sterben, einen Herzanfall zu bekommen",
              answerType: "single_choice",
            },
            {
              code: "E1i",
              label: "Rückzug aus früher geschätzten Aktivitäten",
              detail: "z.B.: aus langjährigen Beschäftigungen, Abkehr von Familie oder Freunden",
              answerType: "single_choice",
            },
            {
              code: "E1j",
              label: "Verminderte soziale Interaktionen",
              answerType: "single_choice",
            },
            {
              code: "E1k",
              label: "Ausdruck mangelnder Lebensfreude",
              detail: "Auch nonverbal (Anhedonie) — z.B. „Ich kann mich an nichts mehr freuen\"",
              answerType: "single_choice",
            },
          ],
        },
        {
          code: "E2",
          order: 2,
          label: "Selbstdeklarierte Stimmungslage",
          instruction: "Fragen Sie: „In den letzten 3 Tagen, wie oft haben Sie sich wie folgt gefühlt . . .\"",
          answerType: "composite",
          options: [
            { code: "0", label: "Nicht in den letzten 3 Tagen" },
            { code: "1", label: "Nicht in den letzten 3 Tagen, fühlte sich jedoch oft so" },
            { code: "2", label: "In den letzten 1–2 Tagen der letzten 3 Tage" },
            { code: "3", label: "Täglich in den letzten 3 Tagen" },
            { code: "8", label: "Person gibt keine Antwort" },
          ],
          subItems: [
            {
              code: "E2a",
              label: "Wenig Interesse oder Freude an Dingen, die Sie sonst freuen?",
              answerType: "single_choice",
            },
            {
              code: "E2b",
              label: "Ängstlich, unruhig, ruhelos?",
              answerType: "single_choice",
            },
            {
              code: "E2c",
              label: "Traurig, niedergeschlagen, hoffnungslos?",
              answerType: "single_choice",
            },
          ],
        },
        {
          code: "E3",
          order: 3,
          label: "Verhaltensauffälligkeiten",
          instruction: "Kodieren Sie die Verhaltensauffälligkeiten, unabhängig von der angenommenen zugrundeliegenden Ursache",
          answerType: "composite",
          options: [
            { code: "0", label: "Nicht vorhanden" },
            { code: "1", label: "Vorhanden, zeigte sich aber nicht in den letzten 3 Tagen" },
            { code: "2", label: "Zeigte sich an 1–2 Tagen der letzten 3 Tage" },
            { code: "3", label: "Zeigte sich täglich in den letzten 3 Tagen" },
          ],
          subItems: [
            {
              code: "E3a",
              label: "Umherirren",
              detail: "Zielloses Umhergehen scheinbar ohne Zweck und ohne Rücksicht auf Gefahren",
              answerType: "single_choice",
            },
            {
              code: "E3b",
              label: "Verbale Aggressivität",
              detail: "Bedroht, beschimpft andere",
              answerType: "single_choice",
            },
            {
              code: "E3c",
              label: "Körperliche Aggressivität",
              detail: "Schlägt, tritt, kratzt andere, belästigt sexuell",
              answerType: "single_choice",
            },
            {
              code: "E3d",
              label: "Sozial unangemessenes oder störendes Verhalten",
              detail: "Lärmt, schreit, schmiert, wirft mit Kot und Essen, hortet, wühlt in fremden Gegenständen",
              answerType: "single_choice",
            },
            {
              code: "E3e",
              label: "Unangemessenes sexuelles Verhalten in der Öffentlichkeit oder entkleidet sich in der Öffentlichkeit",
              answerType: "single_choice",
            },
            {
              code: "E3f",
              label: "Widersetzt sich der Behandlung / Pflege",
              detail: "Verweigert Medikamente, das Essen, Unterstützung in den Aktivitäten des täglichen Lebens",
              answerType: "single_choice",
            },
          ],
        },
      ],
    },
    {
      code: "F",
      title: "Psychosoziales Wohlbefinden",
      items: [
        {
          code: "F1",
          order: 1,
          label: "Soziale Beziehungen",
          instruction: "Fragen Sie wenn immer möglich die Person selbst.",
          answerType: "composite",
          options: [
            { code: "0", label: "Keine" },
            { code: "1", label: "Vor mehr als 30 Tagen" },
            { code: "2", label: "Vor 8–30 Tagen" },
            { code: "3", label: "Vor 4–7 Tagen" },
            { code: "4", label: "In den letzten 3 Tagen" },
            { code: "8", label: "Nicht bestimmbar" },
          ],
          subItems: [
            {
              code: "F1a",
              label: "Teilnahme an sozialen Aktivitäten im Zusammenhang mit langjährigen Interessen",
              answerType: "single_choice",
            },
            {
              code: "F1b",
              label: "Erhält Besuche durch langjährige Bekannte oder Familienangehörige oder besucht diese",
              answerType: "single_choice",
            },
            {
              code: "F1c",
              label: "Andere Kontakte mit langjährigen Bekannten oder Familienmitgliedern",
              detail: "z.B. Telefon- / E-Mail-Kontakt, Skype, chatten",
              answerType: "single_choice",
            },
            {
              code: "F1d",
              label: "Konflikt oder Ausdruck von Wut gegenüber der Familie oder Freunden",
              answerType: "single_choice",
            },
            {
              code: "F1e",
              label: "Fürchtet sich vor Familienangehörigen oder nahen Bezugsperson(en)",
              answerType: "single_choice",
            },
            {
              code: "F1f",
              label: "Vernachlässigt, missbraucht, misshandelt",
              answerType: "single_choice",
            },
          ],
        },
        {
          code: "F2",
          order: 2,
          label: "Einsamkeit",
          instruction: "Die Person sagt oder zeigt, dass sie sich einsam fühlt",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Nein" },
            { code: "1", label: "Ja" },
          ],
        },
        {
          code: "F3",
          order: 3,
          label: "Veränderung der sozialen Aktivitäten in den letzten 90 Tagen (oder seit der letzten Beurteilung, wenn sie weniger als 90 Tage zurückliegt)",
          instruction: "Rückgang der Teilnahme an sozialen, religiösen, beruflichen oder anderen bevorzugten Aktivitäten. WENN ES EINEN RÜCKGANG GIBT, bestimmen Sie, ob die Person darunter leidet.",
          answerType: "single_choice",
          beobachtungsperiode: "letzte 90 Tage",
          options: [
            { code: "0", label: "Kein Rückgang" },
            { code: "1", label: "Rückgang, leidet nicht darunter" },
            { code: "2", label: "Rückgang, leidet darunter" },
          ],
        },
        {
          code: "F4",
          order: 4,
          label: "Dauer des Alleinseins während des Tages (Morgen und Nachmittag)",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Weniger als 1 Stunde" },
            { code: "1", label: "1–2 Stunden" },
            { code: "2", label: "Mehr als 2 Stunden, aber weniger als 8 Stunden" },
            { code: "3", label: "8 Stunden oder mehr" },
          ],
        },
        {
          code: "F5",
          order: 5,
          label: "Belastende Ereignisse in den letzten 90 Tagen",
          instruction: "z.B.: Episode einer schweren eigenen Erkrankung; Tod oder schwerwiegende Krankheit einer nahestehenden Person; Wohnungsverlust; hoher Geld- / Einkommensverlust; war Opfer einer Straftat wie Raub oder Körperverletzung; Verlust des Führerscheins oder des Autos",
          answerType: "single_choice",
          beobachtungsperiode: "letzte 90 Tage",
          options: [
            { code: "0", label: "Nein" },
            { code: "1", label: "Ja" },
          ],
        },
      ],
    },
    {
      code: "G",
      title: "Körperliche Funktionsfähigkeiten",
      items: [
        {
          code: "G1",
          order: 1,
          label: "Effektive IADL-Leistung und vermutete Leistungsfähigkeit (instrumentelle Aktivitäten des täglichen Lebens)",
          instruction: "Kodieren Sie die Leistung der Person während der letzten 3 Tage unter ‚effektive Leistungsfähigkeit‘ (A). Kodieren Sie ebenfalls die ‚vermutete Leistungsfähigkeit‘ unter (B); diese Einschätzung bedingt einen gewissen Teil an Spekulation.",
          answerType: "composite",
          columns: [
            { code: "A", label: "Effektive Leistungsfähigkeit" },
            { code: "B", label: "Vermutete Leistungsfähigkeit" },
          ],
          options: [
            { code: "0", label: "Unabhängig — Keine Hilfe, Vorbereitung oder Aufsicht" },
            { code: "1", label: "Unterstützung nur bei der Vorbereitung" },
            { code: "2", label: "Aufsicht — Überwachung, Anleitung, Ermunterung" },
            { code: "3", label: "Begrenzte Hilfe — Person erhielt manchmal Hilfe" },
            { code: "4", label: "Verstärkte Hilfe — Hilfe erforderlich für die Aufgabe, Person machte aber 50% oder mehr selbst" },
            { code: "5", label: "Umfassende Hilfe — Hilfe erforderlich für die Aufgabe, Person machte weniger als 50% selbst" },
            { code: "6", label: "Vollständige Hilfe — Aufgabe vollständig durch andere ausgeführt während der Beobachtungsperiode" },
            { code: "8", label: "Aktivität ist während der Beobachtungsperiode nicht vorgekommen" },
          ],
          subItems: [
            {
              code: "G1a",
              label: "Mahlzeitenzubereitung",
              detail: "Wie werden die Mahlzeiten zubereitet (z.B. planen, Zutaten bereitstellen, kochen, das Essen und das benötigte Geschirr und Besteck auftischen)?",
              answerType: "single_choice",
            },
            {
              code: "G1b",
              label: "Allgemeine Hausarbeiten",
              detail: "Wie werden allgemeine Hausarbeiten durchgeführt (z.B. abwaschen, abstauben, Betten machen, aufräumen, Wäsche waschen)?",
              answerType: "single_choice",
            },
            {
              code: "G1c",
              label: "Geld verwalten",
              detail: "Wie werden Rechnungen bezahlt, der Kontostand kontrolliert, Haushaltsausgaben budgetiert und die Ausgaben der Kreditkarte überwacht?",
              answerType: "single_choice",
            },
            {
              code: "G1d",
              label: "Umgang mit Medikamenten",
              detail: "Wie wird der Umgang mit den Medikamenten bewerkstelligt (z.B. sich an die Einnahme erinnern, Fläschchen öffnen, richtige Dosis bereitstellen, Selbstinjektionen verabreichen, Salben einreiben)?",
              answerType: "single_choice",
            },
            {
              code: "G1e",
              label: "Telefonieren",
              detail: "Wie wird das Telefon bedient? Wie werden Telefonanrufe entgegengenommen und wie telefoniert die Person (z.B. geeignete Hilfsmittel wie grosse Tasten, aufleuchtende Lampe bei Anruf)?",
              answerType: "single_choice",
            },
            {
              code: "G1f",
              label: "Treppen benutzen",
              detail: "Wie wird eine ganze Treppe hinaufgestiegen, hinuntergegangen (12–14 Stufen)?",
              answerType: "single_choice",
            },
            {
              code: "G1g",
              label: "Einkaufen",
              detail: "Wie werden Einkäufe für die Mahlzeiten und den Haushalt verrichtet (z.B. Auswahl, Bezahlung)? OHNE Transport",
              answerType: "single_choice",
            },
            {
              code: "G1h",
              label: "Verkehrsmittelbenutzung",
              detail: "Wie die Person die öffentlichen Verkehrsmittel benutzt (Streckenwahl, Bezahlung) oder selbst Auto fährt (in die Garage oder zum Parkplatz gehen und ins Auto ein oder aussteigen eingeschlossen)?",
              answerType: "single_choice",
            },
          ],
        },
        {
          code: "G2",
          order: 2,
          label: "Leistungsfähigkeit in den Aktivitäten des täglichen Lebens: BADL-Leistungen",
          instruction: "Kodieren Sie die Abhängigkeit der Person in den LETZTEN 3 TAGEN. Wenn alle Episoden auf dem gleichen Unterstützungslevel durchgeführt wurden, kodieren Sie die BADL auf diesem Level. Wenn nur eine Episode mit 6 kodiert, alle anderen Episoden aber weniger Abhängigkeit zeigten, kodieren Sie das Item mit 5. Andernfalls konzentrieren Sie sich auf die drei abhängigsten Episoden (oder alle Episoden, wenn sie weniger als 3 mal durchgeführt wurden). Wenn die am stärksten abhängige Episode mit 1 kodiert wird, kodieren Sie das Item mit 1. Ansonsten kodieren Sie die am geringsten abhängige Episode zwischen 2 und 5.",
          answerType: "composite",
          options: [
            { code: "0", label: "Unabhängig — Keine Hilfe, Vorbereitung oder Aufsicht" },
            { code: "1", label: "Unabhängig, nur Vorbereitung — Gegenstand oder Gerät bereitgestellt oder griffbereit abgelegt, in keiner Episode irgendeine körperliche Unterstützung oder Aufsicht" },
            { code: "2", label: "Aufsicht — Überwachung, Anleitung, Ermunterung" },
            { code: "3", label: "Begrenzte Unterstützung — Bekommt leichte Hilfe (ohne Übernahme von Gewicht)" },
            { code: "4", label: "Verstärkte Unterstützung — Person beteiligt sich wenig, bekommt Hilfe durch eine Person (mit Übernahme von Gewicht in weniger als 50% der Aktivität)" },
            { code: "5", label: "Umfassende Unterstützung — Person bekommt umfassende Hilfe durch 2 Personen oder mehr ODER Übernahme von Gewicht in mehr als 50% der Aktivität" },
            { code: "6", label: "Vollständige Hilfe — Durch andere ausgeführt während der ganzen Beobachtungsperiode" },
            { code: "8", label: "Aktivität ist während der Beobachtungsperiode nicht vorgekommen" },
          ],
          subItems: [
            {
              code: "G2a",
              label: "Bad, Dusche",
              detail: "Wie badet / duscht sich die Person (Arme, Beine, Brust, Bauch, Intimbereich; OHNE Rücken und Haare)? Es wird hier auch der Einstieg in die Badewanne / in das Duschbecken berücksichtigt",
              answerType: "single_choice",
            },
            {
              code: "G2b",
              label: "Persönliche Hygiene",
              detail: "Wie pflegt, kämmt, rasiert, schminkt sich die Person? Wie putzt sie sich Zähne, Gesicht und Hände? (OHNE Duschen / Baden)",
              answerType: "single_choice",
            },
            {
              code: "G2c",
              label: "Oberkörper an- / auskleiden",
              detail: "Wie sich die Person oberhalb der Taille an- und auszieht (Kleidung, Unterwäsche), einschliesslich Prothesen, Orthesen, Verschlüsse, Pullover usw.",
              answerType: "single_choice",
            },
            {
              code: "G2d",
              label: "Ankleiden der unteren Körperhälfte",
              detail: "Wie sich die Person unterhalb der Taille an- und auszieht (inkl. Kleider für draussen, Unterwäsche, Prothesen oder Schienen, Gürtel, Hosen, Rock, Schuhe und Schnürsenkel).",
              answerType: "single_choice",
            },
            {
              code: "G2e",
              label: "Gehen",
              detail: "Wie geht die Person drinnen zwischen zwei Orten auf gleicher Etage in Innenräumen?",
              answerType: "single_choice",
            },
            {
              code: "G2f",
              label: "Fortbewegung im Haus auf gleichem Stockwerk (zu Fuss oder im Rollstuhl)",
              detail: "Wie kommt die Person zu Fuss oder mit dem Rollstuhl auf dem gleichen Stockwerk voran? Wenn im Rollstuhl: Unabhängigkeit wenn im Rollstuhl sitzend",
              answerType: "single_choice",
            },
            {
              code: "G2g",
              label: "Transfer auf die Toilette",
              detail: "Wie kommt die Person auf und wieder weg von der Toilette oder vom Nachtstuhl?",
              answerType: "single_choice",
            },
            {
              code: "G2h",
              label: "Toilettenbenutzung",
              detail: "Wie benützt die Person die Toilette? Gemeint ist auch die Benützung des Nachtstuhls, Urinals, Steckbeckens (sich reinigen, Einlagen wechseln, Stoma / Katheter handhaben, sich wieder anziehen). OHNE Absitzen und Aufstehen von der Toilette.",
              answerType: "single_choice",
            },
            {
              code: "G2i",
              label: "Mobilität im Bett",
              detail: "Wie bewegt sich die Person in und aus der Liegeposition, wie dreht sie sich von einer auf die andere Seite und wie positioniert sie den Körper im Bett?",
              answerType: "single_choice",
            },
            {
              code: "G2j",
              label: "Essen / Trinken",
              detail: "Wie isst und trinkt die Person (abgesehen von Tischmanieren)? Inkl. Ernährung durch Unterstützung eines Hilfsmittels (z.B. durch Sonde)",
              answerType: "single_choice",
            },
          ],
        },
        {
          code: "G3",
          order: 3,
          label: "Fortbewegung",
          answerType: "composite",
          subItems: [
            {
              code: "G3a",
              label: "Übliche Fortbewegungsart in Innenräumen",
              answerType: "single_choice",
              options: [
                { code: "0", label: "Geht ohne Hilfsmittel" },
                { code: "1", label: "Geht mit Hilfsmittel — z.B. Stock, Krücke, Gehhilfe, schiebt Rollstuhl vor sich her" },
                { code: "2", label: "Rollstuhl (mechanisch oder elektrisch), Elektro-Scooter" },
                { code: "3", label: "Person ist bettlägerig" },
              ],
            },
            {
              code: "G3b",
              label: "Distanz beim Gehen",
              detail: "Weiteste Gehstrecke / Entfernung, die die Person in den LETZTEN 3 TAGEN zu Fuss, ohne sich hinzusetzen zurückgelegt hat (wenn nötig mit Unterstützung oder Hilfsmittel)",
              answerType: "single_choice",
              options: [
                { code: "0", label: "Person ist nicht gegangen" },
                { code: "1", label: "Weniger als 5 Meter" },
                { code: "2", label: "5–49 Meter" },
                { code: "3", label: "50–99 Meter" },
                { code: "4", label: "100 Meter oder mehr" },
                { code: "5", label: "1 Kilometer oder mehr" },
              ],
            },
            {
              code: "G3c",
              label: "Selbst gefahrene Distanz mit dem Rollstuhl (beinhaltet die selbstständige Benutzung eines nicht motorisierten Rollstuhls)",
              detail: "Längste Strecke, die die Person selbständig mit dem Rollstuhl, ohne Pause während der LETZTEN 3 TAGE zurückgelegt hat",
              answerType: "single_choice",
              options: [
                { code: "0", label: "Person wurde von anderen geschoben" },
                { code: "1", label: "Benutzt elektrischen Rollstuhl / Scooter" },
                { code: "2", label: "Fährt selbständig weniger als 5 Meter" },
                { code: "3", label: "Fährt selbständig 5–49 Meter" },
                { code: "4", label: "Fährt selbständig 50–99 Meter" },
                { code: "5", label: "Fährt selbständig 100 Meter oder mehr" },
                { code: "8", label: "Keine Rollstuhlbenutzung" },
              ],
            },
          ],
        },
        {
          code: "G4",
          order: 4,
          label: "Ausdauer",
          answerType: "composite",
          subItems: [
            {
              code: "G4a",
              label: "Ausdauer",
              detail: "Anzahl Stunden körperlicher Aktivität in den letzten 3 Tagen (z.B. spazieren, putzen, turnen)",
              answerType: "single_choice",
              options: [
                { code: "0", label: "Keine" },
                { code: "1", label: "Weniger als 1 Stunde" },
                { code: "2", label: "1–2 Stunden" },
                { code: "3", label: "3–4 Stunden" },
                { code: "4", label: "Mehr als 4 Stunden" },
              ],
            },
            {
              code: "G4b",
              label: "Aufenthalt ausserhalb des Hauses",
              detail: "Anzahl Tage, an denen die Person in den letzten drei Tagen das Haus verlassen hat (unabhängig von der Zeitdauer)",
              answerType: "single_choice",
              options: [
                { code: "0", label: "Person verlässt das Haus nie" },
                { code: "1", label: "Haus in den letzten 3 Tagen nicht verlassen, doch die Person verlässt das Haus sonst regelmässig" },
                { code: "2", label: "An 1 oder 2 Tagen" },
                { code: "3", label: "An allen 3 Tagen" },
              ],
            },
          ],
        },
        {
          code: "G5",
          order: 5,
          label: "Rehabilitationspotential",
          answerType: "composite",
          options: [
            { code: "0", label: "Nein" },
            { code: "1", label: "Ja" },
          ],
          subItems: [
            {
              code: "G5a",
              label: "Person glaubt, dass sie in der Lage ist, ihre funktionelle Unabhängigkeit (IADLs und/oder BADLs) zu verbessern",
              answerType: "single_choice",
            },
            {
              code: "G5b",
              label: "Professionelle Helfer glauben, dass die Person in der Lage ist, ihre funktionelle Unabhängigkeit (IADLs und/oder BADLs) zu verbessern",
              answerType: "single_choice",
            },
          ],
        },
        {
          code: "G6",
          order: 6,
          label: "Änderung der BADL-Fähigkeit in den letzten 90 Tagen (oder seit letzter Beurteilung, wenn sie weniger als 90 Tage zurückliegt)",
          answerType: "single_choice",
          beobachtungsperiode: "letzte 90 Tage",
          options: [
            { code: "0", label: "Verbessert" },
            { code: "1", label: "Keine Änderung" },
            { code: "2", label: "Verschlechtert" },
            { code: "8", label: "Unsicher" },
          ],
        },
        {
          code: "G7",
          order: 7,
          label: "Fuhr in den letzten 90 Tagen Auto",
          answerType: "single_choice",
          beobachtungsperiode: "letzte 90 Tage",
          options: [
            { code: "0", label: "Nein oder fährt nicht" },
            { code: "1", label: "Ja" },
          ],
        },
      ],
    },
    {
      code: "H",
      title: "Kontinenz",
      items: [
        {
          code: "H1",
          order: 1,
          label: "Blasenkontinenz",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Kontinent — Vollständige Kontrolle. Benutzt keinen Katheter oder Hilfsmittel" },
            { code: "1", label: "Kontinent mit Katheter oder Stoma in den letzten 3 Tagen" },
            { code: "2", label: "Selten inkontinent — Nicht inkontinent in den letzten 3 Tagen, aber hatte schon Inkontinenzepisoden" },
            { code: "3", label: "Teilweise inkontinent — Aber nicht täglich" },
            { code: "4", label: "Häufig inkontinent — Täglich, aber mit Restkontrolle" },
            { code: "5", label: "Inkontinent — Keine Restkontrolle" },
            { code: "8", label: "Nicht aufgetreten — Keine Urinentleerungen in den letzten 3 Tagen" },
          ],
        },
        {
          code: "H2",
          order: 2,
          label: "Hilfsmittel beim Urinauffangen (ohne Inkontinenzeinlagen)",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Keine" },
            { code: "1", label: "Kondomkatheter" },
            { code: "2", label: "Urindauerkatheter" },
            { code: "3", label: "Zystostomie, Nephrostomie, Ureterostomie" },
          ],
        },
        {
          code: "H3",
          order: 3,
          label: "Darmkontinenz",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Kontinent — Vollständige Kontrolle. Benutzt kein Stoma oder Hilfsmittel" },
            { code: "1", label: "Kontinent mit Stoma — Kontrolliert mit Stoma in den letzten 3 Tagen" },
            { code: "2", label: "Selten inkontinent — Nicht inkontinent in den letzten 3 Tagen, aber hatte schon Inkontinenzepisoden" },
            { code: "3", label: "Teilweise inkontinent — Aber nicht täglich" },
            { code: "4", label: "Häufig inkontinent — Täglich, aber mit Restkontrolle" },
            { code: "5", label: "Inkontinent — Keine Restkontrolle" },
            { code: "8", label: "Nicht aufgetreten — Keine Darmentleerung in den letzten 3 Tagen" },
          ],
        },
        {
          code: "H4",
          order: 4,
          label: "Inkontinenzeinlagen",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Nein" },
            { code: "1", label: "Ja" },
          ],
        },
      ],
    },
    {
      code: "I",
      title: "Medizinische Diagnosen",
      items: [
        {
          code: "I1",
          order: 1,
          label: "Sind schriftliche medizinische Diagnosen bekannt? [länderspezifisch]",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Nein" },
            { code: "1", label: "Ja" },
          ],
          dependencies: [
            { triggerValue: "0", action: "skip_items", target: "I2a-I2u", description: "Wenn Antwort Nein, I2 a-u nicht ausfüllen." },
          ],
        },
        {
          code: "I2",
          order: 2,
          label: "Medizinische Diagnosen",
          answerType: "composite",
          options: [
            { code: "0", label: "Diagnose nicht vorhanden" },
            { code: "1", label: "Hauptdiagnose, Grund der jetzigen Behandlung" },
            { code: "2", label: "Diagnose vorhanden, aktive Behandlung" },
            { code: "3", label: "Diagnose vorhanden, unter Beobachtung, aber keine aktive Behandlung" },
          ],
          subItems: [
            {
              code: "I2a",
              groupHeading: "Muskuloskelettale Erkrankungen",
              label: "Hüftfraktur in den letzten 30 Tagen",
              detail: "oder seit der letzten Beurteilung, wenn sie weniger als 30 Tage zurückliegt",
              answerType: "single_choice",
            },
            {
              code: "I2b",
              label: "Andere Frakturen in den letzten 30 Tagen",
              detail: "oder seit der letzten Beurteilung, wenn sie weniger als 30 Tage zurückliegt",
              answerType: "single_choice",
            },
            {
              code: "I2c",
              groupHeading: "Neurologische Erkrankungen",
              label: "Alzheimer-Krankheit",
              answerType: "single_choice",
            },
            {
              code: "I2d",
              label: "Andere demenzielle Erkrankung als Alzheimer",
              answerType: "single_choice",
            },
            {
              code: "I2e",
              label: "Hemiplegie",
              answerType: "single_choice",
            },
            {
              code: "I2f",
              label: "Multiple Sklerose",
              answerType: "single_choice",
            },
            {
              code: "I2g",
              label: "Paraplegie",
              answerType: "single_choice",
            },
            {
              code: "I2h",
              label: "Parkinson",
              answerType: "single_choice",
            },
            {
              code: "I2i",
              label: "Tetraplegie",
              answerType: "single_choice",
            },
            {
              code: "I2j",
              label: "Zerebrovaskulärer Insult (CVI)",
              answerType: "single_choice",
            },
            {
              code: "I2k",
              groupHeading: "Herz- / Lungenerkrankungen",
              label: "Koronare Herzerkrankung (KHK)",
              answerType: "single_choice",
            },
            {
              code: "I2l",
              label: "Chronisch obstruktive Pneumopathie (COPD)",
              answerType: "single_choice",
            },
            {
              code: "I2m",
              label: "Herzinsuffizienz",
              answerType: "single_choice",
            },
            {
              code: "I2n",
              groupHeading: "Psychiatrische Erkrankungen",
              label: "Angstzustände",
              answerType: "single_choice",
            },
            {
              code: "I2o",
              label: "Bipolare Störungen",
              answerType: "single_choice",
            },
            {
              code: "I2p",
              label: "Depression",
              answerType: "single_choice",
            },
            {
              code: "I2q",
              label: "Schizophrenie",
              answerType: "single_choice",
            },
            {
              code: "I2r",
              groupHeading: "Infektionen",
              label: "Pneumonie",
              answerType: "single_choice",
            },
            {
              code: "I2s",
              label: "Harnwegsinfektion in den letzten 30 Tagen",
              answerType: "single_choice",
            },
            {
              code: "I2t",
              groupHeading: "Andere Erkrankungen",
              label: "Krebserkrankung",
              answerType: "single_choice",
            },
            {
              code: "I2u",
              label: "Diabetes mellitus",
              answerType: "single_choice",
            },
          ],
        },
        {
          code: "I3",
          order: 3,
          label: "Andere medizinische Diagnosen",
          footnote: "[Anmerkung: Fügen Sie für weitere Diagnosen zusätzliche Linien ein]",
          answerType: "composite",
          repeatRows: 6,
          options: [
            { code: "1", label: "Hauptdiagnose, Grund der jetzigen Behandlung" },
            { code: "2", label: "Diagnose vorhanden, aktive Behandlung" },
            { code: "3", label: "Diagnose vorhanden, unter Beobachtung, aber keine aktive Behandlung" },
          ],
          subItems: [
            {
              code: "I3.diagnose",
              label: "Diagnose",
              answerType: "text",
            },
            {
              code: "I3.code",
              label: "Code",
              answerType: "single_choice",
            },
            {
              code: "I3.icd",
              label: "ICD-10-CM Code",
              answerType: "text",
            },
          ],
        },
      ],
    },
    {
      code: "J",
      title: "Gesundheitszustand",
      items: [
        {
          code: "J1",
          order: 1,
          label: "Stürze",
          answerType: "composite",
          options: [
            { code: "0", label: "Kein Sturz" },
            { code: "1", label: "Ein Sturz" },
            { code: "2", label: "Zwei oder mehr Stürze" },
          ],
          subItems: [
            {
              code: "J1a",
              label: "In den letzten 30 Tagen",
              answerType: "single_choice",
            },
            {
              code: "J1b",
              label: "Vor 31–90 Tagen",
              answerType: "single_choice",
            },
            {
              code: "J1c",
              label: "Vor 91–180 Tagen",
              answerType: "single_choice",
            },
          ],
        },
        {
          code: "J2",
          order: 2,
          label: "Aktuelle Stürze, ein oder mehr Stürze in den letzten 3 Tagen [länderspezifisch]",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Nein" },
            { code: "1", label: "Ja" },
          ],
        },
        {
          code: "J3",
          order: 3,
          label: "Häufigkeit von Gesundheitsproblemen",
          instruction: "In den letzten 3 Tagen",
          answerType: "composite",
          options: [
            { code: "0", label: "Nicht vorhanden" },
            { code: "1", label: "Vorhanden, zeigten sich jedoch nicht in den letzten 3 Tagen" },
            { code: "2", label: "Zeigten sich an 1 Tag der letzten 3 Tage" },
            { code: "3", label: "Zeigten sich an 2 Tagen der letzten 3 Tage" },
            { code: "4", label: "Zeigten sich täglich in den letzten 3 Tagen" },
          ],
          subItems: [
            {
              code: "J3a",
              groupHeading: "Gleichgewicht",
              label: "Schwierigkeit oder nicht in der Lage, ohne Hilfe aufzustehen",
              answerType: "single_choice",
            },
            {
              code: "J3b",
              label: "Schwierigkeit oder nicht in der Lage, sich umzudrehen und im Stehen in die entgegengesetzte Richtung zu schauen",
              answerType: "single_choice",
            },
            {
              code: "J3c",
              label: "Schwindel, Schwindelanfall",
              answerType: "single_choice",
            },
            {
              code: "J3d",
              label: "Unsicherer Gang",
              answerType: "single_choice",
            },
            {
              code: "J3e",
              groupHeading: "Herz- oder Lungenfunktion",
              label: "Brustschmerz",
              answerType: "single_choice",
            },
            {
              code: "J3f",
              label: "Schwierigkeiten beim Abhusten der Atemwegssekrete",
              answerType: "single_choice",
            },
            {
              code: "J3g",
              groupHeading: "Psychiatrische Symptomatik",
              label: "Formale Denkstörung",
              detail: "z.B.: Assoziationsverlust, Blockierungen, Ideenflucht, tangentiales Denken, Ideenkreisen",
              answerType: "single_choice",
            },
            {
              code: "J3h",
              label: "Wahnvorstellungen",
              detail: "Fixe falsche Überzeugungen",
              answerType: "single_choice",
            },
            {
              code: "J3i",
              label: "Halluzinationen",
              detail: "Falsche Sinneswahrnehmung",
              answerType: "single_choice",
            },
            {
              code: "J3j",
              groupHeading: "Neurologische Erkrankung",
              label: "Aphasie",
              answerType: "single_choice",
            },
            {
              code: "J3k",
              groupHeading: "Magen- / Darmtrakt",
              label: "Reflux",
              detail: "Aufstossen sauren Mageninhalts in die Speiseröhre",
              answerType: "single_choice",
            },
            {
              code: "J3l",
              label: "Obstipation",
              detail: "Keine Darmentleerung in den vergangenen 3 Tagen oder harter Stuhlgang",
              answerType: "single_choice",
            },
            {
              code: "J3m",
              label: "Diarrhoe",
              answerType: "single_choice",
            },
            {
              code: "J3n",
              label: "Emesis",
              answerType: "single_choice",
            },
            {
              code: "J3o",
              groupHeading: "Schlafprobleme",
              label: "Einschlaf-, Durchschlafschwierigkeiten, zu frühes Erwachen, Ruhelosigkeit, nicht erholsamer Schlaf",
              answerType: "single_choice",
            },
            {
              code: "J3p",
              label: "Zu viel Schlaf",
              detail: "Übermässiger Schlaf, der das normale Funktionieren der Person beeinträchtigt",
              answerType: "single_choice",
            },
            {
              code: "J3q",
              groupHeading: "Andere",
              label: "Aspiration",
              answerType: "single_choice",
            },
            {
              code: "J3r",
              label: "Fieber",
              answerType: "single_choice",
            },
            {
              code: "J3s",
              label: "Hygiene",
              detail: "Ungewöhnlich schlechte Hygiene, ungepflegt",
              answerType: "single_choice",
            },
            {
              code: "J3t",
              label: "Periphere Ödeme",
              answerType: "single_choice",
            },
          ],
        },
        {
          code: "J4",
          order: 4,
          label: "Dyspnoe (Kurzatmigkeit)",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Nicht vorhanden" },
            { code: "1", label: "Nicht vorhanden in Ruhe, aber bei mittlerer Anstrengung vorhanden" },
            { code: "2", label: "Nicht vorhanden in Ruhe, aber bei alltäglicher, leichter Anstrengung vorhanden" },
            { code: "3", label: "In Ruhe vorhanden" },
          ],
        },
        {
          code: "J5",
          order: 5,
          label: "Fatigue",
          instruction: "Unfähigkeit, normale Alltagsaktivitäten auszuführen (IADLs, BADLs)",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Keine Müdigkeit" },
            { code: "1", label: "Leichte — Verminderte Energie, führt jedoch normale Alltagsaktivitäten aus" },
            { code: "2", label: "Mittlere — Wegen verminderter Energie nicht fähig, normale Alltagsaktivitäten zu Ende zu führen" },
            { code: "3", label: "Grosse — Wegen verminderter Energie UNFÄHIG, einige normale Alltagsaktivitäten zu beginnen" },
            { code: "4", label: "Unfähigkeit, jegliche normale Alltagsaktivität zu beginnen — Wegen verminderter Energie" },
          ],
        },
        {
          code: "J6",
          order: 6,
          label: "Schmerzen",
          instruction: "Fragen Sie die Person immer nach Häufigkeit, Intensität und Kontrolle der Schmerzen. Beobachten Sie die Person und fragen Sie andere Personen, die mit ihr in Kontakt stehen.",
          answerType: "composite",
          subItems: [
            {
              code: "J6a",
              label: "Häufigkeit, mit der Person über Schmerzen klagt oder Hinweise darauf zeigt",
              detail: "dazu zählen Grimassen, Zähne zusammen beissen, Jammern, zurückziehen wenn berührt oder andere non-verbalen Anzeichen von Schmerz",
              answerType: "single_choice",
              options: [
                { code: "0", label: "Keine Schmerzen" },
                { code: "1", label: "Vorhanden, zeigte sich jedoch nicht in den letzten 3 Tagen" },
                { code: "2", label: "Zeigte sich an 1 oder 2 Tagen in den letzten 3 Tagen" },
                { code: "3", label: "Zeigte sich täglich in den letzten 3 Tagen" },
              ],
            },
            {
              code: "J6b",
              label: "Intensität des grössten vorkommenden Schmerzes",
              answerType: "single_choice",
              options: [
                { code: "0", label: "Keine Schmerzen" },
                { code: "1", label: "Leichte Schmerzen" },
                { code: "2", label: "Mittlere Schmerzen" },
                { code: "3", label: "Starke Schmerzen" },
                { code: "4", label: "Perioden mit unerträglichem Schmerz" },
              ],
            },
            {
              code: "J6c",
              label: "Schmerzepisoden",
              answerType: "single_choice",
              options: [
                { code: "0", label: "Keine Schmerzen" },
                { code: "1", label: "Eine einzelne Schmerzepisode in den letzten 3 Tagen" },
                { code: "2", label: "Periodische Schmerzen in den letzten 3 Tagen" },
                { code: "3", label: "Konstante Schmerzen in den letzten 3 Tagen" },
              ],
            },
            {
              code: "J6d",
              label: "Schmerzdurchbruch",
              detail: "Hatte die Person in den LETZTEN 3 TAGEN plötzliche akute Schmerzen?",
              answerType: "single_choice",
              options: [
                { code: "0", label: "Nein" },
                { code: "1", label: "Ja" },
              ],
            },
            {
              code: "J6e",
              label: "Schmerzkontrolle",
              detail: "Aus Sicht der Person: Sind Schmerzen mit der therapeutischen Behandlung unter Kontrolle?",
              answerType: "single_choice",
              options: [
                { code: "0", label: "Schmerzen sind kein Thema" },
                { code: "1", label: "Schmerzen sind nicht kontrolliert, aber Intensität ist für die Person akzeptabel, so dass keine Behandlung oder Änderung der Behandlung erforderlich ist" },
                { code: "2", label: "Schmerzen sind durch Therapie ausreichend kontrolliert" },
                { code: "3", label: "Schmerzen sind kontrolliert, wenn Schmerztherapie befolgt, diese wird aber nicht immer befolgt" },
                { code: "4", label: "Schmerztherapie befolgt, aber Schmerzkontrolle ist nicht ausreichend" },
                { code: "5", label: "Keine Schmerztherapie vorhanden, Schmerzen sind nicht ausreichend kontrolliert" },
              ],
            },
          ],
        },
        {
          code: "J7",
          order: 7,
          label: "Instabiler Krankheitszustand",
          answerType: "composite",
          options: [
            { code: "0", label: "Nein" },
            { code: "1", label: "Ja" },
          ],
          subItems: [
            {
              code: "J7a",
              label: "Die Symptomatik oder Erkrankungen destabilisieren die kognitiven Fähigkeiten, BADL / IADL, Stimmungslage oder Verhalten",
              detail: "schwankend, prekär oder verschlechternd",
              answerType: "single_choice",
            },
            {
              code: "J7b",
              label: "Durchlebt eine akute Erkrankung, Krise, akute Verschlechterung der wiederkehrenden oder chronischen Probleme",
              answerType: "single_choice",
            },
            {
              code: "J7c",
              label: "Terminaler Krankheitszustand, Lebenserwartung von 6 Monaten oder weniger",
              answerType: "single_choice",
            },
          ],
        },
        {
          code: "J8",
          order: 8,
          label: "Selbstbeurteilung Gesundheit",
          instruction: "Frage: „Wie würden Sie Ihre Gesundheit im Allgemeinen beurteilen?“",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Ausgezeichnet" },
            { code: "1", label: "Gut" },
            { code: "2", label: "Mässig" },
            { code: "3", label: "Schlecht" },
            { code: "8", label: "Person gibt keine Antwort" },
          ],
        },
        {
          code: "J9",
          order: 9,
          label: "Tabak und Alkohol",
          answerType: "composite",
          subItems: [
            {
              code: "J9a",
              label: "Raucht täglich",
              answerType: "single_choice",
              options: [
                { code: "0", label: "Nein" },
                { code: "1", label: "Nicht in den letzten 3 Tagen, normalerweise aber täglich" },
                { code: "2", label: "Ja" },
              ],
            },
            {
              code: "J9b",
              label: "Alkohol",
              detail: "Höchste Anzahl von Getränken bei einem Anlass in den LETZTEN 14 TAGEN",
              beobachtungsperiode: "letzte 14 Tage",
              answerType: "single_choice",
              options: [
                { code: "0", label: "Keine" },
                { code: "1", label: "1" },
                { code: "2", label: "2–4" },
                { code: "3", label: "5 oder mehr" },
              ],
            },
          ],
        },
      ],
    },
    {
      code: "K",
      title: "Mund- und Ernährungsstatus",
      items: [
        {
          code: "K1",
          order: 1,
          label: "Grösse und Gewicht",
          answerType: "composite",
          subItems: [
            {
              code: "K1a",
              label: "Grösse (cm)",
              answerType: "number",
            },
            {
              code: "K1b",
              label: "Gewicht (kg)",
              answerType: "number",
            },
          ],
        },
        {
          code: "K2",
          order: 2,
          label: "Ernährungsprobleme",
          answerType: "composite",
          options: [
            { code: "0", label: "Nein" },
            { code: "1", label: "Ja" },
          ],
          subItems: [
            {
              code: "K2a",
              label: "Gewichtsverlust von 5% und mehr im letzten Monat oder 10% und mehr in den letzten 6 Monaten",
              answerType: "single_choice",
            },
            {
              code: "K2b",
              label: "Dehydratation",
              detail: "z.B. Haut und Schleimhaut trocken",
              answerType: "single_choice",
            },
            {
              code: "K2c",
              label: "Flüssigkeitsaufnahme weniger als 1000 ml / Tag",
              answerType: "single_choice",
            },
            {
              code: "K2d",
              label: "Flüssigkeitsverlust übersteigt die Flüssigkeitsaufnahme",
              answerType: "single_choice",
            },
          ],
        },
        {
          code: "K3",
          order: 3,
          label: "Ernährungsform",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Normal — Kann alle Formen von Nahrung schlucken" },
            { code: "1", label: "Veränderte Speisen für unabhängige Aufnahme erforderlich — z.B. nur flüssige Nahrung in Schlückchen, nimmt nur begrenzt feste Nahrung zu sich, die Ursache für die notwendige Veränderung der Speisen kann unbekannt sein" },
            { code: "2", label: "Braucht Spezialzubereitung um feste Speisen zu schlucken — z.B. gehackte / breiige Nahrung oder kann nur besondere Nahrung zu sich nehmen" },
            { code: "3", label: "Braucht Spezialzubereitung von flüssiger Nahrung — z.B. verdickte Flüssigkeiten" },
            { code: "4", label: "Kann nur pürierte Nahrung UND verdickte Flüssigkeit zu sich nehmen" },
            { code: "5", label: "Kombination von oraler und parenteraler oder Sondenernährung" },
            { code: "6", label: "Ausschliesslich nasogastrische Sondenernährung" },
            { code: "7", label: "Ausschliesslich abdominale Sondenernährung — z.B. PEG-Sonde" },
            { code: "8", label: "Ausschliesslich parenterale Ernährung, alle Formen — z.B. TPN (Total parenterale Ernährung)" },
            { code: "9", label: "Aktivität kam während der ganzen Periode nicht vor" },
          ],
        },
        {
          code: "K4",
          order: 4,
          label: "Mund- und Zahnstatus",
          answerType: "composite",
          options: [
            { code: "0", label: "Nein" },
            { code: "1", label: "Ja" },
          ],
          subItems: [
            {
              code: "K4a",
              label: "Trägt herausnehmbare Zahnprothese(n)",
              answerType: "single_choice",
            },
            {
              code: "K4b",
              label: "Hat abgebrochene, verfallene, lose oder anderweitig nicht intakte natürliche Zähne",
              answerType: "single_choice",
            },
            {
              code: "K4c",
              label: "Berichtet über Mundtrockenheit",
              answerType: "single_choice",
            },
            {
              code: "K4d",
              label: "Berichtet über Schwierigkeiten beim Kauen",
              answerType: "single_choice",
            },
          ],
        },
      ],
    },
    {
      code: "L",
      title: "Zustand der Haut",
      items: [
        {
          code: "L1",
          order: 1,
          label: "Stadium des schwerwiegendsten vorhandenen Dekubitus",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Kein Dekubitus vorhanden" },
            { code: "1", label: "Ständige Rötung der Haut" },
            { code: "2", label: "Teilweiser Verlust von Hautschichten" },
            { code: "3", label: "Tiefe Krater in der Haut" },
            { code: "4", label: "Vollständiger Verlust aller Hautschichten, Muskel und / oder Knochen und / oder Sehne sichtbar" },
            { code: "5", label: "Keine Einstufung möglich, z.B. Dominanz von grossflächigen Nekrosen" },
          ],
        },
        {
          code: "L2",
          order: 2,
          label: "Frühere Dekubiti",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Nein" },
            { code: "1", label: "Ja" },
          ],
        },
        {
          code: "L3",
          order: 3,
          label: "Sind andere Ulcera ausser Dekubitus vorhanden?",
          instruction: "z.B. Venöses oder arterielles Ulcus, diabetisches Fussulcus",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Nein" },
            { code: "1", label: "Ja" },
          ],
        },
        {
          code: "L4",
          order: 4,
          label: "Hautverletzungen",
          instruction: "z.B. Wunden, Verbrennungen 2. oder 3. Grades, Heilung chirurgischer Wunden",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Nein" },
            { code: "1", label: "Ja" },
          ],
        },
        {
          code: "L5",
          order: 5,
          label: "Hautrisse oder Schnittwunden, nicht chirurgischen Ursprungs",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Nein" },
            { code: "1", label: "Ja" },
          ],
        },
        {
          code: "L6",
          order: 6,
          label: "Andere Hautprobleme oder Hautveränderungen",
          instruction: "z.B. Ekzeme, Ausschläge, Intertrigo, Hämatome, Juckreiz, Parasiten",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Nein" },
            { code: "1", label: "Ja" },
          ],
        },
        {
          code: "L7",
          order: 7,
          label: "Fussprobleme",
          instruction: "Hallux valgus, Hühneraugen, Hammerzehen, Infektionen, Ulcera",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Keine Fussprobleme" },
            { code: "1", label: "Fussprobleme vorhanden, keine Beeinträchtigung beim Gehen" },
            { code: "2", label: "Fussprobleme beeinträchtigen das Gehen" },
            { code: "3", label: "Fussprobleme verhindern das Gehen" },
            { code: "4", label: "Fussprobleme, Person geht aber aufgrund anderer Probleme nicht" },
          ],
        },
      ],
    },
    {
      code: "M",
      title: "Medikamente",
      items: [
        {
          code: "M1",
          order: 1,
          label: "Totale Anzahl Medikamente",
          instruction: "Notieren Sie die Anzahl der Medikamente (verschrieben und nicht verschrieben), die in den letzten 3 Tagen effektiv verabreicht und eingenommen wurden.",
          answerType: "number",
        },
        {
          code: "M2",
          order: 2,
          label: "Medikamentenliste [länderspezifisch]",
          answerType: "single_choice",
          options: [
            { code: "1", label: "Aktuelle Medikamentenliste mit Dosierung vorhanden" },
            { code: "2", label: "Medikamentenliste mit Dosierung muss erstellt werden" },
            { code: "3", label: "Keine Medikamentenliste erforderlich" },
          ],
        },
        {
          code: "M3",
          order: 3,
          label: "Medikamentenallergien",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Keine bekannt" },
            { code: "1", label: "Bekannt" },
          ],
        },
        {
          code: "M4",
          order: 4,
          label: "Zuverlässigkeit der Medikamenteneinnahme gemäss ärztlicher Verschreibung (auch an Tagen ohne Spitex-Kontakt)",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Immer gewährleistet" },
            { code: "1", label: "Zu 80% oder mehr gewährleistet" },
            { code: "2", label: "Zu weniger als 80% gewährleistet, inkl. Beschaffungslücken" },
            { code: "8", label: "Keine Medikamente verschrieben" },
          ],
        },
      ],
    },
    {
      code: "N",
      title: "Behandlungen",
      items: [
        {
          code: "N1",
          order: 1,
          label: "Behandlungen oder Interventionen, die in den letzten 3 Tagen durchgeführt oder geplant wurden",
          answerType: "composite",
          options: [
            { code: "0", label: "Weder geplant NOCH durchgeführt" },
            { code: "1", label: "Geplant, aber nicht durchgeführt" },
            { code: "2", label: "1- bis 2-mal durchgeführt in den letzten 3 Tagen" },
            { code: "3", label: "Täglich in den letzten 3 Tagen" },
          ],
          subItems: [
            {
              code: "N1a",
              label: "Chemotherapie",
              answerType: "single_choice",
            },
            {
              code: "N1b",
              label: "Dialyse",
              answerType: "single_choice",
            },
            {
              code: "N1c",
              label: "Infektionskontrolle",
              detail: "z.B. Isolation, Quarantäne",
              answerType: "single_choice",
            },
            {
              code: "N1d",
              label: "Intravenöse Medikation",
              answerType: "single_choice",
            },
            {
              code: "N1e",
              label: "Sauerstofftherapie",
              answerType: "single_choice",
            },
            {
              code: "N1f",
              label: "Bestrahlung",
              answerType: "single_choice",
            },
            {
              code: "N1g",
              label: "Absaugen der Atemwege",
              answerType: "single_choice",
            },
            {
              code: "N1h",
              label: "Tracheo(s)tomiepflege",
              answerType: "single_choice",
            },
            {
              code: "N1i",
              label: "Transfusion",
              answerType: "single_choice",
            },
            {
              code: "N1j",
              label: "Assistierte Ventilation oder Beatmung",
              answerType: "single_choice",
            },
            {
              code: "N1k",
              label: "Wundbehandlung",
              answerType: "single_choice",
            },
            {
              code: "N1l",
              groupHeading: "Interventionen",
              label: "Blasentraining",
              answerType: "single_choice",
            },
            {
              code: "N1m",
              label: "Palliativpflege",
              answerType: "single_choice",
            },
            {
              code: "N1n",
              label: "Interventionen zur Umlagerung",
              answerType: "single_choice",
            },
          ],
        },
        {
          code: "N2",
          order: 2,
          label: "Formelles Hilfsnetz [länderspezifisch]",
          instruction: "Bestimmen welche Fachpersonen in den LETZTEN 7 TAGEN involviert waren (oder seit der letzten Einschätzung, wenn weniger als 7 Tage her)",
          answerType: "composite",
          beobachtungsperiode: "letzte 7 Tage",
          options: [
            { code: "0", label: "Nein" },
            { code: "1", label: "Ja" },
          ],
          subItems: [
            {
              code: "N2a",
              label: "FaGe, FaBe",
              answerType: "single_choice",
            },
            {
              code: "N2b",
              label: "Pflegefachperson",
              answerType: "single_choice",
            },
            {
              code: "N2c",
              label: "Pflegehilfe, Haushilfe",
              answerType: "single_choice",
            },
            {
              code: "N2d",
              label: "Mahlzeitendienst",
              answerType: "single_choice",
            },
            {
              code: "N2e",
              label: "Physiotherapie",
              answerType: "single_choice",
              attachmentIntro: "Falls Sie Kenntnis davon haben:",
              attachments: [
                { code: "N2eA", marker: "(A)", label: "Anzahl Tage in den letzten 7 Tagen", answerType: "number", unit: "Tage" },
                { code: "N2eB", marker: "(B)", label: "Gesamtminuten in den letzten 7 Tagen", answerType: "number", unit: "Minuten" },
              ],
            },
            {
              code: "N2f",
              label: "Ergotherapie",
              answerType: "single_choice",
              attachmentIntro: "Falls Sie Kenntnis davon haben:",
              attachments: [
                { code: "N2fA", marker: "(A)", label: "Anzahl Tage in den letzten 7 Tagen", answerType: "number", unit: "Tage" },
                { code: "N2fB", marker: "(B)", label: "Gesamtminuten in den letzten 7 Tagen", answerType: "number", unit: "Minuten" },
              ],
            },
            {
              code: "N2g",
              label: "Logopädie",
              answerType: "single_choice",
              attachmentIntro: "Falls Sie Kenntnis davon haben:",
              attachments: [
                { code: "N2gA", marker: "(A)", label: "Anzahl Tage in den letzten 7 Tagen", answerType: "number", unit: "Tage" },
                { code: "N2gB", marker: "(B)", label: "Gesamtminuten in den letzten 7 Tagen", answerType: "number", unit: "Minuten" },
              ],
            },
            {
              code: "N2h",
              label: "Psychotherapie (durch eine anerkannte Fachperson)",
              answerType: "single_choice",
            },
            {
              code: "N2i",
              label: "Sozialarbeiter/in",
              answerType: "single_choice",
            },
            {
              code: "N2j",
              label: "Andere Fachkräfte",
              answerType: "single_choice",
            },
          ],
        },
        {
          code: "N3",
          order: 3,
          label: "Spital-, Notfallaufenthalte, Arztbesuche",
          instruction: "Kodieren Sie die Anzahl der Aufenthalte in den LETZTEN 90 TAGEN oder seit letzter Beurteilung, falls weniger lange zurück",
          answerType: "composite",
          beobachtungsperiode: "letzte 90 Tage",
          subItems: [
            {
              code: "N3a",
              label: "Stationäre Hospitalisation (nicht psychiatrische) mit mindestens einer Übernachtung",
              answerType: "number",
            },
            {
              code: "N3b",
              label: "Konsultation auf einer Notfallstation (nur Aufenthalte ohne Übernachtung)",
              answerType: "number",
            },
            {
              code: "N3c",
              label: "Arztbesuche, ausgenommen beim Psychiater",
              answerType: "number",
            },
          ],
        },
        {
          code: "N4",
          order: 4,
          label: "Körperliche Fixierung",
          instruction: "Fixierung der Gliedmassen, Bettgitter, Fixierung am Stuhl, Stuhl, der das Aufstehen verhindert",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Nein" },
            { code: "1", label: "Ja" },
          ],
        },
      ],
    },
    {
      code: "O",
      title: "Verantwortungen, Verfügungen [Länderspezifisch]",
      items: [
        {
          code: "O1",
          order: 1,
          label: "Besteht eine Begleit-, Vertretungs-, Mitwirkungs- oder umfassende Beistandschaft?",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Nein" },
            { code: "1", label: "Ja" },
          ],
        },
        {
          code: "O2",
          order: 2,
          label: "Patientenverfügung / Vorsorgeauftrag",
          instruction: "z.B. Person will keine Hospitalisation",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Nein, oder nicht dokumentiert" },
            { code: "1", label: "Ja" },
          ],
        },
      ],
    },
    {
      code: "P",
      title: "Informelle Unterstützung",
      items: [
        {
          code: "P1",
          order: 1,
          label: "Gibt es informelle Helfer zur Unterstützung bei der Alltagsbewältigung (BADL oder IADL)? [länderspezifisch]",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Nein" },
            { code: "1", label: "Ja" },
          ],
        },
        {
          code: "P2",
          order: 2,
          label: "Anzahl informelle Helfer [länderspezifisch]",
          instruction: "(Anzahl eintragen, je nach Anzahl erscheinen n Formulare P2a bis P2d)",
          answerType: "composite",
          repeatable: true,
          subItems: [
            {
              code: "P2a",
              label: "Beziehung der Hilfsperson",
              answerType: "single_choice",
              options: [
                { code: "1", label: "Tochter / Sohn oder Schwiegertochter / Schwiegersohn" },
                { code: "2", label: "Ehefrau / Ehemann" },
                { code: "3", label: "Lebenspartner/in" },
                { code: "4", label: "Eltern / Erziehungsberechtigte/r" },
                { code: "5", label: "Geschwister" },
                { code: "6", label: "Andere Verwandte" },
                { code: "7", label: "Befreundete Person" },
                { code: "8", label: "Nachbar/in" },
              ],
            },
            {
              code: "P2b",
              label: "Informeller Helfer lebt im gleichen Haushalt",
              answerType: "single_choice",
              options: [
                { code: "0", label: "Nein" },
                { code: "1", label: "Ja, 6 Monate oder weniger" },
                { code: "2", label: "Ja, mehr als 6 Monate" },
              ],
            },
            {
              code: "P2c",
              label: "Unterstützung bei den IADL",
              answerType: "single_choice",
              options: [
                { code: "0", label: "Nein" },
                { code: "1", label: "Ja" },
              ],
            },
            {
              code: "P2d",
              label: "Unterstützung bei den BADL",
              answerType: "single_choice",
              options: [
                { code: "0", label: "Nein" },
                { code: "1", label: "Ja" },
              ],
            },
          ],
        },
        {
          code: "P3",
          order: 3,
          label: "Situation der Hilfspersonen",
          answerType: "composite",
          options: [
            { code: "0", label: "Nein, trifft nicht zu" },
            { code: "1", label: "Ja, trifft zu" },
          ],
          subItems: [
            {
              code: "P3a",
              label: "Informelle Helfer sind nicht mehr in der Lage, ihre Unterstützung fortzusetzen",
              detail: "z.B. Gesundheit der Hilfsperson erschwert die weitere Unterstützung",
              answerType: "single_choice",
            },
            {
              code: "P3b",
              label: "Informelle Helfer äussern sich belastet, wütend oder deprimiert",
              answerType: "single_choice",
            },
            {
              code: "P3c",
              label: "Familienangehörige oder Freunde sind mit der Krankheit der Person überfordert",
              answerType: "single_choice",
            },
          ],
        },
        {
          code: "P4",
          order: 4,
          label: "Informelle Betreuungsstunden sowie aktive Überwachung in den letzten 3 Tagen",
          instruction: "Für IADL und BADL in den letzten 3 Tagen, Angabe der Gesamtstundenzahl für Hilfestellungen durch die gesamte Familie, Freunde und Nachbarn.",
          answerType: "number",
        },
        {
          code: "P5",
          order: 5,
          label: "Starke und unterstützende Beziehung zur Familie",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Nein" },
            { code: "1", label: "Ja" },
          ],
        },
      ],
    },
    {
      code: "Q",
      title: "Wohnumgebungsabklärung",
      items: [
        {
          code: "Q1",
          order: 1,
          label: "Wohnumgebung",
          instruction: "Notieren Sie alle Risiken für die Sicherheit des Wohnbereichs und alle Faktoren, die eine Benutzung der Wohnung erschweren (wenn Person zur Zeit im Krankenhaus ist, Beurteilung erst nach einer Besichtigung der Wohnung).",
          answerType: "composite",
          options: [
            { code: "0", label: "Nein" },
            { code: "1", label: "Ja" },
          ],
          subItems: [
            {
              code: "Q1a",
              label: "Baufälliger, vernachlässigter Zustand des Hauses / der Wohnung",
              detail: "z.B. gefährliche Unordnung; unzureichende Beleuchtung; Löcher im Fussboden, starke Verschmutzung, Ratten- oder Ungezieferbefall.",
              answerType: "single_choice",
            },
            {
              code: "Q1b",
              label: "Vernachlässigter Zustand",
              detail: "z.B. extrem schmutzig oder ein Befall durch Insekten oder Ungeziefer (z.B. Mäuse oder Ratten)",
              answerType: "single_choice",
            },
            {
              code: "Q1c",
              label: "Ungenügendes Heizen / Kühlen",
              detail: "Zu heiss im Sommer, zu kalt im Winter",
              answerType: "single_choice",
            },
            {
              code: "Q1d",
              label: "Sicherheitsrisiken",
              detail: "Angst vor Gewalt, ein Sicherheitsproblem wegen starken Verkehrs auf der Strasse. Die Person ist innerhalb oder im unmittelbaren Aussenbereich ihrer Wohnung durch Gewalt gefährdet (oder empfindet dies so).",
              answerType: "single_choice",
            },
            {
              code: "Q1e",
              label: "Eingeschränkter Zugang zu Haus, Wohnung oder Räumen",
              detail: "z.B. Schwierigkeit um aus oder ins Haus zu gelangen, Treppensteigen verunmöglicht, Schwierigkeiten zwischen den Räumen umherzugehen, fehlendes Geländer trotz Notwendigkeit",
              answerType: "single_choice",
            },
          ],
        },
        {
          code: "Q2",
          order: 2,
          label: "Lebt in einer behindertengerechten Wohnung",
          answerType: "single_choice",
          options: [
            { code: "0", label: "Nein" },
            { code: "1", label: "Ja" },
          ],
        },
        {
          code: "Q3",
          order: 3,
          label: "Wohnumfeld",
          answerType: "composite",
          options: [
            { code: "0", label: "Nein" },
            { code: "1", label: "Ja" },
          ],
          subItems: [
            {
              code: "Q3a",
              label: "Unterstützung im Notfall verfügbar",
              detail: "z.B. Telefon, Notrufsystem",
              answerType: "single_choice",
            },
            {
              code: "Q3b",
              label: "Lebensmittelgeschäft in unmittelbarer Nähe ohne Hilfe erreichbar",
              answerType: "single_choice",
            },
            {
              code: "Q3c",
              label: "Möglichkeit der Hauslieferung von Lebensmitteln",
              answerType: "single_choice",
            },
          ],
        },
        {
          code: "Q4",
          order: 4,
          label: "Finanzen",
          instruction: "Machte wegen geringer Finanzmittel in den letzten 30 Tagen Kompromisse bei der Anschaffung folgender Güter: adäquates Essen, Obdach, Kleider, verschriebene Medikamente, ausreichende Heizung / Kühlung der Wohnung, notwendige Gesundheitsversorgung",
          answerType: "single_choice",
          beobachtungsperiode: "letzte 30 Tage",
          options: [
            { code: "0", label: "Nein" },
            { code: "1", label: "Ja" },
          ],
        },
      ],
    },
    {
      code: "R",
      title: "Entlassungsaussichten und Allgemeiner Zustand",
      items: [
        {
          code: "R1",
          order: 1,
          label: "Zielerreichung (nur bei Reassessment)",
          instruction: "Wurden in den LETZTEN 90 TAGEN (oder seit letzter Beurteilung falls weniger lange zurück) eines oder mehrere Pflegeziele erreicht?",
          answerType: "single_choice",
          beobachtungsperiode: "letzte 90 Tage",
          options: [
            { code: "0", label: "Nein" },
            { code: "1", label: "Ja" },
          ],
        },
        {
          code: "R2",
          order: 2,
          label: "Signifikante Veränderung der Selbständigkeit",
          instruction: "Über alles gesehen: Hat sich die Selbständigkeit der Person in den LETZTEN 90 TAGEN (oder seit letzter Beurteilung falls weniger lange zurück) verändert?",
          answerType: "single_choice",
          beobachtungsperiode: "letzte 90 Tage",
          options: [
            { code: "0", label: "Verbessert" },
            { code: "1", label: "Keine Änderung" },
            { code: "2", label: "Verschlechtert" },
          ],
        },
      ],
    },
    {
      code: "S",
      title: "Assessment-Informationen",
      items: [
        {
          code: "S1",
          order: 1,
          label: "„Unterschrift“ der Personen, die mit dem Instrument interRAI HC Schweiz evaluiert haben",
          answerType: "text",
        },
        {
          code: "S2",
          order: 2,
          label: "„Unterschrift“ der zuständigen Person, die die Dokumentation interRAI HC Schweiz abschliesst",
          answerType: "composite",
          subItems: [
            {
              code: "S2a",
              label: "Unterschrift",
              answerType: "text",
            },
            {
              code: "S2b",
              label: "Datum",
              answerType: "date",
            },
          ],
        },
      ],
    },
    {
      code: "Z",
      title: "Entlassung",
      items: [
        {
          code: "Z1",
          order: 1,
          label: "Letzter Tag der Inanspruchnahme von Leistungen durch die Spitex",
          answerType: "date",
        },
        {
          code: "Z2",
          order: 2,
          label: "Entlassung nach",
          answerType: "single_choice",
          options: [
            { code: "1", label: "Privathaus / Eigentums- / Mietwohnung / gemietetes Zimmer" },
            { code: "2", label: "Wohnung mit integrierten Dienstleistungen" },
            { code: "3", label: "Einrichtung für Personen mit psychischen Problemen, z.B. Wohngruppen für Menschen mit psychischen Erkrankungen" },
            { code: "4", label: "Wohngemeinschaft für Personen mit körperlicher Behinderung" },
            { code: "5", label: "Einrichtung für Personen mit geistiger Behinderung" },
            { code: "6", label: "Psychiatrische Klinik oder Abteilung" },
            { code: "7", label: "Obdachlos (mit oder ohne Obdachlosenunterkunft)" },
            { code: "8", label: "Alters- und Pflegeheim" },
            { code: "9", label: "Rehabilitationsklinik / -abteilung" },
            { code: "10", label: "Hospiz / Palliativstation" },
            { code: "11", label: "Akutklinik / -abteilung" },
            { code: "12", label: "Justizvollzugsanstalt" },
            { code: "13", label: "Andere (z.B. eine andere Spitexorganisation):", freeText: true },
            { code: "14", label: "Verstorben" },
          ],
        },
      ],
    },
  ],
};

/**
 * Every field the assessor has to fill in.
 * A sub-item with answer columns counts once per column; the stored code is
 * the sub-item code followed by the lower-cased column code (G1a + A -> G1aa).
 * Attached fields count as their own entries.
 */
export function inputFieldCodes(): string[] {
  const out: string[] = [];
  for (const b of interraiHcSchweiz.bereiche) {
    for (const it of b.items) {
      if (!it.subItems?.length) { out.push(it.code); continue; }
      for (const si of it.subItems) {
        if (it.columns?.length) {
          for (const c of it.columns) out.push(si.code + c.code.toLowerCase());
        } else {
          out.push(si.code);
        }
        for (const a of si.attachments ?? []) out.push(a.code);
      }
    }
  }
  return out;
}

export const seedStats = (() => {
  let items = 0, subItems = 0, attachments = 0;
  for (const b of interraiHcSchweiz.bereiche) for (const it of b.items) {
    items++;
    for (const si of it.subItems ?? []) { subItems++; attachments += si.attachments?.length ?? 0; }
  }
  return { bereiche: interraiHcSchweiz.bereiche.length, items, subItems, attachments, inputFields: inputFieldCodes().length };
})();