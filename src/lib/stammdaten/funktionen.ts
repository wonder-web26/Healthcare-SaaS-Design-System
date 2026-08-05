/**
 * Funktion / Rolle — zentrale, pflegbare Stammdaten.
 *
 * Enum als stabiler Code + Anzeige-Label, NICHT Freitext.
 * Code stabil halten (spätere Anbindung an Lohnklasse / KLV-Abrechnungsberechtigung).
 * Für dieses Feld KEINE Abrechnungslogik bauen.
 *
 * Erweiterbar: neuer Eintrag = neues Array-Element, keine Code-Änderung nötig.
 */

export interface FunktionDefinition {
  value: string;
  label: string;
}

export const FUNKTIONEN: FunktionDefinition[] = [
  { value: "pf_hf", label: "Pflegefachperson HF" },
  { value: "pf_fh", label: "Pflegefachperson FH (Bachelor)" },
  { value: "fage", label: "Fachfrau/-mann Gesundheit FAGE" },
  { value: "ags", label: "Assistent/in Gesundheit und Soziales AGS" },
  { value: "ph_srk", label: "Pflegehelfer/in SRK" },
  { value: "ph_ohne_srk", label: "Pflegehelfer/in ohne SRK" },
  { value: "hauswirtschaft", label: "Hauswirtschaft" },
];

/** Dropdown-Optionen (value + label) */
export const FUNKTIONEN_OPTIONS = FUNKTIONEN.map(f => ({ value: f.value, label: f.label }));

/**
 * R14 des Standardkatalogs Pflegende Angehörige: die Qualifikationsstufe wird
 * nicht erhoben, sondern aus der Funktion abgeleitet. EINZIGE Stelle dieser
 * Zuordnung — Liste, Abrechenbarkeit, Anna und Qualifikationsnachweis lesen
 * das Ergebnis, nicht die Regel.
 *
 * Die Zuordnung von "ags" und "fage" ist im Katalog als [offen] vermerkt: sie
 * bestimmt mit, welche KLV-Leistungen erbracht werden dürfen, und ist
 * fachlich nicht abgenommen.
 *
 * Leere oder unbekannte Funktion ergibt "" — nicht erhoben, nicht geraten.
 */
const QUALIFIKATION_JE_FUNKTION: Record<string, "ohne_srk" | "srk" | "fage_dipl"> = {
  pf_hf: "fage_dipl",
  pf_fh: "fage_dipl",
  fage: "fage_dipl",
  ags: "srk",
  ph_srk: "srk",
  ph_ohne_srk: "ohne_srk",
  hauswirtschaft: "ohne_srk",
};

export function qualifikationAusFunktion(funktion: string): "ohne_srk" | "srk" | "fage_dipl" | "" {
  return QUALIFIKATION_JE_FUNKTION[funktion] ?? "";
}
