/**
 * interRAI Clinical Assessment Protocols (CAPs) — STUB MODULE
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  DO NOT IMPLEMENT CAP TRIGGERING LOGIC HERE.                    ║
 * ║                                                                 ║
 * ║  The real triggering algorithms and risk stratification arrive   ║
 * ║  EXCLUSIVELY with the official specification from Spitex        ║
 * ║  Schweiz as part of the interRAI HC licence.                    ║
 * ║                                                                 ║
 * ║  Do NOT reconstruct CAP logic from the handbook, from sample    ║
 * ║  reports, from academic papers, or from any other source.       ║
 * ║                                                                 ║
 * ║  This stub defines the interface and returns placeholders.      ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { MODUL_ZERTIFIZIERUNG } from "../../stammdaten/modul-zertifizierung";
import type { Assessment } from "../assessment";
import type { ScaleResult } from "./scales";

// — CAP status (NOT a boolean) ——————————————————————

export type CapStatus =
  | "nicht_ausgeloest"
  | "ausgeloest"
  | "ausgeloest_niedriges_risiko"
  | "ausgeloest_mittleres_risiko"
  | "ausgeloest_verschlechterung_verhindern"
  | "ausgeloest_verbesserungspotenzial";

// — CAP result type ————————————————————————————————

export interface CapTriggerItem {
  /** Item code that contributed to triggering */
  itemCode: string;
  /** The answer value at the time of evaluation */
  wert: string | null;
}

export interface CapResult {
  /** CAP identifier (e.g. "ADL", "FALLS", "MOOD") */
  capCode: string;
  /** Human-readable name */
  name: string;
  /** Triggering status — multi-level, not boolean */
  status: CapStatus;
  /** Items that triggered (or would trigger) this CAP */
  triggerItems: CapTriggerItem[];
  /** Scale values that fed into the CAP evaluation */
  eingeflosseneSkalen: { scaleCode: string; wert: number | null }[];
  /** Free-text description of the CAP */
  beschreibung: string;
  /** Indicates this is a stub result */
  isPlaceholder: boolean;
}

// — Known CAPs (interface only) ————————————————————

/**
 * Official interRAI HC CAP registry — exactly 24 CAPs.
 * Names match the German-language Swiss instrument.
 */
const KNOWN_CAPS: { code: string; name: string }[] = [
  { code: "ADEQUATE_MEDICATION", name: "Adäquate Medikation" },
  { code: "BADL", name: "Aktivitäten des täglichen Lebens (BADL)" },
  { code: "BOWEL", name: "Darmprobleme" },
  { code: "DEHYDRATION", name: "Dehydratation" },
  { code: "PRESSURE_ULCER", name: "Dekubitus" },
  { code: "DELIRIUM", name: "Delir" },
  { code: "FEEDING_TUBE", name: "Ernährungssonde" },
  { code: "PHYSICAL_ACTIVITY", name: "Förderung körperlicher Aktivitäten" },
  { code: "CARDIO_RESPIRATORY", name: "Herz-Kreislauf- und Atemwegserkrankungen" },
  { code: "INFORMAL_SUPPORT", name: "Informelle Unterstützung" },
  { code: "IADL", name: "Instrumentelle Aktivitäten des täglichen Lebens (IADL)" },
  { code: "COMMUNICATION", name: "Kommunikation" },
  { code: "MALNUTRITION", name: "Mangelernährung" },
  { code: "ABUSIVE_RELATIONSHIP", name: "Missbräuchliche Beziehung" },
  { code: "HOME_ENVIRONMENT", name: "Optimierung der Wohnumgebung" },
  { code: "INSTITUTIONALIZATION_RISK", name: "Risiko der Institutionalisierung" },
  { code: "PAIN", name: "Schmerzen" },
  { code: "SOCIAL_RELATIONSHIPS", name: "Soziale Beziehungen" },
  { code: "MOOD", name: "Stimmungslage" },
  { code: "FALLS", name: "Stürze" },
  { code: "TOBACCO_ALCOHOL", name: "Tabak- und Alkoholkonsum" },
  { code: "URINARY_INCONTINENCE", name: "Urininkontinenz" },
  { code: "BEHAVIOUR", name: "Verhalten" },
  { code: "COGNITION_LOSS", name: "Verlust kognitiver Fähigkeiten" },
];

// — Stub computation ————————————————————————————————

/**
 * Evaluates all CAPs for an assessment.
 *
 * STUB: Returns all CAPs as "nicht_ausgeloest" placeholders.
 * Real implementation will arrive with the official specification.
 */
export function evaluateCaps(
  _assessment: Assessment,
  _scales: ScaleResult[],
): CapResult[] {
  if (MODUL_ZERTIFIZIERUNG.interraiCertified) {
    // When certified: real evaluation goes here
  }

  return KNOWN_CAPS.map(cap => ({
    capCode: cap.code,
    name: cap.name,
    status: "nicht_ausgeloest" as CapStatus,
    triggerItems: [],
    eingeflosseneSkalen: [],
    beschreibung: `${cap.name} — Auswertung noch nicht implementiert. Echte Triggering-Logik kommt mit der offiziellen Spezifikation von Spitex Schweiz.`,
    isPlaceholder: true,
  }));
}

/**
 * Evaluates a single CAP by code.
 *
 * STUB: Returns placeholder.
 */
export function evaluateCap(
  _assessment: Assessment,
  _scales: ScaleResult[],
  capCode: string,
): CapResult | null {
  const cap = KNOWN_CAPS.find(c => c.code === capCode);
  if (!cap) return null;
  return {
    capCode: cap.code,
    name: cap.name,
    status: "nicht_ausgeloest",
    triggerItems: [],
    eingeflosseneSkalen: [],
    beschreibung: `${cap.name} — Placeholder.`,
    isPlaceholder: true,
  };
}
