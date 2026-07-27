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
