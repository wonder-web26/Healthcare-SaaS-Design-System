/**
 * Hilflosenentschädigung — Grad (leicht/mittel/schwer).
 *
 * Die Werteliste liegt ausschliesslich hier; keine Beschriftung als Literal
 * an einer Aufrufstelle. Der Grad wird nur erfasst, wenn die Ja-Nein-Frage
 * auf «ja» steht (administrativ, kein interRAI-/SDA-Item).
 */
export type HilflosenentschaedigungGrad = "leicht" | "mittel" | "schwer";

export const HILFLOSENENTSCHAEDIGUNG_GRAD_OPTIONS: { value: HilflosenentschaedigungGrad; label: string }[] = [
  { value: "leicht", label: "Leichten Grades" },
  { value: "mittel", label: "Mittleren Grades" },
  { value: "schwer", label: "Schweren Grades" },
];

export function hilflosenentschaedigungGradLabel(v: string | null | undefined): string {
  return HILFLOSENENTSCHAEDIGUNG_GRAD_OPTIONS.find(o => o.value === v)?.label ?? "";
}
