/**
 * SP-09: Doppelbezugs-Check für Kinderzulagen.
 *
 * Die Zulagenart (Kinderzulage/Ausbildungszulage) wird am Feld `zulagenart`
 * geführt (Kürzel K/W, siehe StepAngehoeriger — dort auch die Bezeichnungen).
 */

/** Optionen für den Doppelbezugs-Check */
export const DOPPELBEZUG_OPTIONS = [
  { value: "nein", label: "Nein" },
  { value: "ja", label: "Ja" },
  { value: "unbekannt", label: "Unbekannt" },
];

/** Prüft ob Doppelbezug die Auszahlung blockiert */
export function istDoppelbezugBlockiert(doppelbezug: string): boolean {
  return doppelbezug === "ja" || doppelbezug === "unbekannt";
}
