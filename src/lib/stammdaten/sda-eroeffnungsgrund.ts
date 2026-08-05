/**
 * AA1 Eröffnungsgrund — Standardkatalog Spitex Schweiz (SDA/Entlassung).
 *
 * Hält fest, ob das Formular SDA für einen Eintritt eröffnet wurde oder wegen
 * eines Einsatzabbruchs. Code 1 ist laut Handbuch als Vorbelegung zu setzen —
 * die einzige Vorbelegung im Reiter Anmeldung.
 *
 * Code 2 hat Prozessfolgen: das SDA gilt trotz unvollständigem Bereich BB als
 * abgeschlossen. Die Vollständigkeitsprüfung des Patienten-Schritts kennt
 * diese Ausnahme. Das Formular Entlassung entfällt ebenfalls — das gehört zum
 * Fall-Objekt und ist noch nicht gebaut.
 */
import { type SdaWert } from "./sda-wert";

/** Vorbelegung gemäss Handbuch. */
export const EROEFFNUNGSGRUND_STANDARD = "1";

/**
 * Einsatzabbruch. Bei diesem Wert wird das SDA abgeschlossen, obwohl nicht
 * alle Items im Bereich BB kodiert sind; der Reiter Anmeldung bleibt
 * vollständig pflichtig.
 */
export const EROEFFNUNGSGRUND_EINSATZABBRUCH = "2";

export const SDA_EROEFFNUNGSGRUND: SdaWert[] = [
  { code: "1", label: "Eintritt in die Spitex-Organisation" },
  { code: "2", label: "Einsatzabbruch" },
];

export const SDA_EROEFFNUNGSGRUND_OPTIONS = SDA_EROEFFNUNGSGRUND.map(w => ({ value: w.code, label: w.label }));

export function sdaEroeffnungsgrundLabel(code: string): string {
  return SDA_EROEFFNUNGSGRUND.find(w => w.code === code)?.label ?? "";
}
