/**
 * BB16 Einschätzung der Situation — Standardkatalog Spitex Schweiz.
 *
 * Legt fest, welche Art von Pflege- und Betreuungsleistungen die Person zum
 * Zeitpunkt der Anmeldung voraussichtlich beanspruchen soll.
 *
 * Das Item hat eine TRIAGEFUNKTION: je nach Wert löst die Organisation einen
 * anderen Abklärungsprozess aus, und bei den Codes 5, 6 und 7 findet gar keine
 * interRAI-Abklärung statt. Diese Wirkung ist noch NICHT gebaut — `folge`
 * dient allein als Hilfetext unter dem Feld und verändert nichts.
 */
import { type SdaWert } from "./sda-wert";

export interface SdaSituation extends SdaWert {
  /** Welche Abklärung der Wert nach sich zieht — Information, keine Wirkung. */
  folge: string;
}

export const SDA_EINSCHAETZUNG_SITUATION: SdaSituation[] = [
  { code: "1", label: "Somatische Pflege- und Betreuungssituation", folge: "Bedarfsabklärung mit interRAI HC Schweiz" },
  { code: "2", label: "Psychiatrische Pflege- und Betreuungssituation", folge: "Bedarfsabklärung mit interRAI CMH Schweiz" },
  { code: "3", label: "Palliative Pflege- und Betreuungssituation", folge: "Bedarfsabklärung mit fachspezifischem Instrument" },
  { code: "4", label: "Pädiatrische Pflege- und Betreuungssituation", folge: "Bedarfsabklärung mit fachspezifischem Instrument" },
  { code: "5", label: "Isoliert-therapeutische Pflegesituation", folge: "kein interRAI — SDA vollständig, Leistungsplanungsblatt, beim Austritt Formular Entlassung" },
  { code: "6", label: "Vorübergehende Betreuungssituation (hauswirtschaftliche Leistungen)", folge: "kein interRAI — SDA plus hauswirtschaftliche Abklärung" },
  { code: "7", label: "Klientin lehnt eine umfassende Bedarfsabklärung ab", folge: "kein interRAI — SDA vollständig, Leistungsplanungsblatt, beim Austritt Formular Entlassung" },
];

export const SDA_EINSCHAETZUNG_SITUATION_OPTIONS = SDA_EINSCHAETZUNG_SITUATION.map(w => ({ value: w.code, label: w.label }));

export function sdaEinschaetzungLabel(code: string): string {
  return SDA_EINSCHAETZUNG_SITUATION.find(w => w.code === code)?.label ?? "";
}

/** Hilfetext zur gewählten Situation; leer, solange nichts gewählt ist. */
export function sdaEinschaetzungFolge(code: string): string {
  return SDA_EINSCHAETZUNG_SITUATION.find(w => w.code === code)?.folge ?? "";
}
