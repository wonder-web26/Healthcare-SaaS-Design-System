/**
 * Anrede — gemeinsame Werteliste für Patient und Angehörige.
 *
 * Werte als Code gespeichert, nicht das Label (spätere Logik/Anschreiben hängt
 * daran). Schweizer Hochdeutsch.
 */

export interface AnredeDefinition {
  value: string;
  label: string;
}

export const ANREDEN: AnredeDefinition[] = [
  { value: "frau", label: "Frau" },
  { value: "herr", label: "Herr" },
  { value: "divers", label: "Divers" },
];

export const ANREDE_OPTIONS = ANREDEN.map(a => ({ value: a.value, label: a.label }));

export const anredeLabel = (value: string) =>
  ANREDEN.find(a => a.value === value)?.label ?? value;
