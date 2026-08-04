/**
 * BB10a Form des Zusammenlebens — Standardkatalog Spitex Schweiz.
 *
 * Erfasst, mit wem die Person zum Zeitpunkt der Bedarfsabklärung zusammenlebt.
 * Code 2 umfasst Ehepartnerin und Ehepartner, auch eingetragene Partnerschaft,
 * sowie Freundin und Freund.
 *
 * Massgebend ist die Situation für die Dauer der Abklärung; vorübergehende
 * Rahmenbedingungen zählen nicht — etwa wenn die Tochter nur bleibt, bis die
 * Spitex-Leistung angelaufen ist.
 *
 * Nicht zu verwechseln mit dem organisationseigenen Feld "Personen im
 * Haushalt": das ist eine Anzahl und beantwortet BB10a nicht. Beide Felder
 * erfassen verschiedene Sachverhalte und bestehen nebeneinander.
 */
import { type SdaWert } from "./sda-wert";

export const SDA_ZUSAMMENLEBEN: SdaWert[] = [
  { code: "1", label: "Alleine" },
  { code: "2", label: "Ausschliesslich mit Partner/in" },
  { code: "3", label: "Mit Partner/in und anderen (Kinder, Eltern, Freunde)" },
  { code: "4", label: "Mit Kindern, ohne Partner/in" },
  { code: "5", label: "Mit Eltern oder Erziehungsberechtigten (aber ohne Partner/in)" },
  { code: "6", label: "Mit Geschwistern (ohne Partner/in, Kinder, Eltern, Erziehungsberechtigte)" },
  { code: "7", label: "Mit anderen Verwandten (z.B. Tante, Onkel)" },
  { code: "8", label: "Mit einem oder mehreren Nicht-Verwandten" },
];

export const SDA_ZUSAMMENLEBEN_OPTIONS = SDA_ZUSAMMENLEBEN.map(w => ({ value: w.code, label: w.label }));

export function sdaZusammenlebenLabel(code: string): string {
  return SDA_ZUSAMMENLEBEN.find(w => w.code === code)?.label ?? "";
}
