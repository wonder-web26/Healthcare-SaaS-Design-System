/**
 * AA3 Anmeldende Institution — Standardkatalog Spitex Schweiz (SDA/Entlassung).
 *
 * Identifiziert, wer die Spitex-Organisation für Pflege- und
 * Betreuungsleistungen angefragt hat. Wird beim Erstkontakt erhoben, meist
 * telefonisch oder elektronisch.
 *
 * Bei Code 8 ist die Institution als Freitext zu erfassen. Die Angaben zur
 * tatsächlich anmeldenden Person ergänzen den Code, sie ersetzen ihn nicht.
 */
import { type SdaWert } from "./sda-wert";

/** Code, bei dem die Institution als Freitext zu erfassen ist. */
export const INSTITUTION_ANDERE = "8";

export const SDA_ANMELDENDE_INSTITUTION: SdaWert[] = [
  { code: "0", label: "Angehörige" },
  { code: "1", label: "Hausarzt, Hausärztin, oder anderer ambulanter ärztlicher Dienst" },
  { code: "2", label: "Spital, stationäre Einrichtung inkl. Psychiatrie" },
  { code: "3", label: "Rehabilitationsklinik" },
  { code: "4", label: "Alters- und Pflegeheim" },
  { code: "5", label: "Andere Spitexorganisation" },
  { code: "6", label: "Behörden (z.B. KESB, Sozialdienst)" },
  { code: "7", label: "Person selber" },
  { code: "8", label: "Andere" },
];

export const SDA_ANMELDENDE_INSTITUTION_OPTIONS = SDA_ANMELDENDE_INSTITUTION.map(w => ({ value: w.code, label: w.label }));

export function sdaAnmeldendeInstitutionLabel(code: string): string {
  return SDA_ANMELDENDE_INSTITUTION.find(w => w.code === code)?.label ?? "";
}
