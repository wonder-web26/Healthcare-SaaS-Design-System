/**
 * interRAI Outcome Scales — STUB MODULE
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  DO NOT IMPLEMENT SCALE CALCULATIONS HERE.                      ║
 * ║                                                                 ║
 * ║  The real algorithms (ADL-H, CPS, DRS, IADL, Pain, xFALLS,    ║
 * ║  and others) arrive EXCLUSIVELY with the official specification ║
 * ║  from Spitex Schweiz as part of the interRAI HC licence.        ║
 * ║                                                                 ║
 * ║  Do NOT reconstruct scale logic from the handbook, from sample  ║
 * ║  reports, from academic papers, or from any other source.       ║
 * ║                                                                 ║
 * ║  This stub exists to define the interface so that consuming     ║
 * ║  code can be written against a stable contract. Every function  ║
 * ║  returns a clearly labelled placeholder value.                   ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { MODUL_ZERTIFIZIERUNG } from "../../stammdaten/modul-zertifizierung";
import type { Assessment } from "../assessment";

// — Scale result type ————————————————————————————————

export interface ScaleResult {
  /** Scale identifier (e.g. "CPS", "ADL-H") */
  scaleCode: string;
  /** Human-readable name */
  name: string;
  /** Computed value — null while stub */
  wert: number | null;
  /** Maximum possible value — null while stub */
  maxWert: number | null;
  /** Whether higher is better or worse */
  richtung: "hoeher_schlechter" | "hoeher_besser" | null;
  /** Items that feed into this scale */
  inputItemCodes: string[];
  /** Indicates this is a stub result */
  isPlaceholder: boolean;
}

// — Known scales (interface only) ———————————————————
//
// INCOMPLETE: The interRAI HC instrument has more scales than the six
// listed below. The remaining scales must be added EXCLUSIVELY from the
// official Spitex Schweiz specification. Do NOT invent scale names or
// add scales from general knowledge, academic papers, or sample reports.

const KNOWN_SCALES: Omit<ScaleResult, "wert" | "maxWert" | "isPlaceholder">[] = [
  { scaleCode: "CPS", name: "Cognitive Performance Scale", richtung: "hoeher_schlechter", inputItemCodes: ["C1", "C2a", "C2b", "C2c", "D1", "G2j"] },
  { scaleCode: "ADL-H", name: "ADL Hierarchy Scale", richtung: "hoeher_schlechter", inputItemCodes: ["G2b", "G2e", "G2g", "G2j"] },
  { scaleCode: "IADL", name: "IADL Capacity Scale", richtung: "hoeher_schlechter", inputItemCodes: ["G1aa", "G1ba", "G1ca", "G1da", "G1ea", "G1fa", "G1ga", "G1ha"] },
  { scaleCode: "DRS", name: "Depression Rating Scale", richtung: "hoeher_schlechter", inputItemCodes: ["E1a", "E1b", "E1c", "E1d", "E1e", "E1f", "E1g"] },
  { scaleCode: "PAIN", name: "Pain Scale", richtung: "hoeher_schlechter", inputItemCodes: ["J6a", "J6b"] },
  { scaleCode: "xFALLS", name: "Falls Risk Scale", richtung: "hoeher_schlechter", inputItemCodes: ["J1a", "J1b", "G2e", "C1"] },
];

// — Stub computation ————————————————————————————————

/**
 * Computes all outcome scales for an assessment.
 *
 * STUB: Returns placeholder values. Real implementation will arrive
 * with the official Spitex Schweiz specification.
 */
export function computeScales(_assessment: Assessment): ScaleResult[] {
  if (MODUL_ZERTIFIZIERUNG.interraiCertified) {
    // When certified: real computation goes here
    // For now, still return placeholders
  }

  return KNOWN_SCALES.map(s => ({
    ...s,
    wert: null,
    maxWert: null,
    isPlaceholder: true,
  }));
}

/**
 * Computes a single scale by code.
 *
 * STUB: Returns placeholder.
 */
export function computeScale(_assessment: Assessment, scaleCode: string): ScaleResult | null {
  const template = KNOWN_SCALES.find(s => s.scaleCode === scaleCode);
  if (!template) return null;
  return { ...template, wert: null, maxWert: null, isPlaceholder: true };
}
