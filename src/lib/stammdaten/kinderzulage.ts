/**
 * SP-09: Doppelbezugs-Check für Kinderzulagen.
 *
 * Die Zulagenart (Kinderzulage/Ausbildungszulage/keine) wird nicht erfasst,
 * sondern aus Alter und Ausbildungsstand abgeleitet — siehe
 * lib/stammdaten/zulagenart. Hier geht es nur um den Doppelbezug.
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
