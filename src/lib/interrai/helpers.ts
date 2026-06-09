/**
 * InterRAI helper functions — derive display text, create item instances,
 * progressive disclosure logic.
 */
import type { InterRAIItem, AnnaKonfidenz, GespraechsBeleg, ItemStatus } from "../../types/klinische-artefakte";
import type { InterRAIItemDefinition } from "./types";

/** Derive the display text for the selected answer from antwortOptionen. */
export function getAntwortText(item: InterRAIItem): string {
  if (item.antwortWert === null || item.antwortWert === undefined) return "";
  const opt = item.antwortOptionen.find(o => o.wert === String(item.antwortWert));
  if (opt) return opt.bezeichnung;
  // Fallback for zahl/text/datum types
  return String(item.antwortWert);
}

/** Derive the short label for compact display. */
export function getAntwortKurzLabel(item: InterRAIItem): string {
  if (item.antwortWert === null || item.antwortWert === undefined) return "";
  const opt = item.antwortOptionen.find(o => o.wert === String(item.antwortWert));
  if (opt) return opt.kurzLabel ?? opt.bezeichnung;
  return String(item.antwortWert);
}

/** Progressive disclosure: should this item be expanded by default? */
export function shouldExpandByDefault(item: InterRAIItem): boolean {
  if (item.antwortWert === null) return true;
  if (item.annaKonfidenz === "niedrig") return true;
  if (item.status === "offen") return true;
  return false;
}

/** Create a new InterRAIItem instance from a catalog definition. */
export function createItemInstance(
  def: InterRAIItemDefinition,
  assessmentId: string,
  overrides?: Partial<InterRAIItem>,
): InterRAIItem {
  return {
    id: `item-${def.code}-${assessmentId}`,
    assessmentId,
    code: def.code,
    sektion: def.sektion,
    sektionName: def.sektionName,
    frageKurz: def.frageKurz,
    frageVoll: def.frageVoll,
    antwortTyp: def.antwortTyp,
    antwortOptionen: def.antwortOptionen.map(o => ({ ...o })),
    antwortWert: null,
    validiert: false,
    ausGespraech: false,
    gespraechsBeleg: null,
    annaKonfidenz: null,
    status: "offen" as ItemStatus,
    ...overrides,
  };
}

/** CSS custom property for confidence dot color. */
export function getKonfidenzColor(k: AnnaKonfidenz | null): string {
  switch (k) {
    case "hoch": return "var(--status-success)";
    case "mittel": return "var(--status-warning)";
    case "niedrig": return "var(--status-danger)";
    default: return "var(--text-tertiary)";
  }
}

/** Human-readable confidence label. */
export function getKonfidenzLabel(k: AnnaKonfidenz | null): string {
  switch (k) {
    case "hoch": return "Hoch";
    case "mittel": return "Mittel";
    case "niedrig": return "Niedrig";
    default: return "—";
  }
}

/** Mock confidence percentage for display. */
export function getKonfidenzProzent(k: AnnaKonfidenz | null): number | null {
  switch (k) {
    case "hoch": return 87;
    case "mittel": return 65;
    case "niedrig": return 42;
    default: return null;
  }
}
