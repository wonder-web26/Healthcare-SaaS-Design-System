/**
 * Die zwei Regeln der Wunddokumentation.
 *
 * Beide sind fachlich begründet und stehen darum hier, nicht im Formular:
 * eine Regel, die nur im Bildschirm lebt, gilt nicht mehr, sobald jemand
 * einen zweiten Weg zum Bestand baut.
 */
import { DEKUBITUSKATEGORIE, KATEGORIE_OHNE_RANG } from "../stammdaten/wundwerte";

/** Summe der Gewebeanteile. */
export function anteileSumme(anteile: Record<string, number>): number {
  return Object.values(anteile).reduce((s, n) => s + (Number.isFinite(n) ? n : 0), 0);
}

/**
 * Die Gewebeanteile beschreiben denselben Wundgrund — zusammen ergeben sie
 * ihn ganz. Achtzig Prozent liessen offen, was mit dem Rest ist.
 */
export function anteileStimmen(anteile: Record<string, number>): boolean {
  return anteileSumme(anteile) === 100;
}

/** Rang in der Kategorienfolge; -1 für die beiden ausserhalb. */
function rang(code: string): number {
  if (KATEGORIE_OHNE_RANG.includes(code)) return -1;
  return DEKUBITUSKATEGORIE.findIndex(k => k.code === code);
}

export const KATEGORIE_RUECKSCHRITT_TEXT =
  "Eine Dekubituskategorie wird nicht zurückgesetzt. Sie beschreibt den tiefsten je erreichten "
  + "Gewebeverlust, nicht den heutigen Zustand — heilendes Gewebe ersetzt das verlorene nicht. "
  + "Halten Sie die Besserung stattdessen in der Wundheilungsphase der Beurteilung fest.";

/**
 * Darf von `alt` auf `neu` gewechselt werden?
 *
 * Nein, wenn die neue Kategorie niedriger ist als die bisherige. Aus
 * „nicht klassifizierbar" und „vermutete tiefe Gewebeschädigung" ist jeder
 * Wechsel erlaubt: sie sagen nicht „weniger", sondern „noch nicht beurteilbar".
 */
export function kategorieErlaubt(alt: string, neu: string): boolean {
  if (!alt || !neu || alt === neu) return true;
  if (KATEGORIE_OHNE_RANG.includes(alt)) return true;
  if (KATEGORIE_OHNE_RANG.includes(neu)) return true;
  return rang(neu) >= rang(alt);
}
