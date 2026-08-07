/**
 * Einsatz und erbrachte Leistung.
 *
 * Ein Einsatz hält fest, wer wann wie lange bei welchem Patienten war. Eine
 * erbrachte Leistung hält fest, welche Position des Leistungsplanungsblatts
 * dabei in welchem Umfang geleistet wurde.
 *
 * Der Urheber ist eine Mitarbeitende ODER eine angehörige Person. Beide Arten
 * müssen dasselbe Feld füllen können — die angehörige Person ist bei der
 * Spitex angestellt und erfasst täglich, die diplomierte Pflegefachperson
 * prüft wöchentlich.
 *
 * Zur Form des Urhebers: für angehörige Personen besteht ein Bestand mit
 * Kennungen (A-…), für Mitarbeitende bewusst keiner — Personaladministration
 * liegt ausserhalb des Produktumfangs, sie erscheinen überall als Name. Der
 * Urheber bildet genau das ab, statt ein Register zu erfinden.
 *
 * NICHT ERBRACHT IST EINE ANGABE, KEIN WEGLASSEN. Wer eine geplante Position
 * nicht erbringt, nennt den Grund — sonst ist beim Controlling nicht
 * unterscheidbar, ob sie vergessen wurde oder nicht nötig war.
 */
import type { EinsatzZustandCode, PruefzustandCode } from "../stammdaten/einsatz";

export type EinsatzUrheber =
  | { art: "mitarbeitende"; name: string }
  | { art: "angehoeriger"; kennung: string };

export interface ErbrachteLeistung {
  id: string;
  einsatzId: string;
  /** Verweis auf die Position des Blattes (LP-…). */
  positionId: string;
  minuten: number;
  erbracht: boolean;
  /** Pflicht, wenn nicht erbracht oder die Zeit abweicht. */
  grund: string;
}

export interface Einsatz {
  id: string;
  patientId: string;
  /** TT.MM.JJJJ */
  datum: string;
  /** HH:MM */
  von: string;
  bis: string;
  erbrachtDurch: EinsatzUrheber;
  zustand: EinsatzZustandCode;
  pruefzustand: PruefzustandCode;
  bemerkung: string;
  /** Gesetzt bei einem Nachtrag: Kennung des korrigierten Einsatzes. */
  korrigiert: string | null;
}

/**
 * Ein geprüfter Einsatz ist nicht mehr änderbar. Korrekturen erfolgen als
 * Nachtrag mit Verweis auf den Ursprung; beide bleiben sichtbar. Ein Einsatz
 * im Zustand `zu_pruefen` ist änderbar, einer mit Rückfrage ebenfalls — die
 * Rückfrage ist ja gerade die Aufforderung, ihn zu berichtigen.
 */
export function istUnveraenderbar(e: Einsatz): boolean {
  return e.pruefzustand === "geprueft";
}

/** Minuten eines Einsatzes aus seinen erbrachten Leistungen. */
export function einsatzMinuten(leistungen: ErbrachteLeistung[]): number {
  return leistungen.filter(l => l.erbracht).reduce((s, l) => s + l.minuten, 0);
}

/** Weicht der Einsatz vom Plan ab — nicht erbrachte Position oder Zeitgrund? */
export function hatAbweichung(leistungen: ErbrachteLeistung[]): boolean {
  return leistungen.some(l => !l.erbracht || l.grund.trim() !== "");
}

/* ── Wochenrechnung ────────────────────────────────────────────────────────── */

function ausAnzeigedatum(wert: string): Date | null {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec((wert ?? "").trim());
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function alsAnzeigedatum(d: Date): string {
  const zz = (n: number) => String(n).padStart(2, "0");
  return `${zz(d.getDate())}.${zz(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/** Montag der Woche, in der das Datum liegt. */
export function wochenbeginn(d: Date): Date {
  const k = new Date(d);
  const tag = (k.getDay() + 6) % 7; // Montag = 0
  k.setDate(k.getDate() - tag);
  k.setHours(0, 0, 0, 0);
  return k;
}

export const WOCHENTAGE = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export interface Wochentag {
  datum: string;
  kurz: string;
  einsaetze: Einsatz[];
  /** Erbrachte Minuten des Tages. */
  erbracht: number;
  /** Geplante Minuten des Tages aus dem Blatt. */
  geplant: number;
  /** Kein Einsatz, obwohl geplant — die Lücke. */
  luecke: boolean;
}

/** Die sieben Tage einer Woche mit ihren Einsätzen. */
export function wocheAufteilen(
  einsaetze: Einsatz[],
  leistungenVon: (einsatzId: string) => ErbrachteLeistung[],
  montag: Date,
  geplantProTag: number,
): Wochentag[] {
  const tage: Wochentag[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(montag);
    d.setDate(d.getDate() + i);
    const datum = alsAnzeigedatum(d);
    const desTages = einsaetze.filter(e => e.datum === datum);
    const erbracht = desTages
      .filter(e => e.zustand === "erbracht")
      .reduce((s, e) => s + einsatzMinuten(leistungenVon(e.id)), 0);
    tage.push({
      datum, kurz: WOCHENTAGE[i], einsaetze: desTages, erbracht,
      geplant: geplantProTag,
      // Lücke heisst: geplant, aber nichts erfasst. Ein Tag ohne Plan ist
      // keine Lücke, sondern schlicht ein Tag ohne Einsatz.
      luecke: geplantProTag > 0 && desTages.length === 0,
    });
  }
  return tage;
}

export { ausAnzeigedatum, alsAnzeigedatum };
