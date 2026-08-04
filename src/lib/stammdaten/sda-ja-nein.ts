/**
 * Ja/Nein mit den Codes des Standardkatalogs — 0 Nein, 1 Ja.
 *
 * EINE Liste für alle Katalogfelder mit dieser Kodierung: BB10b sowie die fünf
 * Einträge der Wohn-Vorgeschichte BB15a bis BB15e. Keine Kopien je Feld.
 *
 * Nicht zu verwechseln mit dem Ja/Nein-Umschalter der organisationseigenen
 * Felder (Lift, Treppen, Gewichtsverlust …); jener speichert "ja"/"nein" und
 * gehört nicht zum Katalog.
 */
import { type SdaWert } from "./sda-wert";

export const SDA_JA_NEIN: SdaWert[] = [
  { code: "0", label: "Nein" },
  { code: "1", label: "Ja" },
];

export const SDA_JA_NEIN_OPTIONS = SDA_JA_NEIN.map(w => ({ value: w.code, label: w.label }));

export function sdaJaNeinLabel(code: string): string {
  return SDA_JA_NEIN.find(w => w.code === code)?.label ?? "";
}
