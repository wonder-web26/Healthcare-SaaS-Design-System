/**
 * Zivilstand — gemeinsame Werteliste für Patient und Angehörige.
 *
 * Fünf Einträge, vier SDA-Codes: BB4 des Standardkatalogs führt Verheiratet und
 * eingetragene Partnerschaft unter demselben Code 2 zusammen. Fachlich bleiben
 * sie getrennt wählbar, weil Partner-Pflicht, Quellensteuer-Tarif und die
 * Begründungstexte des Angehörigen-Schritts zwischen beiden unterscheiden.
 *
 * Aufgelöste Partnerschaft, Gerichtlich getrennt und Unbekannt sind entfallen:
 * der Katalog kennt für sie keinen Code, keine Regel stützte sich darauf und
 * kein Datensatz führte sie.
 */
import { type PersonenFeldWert, optionen, label, sdaCode } from "./personenfeld";

export const ZIVILSTAND: PersonenFeldWert[] = [
  { schluessel: "ledig", label: "Ledig", sdaCode: "1" },
  { schluessel: "verheiratet", label: "Verheiratet", sdaCode: "2" },
  { schluessel: "eingetragene_partnerschaft", label: "Eingetragene Partnerschaft", sdaCode: "2" },
  { schluessel: "verwitwet", label: "Verwitwet", sdaCode: "3" },
  { schluessel: "geschieden", label: "Geschieden", sdaCode: "4" },
];

export const ZIVILSTAND_OPTIONS = optionen(ZIVILSTAND);
export const zivilstandLabel = (schluessel: string) => label(ZIVILSTAND, schluessel);
export const zivilstandSdaCode = (schluessel: string) => sdaCode(ZIVILSTAND, schluessel);

/**
 * Der Ehe steuerlich gleichgestellt (DBG Art. 9 Abs. 1bis) — die Bedingung, die
 * Partner-Pflichtfelder, Quellensteuer-Tarif und Partner-Dokumente auslöst.
 * Eine Stelle, damit die Regel nicht an fünf Orten ausgeschrieben steht.
 */
export function istVerheiratetOderPartnerschaft(schluessel: string): boolean {
  return schluessel === "verheiratet" || schluessel === "eingetragene_partnerschaft";
}
