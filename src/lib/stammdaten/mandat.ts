/**
 * Wertelisten des Mandats — der Abrechnungsbeziehung eines Patienten.
 *
 * Ein Mandat sagt, wer zahlt, nach welchem Gesetz, aus welchem Grund und in
 * welchem Zeitraum. Es ist NICHT der Onboarding-Fall; jener heisst weiterhin
 * Fall und liegt in lib/onboarding/faelle.ts.
 *
 * Gespeichert wird durchgehend der Code, nie die Beschriftung. Ein leerer Code
 * bedeutet „nicht erhoben".
 */
import { type SdaWert } from "./sda-wert";

/* ── Mandatsart: wer die Leistung trägt ────────────────────────────────────── */
export type MandatsartCode = "versichert" | "privat" | "gemeinde";

export const MANDATSART: SdaWert[] = [
  { code: "versichert", label: "Versichertenleistung" },
  { code: "privat", label: "Privatleistung" },
  { code: "gemeinde", label: "Gemeindeleistung" },
];

/* ── Gesetzesgrundlage ─────────────────────────────────────────────────────── */
export type GesetzesgrundlageCode =
  | "kvg_pflege" | "kvg_aup" | "uvg" | "ivg" | "mvg" | "privat";

export const GESETZESGRUNDLAGE: SdaWert[] = [
  { code: "kvg_pflege", label: "KVG Pflegeleistungen" },
  { code: "kvg_aup", label: "KVG Akut- und Übergangspflege" },
  { code: "uvg", label: "UVG" },
  { code: "ivg", label: "IVG" },
  { code: "mvg", label: "MVG" },
  { code: "privat", label: "Privat" },
];

/* ── Grund des Mandats ─────────────────────────────────────────────────────── */
export type MandatsgrundCode = "krankheit" | "unfall" | "geburtsgebrechen" | "praevention";

export const MANDATSGRUND: SdaWert[] = [
  { code: "krankheit", label: "Krankheit" },
  { code: "unfall", label: "Unfall" },
  { code: "geburtsgebrechen", label: "Geburtsgebrechen" },
  { code: "praevention", label: "Prävention" },
];

/* ── Auswahlfelder und Beschriftungen ──────────────────────────────────────── */
const alsOptionen = (liste: SdaWert[]) => liste.map(w => ({ value: w.code, label: w.label }));

export const MANDATSART_OPTIONS = alsOptionen(MANDATSART);
export const GESETZESGRUNDLAGE_OPTIONS = alsOptionen(GESETZESGRUNDLAGE);
export const MANDATSGRUND_OPTIONS = alsOptionen(MANDATSGRUND);

const beschriftung = (liste: SdaWert[]) => (code: string): string =>
  liste.find(w => w.code === code)?.label ?? "";

export const mandatsartLabel = beschriftung(MANDATSART);
export const gesetzesgrundlageLabel = beschriftung(GESETZESGRUNDLAGE);
export const mandatsgrundLabel = beschriftung(MANDATSGRUND);
