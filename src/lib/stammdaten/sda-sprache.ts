/**
 * BB13 Üblicherweise gesprochene Sprache — Standardkatalog Spitex Schweiz.
 *
 * Bevorzugte Sprache für die tägliche Kommunikation. Pflegefachpersonen müssen
 * mit der Person in einer Sprache kommunizieren können, die sie versteht; die
 * Angabe kann darauf hinweisen, dass eine Übersetzung nötig ist (BB14).
 *
 * Bei Code 21 ist die Sprache als Freitext zu erfassen.
 *
 * Der Patientenbestand hält die BESCHRIFTUNG, nicht den Code: Zuweisungs-
 * Übereinstimmung, Sprachfilter und Suche der Zuteilung vergleichen gegen
 * Klartextnamen. Das Formular speichert den Code, der Store schreibt das Label.
 */
import { type SdaWert } from "./sda-wert";

/** Code, bei dem die Sprache als Freitext zu erfassen ist. */
export const SPRACHE_ANDERE = "21";

export const SDA_SPRACHE: SdaWert[] = [
  { code: "1", label: "Schweizerdeutsch" },
  { code: "2", label: "Französisch" },
  { code: "3", label: "Italienisch" },
  { code: "4", label: "Rätoromanisch" },
  { code: "5", label: "Hochdeutsch" },
  { code: "6", label: "Englisch" },
  { code: "7", label: "Portugiesisch" },
  { code: "8", label: "Spanisch" },
  { code: "9", label: "Albanisch" },
  { code: "10", label: "Kroatisch" },
  { code: "11", label: "Serbisch" },
  { code: "12", label: "Arabisch" },
  { code: "13", label: "Kurdisch" },
  { code: "14", label: "Türkisch" },
  { code: "15", label: "Tamilisch" },
  { code: "16", label: "Chinesisch" },
  { code: "17", label: "Russisch" },
  { code: "18", label: "Hindi" },
  { code: "19", label: "Tigrinya" },
  { code: "20", label: "Somalisch" },
  { code: "21", label: "Andere, welche" },
];

export const SDA_SPRACHE_OPTIONS = SDA_SPRACHE.map(w => ({ value: w.code, label: w.label }));

export function sdaSpracheLabel(code: string): string {
  return SDA_SPRACHE.find(w => w.code === code)?.label ?? "";
}

/**
 * Code zu einer Beschriftung — der Rückweg von sdaSpracheLabel().
 *
 * Nötig, weil der Patientenbestand die BESCHRIFTUNG hält (Entscheid aus
 * Lauf 4), der Abgleich mit den Pflegefachpersonen aber über Codes läuft.
 * Der Code wird damit aus dieser Liste geholt statt als zweites Feld an den
 * Bestand gehängt; es gibt weiterhin nur diese eine Sprachliste.
 *
 * Liefert "" für eine Beschriftung ausserhalb des Katalogs — etwa den
 * Freitext, den Code 21 erlaubt. Ein leerer Code trifft auf keine
 * Pflegefachperson; das ist richtig, denn eine Sprache ausserhalb des
 * Katalogs ist im Bestand der Pflegefachpersonen nicht abgebildet.
 */
export function sdaSpracheCode(label: string): string {
  return SDA_SPRACHE.find(w => w.label === label)?.code ?? "";
}
