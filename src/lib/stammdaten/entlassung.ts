/**
 * Bereich Z des Standardkatalogs — Entlassung.
 *
 * Quelle: docs/standardkatalog-sda-entlassung.md, Zeilen 583–655. Die
 * Wertliste ist wörtlich übernommen; Code, nie Beschriftung, wird
 * gespeichert.
 *
 * Codes 1 bis 12 sind mit BB9 (Wohnsituation) identisch — dieselben
 * Lebensumstände, einmal beim Eintritt, einmal beim Austritt. Code 13 trägt
 * hier ein Freitextfeld, Code 14 gibt es nur in Z2.
 */

export interface EntlassungWert {
  code: string;
  label: string;
}

/** Z2 — Lebensumstände unmittelbar nach der Entlassung. Genau eine Antwort. */
export const ENTLASSUNG_NACH: EntlassungWert[] = [
  { code: "1", label: "Privathaus / Eigentums- / Mietwohnung / gemietetes Zimmer" },
  { code: "2", label: "Wohnung mit integrierten Dienstleistungen" },
  { code: "3", label: "Einrichtung für Personen mit psychischen Problemen" },
  { code: "4", label: "Wohngemeinschaft für Personen mit körperlicher Behinderung" },
  { code: "5", label: "Einrichtung für Personen mit geistiger Behinderung" },
  { code: "6", label: "Psychiatrische Klinik oder Abteilung" },
  { code: "7", label: "Obdachlos (mit oder ohne Obdachlosenunterkunft)" },
  { code: "8", label: "Alters- und Pflegeheim" },
  { code: "9", label: "Rehabilitationsklinik / -abteilung" },
  { code: "10", label: "Hospiz / Palliativstation" },
  { code: "11", label: "Akutklinik / -abteilung" },
  { code: "12", label: "Justizvollzugsanstalt" },
  { code: "13", label: "Sonstiges" },
  { code: "14", label: "Verstorben" },
];

/** Nur bei Code 13 trägt Z2 einen Freitext. */
export const ENTLASSUNG_SONSTIGES = "13";
/** Code 14 existiert nur in Z2 und nicht in BB9. */
export const ENTLASSUNG_VERSTORBEN = "14";

export function entlassungNachLabel(code: string): string {
  return ENTLASSUNG_NACH.find(w => w.code === code)?.label ?? "";
}
