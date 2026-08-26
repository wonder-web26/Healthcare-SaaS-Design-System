/**
 * Gemeinsame Sortierhilfen der Listen.
 *
 * `leerZuletzt` lag fünfmal wortgleich in den Listen. Die Regel ist keine
 * Fachlogik, sondern eine Darstellungsentscheidung, die überall dieselbe ist:
 * nicht erhobene Werte gehören ans Ende, gleich in welcher Richtung sortiert
 * wird. Ein Rangwert am Ende der Skala würde beim Umkehren nach vorne wandern.
 */

/**
 * @param la    Ist der Wert links leer?
 * @param lb    Ist der Wert rechts leer?
 * @param f     Richtungsfaktor (+1 aufsteigend, −1 absteigend)
 * @param cmp   Vergleich, wenn beide einen Wert haben
 */
export function leerZuletzt(la: boolean, lb: boolean, f: number, cmp: () => number): number {
  if (la && lb) return 0;
  if (la) return 1;
  if (lb) return -1;
  return f * cmp();
}

/** Anzeigedatum TT.MM.JJJJ als sortierbarer Schlüssel JJJJMMTT. */
export function datumKey(d: string | null | undefined): string {
  if (!d) return "";
  const [dd, mm, yy] = d.split(".");
  return `${yy ?? ""}${mm ?? ""}${dd ?? ""}`;
}
