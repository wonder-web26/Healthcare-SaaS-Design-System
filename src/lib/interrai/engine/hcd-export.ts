/**
 * HomeCareData (HCD) Export — STUB MODULE
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  DO NOT IMPLEMENT HCD EXPORT LOGIC HERE.                        ║
 * ║                                                                 ║
 * ║  The HCD format specification and field mapping arrive           ║
 * ║  EXCLUSIVELY with the official specification from Spitex        ║
 * ║  Schweiz as part of the interRAI HC licence/certification.      ║
 * ║                                                                 ║
 * ║  Do NOT reconstruct the export format from sample files, from   ║
 * ║  documentation fragments, or from any other source.             ║
 * ║                                                                 ║
 * ║  This stub defines the interface and returns a placeholder.     ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { MODUL_ZERTIFIZIERUNG } from "../../stammdaten/modul-zertifizierung";
import type { Assessment } from "../assessment";
import type { ScaleResult } from "./scales";
import type { CapResult } from "./caps";

// — Export result type ——————————————————————————————

export interface HcdExportResult {
  /** Whether the export was successful */
  success: boolean;
  /** The exported data as string (XML, JSON, or other format TBD) */
  data: string | null;
  /** Format identifier */
  format: string;
  /** Error message if not successful */
  fehler: string | null;
  /** Indicates this is a stub result */
  isPlaceholder: boolean;
}

// — Stub export ————————————————————————————————————

/**
 * Exports an assessment to HomeCareData format.
 *
 * STUB: Returns a placeholder. Real implementation will arrive
 * with the official specification.
 */
export function exportToHcd(
  _assessment: Assessment,
  _scales: ScaleResult[],
  _caps: CapResult[],
): HcdExportResult {
  if (MODUL_ZERTIFIZIERUNG.interraiCertified) {
    // When certified: real export goes here
  }

  return {
    success: false,
    data: null,
    format: "HCD_CH (not yet implemented)",
    fehler: "HCD-Export ist noch nicht implementiert. Das Exportformat kommt mit der offiziellen Spezifikation von Spitex Schweiz.",
    isPlaceholder: true,
  };
}
