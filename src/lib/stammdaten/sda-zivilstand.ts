/**
 * BB4 Zivilstand — Standardkatalog Spitex Schweiz (SDA/Entlassung).
 *
 * Vier Werte gemäss Entscheid 4.8.2026; die bisherigen acht entfallen für den
 * Patienten. Regel des Handbuchs: eingetragene Partnerschaft zählt zu Code 2,
 * eine gleichgeschlechtliche Beziehung ohne eingetragene Partnerschaft zu Code 1.
 * Für einen unbekannten Zivilstand kennt der Katalog keinen Code — das Feld
 * bleibt dann leer.
 *
 * Bewusst getrennt von lib/stammdaten/zivilstand.ts: jene Liste gilt weiter für
 * den Angehörigen, wo Partner-Pflicht und Quellensteuer-Tarif an den bisherigen
 * Werten hängen.
 */
import { type SdaWert } from "./sda-wert";

export const SDA_ZIVILSTAND: SdaWert[] = [
  { code: "1", label: "Ledig" },
  { code: "2", label: "Verheiratet, eingetragene Partnerschaft" },
  { code: "3", label: "Verwitwet" },
  { code: "4", label: "Geschieden" },
];

/** Optionen für Auswahlfelder (value = Code). */
export const SDA_ZIVILSTAND_OPTIONS = SDA_ZIVILSTAND.map(w => ({ value: w.code, label: w.label }));

/** Beschriftung zu einem Code; leerer String, wenn nicht erhoben. */
export function sdaZivilstandLabel(code: string): string {
  return SDA_ZIVILSTAND.find(w => w.code === code)?.label ?? "";
}
