/**
 * BVG-Eintrittsschwelle — zentrale Stammdaten.
 *
 * Schwellenwert nicht pro Mitarbeiter speichern, sondern zentral nachschlagen.
 * Wert wird jährlich angepasst (Bundesratsbeschluss).
 */

/** BVG-Eintrittsschwelle in CHF (auf 100% hochgerechneter Jahreslohn). Stand 2026. */
export const BVG_EINTRITTSSCHWELLE = 22680;

/**
 * Prüft ob der Jahreslohn (auf 100% hochgerechnet) über der BVG-Eintrittsschwelle liegt.
 * @param stundenlohn - Brutto-Stundenlohn in CHF
 * @param wochenStunden - Angenommene Wochenstunden (Default: 42 gemäss GAV Gesundheitswesen)
 */
export function istBvgObligatorisch(stundenlohn: number, wochenStunden: number = 42): boolean {
  const jahreslohn = stundenlohn * wochenStunden * 52;
  return jahreslohn >= BVG_EINTRITTSSCHWELLE;
}

/**
 * Berechnet den auf 100% hochgerechneten Jahreslohn.
 */
export function berechneJahreslohn(stundenlohn: number, wochenStunden: number = 42): number {
  return stundenlohn * wochenStunden * 52;
}
