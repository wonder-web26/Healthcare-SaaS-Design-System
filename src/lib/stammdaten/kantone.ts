/**
 * Die 26 Kantone — als Auswahl statt Freitext.
 *
 * Der gespeicherte Wert ist das zweibuchstabige Kürzel (ZH, BE, …). Diese
 * Schreibweise steht heute in den Fixtures UND in `pflegetarife.ts`; die
 * Tarifzuordnung vergleicht über die Zeichenkette (`t.kanton === kanton`), eine
 * abweichende Schreibweise bräche sie still. Darum eine Auswahl, kein Textfeld.
 */
export interface Kanton {
  code: string;
  name: string;
}

export const KANTONE: Kanton[] = [
  { code: "AG", name: "Aargau" },
  { code: "AI", name: "Appenzell Innerrhoden" },
  { code: "AR", name: "Appenzell Ausserrhoden" },
  { code: "BE", name: "Bern" },
  { code: "BL", name: "Basel-Landschaft" },
  { code: "BS", name: "Basel-Stadt" },
  { code: "FR", name: "Freiburg" },
  { code: "GE", name: "Genf" },
  { code: "GL", name: "Glarus" },
  { code: "GR", name: "Graubünden" },
  { code: "JU", name: "Jura" },
  { code: "LU", name: "Luzern" },
  { code: "NE", name: "Neuenburg" },
  { code: "NW", name: "Nidwalden" },
  { code: "OW", name: "Obwalden" },
  { code: "SG", name: "St. Gallen" },
  { code: "SH", name: "Schaffhausen" },
  { code: "SO", name: "Solothurn" },
  { code: "SZ", name: "Schwyz" },
  { code: "TG", name: "Thurgau" },
  { code: "TI", name: "Tessin" },
  { code: "UR", name: "Uri" },
  { code: "VD", name: "Waadt" },
  { code: "VS", name: "Wallis" },
  { code: "ZG", name: "Zug" },
  { code: "ZH", name: "Zürich" },
];

/** Für Auswahl-Komponenten (Kürzel als Wert, „ZH — Zürich" als Beschriftung). */
export const KANTON_OPTIONS = KANTONE.map(k => ({ value: k.code, label: `${k.code} — ${k.name}` }));

export function kantonName(code: string): string {
  return KANTONE.find(k => k.code === code)?.name ?? code;
}
