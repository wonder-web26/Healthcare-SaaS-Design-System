/**
 * Wartende Leistungsplanungsblätter — worauf welches Blatt wartet.
 *
 * Zwei der sieben Zustände warten auf jemanden ausserhalb des Hauses:
 * `an_arzt` und `an_kasse`. Dort entstehen die Verzögerungen, die niemand
 * sieht, solange man Patient für Patient nachschaut.
 *
 * Die Wartezeit wird nicht gespeichert, sondern aus dem Protokoll gerechnet:
 * aus dem Zeitpunkt des Wechsels IN den aktuellen Zustand. Ein zweiter,
 * gespeicherter Wert könnte davon abweichen.
 */
import type { KLVVerordnung } from "../../types/klinische-artefakte";
import { gegenwart } from "../gegenwart";
import { lpbAmZug, type AmZug } from "../stammdaten/lpb-status";

/**
 * Frist, ab der ein Warten auffällt.
 *
 * Bei der Kasse ist es die Frist des Verfahrens: bleibt die Antwort aus, gilt
 * das eingereichte Blatt als stillschweigend angenommen — das
 * Rückforderungsrisiko bleibt davon unberührt.
 *
 * Bei der Ärztin ist dieselbe Zahl eine Setzung ohne Rechtsgrundlage, ein
 * blosser Erfahrungswert.
 */
export const WARTEFRIST_TAGE = 14;

/**
 * Tage seit dem Wechsel in den aktuellen Zustand; null ohne lesbaren Eintrag.
 *
 * Bezug ist die fachliche Gegenwart. Wann ein Blatt zur Kasse ging, steht auf
 * der Bedarfsmeldung und begründet die Wartezeit — es ist eine fachliche
 * Angabe, kein Bedienprotokoll. Ein Zustandswechsel zur Laufzeit stempelt
 * darum ebenfalls die Gegenwart; so entsteht keine negative Wartezeit.
 */
export function wartetSeitTagen(v: KLVVerordnung, heute: Date = gegenwart()): number | null {
  const letzter = [...v.statusProtokoll].reverse().find(e => e.status === v.status);
  if (!letzter) return null;
  const m = /^(\d{2})\.(\d{2})\.(\d{4})/.exec(letzter.zeitpunkt);
  if (!m) return null;
  const seit = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  const tage = Math.floor(
    (Date.UTC(heute.getFullYear(), heute.getMonth(), heute.getDate())
      - Date.UTC(seit.getFullYear(), seit.getMonth(), seit.getDate())) / 86400000);
  return tage >= 0 ? tage : null;
}

export interface WartendesBlatt {
  verordnung: KLVVerordnung;
  /** "arzt" oder "kasse" — nur diese beiden warten. */
  amZug: Exclude<AmZug, "spitex" | null>;
  tage: number;
  /** Wartet es länger als die Frist? */
  ueberfaellig: boolean;
}

/**
 * Alle Blätter, die bei einer Ärztin oder einer Kasse liegen — längste
 * Wartezeit zuerst.
 *
 * Ersetzte Fassungen kommen nicht vor: `ersetzt` ist kein wartender Zustand,
 * `lpbAmZug` gibt dafür null zurück. Blätter ohne lesbaren Protokolleintrag
 * bleiben aussen vor, statt mit einer geratenen Zahl zu erscheinen.
 */
export function wartendeBlaetter(alle: KLVVerordnung[], heute: Date = gegenwart()): WartendesBlatt[] {
  const aus: WartendesBlatt[] = [];
  for (const v of alle) {
    const amZug = lpbAmZug(v.status);
    if (amZug !== "arzt" && amZug !== "kasse") continue;
    const tage = wartetSeitTagen(v, heute);
    if (tage === null) continue;
    aus.push({ verordnung: v, amZug, tage, ueberfaellig: tage > WARTEFRIST_TAGE });
  }
  return aus.sort((a, b) => b.tage - a.tage);
}
