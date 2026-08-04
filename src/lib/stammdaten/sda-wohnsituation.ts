/**
 * BB9 Wohnsituation zur Zeit der Abklärung — Standardkatalog Spitex Schweiz.
 *
 * Hält fest, wo die Person während der Zeit wohnt, in der die
 * Spitex-Dienstleistung beansprucht wird. Code 1 umfasst auch
 * Seniorengemeinschaften und unabhängiges Wohnen; Code 2 meint integrierte
 * Dienste wie Reinigung, Mahlzeiten und Wäsche — nicht Pflegeleistungen.
 * Im Spitex-Setting sind laut Handbuch vorwiegend die Codes 1, 2 und 13 relevant.
 */
import { type SdaWert } from "./sda-wert";

export const SDA_WOHNSITUATION: SdaWert[] = [
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
];

/** Optionen für Auswahlfelder (value = Code). */
export const SDA_WOHNSITUATION_OPTIONS = SDA_WOHNSITUATION.map(w => ({ value: w.code, label: w.label }));

/** Beschriftung zu einem Code; leerer String, wenn nicht erhoben. */
export function sdaWohnsituationLabel(code: string): string {
  return SDA_WOHNSITUATION.find(w => w.code === code)?.label ?? "";
}
