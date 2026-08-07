/**
 * Zustände des Leistungsplanungsblatts.
 *
 * Der Ablauf einer Spitex: Blatt erstellen, intern kontrollieren, an die
 * Ärztin senden, unterzeichnet zurückerhalten, an die Kasse übermitteln,
 * Entscheid abwarten.
 *
 * Zwei der Zustände warten auf jemanden ausserhalb des Hauses — `an_arzt` und
 * `an_kasse`. Dort liegt der Nutzen der Kette: sie macht Wartezeit sichtbar.
 *
 * Der Zustand lebt am Dokument. Aufgabenlisten spiegeln ihn später, sie führen
 * ihn nicht.
 *
 * Gespeichert wird der Code, nie die Beschriftung.
 */
import { type SdaWert } from "./sda-wert";

export type LpbStatusCode =
  | "entwurf"
  | "kontrolliert"
  | "an_arzt"
  | "unterzeichnet"
  | "an_kasse"
  | "entscheid_erhalten"
  | "ersetzt";

/** Wer nach diesem Zustand am Zug ist. */
export type AmZug = "spitex" | "arzt" | "kasse" | null;

export interface LpbStatusDef extends SdaWert {
  amZug: AmZug;
}

/**
 * Die Kette in ihrer Reihenfolge. `ersetzt` steht bewusst NICHT darin: es wird
 * nie von Hand gesetzt, sondern nur beim Erstellen einer neuen Version.
 */
export const LPB_ABLAUF: LpbStatusDef[] = [
  { code: "entwurf", label: "Entwurf", amZug: "spitex" },
  { code: "kontrolliert", label: "Kontrolliert", amZug: "spitex" },
  { code: "an_arzt", label: "An Arzt gesendet", amZug: "arzt" },
  { code: "unterzeichnet", label: "Vom Arzt unterzeichnet", amZug: "spitex" },
  { code: "an_kasse", label: "An Kasse übermittelt", amZug: "kasse" },
  { code: "entscheid_erhalten", label: "Entscheid erhalten", amZug: "spitex" },
];

export const LPB_STATUS: LpbStatusDef[] = [
  ...LPB_ABLAUF,
  { code: "ersetzt", label: "Ersetzt", amZug: null },
];

export function lpbStatusLabel(code: string): string {
  return LPB_STATUS.find(s => s.code === code)?.label ?? "";
}

export function lpbAmZug(code: string): AmZug {
  return LPB_STATUS.find(s => s.code === code)?.amZug ?? null;
}

/** Position in der Kette; -1 für `ersetzt`, das ausserhalb steht. */
export function lpbRang(code: string): number {
  return LPB_ABLAUF.findIndex(s => s.code === code);
}

/**
 * Der nächste Zustand der Kette — oder null am Ende und bei `ersetzt`.
 * Es gibt bewusst keine Funktion für den vorherigen: rückwärts wird nicht
 * gewechselt.
 */
export function lpbNaechster(code: string): LpbStatusCode | null {
  const i = lpbRang(code);
  if (i < 0 || i >= LPB_ABLAUF.length - 1) return null;
  return LPB_ABLAUF[i + 1].code as LpbStatusCode;
}

/**
 * Ab „an Kasse übermittelt" ist das Blatt aus der Hand — es liegt bei der
 * Kasse und darf nicht mehr still geändert werden. Wer etwas ändern will,
 * erzeugt eine neue Version.
 */
export const LPB_SPERRE_AB: LpbStatusCode = "an_kasse";

export function lpbGesperrt(code: string): boolean {
  if (code === "ersetzt") return true;
  const i = lpbRang(code);
  return i >= 0 && i >= lpbRang(LPB_SPERRE_AB);
}

/**
 * Abbildung der früheren Wertemenge. Die alte Liste kannte acht Werte; zwei
 * davon beschreiben keinen Schritt der Kette, sondern das Ergebnis:
 * `abgelehnt` ist ein erhaltener Entscheid (ob positiv oder negativ, steht an
 * der Kostengutsprache), `abgelaufen` ist ein Blatt, das nicht mehr gilt.
 * Kein Datensatz trägt heute einen der beiden.
 */
export const LPB_STATUS_ALT: Record<string, LpbStatusCode> = {
  "entwurf": "entwurf",
  "kontrolliert": "kontrolliert",
  "beim-arzt": "an_arzt",
  "vom-arzt-zurueck": "unterzeichnet",
  "bei-krankenkasse": "an_kasse",
  "kostengutsprache-erhalten": "entscheid_erhalten",
  "abgelehnt": "entscheid_erhalten",
  "abgelaufen": "ersetzt",
};

/** Alten Wert auf den neuen abbilden; Unbekanntes bleibt Entwurf. */
export function lpbAusAlt(alt: string): LpbStatusCode {
  return LPB_STATUS_ALT[alt] ?? "entwurf";
}
