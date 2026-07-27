/**
 * Ferienanspruch — zentrale Stammdaten + Berechnungslogik.
 *
 * Eine Wahrheit: ferienanspruch_wochen (Dezimalzahl).
 * Alles andere (Zuschlag-%, Ferienstunden) wird live abgeleitet.
 */

/** Firmen-Default Ferienwochen (zentral pflegbar, kein Hardcode pro Mitarbeiter) */
export const FIRMEN_DEFAULT_FERIENWOCHEN = 5.0;

/**
 * Berechnet den Ferienzuschlag in Prozent (für Stundenlohn).
 * Formel: wochen / (52 − wochen), auf 2 Nachkommastellen.
 */
export function berechneFerienzuschlagProzent(wochen: number): number {
  if (wochen <= 0 || wochen >= 52) return 0;
  return Math.round((wochen / (52 - wochen)) * 10000) / 100;
}

/**
 * Berechnet das Ferienguthaben in Stunden (für Monatslohn).
 * Formel: wochen × vertragliche Wochenstunden.
 */
export function berechneFerienstunden(wochen: number, wochenStunden: number): number {
  return Math.round(wochen * wochenStunden * 100) / 100;
}

/**
 * Prüft gesetzliches Minimum (OR Art. 329a) — weiche Warnung.
 * @param wochen - Ferienanspruch in Wochen
 * @param alter - Alter in Jahren (aus Geburtsdatum)
 * @returns Warnungstext oder null
 */
export function pruefeFerienMinimum(wochen: number, alter: number): string | null {
  if (alter < 20 && wochen < 5.0) {
    return `Unter dem gesetzlichen Minimum: Mitarbeiter unter 20 Jahren haben Anspruch auf mindestens 5 Wochen Ferien (OR Art. 329a Abs. 1).`;
  }
  if (alter >= 20 && wochen < 4.0) {
    return `Unter dem gesetzlichen Minimum: Mitarbeiter ab 20 Jahren haben Anspruch auf mindestens 4 Wochen Ferien (OR Art. 329a Abs. 1).`;
  }
  return null;
}
