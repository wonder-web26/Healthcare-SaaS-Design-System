/**
 * BB11 Zeit seit dem letzten Spitalaufenthalt — Standardkatalog Spitex Schweiz.
 *
 * Ermittelt den letzten Spitalaufenthalt in den LETZTEN 90 TAGEN, ohne
 * Rehabilitation oder Heim. Die Periode wird vom Beginn der Bedarfsabklärung
 * zurückgerechnet. Deckungsgleich mit interRAI HC Item A13.
 *
 * Ersetzt den bisherigen Ja/Nein-Umschalter. „Ja" ist nicht auflösbar — es
 * verteilt sich auf die Codes 1 bis 5 und muss neu erhoben werden.
 */
import { type SdaWert } from "./sda-wert";

export const SDA_SPITALAUFENTHALT: SdaWert[] = [
  { code: "0", label: "Kein Spitalaufenthalt in den letzten 90 Tagen" },
  { code: "1", label: "Vor 31–90 Tagen" },
  { code: "2", label: "Vor 15–30 Tagen" },
  { code: "3", label: "Vor 8–14 Tagen" },
  { code: "4", label: "In den letzten 7 Tagen" },
  { code: "5", label: "Ist aktuell hospitalisiert" },
];

/** Optionen für Auswahlfelder (value = Code). */
export const SDA_SPITALAUFENTHALT_OPTIONS = SDA_SPITALAUFENTHALT.map(w => ({ value: w.code, label: w.label }));

/** Beschriftung zu einem Code; leerer String, wenn nicht erhoben. */
export function sdaSpitalaufenthaltLabel(code: string): string {
  return SDA_SPITALAUFENTHALT.find(w => w.code === code)?.label ?? "";
}
