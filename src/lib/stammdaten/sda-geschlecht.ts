/**
 * BB2 Geschlecht — Standardkatalog Spitex Schweiz (SDA/Entlassung).
 *
 * Gespeichert wird der CODE, nicht die Beschriftung. Die Beschriftung ist
 * Anzeige und wird aus dem Code abgeleitet.
 *
 * Wortlaut und Reihenfolge unverändert aus docs/standardkatalog-sda-entlassung.md.
 * Gilt für den Patienten. Der Angehörigen-Schritt folgt weiterhin seiner eigenen
 * Werteliste — dort hängen andere Regeln daran.
 */
import { type SdaWert } from "./sda-wert";

export const SDA_GESCHLECHT: SdaWert[] = [
  { code: "1", label: "Männlich" },
  { code: "2", label: "Weiblich" },
  { code: "3", label: "Andere" },
];

/** Optionen für Auswahlfelder (value = Code). */
export const SDA_GESCHLECHT_OPTIONS = SDA_GESCHLECHT.map(w => ({ value: w.code, label: w.label }));

/** Beschriftung zu einem Code; leerer String, wenn nicht erhoben. */
export function sdaGeschlechtLabel(code: string): string {
  return SDA_GESCHLECHT.find(w => w.code === code)?.label ?? "";
}
