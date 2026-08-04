/**
 * BB12 Staatsangehörigkeit — Standardkatalog Spitex Schweiz (SDA/Entlassung).
 *
 * Zwei Werte. Bei Code 2 ist der Staat als Freitext anzugeben. Besitzt die
 * Person eine doppelte Staatsbürgerschaft und ist eine davon das Schweizer
 * Bürgerrecht, wird mit 1 kodiert; eine zweite Staatsangehörigkeit lässt sich
 * heute nicht erfassen.
 *
 * Bewusst getrennt von NATIONALITAETEN im Angehörigen-Formular: dort steuert
 * die Länderauswahl Heimatort, Aufenthaltsstatus und das SEM-Meldeformular.
 */
import { type SdaWert } from "./sda-wert";

export const SDA_STAATSANGEHOERIGKEIT: SdaWert[] = [
  { code: "1", label: "Schweizer/in" },
  { code: "2", label: "Andere, welche" },
];

/** Code, bei dem der Staat als Freitext zu erfassen ist. */
export const SDA_STAAT_ANDERE = "2";

/** Optionen für Auswahlfelder (value = Code). */
export const SDA_STAATSANGEHOERIGKEIT_OPTIONS = SDA_STAATSANGEHOERIGKEIT.map(w => ({ value: w.code, label: w.label }));

/** Beschriftung zu einem Code; leerer String, wenn nicht erhoben. */
export function sdaStaatsangehoerigkeitLabel(code: string): string {
  return SDA_STAATSANGEHOERIGKEIT.find(w => w.code === code)?.label ?? "";
}
