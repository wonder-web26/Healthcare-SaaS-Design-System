/**
 * Spalte W (Wer) des Leistungsplanungsblatts — wer die Leistung erbringt.
 *
 * Quelle: Ergänzung zu den interRAI-Handbüchern, Version 1.3, Februar 2023,
 * Spitex Schweiz, Kapitel 4 Leistungsplanungsblatt. Dasselbe Blatt ist
 * Anhang 2a des Administrativvertrags mit den Versicherern.
 *
 * Das Handbuch sieht `S` als Standardeintrag der EDV-Version vor; er ist
 * jederzeit überschreibbar. Der Katalog kennt genau EINEN Wert je Position —
 * eine gemeinsam erbrachte Leistung lässt sich darin nicht ausdrücken.
 *
 * Gespeichert wird der Code, nie die Beschriftung.
 *
 * Dieser Lauf erfasst und zeigt die Angabe. Er wertet sie nicht aus:
 * Abrechenbarkeit, Mindestqualifikation und Leistungsbeschränkungen nach
 * Ziffer 1.2 des Administrativvertrags sind eigene Läufe.
 */
import { type SdaWert } from "./sda-wert";

export type KlvWerCode = "S" | "I" | "A" | "V";

/** Vorbelegung neuer Positionen laut Handbuch. */
export const KLV_WER_STANDARD: KlvWerCode = "S";

export const KLV_WER: SdaWert[] = [
  { code: "S", label: "Spitex" },
  { code: "I", label: "Informelles Netz" },
  { code: "A", label: "Andere Anbieter" },
  { code: "V", label: "Verweigerung" },
];

export const KLV_WER_OPTIONS = KLV_WER.map(w => ({ value: w.code, label: w.label }));

export function klvWerLabel(code: string): string {
  return KLV_WER.find(w => w.code === code)?.label ?? "";
}
