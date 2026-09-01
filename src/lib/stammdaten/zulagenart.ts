/**
 * Zulagenart eines Kindes — abgeleitet, nicht erfasst.
 *
 * Die Art der Familienzulage folgt aus Alter und Ausbildungsstand des Kindes;
 * sie wird nirgends gespeichert, sondern an genau dieser Stelle berechnet
 * (`zulagenart(...)`). Frühere Modelle trugen ein manuell gepflegtes Kürzel
 * (K/W) am Kind — das ist entfallen.
 *
 * Kinderzulage bis zur Vollendung des 16. Altersjahres; danach
 * Ausbildungszulage nur bei laufender Ausbildung, längstens bis zur Vollendung
 * des 25. Altersjahres.
 */
import { GEGENWART_ISO } from "../gegenwart";
import { anzeigeZuIso, isoZuDate } from "../datum";

export type Zulagenart = "kinderzulage" | "ausbildungszulage" | "keine";

/**
 * Altersgrenzen der CH-Familienzulagen — VORLÄUFIG.
 *
 * Die genauen Grenzen (und Sonderfälle, siehe unten) sind fachlich noch durch
 * die Lohnstelle / Person B zu bestätigen. Sie stehen bewusst nur hier, damit
 * eine Korrektur an einer Stelle greift.
 *
 * Offener Sonderfall (NICHT abgebildet): bei erwerbsunfähigen Kindern läuft die
 * Kinderzulage bis zur Vollendung des 20. Altersjahres weiter. Solange das
 * Modell keine Erwerbsunfähigkeit trägt, bleibt dieser Fall unberücksichtigt.
 */
export const KINDERZULAGE_BIS_ALTER = 16;
export const AUSBILDUNGSZULAGE_BIS_ALTER = 25;

/** Alter, ab dem die Ausbildungsfrage überhaupt gestellt wird. */
export const AUSBILDUNGSFRAGE_AB_ALTER = KINDERZULAGE_BIS_ALTER;

/** Geburtsdatum (Anzeige TT.MM.JJJJ oder ISO JJJJ-MM-TT) → Date | null. */
function parseGeburt(geburtsdatum: string): Date | null {
  if (!geburtsdatum) return null;
  const iso = geburtsdatum.includes(".") ? anzeigeZuIso(geburtsdatum) : geburtsdatum;
  return isoZuDate(iso);
}

/** Vollendete Lebensjahre am Stichtag; null ohne gültiges Geburtsdatum. */
export function alterInJahren(geburtsdatum: string, stichtag: string = GEGENWART_ISO): number | null {
  const geb = parseGeburt(geburtsdatum);
  const stag = isoZuDate(stichtag);
  if (!geb || !stag) return null;
  let jahre = stag.getFullYear() - geb.getFullYear();
  const monatDiff = stag.getMonth() - geb.getMonth();
  if (monatDiff < 0 || (monatDiff === 0 && stag.getDate() < geb.getDate())) jahre--;
  return jahre;
}

/** Vollendete Lebensmonate am Stichtag — nur für die Kleinkind-Anzeige. */
function monateInsgesamt(geb: Date, stag: Date): number {
  let monate = (stag.getFullYear() - geb.getFullYear()) * 12 + (stag.getMonth() - geb.getMonth());
  if (stag.getDate() < geb.getDate()) monate--;
  return Math.max(0, monate);
}

/**
 * Altersangabe für die Kartenkopfzeile: Jahre; unter einem Jahr in Monaten;
 * leerer String, solange kein Geburtsdatum erfasst ist.
 */
export function alterAnzeige(geburtsdatum: string, stichtag: string = GEGENWART_ISO): string {
  const geb = parseGeburt(geburtsdatum);
  const stag = isoZuDate(stichtag);
  if (!geb || !stag) return "";
  const jahre = alterInJahren(geburtsdatum, stichtag);
  if (jahre === null) return "";
  if (jahre < 1) {
    const monate = monateInsgesamt(geb, stag);
    return monate === 1 ? "1 Monat" : `${monate} Monate`;
  }
  return jahre === 1 ? "1 Jahr" : `${jahre} Jahre`;
}

/**
 * Abgeleitete Zulagenart eines Kindes.
 *
 * - unter 16 Jahren → Kinderzulage
 * - 16 bis 25 Jahre und in Ausbildung → Ausbildungszulage
 * - 16 bis 25 Jahre und nicht (oder unbeantwortet) in Ausbildung → keine
 * - über 25 Jahre → keine
 * - ohne Geburtsdatum → keine
 */
export function zulagenart(
  geburtsdatum: string,
  inAusbildung: boolean | null,
  stichtag: string = GEGENWART_ISO,
): Zulagenart {
  const alter = alterInJahren(geburtsdatum, stichtag);
  if (alter === null) return "keine";
  if (alter < KINDERZULAGE_BIS_ALTER) return "kinderzulage";
  if (alter <= AUSBILDUNGSZULAGE_BIS_ALTER && inAusbildung === true) return "ausbildungszulage";
  return "keine";
}

/** Einzige Quelle der Anzeigebezeichnung. */
export const ZULAGENART_LABEL: Record<Zulagenart, string> = {
  kinderzulage: "Kinderzulage",
  ausbildungszulage: "Ausbildungszulage",
  keine: "Keine Zulage",
};

export function zulagenartLabel(v: Zulagenart): string {
  return ZULAGENART_LABEL[v];
}
