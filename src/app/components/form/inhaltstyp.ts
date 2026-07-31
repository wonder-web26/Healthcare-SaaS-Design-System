/**
 * Inhaltstyp einer Formularfeld-Eingabe → Höchstbreite.
 *
 * Umsetzungsregel (siehe Lauf "Feld-Breiten/Höhen-Token"): Die Breite kommt
 * weiterhin aus dem Raster (w-full). Zusätzlich bekommt jedes Feld eine
 * Höchstbreite nach INHALTSTYP — die Aufrufstelle sagt "das ist eine
 * Postleitzahl", nicht "120 Pixel breit". Die konkreten Zahlen stehen als
 * Token in theme.css (--field-w-*); eine Token-Änderung wirkt auf alle Felder
 * der Klasse. Auswahl-, Strassen-, E-Mail-, Freitext- und mehrzeilige Felder
 * erhalten bewusst KEINE Höchstbreite (undefined) und füllen ihre Zelle.
 */
export type Inhaltstyp =
  // xs — var(--field-w-xs) 120
  | "plz" | "bagNr" | "tarifcode" | "prozent" | "anzahl" | "groesse" | "gewicht"
  // sm — var(--field-w-sm) 180
  | "datum" | "zemis" | "betrag" | "stundenlohn" | "telefon"
  // md — var(--field-w-md) 240
  | "ahv" | "kartennummer" | "iban" | "icd"
  // lg — var(--field-w-lg) 320
  | "vorname" | "nachname" | "ort" | "heimatort"
  // ohne Höchstbreite
  | "strasse" | "email" | "auswahl" | "freitext" | "mehrzeilig";

const XS = "var(--field-w-xs)";
const SM = "var(--field-w-sm)";
const MD = "var(--field-w-md)";
const LG = "var(--field-w-lg)";

const BREITE: Record<Inhaltstyp, string | undefined> = {
  plz: XS, bagNr: XS, tarifcode: XS, prozent: XS, anzahl: XS, groesse: XS, gewicht: XS,
  datum: SM, zemis: SM, betrag: SM, stundenlohn: SM, telefon: SM,
  ahv: MD, kartennummer: MD, iban: MD, icd: MD,
  vorname: LG, nachname: LG, ort: LG, heimatort: LG,
  strasse: undefined, email: undefined, auswahl: undefined, freitext: undefined, mehrzeilig: undefined,
};

/** Liefert das Breiten-Token (CSS var) für einen Inhaltstyp, oder undefined (keine Höchstbreite). */
export function breiteFuerInhalt(typ?: Inhaltstyp): string | undefined {
  return typ ? BREITE[typ] : undefined;
}
