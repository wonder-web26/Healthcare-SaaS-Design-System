/**
 * Inklusiv-Regeln für KLV-Leistungen.
 *
 * Definiert, welche Leistungsposition welche anderen Positionen einschliesst.
 * Eine enthaltene Position darf nicht zusätzlich als eigenständige Leistung
 * abgerechnet werden, wenn die Hauptleistung bereits erfasst ist.
 *
 * ⚠️ MOCK / MACHBARKEITSNACHWEIS
 * Diese Tabelle enthält eine kleine Auswahl realistischer Regeln für die Demo.
 * Die vollständige fachliche Regelbasis muss mit dem Pflegeteam / der
 * Abrechnungsstelle erarbeitet und hier ergänzt werden. Die Datenstruktur
 * und Erkennungslogik sind dafür vorbereitet — nur die Regeln selbst müssen
 * erweitert werden.
 *
 * Erkennung: rein regelbasiert (Tabellen-Abgleich), keine LLM-Inferenz.
 */

export interface InklusivRegel {
  /** KLV-Nummer der Hauptleistung (die andere einschliesst) */
  hauptNr: string;
  /** Kurzbezeichnung der Hauptleistung (für Anzeige im Hinweis) */
  hauptBezeichnung: string;
  /** KLV-Nummern der enthaltenen Leistungen */
  enthalteneNr: string[];
}

/**
 * Mock-Regeltabelle: erweiterbar.
 * Format: Hauptleistung → [enthaltene Leistungen]
 */
export const INKLUSIV_REGELN: InklusivRegel[] = [
  {
    hauptNr: "10101",
    hauptBezeichnung: "Ganzwäsche bettlägerige Klientin",
    enthalteneNr: ["10107", "10106", "10112"],
    // Ganzwäsche schliesst ein: Haare waschen, Rasur, Zahnpflege
  },
  {
    hauptNr: "10102",
    hauptBezeichnung: "Ganzwäsche in Bad, Dusche oder am Lavabo",
    enthalteneNr: ["10107", "10106", "10112"],
    // Ganzwäsche schliesst ein: Haare waschen, Rasur, Zahnpflege
  },
  {
    hauptNr: "10103",
    hauptBezeichnung: "Teilwäsche im Bett (inkl. Intimpflege)",
    enthalteneNr: ["10105"],
    // Teilwäsche im Bett schliesst Intimpflege ein
  },
  {
    hauptNr: "10104",
    hauptBezeichnung: "Teilwäsche am Lavabo (inkl. Intimpflege)",
    enthalteneNr: ["10105"],
    // Teilwäsche am Lavabo schliesst Intimpflege ein
  },
];

/**
 * Prüft ob eine Leistung in einer anderen enthaltenen ist,
 * basierend auf den aktuell erfassten Leistungsnummern.
 *
 * @returns null wenn keine Inklusiv-Beziehung besteht,
 *          oder die Regel mit Hauptleistungs-Info.
 */
export interface InklusivTreffer {
  hauptNr: string;
  hauptBezeichnung: string;
}

export function pruefeInklusiv(
  klvNummer: string,
  alleErfasstenNummern: string[],
): InklusivTreffer | null {
  for (const regel of INKLUSIV_REGELN) {
    // Ist diese Leistung in der enthaltenen-Liste einer Regel?
    if (regel.enthalteneNr.includes(klvNummer)) {
      // Und ist die Hauptleistung ebenfalls erfasst?
      if (alleErfasstenNummern.includes(regel.hauptNr)) {
        return {
          hauptNr: regel.hauptNr,
          hauptBezeichnung: regel.hauptBezeichnung,
        };
      }
    }
  }
  return null;
}
