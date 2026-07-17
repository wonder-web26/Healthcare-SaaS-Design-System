/**
 * Konfession — SP-01
 *
 * Werte als Enum/Code gespeichert, nicht das Label (spaetere Logik haengt daran).
 * Pro Eintrag internes Flag kirchensteuerRelevant (NICHT an Label koppeln;
 * kantonal unterschiedlich).
 *
 * Datenschutz: revDSG besonders schuetzenswertes Datum → Zugriff beschraenken.
 */

export interface KonfessionDefinition {
  value: string;
  label: string;
  /** Kirchensteuer-Relevanz (kantonal unterschiedlich, hier Default-Wert) */
  kirchensteuerRelevant: boolean;
}

export const KONFESSIONEN: KonfessionDefinition[] = [
  { value: "roemisch_katholisch", label: "Römisch-katholisch", kirchensteuerRelevant: true },
  { value: "evangelisch_reformiert", label: "Evangelisch-reformiert", kirchensteuerRelevant: true },
  { value: "christkatholisch", label: "Christkatholisch", kirchensteuerRelevant: true },
  { value: "juedisch", label: "Jüdisch / Israelitisch", kirchensteuerRelevant: true },
  // * israelitisch nur in einzelnen Kantonen oeffentlich-rechtlich anerkannt
  { value: "konfessionslos", label: "Konfessionslos / keine", kirchensteuerRelevant: false },
  { value: "muslimisch", label: "Muslimisch", kirchensteuerRelevant: false },
  { value: "orthodox", label: "Christlich-orthodox", kirchensteuerRelevant: false },
  { value: "evangelisch_freikirche", label: "Evangelisch-freikirchlich", kirchensteuerRelevant: false },
  { value: "buddhistisch", label: "Buddhistisch", kirchensteuerRelevant: false },
  { value: "hinduistisch", label: "Hinduistisch", kirchensteuerRelevant: false },
  { value: "andere", label: "Andere", kirchensteuerRelevant: false },
  { value: "keine_angabe", label: "Keine Angabe", kirchensteuerRelevant: false },
];

/** Dropdown-Optionen fuer Select-Komponenten (value + label) */
export const KONFESSION_OPTIONS = KONFESSIONEN.map(k => ({ value: k.value, label: k.label }));

/** Prueft ob eine Konfession kirchensteuer-relevant ist */
export function istKirchensteuerRelevant(value: string): boolean {
  return KONFESSIONEN.find(k => k.value === value)?.kirchensteuerRelevant ?? false;
}
