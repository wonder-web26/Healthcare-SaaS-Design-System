/**
 * Staatsangehörigkeit — gemeinsame Werteliste für Patient und Angehörige.
 *
 * BB12 des Standardkatalogs kennt nur zwei Codes: 1 für Schweizer/in, 2 für
 * jedes andere Land. Die Auswahl bleibt trotzdem die volle Länderliste, weil
 * Heimatort, Aufenthaltsstatus und das SEM-Meldeformular das konkrete Land
 * brauchen. Beim Export ins SDA wird zu Code 2 die Beschriftung des Landes in
 * das Standardfeld „Andere, welche" geschrieben — deshalb kommt das Formular
 * ohne eigenes Freitextfeld aus.
 */
import { type PersonenFeldWert, optionen, label, sdaCode } from "./personenfeld";

/** Schlüssel des Schweizer Bürgerrechts — steuert Heimatort und Aufenthaltsstatus. */
export const SCHWEIZ = "schweiz";

export const STAATSANGEHOERIGKEIT: PersonenFeldWert[] = [
  { schluessel: "schweiz", label: "Schweiz", sdaCode: "1" },
  { schluessel: "deutschland", label: "Deutschland", sdaCode: "2" },
  { schluessel: "frankreich", label: "Frankreich", sdaCode: "2" },
  { schluessel: "italien", label: "Italien", sdaCode: "2" },
  { schluessel: "oesterreich", label: "Österreich", sdaCode: "2" },
  { schluessel: "portugal", label: "Portugal", sdaCode: "2" },
  { schluessel: "spanien", label: "Spanien", sdaCode: "2" },
  { schluessel: "tuerkei", label: "Türkei", sdaCode: "2" },
  { schluessel: "andere", label: "Andere", sdaCode: "2" },
];

export const STAATSANGEHOERIGKEIT_OPTIONS = optionen(STAATSANGEHOERIGKEIT);
export const staatsangehoerigkeitLabel = (schluessel: string) => label(STAATSANGEHOERIGKEIT, schluessel);
export const staatsangehoerigkeitSdaCode = (schluessel: string) => sdaCode(STAATSANGEHOERIGKEIT, schluessel);

/** Schweizer Bürgerrecht — die Bedingung hinter Heimatort und Aufenthaltsstatus. */
export function istSchweiz(schluessel: string): boolean {
  return schluessel === SCHWEIZ;
}

/**
 * Was beim SDA-Export im Feld „Andere, welche" steht: bei Code 2 die
 * Beschriftung des Landes, sonst nichts. Der Export selbst wird erst später
 * gebaut; hier liegt nur die Ableitung.
 */
export function sdaAndereWelche(schluessel: string): string {
  return staatsangehoerigkeitSdaCode(schluessel) === "2" ? staatsangehoerigkeitLabel(schluessel) : "";
}
