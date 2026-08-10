/**
 * Was ein Kontakt ist — Typ einer dritten Person.
 *
 * Gespeichert wird der Code, angezeigt die Beschriftung. Der Typ sagt, was
 * der Kontakt ist; was er für einen bestimmten Patienten ist, sagt die Rolle
 * an der Beziehung, und ein Merkmal wie „Notfallkontakt" sagt zusätzliches.
 *
 * Die Stelle gehört nicht hierher: „Regula Sommer, Sozialdienst Stadt
 * Zürich" ist eine Person vom Typ Sozialdienst mit der Zugehörigkeit
 * „Sozialdienst Stadt Zürich" — nicht umgekehrt.
 */
export interface Kontakttyp {
  code: string;
  label: string;
}

export const KONTAKTTYP: Kontakttyp[] = [
  { code: "arztpraxis", label: "Arztpraxis" },
  { code: "behoerde", label: "Behörde" },
  { code: "sozialdienst", label: "Sozialdienst" },
  { code: "privatperson", label: "Privatperson" },
];

export type KontakttypCode = "arztpraxis" | "behoerde" | "sozialdienst" | "privatperson";

export function kontakttypLabel(code: string): string {
  return KONTAKTTYP.find(t => t.code === code)?.label ?? code;
}

export const KONTAKTTYP_OPTIONS = KONTAKTTYP.map(t => ({ value: t.code, label: t.label }));
