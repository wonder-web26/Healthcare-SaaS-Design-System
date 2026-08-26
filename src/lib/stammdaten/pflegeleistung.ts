/**
 * Pflegeleistungen nach KLV Art. 7 — Mehrfachauswahl (Multi-Pick).
 *
 * Welche Leistungskategorien die pflegende angehörige Person erbringt.
 * Bewusst nur B und C: A (Abklärung und Beratung) erbringt die Spitex, nicht
 * die angehörige Person. Werte als Code gespeichert (B/C), nicht das Label.
 */

export interface PflegeleistungDefinition {
  value: string;
  label: string;
  kurz: string;
}

export const PFLEGELEISTUNGEN: PflegeleistungDefinition[] = [
  { value: "B", kurz: "B", label: "B — Untersuchung und Behandlung" },
  { value: "C", kurz: "C", label: "C — Grundpflege" },
];

export const PFLEGELEISTUNG_OPTIONS = PFLEGELEISTUNGEN.map(p => ({ value: p.value, label: p.label }));

export const pflegeleistungLabel = (value: string) =>
  PFLEGELEISTUNGEN.find(p => p.value === value)?.label ?? value;
