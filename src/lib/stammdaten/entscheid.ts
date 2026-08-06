/**
 * Entscheid der Kasse über eine Kostengutsprache.
 *
 * Gespeichert wird der Code, nie die Beschriftung.
 *
 * Zu `stillschweigend_angenommen`: reagiert die Kasse innert vierzehn Tagen
 * nicht, gilt das eingereichte Blatt als angenommen. Das ist ein ABGELEITETER
 * Zustand — gespeichert bleibt `ausstehend`, bis ein echter Entscheid vorliegt.
 * Der Code steht hier trotzdem, weil eine Kasse ihn auch ausdrücklich
 * bestätigen kann.
 */
import { type SdaWert } from "./sda-wert";

export type EntscheidCode =
  | "ausstehend"
  | "stillschweigend_angenommen"
  | "bewilligt"
  | "gekuerzt"
  | "abgelehnt";

export const ENTSCHEID: SdaWert[] = [
  { code: "ausstehend", label: "Ausstehend" },
  { code: "stillschweigend_angenommen", label: "Stillschweigend angenommen" },
  { code: "bewilligt", label: "Bewilligt" },
  { code: "gekuerzt", label: "Gekürzt" },
  { code: "abgelehnt", label: "Abgelehnt" },
];

export const ENTSCHEID_OPTIONS = ENTSCHEID.map(e => ({ value: e.code, label: e.label }));

export function entscheidLabel(code: string): string {
  return ENTSCHEID.find(e => e.code === code)?.label ?? "";
}

/** Entscheide, die eine Kostengutsprache tatsächlich gültig machen. */
export function entscheidDeckt(code: EntscheidCode): boolean {
  return code === "bewilligt" || code === "gekuerzt" || code === "stillschweigend_angenommen";
}
