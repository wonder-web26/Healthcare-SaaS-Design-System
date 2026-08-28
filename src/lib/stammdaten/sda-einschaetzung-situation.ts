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
 * Route (Fall.route) im produktiven Schema: die Zuordnung des BB16-Codes zum
 * Abklärungsweg, eins zu eins, ohne Zusammenfassung. Dies ist die EINZIGE
 * Mapping-Quelle (kein zweites Mapping anlegen).
 *
 * 1 somatisch · 2 psychiatrisch · 3 palliativ · 4 pädiatrisch ·
 * 5 isoliert-therapeutisch · 6 vorübergehend hauswirtschaftlich ·
 * 7 Klientin lehnt eine umfassende Bedarfsabklärung ab.
 */
export type FallRoute =
  | "somatic"
  | "mental_health"
  | "palliative"
  | "paediatric"
  | "isolated_therapeutic"
  | "housekeeping"
  | "declined"
  | null;

const BB16_ROUTE: Record<string, Exclude<FallRoute, null>> = {
  "1": "somatic",
  "2": "mental_health",
  "3": "palliative",
  "4": "paediatric",
  "5": "isolated_therapeutic",
  "6": "housekeeping",
  "7": "declined",
};

/** BB16-Code → Route. Leerer/unbekannter Code → null (Triage steht aus). */
export function sdaRoute(code: string): FallRoute {
  return BB16_ROUTE[code] ?? null;
}

/**
 * Verlangt dieser BB16-Wert im Onboarding eine interRAI-Abklärung? Dünne
 * Ableitung aus `sdaRoute` (KEIN zweites Mapping) — erhält das bestehende
 * Onboarding-Verhalten: nur die Codes 5/6/7 (isoliert-therapeutisch,
 * hauswirtschaftlich, abgelehnt) verlangen keine; leer/unbekannt verlangt.
 */
export function sdaVerlangtInterrai(code: string): boolean {
  const r = sdaRoute(code);
  return r === null || (r !== "isolated_therapeutic" && r !== "housekeeping" && r !== "declined");
}
