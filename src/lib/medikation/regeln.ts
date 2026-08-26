/**
 * Die Regeln des Medikationsplans.
 *
 * Sie stehen hier und nicht im Formular: eine Regel, die nur im Bildschirm
 * lebt, gilt nicht mehr, sobald jemand einen zweiten Weg zum Bestand baut.
 */
import { OHNE_TAGESDOSIERUNG } from "../stammdaten/medikationswerte";
import { istFreitextlich, type Medikation } from "./medikation";

/**
 * DEZIMALSCHREIBWEISE. Eine halbe Tablette ist „0.5", nicht „½" und nicht
 * „1/2". Die Umsetzungshilfe verlangt es ausdrücklich — Bruchzeichen sind
 * weder rechenbar noch über Systemgrenzen hinweg zuverlässig lesbar, und
 * „½" von „1/2" von „0,5" zu unterscheiden hiesse, drei Schreibweisen
 * derselben Zahl zu pflegen.
 *
 * Das Komma wird stillschweigend zum Punkt: es ist dieselbe Zahl, nur die
 * andere Landessprache.
 */
export function dosisNormalisieren(v: string): string {
  return v.trim().replace(",", ".");
}

const DOSIS_FEHLERTEXT =
  "Dosierungen werden dezimal geschrieben: eine halbe Tablette ist 0.5, nicht ½ und nicht 1/2.";

/** Leer ist erlaubt; sonst nur Ziffern mit höchstens einem Punkt. */
export function dosisFehler(v: string): boolean {
  const t = dosisNormalisieren(v);
  return t !== "" && !/^\d+(\.\d+)?$/.test(t);
}

/**
 * Was einer Medikation zum Sichern fehlt — leer heisst vollständig.
 *
 * Eine einzige Stelle für alle fünf Prüfungen, damit kein zweiter Weg zum
 * Bestand an einer davon vorbeikommt.
 */
export function medikationFehler(m: Medikation): string {
  if (istFreitextlich(m) && !m.produktename.trim() && !m.wirkstoff.trim()) {
    return "Ohne Katalogeintrag braucht es einen Produktenamen oder einen Wirkstoff. "
      + "Der Standard lässt offen, welchen von beiden — aber nicht, dass beide fehlen.";
  }
  if (!m.art) return "Bitte die Art wählen.";
  if (!m.beginn.trim()) return "Bitte den Beginn angeben.";
  if (m.art === "befristet" && !m.ende.trim()) {
    return "Eine befristete Medikation braucht ein Ende. Ohne Ende ist sie eine Dauermedikation, "
      + "und niemand weiss, wann sie hätte aufhören sollen.";
  }
  const dosen = [m.morgen, m.mittag, m.abend, m.nacht];
  if (!OHNE_TAGESDOSIERUNG.includes(m.art) && dosen.some(dosisFehler)) return DOSIS_FEHLERTEXT;
  return "";
}
