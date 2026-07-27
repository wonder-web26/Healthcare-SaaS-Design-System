/**
 * PA-05: Vitalparameter — zentrale, pflegbare Stammdaten.
 * Erweiterbar: neuer Eintrag = neues Array-Element, keine Code-Änderung.
 */

export interface VitalparameterDefinition {
  code: string;
  label: string;
  einheit: string;
  minPlausibel: number;
  maxPlausibel: number;
  aktiv: boolean;
}

export const VITALPARAMETER: VitalparameterDefinition[] = [
  { code: "blutdruck_sys", label: "Blutdruck systolisch", einheit: "mmHg", minPlausibel: 60, maxPlausibel: 260, aktiv: true },
  { code: "blutdruck_dia", label: "Blutdruck diastolisch", einheit: "mmHg", minPlausibel: 30, maxPlausibel: 150, aktiv: true },
  { code: "puls", label: "Puls", einheit: "/min", minPlausibel: 30, maxPlausibel: 220, aktiv: true },
  { code: "temperatur", label: "Körpertemperatur", einheit: "°C", minPlausibel: 34, maxPlausibel: 43, aktiv: true },
  { code: "spo2", label: "Sauerstoffsättigung", einheit: "%", minPlausibel: 50, maxPlausibel: 100, aktiv: true },
  { code: "atemfrequenz", label: "Atemfrequenz", einheit: "/min", minPlausibel: 5, maxPlausibel: 60, aktiv: true },
  { code: "blutzucker", label: "Blutzucker", einheit: "mmol/L", minPlausibel: 1, maxPlausibel: 40, aktiv: true },
  { code: "gewicht", label: "Gewicht", einheit: "kg", minPlausibel: 20, maxPlausibel: 300, aktiv: true },
  { code: "schmerz_nrs", label: "Schmerz (NRS)", einheit: "Punkte", minPlausibel: 0, maxPlausibel: 10, aktiv: true },
];

export const AKTIVE_PARAMETER = VITALPARAMETER.filter(p => p.aktiv);

/**
 * Prüft Plausibilität eines Messwerts. Gibt Warnung oder null zurück.
 */
export function pruefeVitalPlausibilitaet(code: string, wert: number): string | null {
  const param = VITALPARAMETER.find(p => p.code === code);
  if (!param) return null;
  if (wert < param.minPlausibel) return `${param.label}: ${wert} ${param.einheit} liegt unter dem Plausibilitätsbereich (min. ${param.minPlausibel}).`;
  if (wert > param.maxPlausibel) return `${param.label}: ${wert} ${param.einheit} liegt über dem Plausibilitätsbereich (max. ${param.maxPlausibel}).`;
  return null;
}
