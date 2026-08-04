/**
 * AA1 Eröffnungsgrund — Standardkatalog Spitex Schweiz (SDA/Entlassung).
 *
 * Hält fest, ob das Formular SDA für einen Eintritt eröffnet wurde oder wegen
 * eines Einsatzabbruchs. Code 1 ist laut Handbuch als Vorbelegung zu setzen —
 * die einzige Vorbelegung im Reiter Anmeldung.
 *
 * Code 2 hat Prozessfolgen (SDA gilt trotz unvollständigem Bereich BB als
 * abgeschlossen, kein Formular Entlassung). Diese Wirkung ist noch nicht
 * gebaut; hier wird der Wert nur erhoben.
 */
import { type SdaWert } from "./sda-wert";

/** Vorbelegung gemäss Handbuch. */
export const EROEFFNUNGSGRUND_STANDARD = "1";

export const SDA_EROEFFNUNGSGRUND: SdaWert[] = [
  { code: "1", label: "Eintritt in die Spitex-Organisation" },
  { code: "2", label: "Einsatzabbruch" },
];

export const SDA_EROEFFNUNGSGRUND_OPTIONS = SDA_EROEFFNUNGSGRUND.map(w => ({ value: w.code, label: w.label }));

export function sdaEroeffnungsgrundLabel(code: string): string {
  return SDA_EROEFFNUNGSGRUND.find(w => w.code === code)?.label ?? "";
}
