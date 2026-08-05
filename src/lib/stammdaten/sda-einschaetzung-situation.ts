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
  { code: "2", label: "Psychiatrische Pflege- und Betreuungssituation", folge: "Bedarfsabklärung mit interRAI CMH Schweiz — im Prototyp nicht vorhanden, es wird interRAI HC verlangt" },
  { code: "3", label: "Palliative Pflege- und Betreuungssituation", folge: "Bedarfsabklärung mit fachspezifischem Instrument — im Prototyp nicht vorhanden, es wird interRAI HC verlangt" },
  { code: "4", label: "Pädiatrische Pflege- und Betreuungssituation", folge: "Bedarfsabklärung mit fachspezifischem Instrument — im Prototyp nicht vorhanden, es wird interRAI HC verlangt" },
  { code: "5", label: "Isoliert-therapeutische Pflegesituation", folge: "kein interRAI — SDA vollständig, Leistungsplanungsblatt, beim Austritt Formular Entlassung" },
  { code: "6", label: "Vorübergehende Betreuungssituation (hauswirtschaftliche Leistungen)", folge: "kein interRAI — SDA plus hauswirtschaftliche Abklärung; das Modul Hauswirtschaft gibt es im Prototyp nicht" },
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

/**
 * Triage nach BB16: Verlangt dieser Wert eine interRAI-Abklärung?
 *
 * Die Codes 5, 6 und 7 führen laut Standard zu KEINER Abklärung — isoliert-
 * therapeutisch, vorübergehend hauswirtschaftlich, oder die Person lehnt ab.
 * Bei ihnen wird sie nicht mehr verlangt: kein offener Prozessschritt, keine
 * Aufgabe, kein Fortschrittsanteil. Eine dennoch durchgeführte Abklärung
 * bleibt sichtbar und gültig.
 *
 * Die Codes 2, 3 und 4 verlangen laut Standard ANDERE Instrumente (interRAI
 * CMH Schweiz beziehungsweise fachspezifische). Die gibt es im Prototyp
 * nicht; sie werden deshalb wie Code 1 behandelt — eine Abklärung wird
 * verlangt. Sie hier wie 5 bis 7 zu behandeln hiesse, eine vom Standard
 * geforderte Abklärung entfallen zu lassen.
 *
 * Ein leerer Wert verlangt die Abklärung: solange BB16 nicht kodiert ist,
 * steht die Triage aus.
 */
export function sdaVerlangtInterrai(code: string): boolean {
  return code !== "5" && code !== "6" && code !== "7";
}
