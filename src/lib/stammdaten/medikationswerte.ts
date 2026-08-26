/**
 * Wertelisten des Medikationsplans.
 *
 * Quelle: Umsetzungshilfe „Einführung Medikationsplan im EPD", eHealth Suisse
 * und IPAG, 28.2.2022. Gespeichert wird durchweg der Code, nie die
 * Beschriftung.
 */

interface Medikationswert {
  code: string;
  label: string;
}

export const MEDIKATIONSART: Medikationswert[] = [
  { code: "dauermedikation", label: "Dauermedikation" },
  { code: "befristet", label: "Befristet" },
  { code: "reserve", label: "Reserve" },
  { code: "notfall", label: "Notfall" },
];

/** Reserve und Notfall werden nicht nach Tageszeit dosiert. */
export const OHNE_TAGESDOSIERUNG = ["reserve", "notfall"];

export const DARREICHUNGSFORM: Medikationswert[] = [
  { code: "tablette", label: "Tablette" },
  { code: "retardtablette", label: "Retardtablette" },
  { code: "kapsel", label: "Kapsel" },
  { code: "tropfen", label: "Tropfen" },
  { code: "saft", label: "Saft" },
  { code: "suppositorium", label: "Suppositorium" },
  { code: "salbe", label: "Salbe" },
  { code: "pflaster", label: "Pflaster" },
  { code: "injektionsloesung", label: "Injektionslösung" },
  { code: "inhalation", label: "Inhalation" },
  { code: "augentropfen", label: "Augentropfen" },
  { code: "andere", label: "Andere" },
];

export const ANWENDUNGSWEG: Medikationswert[] = [
  { code: "oral", label: "Oral" },
  { code: "sublingual", label: "Sublingual" },
  { code: "subkutan", label: "Subkutan" },
  { code: "intramuskulaer", label: "Intramuskulär" },
  { code: "intravenoes", label: "Intravenös" },
  { code: "perkutan", label: "Perkutan" },
  { code: "rektal", label: "Rektal" },
  { code: "inhalativ", label: "Inhalativ" },
  { code: "okular", label: "Okular" },
  { code: "andere", label: "Andere" },
];

/**
 * Allergie oder Unverträglichkeit — und der ausdrückliche dritte Wert.
 *
 * „Art unbekannt" ist kein Verlegenheitswert: wer eine Reaktion meldet, weiss
 * oft nicht, ob sie immunologisch war. Ihn wegzulassen zwänge zu einer
 * Angabe, die niemand erhoben hat.
 */
export const UNVERTRAEGLICHKEITSART: Medikationswert[] = [
  { code: "allergie", label: "Allergie" },
  { code: "unvertraeglichkeit", label: "Unverträglichkeit" },
  { code: "art_unbekannt", label: "Art unbekannt" },
];

/**
 * Wie schwer die Reaktion ausfällt — eine zweite Achse neben der Art.
 *
 * Art und Schwere ersetzen einander nicht: eine Allergie kann leicht
 * verlaufen, eine Unverträglichkeit schwer. Die Angabe ist freiwillig, weil
 * sie eine Einstufung ist; wo niemand eingestuft hat, bleibt sie leer.
 */
export const UNVERTRAEGLICHKEIT_SCHWERE: Medikationswert[] = [
  { code: "leicht", label: "Leicht" },
  { code: "mittel", label: "Mittel" },
  { code: "schwer", label: "Schwer" },
];

export function medikationswertLabel(liste: Medikationswert[], code: string): string {
  return liste.find(w => w.code === code)?.label ?? code;
}

export const medikationsOptionen = (liste: Medikationswert[]) =>
  liste.map(w => ({ value: w.code, label: w.label }));
